package rs.logistics.logistics_system.service.implementation;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;
import rs.logistics.logistics_system.service.support.DomainScopeValidator;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.City;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.mapper.WarehouseInventoryMapper;
import rs.logistics.logistics_system.mapper.WarehouseMapper;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.CountryRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseZoneRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.CityServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimezoneServiceDefinition;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;

@Service
@RequiredArgsConstructor
public class WarehouseService implements WarehouseServiceDefinition {

    private final WarehouseRepository _warehouseRepository;
    private final WarehouseInventoryRepository _warehouseInventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final TransportOrderRepository _transportOrderRepository;
    private final EmployeeRepository _employeeRepository;
    private final CompanyRepository companyRepository;
    private final CountryRepository countryRepository;

    private final AuditFacadeDefinition auditFacade;
    private final AppProperties appProperties;

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final TimezoneServiceDefinition timezoneService;
    private final CityServiceDefinition cityService;
    private final DomainScopeValidator domainScopeValidator;
    private final WarehouseAccessGuard warehouseAccessGuard;
    private final WarehouseZoneRepository warehouseZoneRepository;

    @Override
    @Transactional
    public WarehouseResponse create(WarehouseCreate dto) {
        Employee employee = getAccessibleEmployee(dto.getEmployeeId());
        validateWarehouseManager(employee);

        Company targetCompany = resolveTargetCompany(dto.getCompanyId());
        Country country = resolveWarehouseCountry(dto.getCountryId(), targetCompany);
        Timezone timezone = timezoneService.getRequiredForCountry(dto.getTimezoneId(), country.getId());
        City city = cityService.getRequiredActiveForCountry(dto.getCityId(), country.getId());
        Warehouse warehouse = WarehouseMapper.toEntity(dto, employee, country, city, timezone);
        warehouse.setCompany(targetCompany);

        validateEmployeeCompanyForWarehouse(employee, warehouse);
        domainScopeValidator.ensureWarehouseLocationConsistency(warehouse);
        domainScopeValidator.ensureWarehouseManager(employee, warehouse);
        Warehouse saved = _warehouseRepository.save(warehouse);
        syncManagerPrimaryWarehouse(saved, employee);

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
    @Transactional
    public WarehouseResponse update(Long id, WarehouseUpdate dto) {
        Warehouse warehouse = getWarehouseOrThrow(id);
        validateWarehouseIsActive(warehouse);
        ensureWarehouseManagerCanUpdateManagedWarehouse(warehouse);

        String oldName = warehouse.getName();
        String oldLocation = (warehouse.getCity() != null ? warehouse.getCity().getName() : null) + "; " + warehouse.getAddress();
        BigDecimal oldCapacity = warehouse.getCapacity();

        Country country = resolveWarehouseCountry(dto.getCountryId(), warehouse.getCompany());
        Timezone timezone = timezoneService.getRequiredForCountry(dto.getTimezoneId(), country.getId());
        City city = cityService.getRequiredActiveForCountry(dto.getCityId(), country.getId());
        WarehouseMapper.updateEntity(warehouse, dto, country, city, timezone);
        domainScopeValidator.ensureWarehouseLocationConsistency(warehouse);
        validateCapacityNotBelowCurrentInventory(warehouse);

        BigDecimal zones =
        warehouseZoneRepository.sumCapacityByWarehouse(
                warehouse.getId());

        if (warehouse.getCapacity().compareTo(zones) < 0) {
            throw new BadRequestException(
                    "Warehouse capacity cannot be smaller than total zone capacity.");
        }

        Warehouse saved = _warehouseRepository.save(warehouse);

        auditFacade.recordFieldChange("WAREHOUSE", saved.getId(), "name", oldName, saved.getName());
        auditFacade.recordFieldChange("WAREHOUSE", saved.getId(), "location", oldLocation, (saved.getCity() != null ? saved.getCity().getName() : null) + "; " + saved.getAddress());
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
    @Transactional
    public WarehouseResponse assignEmployee(Long warehouseId, Long employeeId) {
        Employee employee = getAccessibleEmployee(employeeId);
        Warehouse warehouse = getWarehouseOrThrow(warehouseId);

        validateWarehouseManager(employee);
        validateSameCompany(warehouse, employee);
        domainScopeValidator.ensureWarehouseManager(employee, warehouse);

        Long oldManagerId = warehouse.getManager() != null ? warehouse.getManager().getId() : null;
        warehouse.setManager(employee);
        Warehouse saved = _warehouseRepository.save(warehouse);
        syncManagerPrimaryWarehouse(saved, employee);

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
        String normalizedSearch = QueryParameterNormalizer.trimToNull(search);
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        Long searchId = QueryParameterNormalizer.parseLongOrNull(normalizedSearch);

        if (authenticatedUserProvider.hasRole("WORKER")) {
            List<Long> warehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
            if (warehouseIds == null) {
                return PageResponse.from(_warehouseRepository.search(companyId, normalizedSearch, searchId, status, active, managerId, pageable)
                        .map(WarehouseMapper::toResponse));
            }
            return PageResponse.from((warehouseIds.isEmpty()
                    ? Page.<Warehouse>empty(pageable)
                    : _warehouseRepository.searchWarehouseIds(companyId, warehouseIds, normalizedSearch, searchId, status, active, managerId, pageable))
                    .map(WarehouseMapper::toResponse));
        }

        return PageResponse.from(_warehouseRepository.search(companyId, normalizedSearch, searchId, status, active, managerId, pageable)
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
    @Transactional
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
    @Transactional
    public WarehouseResponse archiveWarehouse(Long id) {
        return changeStatus(id, WarehouseStatus.INACTIVE);
    }

    @Override
    @Transactional
    public WarehouseResponse restoreWarehouse(Long id) {
        return changeStatus(id, WarehouseStatus.ACTIVE);
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

    private Country resolveWarehouseCountry(Long countryId, Company company) {
        Country country = null;
        if (countryId != null) {
            country = countryRepository.findById(countryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Country not found"));
            if (!Boolean.TRUE.equals(country.getActive())) {
                throw new BadRequestException("Country is not active");
            }
        } else if (company != null && company.getCountry() != null) {
            country = company.getCountry();
        }
        if (country == null) {
            throw new BadRequestException("Country is required");
        }
        return country;
    }

    private void validateCapacityNotBelowCurrentInventory(Warehouse warehouse) {
        if (!appProperties.isWarehouseCapacityValidationEnabled()) {
            return;
        }

        BigDecimal currentQuantity = _warehouseInventoryRepository.sumQuantityByWarehouseId(warehouse.getId());
        if (currentQuantity == null) {
            currentQuantity = BigDecimal.ZERO;
        }

        if (warehouse.getCapacity() != null && warehouse.getCapacity().compareTo(currentQuantity) < 0) {
            throw new BadRequestException("Warehouse capacity cannot be lower than current inventory quantity. Current quantity: "
                    + currentQuantity
                    + ", requested capacity: "
                    + warehouse.getCapacity());
        }
    }

    private String normalizeSearch(String search) {
        if (search == null || search.trim().isEmpty()) {
            return null;
        }

        return search.trim();
    }

    private void syncManagerPrimaryWarehouse(Warehouse warehouse, Employee employee) {
        if (employee != null && employee.getPrimaryWarehouse() == null) {
            employee.setPrimaryWarehouse(warehouse);
            _employeeRepository.save(employee);
        }
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
        if (_warehouseInventoryRepository.existsByWarehouse_Id(warehouse.getId())) {
            throw new ConflictException("Warehouse cannot be hard-deleted because it contains inventory records. Archive warehouse instead.");
        }

        if (stockMovementRepository.existsByWarehouse_Id(warehouse.getId())) {
            throw new ConflictException("Warehouse cannot be hard-deleted because it has stock movement history. Archive warehouse instead.");
        }

        if (warehouse.getManager() != null) {
            throw new ConflictException("Warehouse cannot be hard-deleted while manager is assigned. Remove the assignment or archive warehouse instead.");
        }

        if (_transportOrderRepository.existsBySourceWarehouseIdOrDestinationWarehouseId(warehouse.getId(), warehouse.getId())) {
            throw new ConflictException("Warehouse cannot be hard-deleted because it is linked to transport history. Archive warehouse instead.");
        }
    }

    private void validateForDeactivation(Warehouse warehouse) {
        if (_warehouseInventoryRepository.existsNonEmptyByWarehouseId(warehouse.getId())) {
            throw new BadRequestException("Warehouse cannot be deactivated while it contains quantity or reserved inventory.");
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
        Warehouse warehouse;
        if (authenticatedUserProvider.isOverlord()) {
            warehouse = _warehouseRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        } else {
            warehouse = _warehouseRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        }

        if (authenticatedUserProvider.hasRole("WORKER")) {
            warehouseAccessGuard.ensureCanReadWarehouse(warehouse);
        }

        return warehouse;
    }

    private void ensureWarehouseManagerCanUpdateManagedWarehouse(Warehouse warehouse) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return;
        }

        warehouseAccessGuard.ensureCanMutateWarehouse(warehouse);
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

            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
            validateTargetCompany(company);
            return company;
        }

        Company company = authenticatedUserProvider.getAuthenticatedCompanyOrThrow();
        validateTargetCompany(company);
        return company;
    }

    private void validateTargetCompany(Company company) {
        if (company == null || company.getId() == null) {
            throw new BadRequestException("Warehouse must belong to a company");
        }

        if (!Boolean.TRUE.equals(company.getActive())) {
            throw new BadRequestException("Warehouse cannot be created for an inactive company");
        }
    }
}
