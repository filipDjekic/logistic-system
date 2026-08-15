package rs.logistics.logistics_system.security;

import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.EmployeeWarehouseAssignmentRepository;
import rs.logistics.logistics_system.repository.InternalWarehouseMovementRepository;
import rs.logistics.logistics_system.repository.InventoryCountSessionRepository;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleMaintenanceRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.service.security.OperationalEntityAccessValidator;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;
import rs.logistics.logistics_system.testsupport.ServiceTestSupport;
import rs.logistics.logistics_system.testsupport.TestEntityFactory;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;

class StockMovementCompanyScopeTest extends ServiceTestSupport {

    @Mock private AuthenticatedUserProvider authenticatedUserProvider;
    @Mock private CompanyRepository companyRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmployeeWarehouseAssignmentRepository employeeWarehouseAssignmentRepository;
    @Mock private InternalWarehouseMovementRepository internalWarehouseMovementRepository;
    @Mock private InventoryCountSessionRepository inventoryCountSessionRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ShiftRepository shiftRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private TransportOrderRepository transportOrderRepository;
    @Mock private VehicleMaintenanceRepository vehicleMaintenanceRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private WarehouseInventoryRepository warehouseInventoryRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseAccessGuard warehouseAccessGuard;

    @InjectMocks
    private OperationalEntityAccessValidator accessValidator;

    @Test
    void warehouseManagerListAndDetailsUseTheSameCompanyScope() {
        StockMovement movement = movement(2297L, 10L, 1L);
        warehouseManagerInCompany(1L);
        when(stockMovementRepository.findByIdAndWarehouse_Company_Id(2297L, 1L))
                .thenReturn(Optional.of(movement));

        AuthorizationService authorization = new AuthorizationService(
                authenticatedUserProvider,
                accessValidator,
                shiftRepository,
                warehouseAccessGuard,
                stockMovementRepository
        );

        assertTrue(authorization.canListStockMovements());
        assertTrue(authorization.canReadStockMovement(2297L));
        verify(stockMovementRepository).findByIdAndWarehouse_Company_Id(2297L, 1L);
        verify(employeeWarehouseAssignmentRepository, never()).hasActiveAccess(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyList(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void warehouseManagerCanReadMovementFromAnyWarehouseInOwnCompany() {
        warehouseManagerInCompany(1L);
        when(stockMovementRepository.findByIdAndWarehouse_Company_Id(2297L, 1L))
                .thenReturn(Optional.of(movement(2297L, 99L, 1L)));

        assertTrue(accessValidator.canAccess(OperationalEntityType.STOCK_MOVEMENT, 2297L));
    }

    @Test
    void directIdFromAnotherCompanyIsDeniedByTheCompanyScopedRepositoryLookup() {
        warehouseManagerInCompany(1L);
        when(stockMovementRepository.findByIdAndWarehouse_Company_Id(2297L, 1L))
                .thenReturn(Optional.empty());

        assertFalse(accessValidator.canAccess(OperationalEntityType.STOCK_MOVEMENT, 2297L));
    }

    @Test
    void dispatcherCanReadOnlyTransportRelatedMovementDetails() {
        dispatcherInCompany(1L);
        StockMovement manual = movement(100L, 10L, 1L);
        StockMovement transportRelated = movement(101L, 10L, 1L);
        transportRelated.setReferenceType(StockMovementReferenceType.TRANSPORT_ORDER);
        when(stockMovementRepository.findByIdAndWarehouse_Company_Id(100L, 1L)).thenReturn(Optional.of(manual));
        when(stockMovementRepository.findByIdAndWarehouse_Company_Id(101L, 1L)).thenReturn(Optional.of(transportRelated));

        assertFalse(accessValidator.canAccess(OperationalEntityType.STOCK_MOVEMENT, 100L));
        assertTrue(accessValidator.canAccess(OperationalEntityType.STOCK_MOVEMENT, 101L));
    }

    private void warehouseManagerInCompany(Long companyId) {
        when(authenticatedUserProvider.isOverlord()).thenReturn(false);
        when(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).thenReturn(companyId);
        when(authenticatedUserProvider.getAuthenticatedUserId()).thenReturn(700L);
        when(authenticatedUserProvider.hasRole(anyString()))
                .thenAnswer(invocation -> "WAREHOUSE_MANAGER".equals(invocation.getArgument(0)));
    }

    private void dispatcherInCompany(Long companyId) {
        when(authenticatedUserProvider.isOverlord()).thenReturn(false);
        when(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).thenReturn(companyId);
        when(authenticatedUserProvider.getAuthenticatedUserId()).thenReturn(701L);
        when(authenticatedUserProvider.hasRole(anyString()))
                .thenAnswer(invocation -> "DISPATCHER".equals(invocation.getArgument(0)));
    }

    private StockMovement movement(Long id, Long warehouseId, Long companyId) {
        Company company = TestEntityFactory.company(companyId);
        Warehouse warehouse = TestEntityFactory.warehouse(warehouseId, company);
        StockMovement movement = new StockMovement();
        TestEntityFactory.setId(movement, id);
        movement.setWarehouse(warehouse);
        return movement;
    }
}
