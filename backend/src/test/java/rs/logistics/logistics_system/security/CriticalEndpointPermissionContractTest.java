package rs.logistics.logistics_system.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import rs.logistics.logistics_system.controller.EmployeeController;
import rs.logistics.logistics_system.controller.InventoryCountController;
import rs.logistics.logistics_system.controller.OperationalAttachmentController;
import rs.logistics.logistics_system.controller.OperationalCommentController;
import rs.logistics.logistics_system.controller.StockMovementController;
import rs.logistics.logistics_system.controller.TaskController;
import rs.logistics.logistics_system.controller.TransportOrderController;
import rs.logistics.logistics_system.controller.VehicleController;
import rs.logistics.logistics_system.controller.WarehouseController;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CriticalEndpointPermissionContractTest {

    private static final List<Class<?>> CRITICAL_CONTROLLERS = List.of(
            WarehouseController.class,
            TransportOrderController.class,
            InventoryCountController.class,
            StockMovementController.class,
            TaskController.class,
            EmployeeController.class,
            VehicleController.class,
            OperationalAttachmentController.class,
            OperationalCommentController.class
    );

    @Test
    void allCriticalMappedEndpointsHavePreAuthorize() {
        for (Class<?> controller : CRITICAL_CONTROLLERS) {
            for (Method method : controller.getDeclaredMethods()) {
                if (isMappedEndpoint(method)) {
                    assertNotNull(
                            method.getAnnotation(PreAuthorize.class),
                            controller.getSimpleName() + "." + method.getName() + " must declare explicit authorization"
                    );
                }
            }
        }
    }

    @Test
    void warehouseWriteEndpointsStayAdministrativeOrManagedWarehouseOnly() throws NoSuchMethodException {
        assertRoles(WarehouseController.class, "createWarehouse", "OVERLORD", "COMPANY_ADMIN");
        assertRoles(WarehouseController.class, "update", "OVERLORD", "COMPANY_ADMIN", "WAREHOUSE_MANAGER");
        assertRoles(WarehouseController.class, "deleteById", "OVERLORD", "COMPANY_ADMIN");
    }

    @Test
    void transportLifecycleEndpointsDoNotExposeWorkerWriteAccess() throws NoSuchMethodException {
        assertRoles(TransportOrderController.class, "create", "OVERLORD", "DISPATCHER");
        assertRoles(TransportOrderController.class, "updateStatus", "OVERLORD", "COMPANY_ADMIN", "DISPATCHER", "WAREHOUSE_MANAGER", "DRIVER");
        assertNoRoles(TransportOrderController.class, "updateStatus", "WORKER", "HR_MANAGER");
    }

    @Test
    void inventoryCountLifecycleEndpointsKeepWorkerLimitedToCountingLineUpdates() throws NoSuchMethodException {
        assertRoles(InventoryCountController.class, "create", "OVERLORD", "WAREHOUSE_MANAGER");
        assertRoles(InventoryCountController.class, "start", "OVERLORD", "WAREHOUSE_MANAGER");
        assertRoles(InventoryCountController.class, "updateLine", "OVERLORD", "WAREHOUSE_MANAGER", "WORKER");
        assertNoRoles(InventoryCountController.class, "approve", "WORKER", "DISPATCHER", "DRIVER");
        assertNoRoles(InventoryCountController.class, "cancel", "WORKER", "DISPATCHER", "DRIVER");
    }

    @Test
    void stockMovementMutationEndpointsStayWarehouseScoped() throws NoSuchMethodException {
        assertRoles(StockMovementController.class, "approve", "OVERLORD", "WAREHOUSE_MANAGER");
        assertRoles(StockMovementController.class, "reject", "OVERLORD", "WAREHOUSE_MANAGER");
        assertRoles(StockMovementController.class, "execute", "OVERLORD", "WAREHOUSE_MANAGER");
        assertRoles(StockMovementController.class, "reverse", "OVERLORD", "WAREHOUSE_MANAGER");
        assertNoRoles(StockMovementController.class, "execute", "DISPATCHER", "WORKER", "DRIVER", "HR_MANAGER");
    }

    @Test
    void taskLifecycleKeepsAssignedUserSecurityExpression() throws NoSuchMethodException {
        String updateStatus = preAuthorize(TaskController.class, "updateStatus").value();
        assertTrue(updateStatus.contains("@taskSecurity.isAssignedToCurrentUser(#id)"));
        assertTrue(updateStatus.contains("DISPATCHER"));
        assertTrue(updateStatus.contains("WAREHOUSE_MANAGER"));
    }

    @Test
    void employeeReadUsesDedicatedEmployeeSecurityHelper() throws NoSuchMethodException {
        String getById = preAuthorize(EmployeeController.class, "getById").value();
        String tasks = preAuthorize(EmployeeController.class, "getTasksByEmployeeId").value();
        String shifts = preAuthorize(EmployeeController.class, "getShiftsByEmployeeId").value();

        assertTrue(getById.contains("@employeeSecurity.canRead(#id)"));
        assertTrue(tasks.contains("@employeeSecurity.canRead(#id)"));
        assertTrue(shifts.contains("@employeeSecurity.canRead(#id)"));
    }

    @Test
    void operationalContentAllowsCreateReadForAssignedRolesButRestrictsAttachmentDelete() throws NoSuchMethodException {
        assertRoles(OperationalCommentController.class, "create", "DRIVER", "WORKER");
        assertRoles(OperationalAttachmentController.class, "create", "DRIVER", "WORKER");
        assertNoRoles(OperationalAttachmentController.class, "delete", "DRIVER", "WORKER");
    }

    private static void assertRoles(Class<?> controller, String methodName, String... roles) throws NoSuchMethodException {
        String expression = preAuthorize(controller, methodName).value();
        for (String role : roles) {
            assertTrue(expression.contains("'" + role + "'"), controller.getSimpleName() + "." + methodName + " must allow " + role);
        }
    }

    private static void assertNoRoles(Class<?> controller, String methodName, String... roles) throws NoSuchMethodException {
        String expression = preAuthorize(controller, methodName).value();
        for (String role : roles) {
            assertTrue(!expression.contains("'" + role + "'"), controller.getSimpleName() + "." + methodName + " must not allow " + role);
        }
    }

    private static PreAuthorize preAuthorize(Class<?> controller, String methodName) throws NoSuchMethodException {
        for (Method method : controller.getDeclaredMethods()) {
            if (method.getName().equals(methodName)) {
                PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
                assertNotNull(annotation, controller.getSimpleName() + "." + methodName + " must declare @PreAuthorize");
                return annotation;
            }
        }
        throw new NoSuchMethodException(controller.getName() + "." + methodName);
    }

    private static boolean isMappedEndpoint(Method method) {
        return method.isAnnotationPresent(GetMapping.class)
                || method.isAnnotationPresent(PostMapping.class)
                || method.isAnnotationPresent(PutMapping.class)
                || method.isAnnotationPresent(PatchMapping.class)
                || method.isAnnotationPresent(DeleteMapping.class);
    }
}
