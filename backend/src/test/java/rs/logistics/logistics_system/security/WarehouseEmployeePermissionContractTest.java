package rs.logistics.logistics_system.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import rs.logistics.logistics_system.controller.EmployeeController;
import rs.logistics.logistics_system.controller.WarehouseController;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WarehouseEmployeePermissionContractTest {

    @Test
    void warehousePermissionAllowsCompanyAdminForAdministrativeOperations() throws NoSuchMethodException {
        assertAllows(WarehouseController.class, "createWarehouse", "COMPANY_ADMIN");
        assertAllows(WarehouseController.class, "update", "COMPANY_ADMIN");
        assertAllows(WarehouseController.class, "archiveWarehouse", "COMPANY_ADMIN");
        assertAllows(WarehouseController.class, "restoreWarehouse", "COMPANY_ADMIN");
        assertAllows(WarehouseController.class, "deleteById", "COMPANY_ADMIN");
        assertAllows(WarehouseController.class, "assignEmployee", "COMPANY_ADMIN");
        assertAllows(WarehouseController.class, "changeWarehouseStatus", "COMPANY_ADMIN");
    }

    @Test
    void warehousePermissionDoesNotAllowWorkerForAdministrativeOperations() throws NoSuchMethodException {
        assertDenies(WarehouseController.class, "createWarehouse", "WORKER");
        assertDenies(WarehouseController.class, "update", "WORKER");
        assertDenies(WarehouseController.class, "archiveWarehouse", "WORKER");
        assertDenies(WarehouseController.class, "restoreWarehouse", "WORKER");
        assertDenies(WarehouseController.class, "deleteById", "WORKER");
        assertDenies(WarehouseController.class, "assignEmployee", "WORKER");
        assertDenies(WarehouseController.class, "changeWarehouseStatus", "WORKER");
    }

    @Test
    void employeePermissionAllowsHrManagerForAdministrativeOperations() throws NoSuchMethodException {
        assertAllows(EmployeeController.class, "createUser", "HR_MANAGER");
        assertAllows(EmployeeController.class, "createWithUser", "HR_MANAGER");
        assertAllows(EmployeeController.class, "update", "HR_MANAGER");
        assertAllows(EmployeeController.class, "archiveEmployee", "HR_MANAGER");
        assertAllows(EmployeeController.class, "restoreEmployee", "HR_MANAGER");
        assertAllows(EmployeeController.class, "delete", "HR_MANAGER");
        assertAllows(EmployeeController.class, "terminateEmployee", "HR_MANAGER");
    }

    @Test
    void employeePermissionDoesNotAllowWorkerForAdministrativeOperations() throws NoSuchMethodException {
        assertDenies(EmployeeController.class, "createUser", "WORKER");
        assertDenies(EmployeeController.class, "createWithUser", "WORKER");
        assertDenies(EmployeeController.class, "update", "WORKER");
        assertDenies(EmployeeController.class, "getAll", "WORKER");
        assertDenies(EmployeeController.class, "archiveEmployee", "WORKER");
        assertDenies(EmployeeController.class, "restoreEmployee", "WORKER");
        assertDenies(EmployeeController.class, "delete", "WORKER");
        assertDenies(EmployeeController.class, "terminateEmployee", "WORKER");
    }

    private static void assertAllows(Class<?> controller, String methodName, String role) throws NoSuchMethodException {
        String expression = expression(controller, methodName);
        assertTrue(
                expression.contains("'" + role + "'"),
                controller.getSimpleName() + "." + methodName + " must allow " + role
        );
    }

    private static void assertDenies(Class<?> controller, String methodName, String role) throws NoSuchMethodException {
        String expression = expression(controller, methodName);
        assertTrue(
                !expression.contains("'" + role + "'"),
                controller.getSimpleName() + "." + methodName + " must not allow " + role
        );
    }

    private static String expression(Class<?> controller, String methodName) throws NoSuchMethodException {
        for (Method method : controller.getDeclaredMethods()) {
            if (method.getName().equals(methodName)) {
                PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
                assertNotNull(annotation, controller.getSimpleName() + "." + methodName + " must declare @PreAuthorize");
                return annotation.value();
            }
        }
        throw new NoSuchMethodException(controller.getName() + "." + methodName);
    }
}
