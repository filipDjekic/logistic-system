package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.mapper.WarehouseInventoryMapper;
import rs.logistics.logistics_system.mapper.WarehouseMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseServiceDefinition;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService implements WarehouseServiceDefinition {

    private final WarehouseRepository _warehouseRepository;
    private final WarehouseInventoryRepository _warehouseInventoryRepository;
    private final TransportOrderRepository _transportOrderRepository;
    private final EmployeeRepository _employeeRepository;

    private final AuditFacadeDefinition auditFacade;

    @Override
    public WarehouseResponse create(WarehouseCreate dto) {
        Employee employee = _employeeRepository.findById(dto.getEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        validateWarehouseManager(employee);

        Warehouse warehouse = WarehouseMapper.toEntity(dto, employee);
        Warehouse saved = _warehouseRepository.save(warehouse);

        auditFacade.recordCreate("WAREHOUSE", saved.getId());
        auditFacade.log(
                "CREATE",
                "WAREHOUSE",
                saved.getId(),
                "WAREHOUSE is created (ID: " + saved.getId() + ")"
        );

        return WarehouseMapper.toResponse(saved);
    }

    @Override
    public WarehouseResponse update(Long id, WarehouseUpdate dto) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
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
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        return WarehouseMapper.toResponse(warehouse);
    }

    @Override
    public WarehouseResponse assignEmployee(Long warehouseId, Long employeeId) {
        Employee employee = _employeeRepository.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Warehouse warehouse = _warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        validateWarehouseManager(employee);
        validateWarehouseIsActive(warehouse);

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
    public List<WarehouseResponse> getAll() {
        return _warehouseRepository.findAll().stream().map(WarehouseMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

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
        Warehouse warehouse = _warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

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
        Warehouse warehouse = _warehouseRepository.findById(warehouseId).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        return _warehouseInventoryRepository.findByWarehouse_Id(warehouse.getId()).stream().map(WarehouseInventoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<TransportOrderResponse> getOutgoingTransportOrders(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        return _transportOrderRepository.findBySourceWarehouseId(warehouse.getId()).stream().map(TransportOrderMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<TransportOrderResponse> getIncomingTransportOrders(Long id) {
        Warehouse warehouse = _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        return _transportOrderRepository.findByDestinationWarehouseId(warehouse.getId()).stream().map(TransportOrderMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<WarehouseResponse> getByManager(Long managerId) {
        Employee manager = _employeeRepository.findById(managerId).orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return _warehouseRepository.findByManagerId(manager.getId()).stream().map(WarehouseMapper::toResponse).collect(Collectors.toList());
    }

    private void validateWarehouseManager(Employee employee) {
        if (Boolean.FALSE.equals(employee.getActive())) {
            throw new BadRequestException("Inactive employee cannot be assigned as warehouse manager");
        }

        if (employee.getPosition() != EmployeePosition.MANAGER) {
            throw new BadRequestException("Only employee with MANAGER position can be assigned as warehouse manager");
        }
    }

    private void validateWarehouseIsActive(Warehouse warehouse) {
        if (!Boolean.TRUE.equals(warehouse.getActive()) || warehouse.getStatus() == WarehouseStatus.INACTIVE) {
            throw new BadRequestException("Inactive warehouse cannot be modified.");
        }
    }

    private void validateForDeleting(Warehouse warehouse) {
        if (!warehouse.getInventoryItems().isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deleted because it contains inventory.");
        }

        if (!warehouse.getStockMovements().isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deleted because it has stock movement history.");
        }

        if (warehouse.getManager() != null) {
            throw new BadRequestException("Warehouse cannot be deleted while manager is assigned.");
        }

        if (!_transportOrderRepository.findBySourceWarehouseId(warehouse.getId()).isEmpty() ||
                !_transportOrderRepository.findByDestinationWarehouseId(warehouse.getId()).isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deleted because it is linked to transport orders.");
        }
    }

    private void validateForDeactivation(Warehouse warehouse) {
        if (!warehouse.getInventoryItems().isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deactivated while it contains inventory.");
        }

        if (!_transportOrderRepository.findBySourceWarehouseId(warehouse.getId()).isEmpty() ||
                !_transportOrderRepository.findByDestinationWarehouseId(warehouse.getId()).isEmpty()) {
            throw new BadRequestException("Warehouse cannot be deactivated while it is linked to transport orders.");
        }
    }
}