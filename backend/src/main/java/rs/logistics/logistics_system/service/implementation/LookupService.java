package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.LookupOptionResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.entity.BinLocation;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseZone;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.EmployeeLookupMode;
import rs.logistics.logistics_system.enums.ProductLookupMode;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.repository.BinLocationRepository;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.repository.WarehouseZoneRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.LookupServiceDefinition;
import rs.logistics.logistics_system.service.definition.DriverWorkloadServiceDefinition;
import rs.logistics.logistics_system.lifecycle.LifecycleStatusClassifier;
import rs.logistics.logistics_system.service.support.PageableSortMapper;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LookupService implements LookupServiceDefinition {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseZoneRepository warehouseZoneRepository;
    private final BinLocationRepository binLocationRepository;
    private final ProductRepository productRepository;
    private final VehicleRepository vehicleRepository;
    private final EmployeeRepository employeeRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final StockMovementRepository stockMovementRepository;
    private final CompanyRepository companyRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final WarehouseAccessGuard warehouseAccessGuard;
    private final DriverWorkloadServiceDefinition driverWorkloadService;
    private final LifecycleStatusClassifier lifecycleStatusClassifier;

    private static final int MAX_SEARCH_LENGTH = 80;

    @Override
    public PageResponse<LookupOptionResponse> warehouses(String search, String accessMode, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "name"));
        String normalizedSearch = normalize(search);
        String normalizedAccessMode = accessMode == null ? "read" : accessMode.trim().toLowerCase(java.util.Locale.ROOT);
        if (!Set.of("read", "select", "reference", "mutate", "mutation").contains(normalizedAccessMode)) {
            throw new BadRequestException("Unsupported warehouse lookup accessMode");
        }
        Long searchId = QueryParameterNormalizer.parseLongOrNull(normalizedSearch);
        Page<Warehouse> page;
        if ("select".equals(normalizedAccessMode) || "reference".equals(normalizedAccessMode)) {
            page = warehouseRepository.search(currentCompanyScope(), normalizedSearch, searchId, null, true, null, safePageable);
        } else if ("mutate".equals(normalizedAccessMode) || "mutation".equals(normalizedAccessMode)) {
            List<Long> warehouseIds = warehouseAccessGuard.mutationWarehouseIdsForScopedUser();
            page = warehouseIds == null
                    ? warehouseRepository.search(currentCompanyScope(), normalizedSearch, searchId, null, true, null, safePageable)
                    : warehouseIds.isEmpty()
                        ? Page.empty(safePageable)
                        : warehouseRepository.searchWarehouseIds(currentCompanyScope(), warehouseIds, normalizedSearch, searchId, null, true, null, safePageable);
        } else if (shouldLimitToAssignedWarehouses()) {
            Long employeeId = employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId())
                    .map(Employee::getId)
                    .orElse(null);
            page = employeeId == null
                    ? Page.empty(safePageable)
                    : warehouseRepository.searchAssignedWarehouses(currentCompanyScope(), employeeId, normalizedSearch, searchId, null, true, null, safePageable);
        } else {
            page = warehouseRepository.search(currentCompanyScope(), normalizedSearch, searchId, null, true, null, safePageable);
        }
        return PageResponse.fromContent(page.getContent().stream().map(this::warehouseOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> products(String search, Long warehouseId, ProductLookupMode mode, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "name"));
        String normalizedSearch = normalize(search);
        if (warehouseId != null && !warehouseAccessGuard.canReadWarehouse(warehouseId)) {
            throw new ResourceNotFoundException("Warehouse not found");
        }
        Long searchId = QueryParameterNormalizer.parseLongOrNull(normalizedSearch);
        Page<Product> page;
        ProductLookupMode resolvedMode = mode == null ? ProductLookupMode.REFERENCE : mode;
        if (resolvedMode == ProductLookupMode.AVAILABLE_STOCK) {
            if (warehouseId == null) {
                throw new BadRequestException("warehouseId is required for AVAILABLE_STOCK product lookup");
            }
            page = productRepository.searchProductsWithAvailableStockInWarehouse(
                    currentCompanyScope(), warehouseId, normalizedSearch, searchId, true, safePageable);
        } else if (warehouseId != null) {
            page = productRepository.searchProductsConfiguredInWarehouse(
                    currentCompanyScope(), warehouseId, normalizedSearch, searchId, true, safePageable);
        } else if (isWorkplaceScopedUser()) {
            List<Long> warehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
            page = warehouseIds == null || warehouseIds.isEmpty()
                    ? productRepository.searchProductsRelatedToUser(
                            currentCompanyScope(), authenticatedUserProvider.getAuthenticatedUserId(),
                            normalizedSearch, searchId, true, safePageable)
                    : productRepository.searchDriverAccessibleProducts(
                            currentCompanyScope(), warehouseIds, authenticatedUserProvider.getAuthenticatedUserId(),
                            normalizedSearch, searchId, true, safePageable);
        } else {
            page = productRepository.searchProducts(
                    currentCompanyScope(), normalizedSearch, searchId, true, safePageable);
        }
        return PageResponse.fromContent(page.getContent().stream().map(this::productOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> vehicles(
            String search,
            VehicleStatus status,
            Boolean available,
            LocalDateTime availableFrom,
            LocalDateTime availableTo,
            Pageable pageable
    ) {
        validateAvailabilityWindow(availableFrom, availableTo);
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "registrationNumber"));
        String normalizedSearch = normalize(search);

        Page<Vehicle> page = Boolean.TRUE.equals(available)
                ? vehicleRepository.searchSelectableVehicles(
                        currentCompanyScope(),
                        normalizedSearch,
                        QueryParameterNormalizer.parseLongOrNull(normalizedSearch),
                        QueryParameterNormalizer.parseIntegerOrNull(normalizedSearch),
                        status,
                        availableFrom,
                        availableTo,
                        lifecycleStatusClassifier.scheduleBlockingTransportStatuses(),
                        lifecycleStatusClassifier.activeVehicleMaintenanceStatuses(),
                        safePageable
                )
                : vehicleRepository.searchVehicles(
                currentCompanyScope(),
                null,
                normalizedSearch,
                QueryParameterNormalizer.parseLongOrNull(normalizedSearch),
                QueryParameterNormalizer.parseIntegerOrNull(normalizedSearch),
                status,
                null,
                null,
                null,
                null,
                safePageable
        );

        return PageResponse.fromContent(page.getContent().stream().map(this::vehicleOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> employees(
            String search,
            EmployeePosition position,
            Boolean active,
            String linkedUser,
            EmployeeLookupMode mode,
            LocalDateTime availableFrom,
            LocalDateTime availableTo,
            Pageable pageable
    ) {
        validateAvailabilityWindow(availableFrom, availableTo);
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "lastName"));
        String normalizedSearch = normalize(search);
        Long searchId = QueryParameterNormalizer.parseLongOrNull(normalizedSearch);

        Page<Employee> page = employeeRepository.searchEmployees(
                currentCompanyScope(), normalizedSearch, searchId, position, active, linkedUser,
                availableFrom, availableTo, safePageable);

        return PageResponse.fromContent(page.getContent().stream()
                .map(employee -> employeeOption(
                        employee,
                        !isSelectableDriver(employee, position, availableFrom, availableTo)
                ))
                .toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> transportOrders(
            String search,
            Long sourceWarehouseId,
            Long destinationWarehouseId,
            Set<TransportOrderStatus> excludeStatuses,
            Pageable pageable
    ) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.DESC, "id"));
        Long driverUserId = authenticatedUserProvider.hasRole("DRIVER") ? authenticatedUserProvider.getAuthenticatedUserId() : null;
        Long workerEmployeeId = authenticatedUserProvider.hasRole("WORKER") ? currentEmployeeIdOrNotFound() : null;

        Page<TransportOrder> page = transportOrderRepository.searchTransportOrders(
                currentCompanyScope(),
                driverUserId,
                workerEmployeeId,
                false,
                null,
                null,
                null,
                excludeStatuses == null || excludeStatuses.isEmpty() ? null : excludeStatuses,
                sourceWarehouseId,
                destinationWarehouseId,
                null,
                null,
                null,
                null,
                normalize(search),
                safePageable
        );

        return PageResponse.fromContent(page.getContent().stream().map(this::transportOrderOption).toList(), page);
    }


    @Override
    public PageResponse<LookupOptionResponse> stockMovements(String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.DESC, "id"));
        Page<StockMovement> page;
        if (authenticatedUserProvider.hasRole("WORKER") || authenticatedUserProvider.hasRole("DRIVER")) {
            page = stockMovementRepository.searchMovementsAssignedToEmployee(
                    currentCompanyScope(),
                    currentEmployeeIdOrNotFound(),
                    normalize(search),
                    parseSearchId(search),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    safePageable
            );
        } else {
            List<Long> warehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
            if (warehouseIds != null) {
                page = warehouseIds.isEmpty()
                        ? Page.empty(safePageable)
                        : stockMovementRepository.searchMovementsForWarehouseIds(
                        currentCompanyScope(),
                        warehouseIds,
                        normalize(search),
                        parseSearchId(search),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        safePageable
                );
            } else {
                page = stockMovementRepository.searchMovements(
                        currentCompanyScope(),
                        normalize(search),
                        parseSearchId(search),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        safePageable
                );
            }
        }
        return PageResponse.fromContent(page.getContent().stream().map(this::stockMovementOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> binLocations(String search, Long warehouseId, Long zoneId, Boolean activeOnly, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "code"));
        List<Long> warehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        Page<BinLocation> page;
        if (warehouseIds != null) {
            page = warehouseIds.isEmpty()
                    ? Page.empty(safePageable)
                    : binLocationRepository.searchAssigned(
                    currentCompanyScope(),
                    warehouseIds,
                    warehouseId,
                    zoneId,
                    Boolean.TRUE.equals(activeOnly) ? Boolean.TRUE : null,
                    null,
                    normalize(search),
                    safePageable
            );
        } else {
            page = binLocationRepository.search(
                    currentCompanyScope(),
                    warehouseId,
                    zoneId,
                    Boolean.TRUE.equals(activeOnly) ? Boolean.TRUE : null,
                    null,
                    normalize(search),
                    safePageable
            );
        }
        return PageResponse.fromContent(page.getContent().stream().map(this::binLocationOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> warehouseZones(String search, Long warehouseId, Boolean activeOnly, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "code"));
        List<Long> warehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        Page<WarehouseZone> page;
        if (warehouseIds != null) {
            page = warehouseIds.isEmpty()
                    ? Page.empty(safePageable)
                    : warehouseZoneRepository.searchAssigned(
                            currentCompanyScope(), warehouseIds, warehouseId,
                            Boolean.TRUE.equals(activeOnly) ? Boolean.TRUE : null,
                            null, normalize(search), safePageable
                    );
        } else {
            page = warehouseZoneRepository.search(
                    currentCompanyScope(), warehouseId,
                    Boolean.TRUE.equals(activeOnly) ? Boolean.TRUE : null,
                    null, normalize(search), safePageable
            );
        }
        return PageResponse.fromContent(page.getContent().stream().map(this::warehouseZoneOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> companies(String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "name"));
        Long companyId = authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        String normalizedSearch = normalize(search);
        Page<Company> page = companyRepository.searchLookup(
                companyId,
                normalizedSearch,
                QueryParameterNormalizer.parseLongOrNull(normalizedSearch),
                safePageable
        );
        return PageResponse.fromContent(page.getContent().stream().map(this::companyOption).toList(), page);
    }

    private Long currentCompanyScope() {
        return authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
    }

    private boolean shouldLimitToAssignedWarehouses() {
        return !authenticatedUserProvider.isOverlord()
                && !authenticatedUserProvider.isCompanyAdmin()
                && !authenticatedUserProvider.hasRole("DISPATCHER")
                && !authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER");
    }

    private boolean isWorkplaceScopedUser() {
        return !authenticatedUserProvider.isOverlord()
                && !authenticatedUserProvider.isCompanyAdmin()
                && !authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                && !authenticatedUserProvider.hasRole("DISPATCHER")
                && (authenticatedUserProvider.hasRole("WORKER") || authenticatedUserProvider.hasRole("DRIVER"));
    }

    private String normalize(String search) {
        if (search == null || search.trim().isEmpty()) {
            return null;
        }
        String normalized = search.trim();
        if (normalized.length() > MAX_SEARCH_LENGTH) {
            throw new BadRequestException("Lookup search must be at most " + MAX_SEARCH_LENGTH + " characters");
        }
        return normalized;
    }

    private void validateAvailabilityWindow(LocalDateTime availableFrom, LocalDateTime availableTo) {
        if ((availableFrom == null) != (availableTo == null)) {
            throw new BadRequestException("Both availableFrom and availableTo are required");
        }
        if (availableFrom != null && !availableFrom.isBefore(availableTo)) {
            throw new BadRequestException("availableFrom must be before availableTo");
        }
    }

    private LookupOptionResponse warehouseOption(Warehouse warehouse) {
        String subtitle = joinNonBlank(
                warehouse.getCity() != null ? warehouse.getCity().getName() : null,
                warehouse.getAddress()
        );
        return new LookupOptionResponse(warehouse.getId(), warehouse.getName(), subtitle, enumName(warehouse.getStatus()));
    }

    private LookupOptionResponse productOption(Product product) {
        String subtitle = joinNonBlank(product.getSku(), product.getUnit() != null ? product.getUnit().name() : null);
        return new LookupOptionResponse(product.getId(), product.getName(), subtitle, Boolean.TRUE.equals(product.getActive()) ? "ACTIVE" : "INACTIVE");
    }

    private LookupOptionResponse vehicleOption(Vehicle vehicle) {
        String model = vehicle.getVehicleModel() == null ? null : vehicle.getVehicleModel().getName();
        String brand = vehicle.getVehicleModel() == null || vehicle.getVehicleModel().getBrand() == null ? null : vehicle.getVehicleModel().getBrand().getName();
        String subtitle = joinNonBlank(brand, model, vehicle.getType() != null ? vehicle.getType().name() : null);
        return new LookupOptionResponse(vehicle.getId(), vehicle.getRegistrationNumber(), subtitle, enumName(vehicle.getStatus()));
    }

    private LookupOptionResponse employeeOption(Employee employee) {
        return employeeOption(employee, false);
    }

    private LookupOptionResponse employeeOption(Employee employee, boolean disabled) {
        String label = joinNonBlank(employee.getFirstName(), employee.getLastName());
        String subtitle = joinNonBlank(employee.getPosition() != null ? employee.getPosition().name() : null, employee.getEmail());
        return new LookupOptionResponse(
                employee.getId(),
                label,
                subtitle,
                Boolean.TRUE.equals(employee.getActive()) ? "ACTIVE" : "INACTIVE",
                disabled || !Boolean.TRUE.equals(employee.getActive())
        );
    }

    private boolean isSelectableDriver(Employee employee, EmployeePosition position,
                                       LocalDateTime availableFrom, LocalDateTime availableTo) {
        if (availableFrom == null || availableTo == null || position != EmployeePosition.DRIVER) {
            return true;
        }
        try {
            driverWorkloadService.validateDriverCanTakeTransport(employee.getId(), availableFrom, availableTo, null);
            return true;
        } catch (BadRequestException ignored) {
            return false;
        }
    }

    private LookupOptionResponse transportOrderOption(TransportOrder transportOrder) {
        String subtitle = joinNonBlank(
                transportOrder.getSourceWarehouse() != null ? transportOrder.getSourceWarehouse().getName() : null,
                transportOrder.getDestinationWarehouse() != null ? transportOrder.getDestinationWarehouse().getName() : null
        );
        return new LookupOptionResponse(transportOrder.getId(), transportOrder.getOrderNumber(), subtitle, enumName(transportOrder.getStatus()));
    }


    private LookupOptionResponse stockMovementOption(StockMovement movement) {
        String label = (movement.getMovementType() != null ? movement.getMovementType().name() : "Stock movement")
                + " #" + movement.getId();
        String subtitle = joinNonBlank(
                movement.getProduct() != null ? movement.getProduct().getName() : null,
                movement.getWarehouse() != null ? movement.getWarehouse().getName() : null,
                movement.getReferenceNumber()
        );
        return new LookupOptionResponse(movement.getId(), label, subtitle, movement.getReasonCode() != null ? movement.getReasonCode().name() : null);
    }

    private LookupOptionResponse binLocationOption(BinLocation binLocation) {
        String subtitle = joinNonBlank(
                binLocation.getWarehouse() != null ? binLocation.getWarehouse().getName() : null,
                binLocation.getZone() != null ? binLocation.getZone().getCode() : null,
                binLocation.getZone() != null && binLocation.getZone().getType() != null ? binLocation.getZone().getType().name() : null
        );
        return new LookupOptionResponse(
                binLocation.getId(),
                joinNonBlank(binLocation.getCode(), binLocation.getName()),
                subtitle,
                Boolean.TRUE.equals(binLocation.getActive()) ? "ACTIVE" : "INACTIVE"
        );
    }

    private LookupOptionResponse warehouseZoneOption(WarehouseZone zone) {
        return new LookupOptionResponse(
                zone.getId(),
                joinNonBlank(zone.getCode(), zone.getName()),
                joinNonBlank(
                        zone.getWarehouse() != null ? zone.getWarehouse().getName() : null,
                        zone.getType() != null ? zone.getType().name() : null
                ),
                Boolean.TRUE.equals(zone.getActive()) ? "ACTIVE" : "INACTIVE"
        );
    }

    private Long currentEmployeeIdOrNotFound() {
        return employeeRepository.findByUser_Id(authenticatedUserProvider.getAuthenticatedUserId())
                .map(Employee::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private Long parseSearchId(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }

        try {
            return Long.parseLong(search.trim().replace("#", ""));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private LookupOptionResponse companyOption(Company company) {
        String subtitle = joinNonBlank(
                company.getCity() != null ? company.getCity().getName() : null,
                company.getCountry() != null ? company.getCountry().getName() : null
        );
        return new LookupOptionResponse(company.getId(), company.getName(), subtitle, Boolean.TRUE.equals(company.getActive()) ? "ACTIVE" : "INACTIVE");
    }

    private String enumName(Enum<?> value) {
        return value == null ? null : value.name();
    }

    private String joinNonBlank(String... values) {
        return java.util.Arrays.stream(values)
                .filter(value -> value != null && !value.isBlank())
                .collect(java.util.stream.Collectors.joining(" · "));
    }
}
