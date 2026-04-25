package rs.logistics.logistics_system.service.implementation;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.mapper.WarehouseInventoryMapper;
import rs.logistics.logistics_system.mapper.WarehouseMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseServiceDefinition;

@Service
@RequiredArgsConstructor
public class WarehouseService implements WarehouseServiceDefinition {

    private final WarehouseRepository _warehouseRepository;
    private final WarehouseInventoryRepository _warehouseInventoryRepository;
    private final TransportOrderRepository _transportOrderRepository;
    private final EmployeeRepository _employeeRepository;
    private final CompanyRepository companyRepository;

    private final AuditFacadeDefinition auditFacade;

    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public WarehouseResponse create(WarehouseCreate dto) {
        Employee employee = getAccessibleEmployee(dto.getEmployeeId());
        validateWarehouseManager(employee);

        Warehouse warehouse = WarehouseMapper.toEntity(dto, employee);
        warehouse.setCompany(resolveTargetCompany(dto.getCompanyId()));

        validateEmployeeCompanyForWarehouse(employee, warehouse);
        Warehouse saved = _warehouseRepository.save(warehouse);

        auditFacade.recordCreate("WAREHOUSE", saved.getId());
        auditFacade.recordFieldChange("WAREHOUSE", saved.getId(), "company_id", null, saved.getCompany() != null ? saved.getCompany().getId() : null);
        auditFacade.log(
                "CREATE",
                "WAREHOUSE",
                saved.getId(),
                "WAREHOUSE is created (ID: " + saved.getId() + ", companyId: " + (saved.getCompany() != null ? saved.getCompany().getId() : null) + ")"
        );

        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public WarehouseResponse update(Long id, WarehouseUpdate dto) {
        Warehouse warehouse = getWarehouseOrThrow(id);
        validateWarehouseIsActive(warehouse);

        String oldName = warehouse.getName();
        String oldLocation = warehouse.getCity() + "; " + warehouse.getAddress();
        BigDecimal oldCapacity = warehouse.getCapacity();

        WarehouseMapper.updateEntity(warehouse, dto);
        Warehouse saved = _warehouseRepository.save(warehouse);

        auditFacade.recordFieldChange("WAREHOUSE", saved.getId(), "name", oldName, saved.getName());
        auditFacade.recordFieldChange("WAREHOUSE", saved.getId(), "location", oldLocation, saved.getCity() + "; " + saved.getAddress());
        auditFacade.recordFieldChange("WAREHOUSE", saved.getId(), "capacity", oldCapacity, saved.getCapacity());

        auditFacade.log(
                "UPDATE",
                "WAREHOUSE",
                saved.getId(),
                "WAREHOUSE is updated (ID: " + saved.getId() + ")"
        );

        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public WarehouseResponse getById(Long id) {
        Warehouse warehouse = getWarehouseOrThrow(id);
        return WarehouseMapper.toResponse(warehouse);
    }

    @Override
    public WarehouseResponse assignEmployee(Long warehouseId, Long employeeId) {
        Employee employee = getAccessibleEmployee(employeeId);
        Warehouse warehouse = getWarehouseOrThrow(warehouseId);

        validateWarehouseManager(employee);
        validateSameCompany(warehouse, employee);

        Long oldManagerId = warehouse.getManager() != null ? warehouse.getManager().getId() : null;
        warehouse.setManager(employee);
        Warehouse saved = _warehouseRepository.save(warehouse);

        auditFacade.recordFieldChange("WAREHOUSE", warehouseId, "manager", oldManagerId, employeeId);
        auditFacade.log(
                "EMPLOYEE_ASSIGNED",
                "WAREHOUSE",
                warehouseId,
                "WAREHOUSE (ID: " + warehouseId + ") was assigned to manager (ID: " + employeeId + ")"
        );

        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public PageResponse<WarehouseResponse> getAll(String search, WarehouseStatus status, Boolean active, Long managerId, Pageable pageable) {
        String normalizedSearch = normalizeSearch(search);
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        return PageResponse.from(_warehouseRepository.search(companyId, normalizedSearch, status, active, managerId, pageable)
                .map(WarehouseMapper::toResponse));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Warehouse warehouse = getWarehouseOrThrow(id);

        validateForDeleting(warehouse);

        _warehouseRepository.delete(warehouse);

        auditFacade.recordDelete("WAREHOUSE", id);
        auditFacade.log(
                "DELETE",
                "WAREHOUSE",
                id,
                "WAREHOUSE is deleted (ID: " + id + ")"
        );
    }

    @Override
    public WarehouseResponse changeStatus(Long warehouseId, WarehouseStatus status) {
        Warehouse warehouse = getWarehouseOrThrow(warehouseId);

        WarehouseStatus oldStatus = warehouse.getStatus();
        Boolean oldActive = warehouse.getActive();

        if (warehouse.getStatus() == status) {
            throw new BadRequestException("Warehouse already has this status.");
        }

        if (status == WarehouseStatus.INACTIVE) {
            validateForDeactivation(warehouse);
            warehouse.setStatus(WarehouseStatus.INACTIVE);
            warehouse.setActive(false);
        } else if (status == WarehouseStatus.ACTIVE) {
            warehouse.setStatus(WarehouseStatus.ACTIVE);
            warehouse.setActive(true);
        } else if (status == WarehouseStatus.FULL) {
            if (!Boolean.TRUE.equals(warehouse.getActive())) {
                throw new BadRequestException("Inactive warehouse cannot be marked as full.");
            }
            warehouse.setStatus(WarehouseStatus.FULL);
        } else if (status == WarehouseStatus.UNDER_MAINTENANCE) {
            if (!Boolean.TRUE.equals(warehouse.getActive())) {
                throw new BadRequestException("Inactive warehouse cannot be placed under maintenance.");
            }
            validateForDeactivation(warehouse);
            warehouse.setStatus(WarehouseStatus.UNDER_MAINTENANCE);
            warehouse.setActive(false);
        }

        Warehouse saved = _warehouseRepository.save(warehouse);

        auditFacade.recordStatusChange("WAREHOUSE", saved.getId(), "status", oldStatus, saved.getStatus());
        auditFacade.recordFieldChange("WAREHOUSE", saved.getId(), "active", oldActive, saved.getActive());
        auditFacade.log(
                "WAREHOUSE_STATUS",
                "WAREHOUSE",
                saved.getId(),
                "WAREHOUSE status changed from " + oldStatus + " to " + saved.getStatus() + " (ID: " + saved.getId() + ")"
        );

        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public List<WarehouseInventoryResponse> getInventoryByWarehouse(Long warehouseId) {
        Warehouse warehouse = getWarehouseOrThrow(warehouseId);

        return (authenticatedUserProvider.isOverlord()
                ? _warehouseInventoryRepository.findByWarehouse_Id(warehouse.getId())
                : _warehouseInventoryRepository.findByWarehouse_IdAndWarehouse_Company_Id(
                warehouse.getId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ))
                .stream()
                .map(WarehouseInventoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransportOrderResponse> getOutgoingTransportOrders(Long id) {
        Warehouse warehouse = getWarehouseOrThrow(id);

        return (authenticatedUserProvider.isOverlord()
                ? _transportOrderRepository.findBySourceWarehouseId(warehouse.getId())
                : _transportOrderRepository.findBySourceWarehouseIdAndCreatedBy_Company_Id(
                warehouse.getId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ))
                .stream()
                .map(TransportOrderMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransportOrderResponse> getIncomingTransportOrders(Long id) {
        Warehouse warehouse = getWarehouseOrThrow(id);

        return (authenticatedUserProvider.isOverlord()
                ? _transportOrderRepository.findByDestinationWarehouseId(warehouse.getId())
                : _transportOrderRepository.findByDestinationWarehouseIdAndCreatedBy_Company_Id(
                warehouse.getId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        ))
                .stream()
                .map(TransportOrderMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<WarehouseResponse> getByManager(Long managerId) {
        Employee manager = getAccessibleEmployee(managerId);
        validateWarehouseManager(manager);

        List<Warehouse> warehouses = authenticatedUserProvider.isOverlord()
                ? _warehouseRepository.findByManagerId(manager.getId())
                : _warehouseRepository.findByManagerIdAndCompany_Id(
                manager.getId(),
                authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
        );

        return warehouses.stream().map(WarehouseMapper::toResponse).collect(Collectors.toList());
    }

    private String normalizeSearch(String search) {
        if (search == null || search.trim().isEmpty()) {
            return null;
        }

        return search.trim();
    }

    private void validateWarehouseManager(Employee employee) {
        if (Boolean.FALSE.equals(employee.getActive())) {
            throw new BadRequestException("Inactive employee cannot be assigned as warehouse manager");
        }

        if (employee.getPosition() != EmployeePosition.WAREHOUSE_MANAGER) {
            throw new BadRequestException("Only employee with WAREHOUSE_MANAGER position can be assigned as warehouse manager");
        }
    }

    private void validateWarehouseIsActive(Warehouse warehouse) {
        if (!Boolean.TRUE.equals(warehouse.getActive()) || warehouse.getStatus() == WarehouseStatus.INACTIVE) {
            throw new BadRequestException("Inactive warehouse cannot be modified.");
        }
    }

    private void validateForDeleting(Warehouse warehouse) {
        if (!warehouse.getInventoryItems().isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deleted because it contains inventory records.");
        }

        if (!warehouse.getStockMovements().isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deleted because it has stock movement history. Deactivate warehouse instead.");
        }

        if (warehouse.getManager() != null) {
            throw new BadRequestException("Warehouse cannot be deleted while manager is assigned.");
        }

        if (!_transportOrderRepository.findBySourceWarehouseId(warehouse.getId()).isEmpty() ||
                !_transportOrderRepository.findByDestinationWarehouseId(warehouse.getId()).isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deleted because it is linked to transport history. Deactivate warehouse instead.");
        }
    }

    private void validateForDeactivation(Warehouse warehouse) {
        if (!warehouse.getInventoryItems().isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deactivated while it contains inventory.");
        }

        boolean hasActiveOutgoingTransport = _transportOrderRepository.findBySourceWarehouseId(warehouse.getId())
                .stream()
                .map(TransportOrder::getStatus)
                .anyMatch(status -> status == TransportOrderStatus.ASSIGNED || status == TransportOrderStatus.IN_TRANSIT);

        if (hasActiveOutgoingTransport) {
            throw new BadRequestException("Warehouse cannot be deactivated while it is source warehouse for active transport orders.");
        }

        boolean hasActiveIncomingTransport = _transportOrderRepository.findByDestinationWarehouseId(warehouse.getId())
                .stream()
                .map(TransportOrder::getStatus)
                .anyMatch(status -> status == TransportOrderStatus.ASSIGNED || status == TransportOrderStatus.IN_TRANSIT);

        if (hasActiveIncomingTransport) {
            throw new BadRequestException("Warehouse cannot be deactivated while it is destination warehouse for active transport orders.");
        }
    }

    private Warehouse getWarehouseOrThrow(Long id) {
        if (authenticatedUserProvider.isOverlord()) {
            return _warehouseRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        }

        return _warehouseRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    private Employee getAccessibleEmployee(Long employeeId) {
        if (authenticatedUserProvider.isOverlord()) {
            return _employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }

        return _employeeRepository.findByIdAndCompany_Id(employeeId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private void validateEmployeeCompanyForWarehouse(Employee employee, Warehouse warehouse) {
        authenticatedUserProvider.ensureSameCompany(
                warehouse.getCompany() != null ? warehouse.getCompany().getId() : null,
                employee.getCompany() != null ? employee.getCompany().getId() : null,
                "Warehouse manager must belong to the same company"
        );
    }

    private void validateSameCompany(Warehouse warehouse, Employee employee) {
        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        authenticatedUserProvider.ensureSameCompany(
                warehouse.getCompany() != null ? warehouse.getCompany().getId() : null,
                employee.getCompany() != null ? employee.getCompany().getId() : null,
                "Warehouse manager must belong to the same company"
        );
    }

    private Company resolveTargetCompany(Long companyId) {
        if (authenticatedUserProvider.isOverlord()) {
            if (companyId == null) {
                throw new BadRequestException("companyId is required for OVERLORD warehouse creation");
            }

            return companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        }

        Company company = authenticatedUserProvider.getAuthenticatedCompany();
        if (company == null) {
            throw new ForbiddenException("Authenticated user is not assigned to a company");
        }

        return company;
    }
}