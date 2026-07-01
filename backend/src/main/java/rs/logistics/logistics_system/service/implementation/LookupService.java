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
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.BinLocationRepository;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.LookupServiceDefinition;
import rs.logistics.logistics_system.service.support.PageableSortMapper;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;
import rs.logistics.logistics_system.service.support.QueryParameterNormalizer;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LookupService implements LookupServiceDefinition {

    private final WarehouseRepository warehouseRepository;
    private final BinLocationRepository binLocationRepository;
    private final ProductRepository productRepository;
    private final VehicleRepository vehicleRepository;
    private final EmployeeRepository employeeRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final StockMovementRepository stockMovementRepository;
    private final CompanyRepository companyRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final WarehouseAccessGuard warehouseAccessGuard;

    private static final int MAX_SEARCH_LENGTH = 80;

    @Override
    public PageResponse<LookupOptionResponse> warehouses(String search, String accessMode, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "name"));
        String normalizedSearch = normalize(search);
        Long searchId = QueryParameterNormalizer.parseLongOrNull(normalizedSearch);
        Page<Warehouse> page;
        if ("mutate".equalsIgnoreCase(accessMode) || "mutation".equalsIgnoreCase(accessMode)) {
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
    public PageResponse<LookupOptionResponse> products(String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "name"));
        String normalizedSearch = normalize(search);
        Page<Product> page = productRepository.searchProducts(
                currentCompanyScope(),
                normalizedSearch,
                QueryParameterNormalizer.parseLongOrNull(normalizedSearch),
                true,
                safePageable
        );
        return PageResponse.fromContent(page.getContent().stream().map(this::productOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> vehicles(String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "registrationNumber"));
        String normalizedSearch = normalize(search);
        Page<Vehicle> page = vehicleRepository.searchVehicles(
                currentCompanyScope(),
                null,
                normalizedSearch,
                QueryParameterNormalizer.parseLongOrNull(normalizedSearch),
                QueryParameterNormalizer.parseIntegerOrNull(normalizedSearch),
                null,
                null,
                true,
                null,
                null,
                safePageable
        );
        return PageResponse.fromContent(page.getContent().stream().map(this::vehicleOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> employees(String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.ASC, "lastName"));
        String normalizedSearch = normalize(search);
        Page<Employee> page = employeeRepository.searchEmployees(
                currentCompanyScope(),
                normalizedSearch,
                QueryParameterNormalizer.parseLongOrNull(normalizedSearch),
                null,
                true,
                null,
                null,
                null,
                safePageable
        );
        return PageResponse.fromContent(page.getContent().stream().map(this::employeeOption).toList(), page);
    }

    @Override
    public PageResponse<LookupOptionResponse> transportOrders(String search, Pageable pageable) {
        Pageable safePageable = PageableSortMapper.lookup(pageable, Sort.by(Sort.Direction.DESC, "id"));
        Long driverUserId = authenticatedUserProvider.hasRole("DRIVER") ? authenticatedUserProvider.getAuthenticatedUserId() : null;
        Long workerEmployeeId = authenticatedUserProvider.hasRole("WORKER") ? currentEmployeeIdOrNotFound() : null;
        Page<TransportOrder> page = transportOrderRepository.searchTransportOrders(
                currentCompanyScope(),
                driverUserId,
                workerEmployeeId,
                null,
                null,
                null,
                null,
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
        if (authenticatedUserProvider.hasRole("WORKER")) {
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
    public PageResponse<LookupOptionResponse> binLocations(String search, Long warehouseId, Boolean activeOnly, Pageable pageable) {
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
                    null,
                    Boolean.TRUE.equals(activeOnly) ? Boolean.TRUE : null,
                    null,
                    normalize(search),
                    safePageable
            );
        } else {
            page = binLocationRepository.search(
                    currentCompanyScope(),
                    warehouseId,
                    null,
                    Boolean.TRUE.equals(activeOnly) ? Boolean.TRUE : null,
                    null,
                    normalize(search),
                    safePageable
            );
        }
        return PageResponse.fromContent(page.getContent().stream().map(this::binLocationOption).toList(), page);
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
                && !authenticatedUserProvider.hasRole("DISPATCHER");
    }

    private String normalize(String search) {
        if (search == null || search.trim().isEmpty()) {
            return null;
        }
        String normalized = search.trim();
        return normalized.length() > MAX_SEARCH_LENGTH ? normalized.substring(0, MAX_SEARCH_LENGTH) : normalized;
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
        String label = joinNonBlank(employee.getFirstName(), employee.getLastName());
        String subtitle = joinNonBlank(employee.getPosition() != null ? employee.getPosition().name() : null, employee.getEmail());
        return new LookupOptionResponse(employee.getId(), label, subtitle, Boolean.TRUE.equals(employee.getActive()) ? "ACTIVE" : "INACTIVE");
    }

    private LookupOptionResponse transportOrderOption(TransportOrder transportOrder) {
        String subtitle = joinNonBlank(
                transportOrder.getSourceWarehouse() != null ? transportOrder.getSourceWarehouse().getName() : null,
                transportOrder.getDestinationWarehouse() != null ? transportOrder.getDestinationWarehouse().getName() : null
        );
        return new LookupOptionResponse(transportOrder.getId(), transportOrder.getOrderNumber(), subtitle, enumName(transportOrder.getStatus()));
    }


    private LookupOptionResponse stockMovementOption(StockMovement movement) {
        String label = movement.getMovementType().name() + " #" + movement.getId();
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
