package rs.logistics.logistics_system.security;

import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class OperationalScopeIdorContractTest extends ServiceTestSupport {

    @Mock
    private AuthenticatedUserProvider authenticatedUserProvider;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeWarehouseAssignmentRepository employeeWarehouseAssignmentRepository;

    @Mock
    private InternalWarehouseMovementRepository internalWarehouseMovementRepository;

    @Mock
    private InventoryCountSessionRepository inventoryCountSessionRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TransportOrderRepository transportOrderRepository;

    @Mock
    private VehicleMaintenanceRepository vehicleMaintenanceRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private WarehouseInventoryRepository warehouseInventoryRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @InjectMocks
    private WarehouseAccessGuard warehouseAccessGuard;

    @InjectMocks
    private OperationalEntityAccessValidator operationalEntityAccessValidator;

    @Test
    void workerCanReadOnlyAssignedWarehouse() {
        Company company = TestEntityFactory.company(1L);
        Warehouse assignedWarehouse = TestEntityFactory.warehouse(10L, company);
        Warehouse otherWarehouse = TestEntityFactory.warehouse(11L, company);
        User workerUser = TestEntityFactory.user(100L, "worker@example.com", "WORKER", company);
        Employee worker = TestEntityFactory.employee(200L, workerUser, company, EmployeePosition.WORKER);
        worker.setPrimaryWarehouse(assignedWarehouse);

        mockScopedWorker(workerUser, worker);
        when(employeeWarehouseAssignmentRepository.hasActiveAccess(eq(200L), eq(11L), any(List.class), any(LocalDate.class)))
                .thenReturn(false);

        assertDoesNotThrow(() -> warehouseAccessGuard.ensureCanReadWarehouse(assignedWarehouse));
        assertThrows(ResourceNotFoundException.class, () -> warehouseAccessGuard.ensureCanReadWarehouse(otherWarehouse));
    }

    @Test
    void driverCanAccessOwnTransportOrder() {
        Company company = TestEntityFactory.company(1L);
        User driverUser = TestEntityFactory.user(100L, "driver@example.com", "DRIVER", company);
        Employee driver = TestEntityFactory.employee(200L, driverUser, company, EmployeePosition.DRIVER);
        TransportOrder ownTransport = transportOrder(300L, company, driver);

        mockScopedDriver(driverUser);
        when(transportOrderRepository.findByIdAndCreatedBy_Company_Id(300L, 1L)).thenReturn(Optional.of(ownTransport));

        assertTrue(operationalEntityAccessValidator.canAccess(OperationalEntityType.TRANSPORT_ORDER, 300L));
    }

    @Test
    void driverCannotAccessAnotherDriversTransportOrder() {
        Company company = TestEntityFactory.company(1L);
        User authenticatedDriverUser = TestEntityFactory.user(100L, "driver@example.com", "DRIVER", company);
        User otherDriverUser = TestEntityFactory.user(101L, "other.driver@example.com", "DRIVER", company);
        Employee otherDriver = TestEntityFactory.employee(201L, otherDriverUser, company, EmployeePosition.DRIVER);
        TransportOrder otherTransport = transportOrder(301L, company, otherDriver);

        mockScopedDriver(authenticatedDriverUser);
        when(transportOrderRepository.findByIdAndCreatedBy_Company_Id(301L, 1L)).thenReturn(Optional.of(otherTransport));

        assertFalse(operationalEntityAccessValidator.canAccess(OperationalEntityType.TRANSPORT_ORDER, 301L));
        assertThrows(ResourceNotFoundException.class,
                () -> operationalEntityAccessValidator.ensureCanAccess(OperationalEntityType.TRANSPORT_ORDER, 301L));
    }

    private void mockScopedWorker(User user, Employee employee) {
        when(authenticatedUserProvider.isOverlord()).thenReturn(false);
        when(authenticatedUserProvider.isCompanyAdmin()).thenReturn(false);
        when(authenticatedUserProvider.hasRole("DISPATCHER")).thenReturn(false);
        when(authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")).thenReturn(false);
        when(authenticatedUserProvider.hasRole("WORKER")).thenReturn(true);
        when(authenticatedUserProvider.getAuthenticatedUserId()).thenReturn(user.getId());
        when(employeeRepository.findByUser_Id(user.getId())).thenReturn(Optional.of(employee));
    }

    private void mockScopedDriver(User user) {
        when(authenticatedUserProvider.isOverlord()).thenReturn(false);
        when(authenticatedUserProvider.isCompanyAdmin()).thenReturn(false);
        when(authenticatedUserProvider.hasRole("DISPATCHER")).thenReturn(false);
        when(authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")).thenReturn(false);
        when(authenticatedUserProvider.hasRole("DRIVER")).thenReturn(true);
        when(authenticatedUserProvider.getAuthenticatedUserId()).thenReturn(user.getId());
        when(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).thenReturn(user.getCompany().getId());
    }

    private TransportOrder transportOrder(Long id, Company company, Employee driver) {
        User dispatcher = TestEntityFactory.user(900L + id, "dispatcher" + id + "@example.com", "DISPATCHER", company);
        TransportOrder transportOrder = new TransportOrder();
        TestEntityFactory.setId(transportOrder, id);
        transportOrder.setCreatedBy(dispatcher);
        transportOrder.setAssignedEmployee(driver);
        return transportOrder;
    }
}
