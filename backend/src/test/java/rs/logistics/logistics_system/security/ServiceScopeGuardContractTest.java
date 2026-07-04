package rs.logistics.logistics_system.security;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ServiceScopeGuardContractTest {

    @Test
    void transportIdAccessGoesThroughOperationalEntityValidator() throws IOException {
        String source = source("service/implementation/TransportOrderService.java");

        assertTrue(source.contains("operationalEntityAccessValidator.ensureCanAccess(OperationalEntityType.TRANSPORT_ORDER, id)"));
        assertTrue(source.contains("private TransportOrder getTransportOrderOrThrow(Long id)"));
        assertTrue(source.contains("private TransportOrder getTransportOrderForUpdateOrThrow(Long id)"));
    }

    @Test
    void stockMovementIdAccessChecksReadableScopeAndWarehouseMutations() throws IOException {
        String source = source("service/implementation/StockMovementService.java");

        assertTrue(source.contains("private StockMovement getAccessibleStockMovement(Long id)"));
        assertTrue(source.contains("isStockMovementReadableByCurrentUser(movement)"));
        assertTrue(source.contains("warehouseAccessGuard.ensureCanMutateWarehouse(warehouse)"));
    }

    @Test
    void inventoryCountLifecycleUsesWarehouseScopeForReadAndWrite() throws IOException {
        String source = source("service/implementation/InventoryCountService.java");

        assertTrue(source.contains("warehouseAccessGuard.ensureCanReadWarehouse(session.getWarehouse())"));
        assertTrue(source.contains("warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse())"));
        assertTrue(source.contains("private void ensureCanUpdateCountLine"));
    }

    @Test
    void operationalCommentsAndAttachmentsUseCentralEntityScopeValidator() throws IOException {
        String comments = source("service/implementation/OperationalCommentService.java");
        String attachments = source("service/implementation/OperationalAttachmentService.java");

        assertTrue(comments.contains("operationalEntityAccessValidator.ensureCanCreateOperationalContent"));
        assertTrue(comments.contains("operationalEntityAccessValidator.ensureCanAccess"));
        assertTrue(attachments.contains("operationalEntityAccessValidator.ensureCanCreateOperationalContent"));
        assertTrue(attachments.contains("operationalEntityAccessValidator.ensureCanDeleteOperationalContent"));
    }

    @Test
    void taskAndEmployeeOwnScopeStayCentralizedInSecurityHelpers() throws IOException {
        String taskController = source("controller/TaskController.java");
        String employeeController = source("controller/EmployeeController.java");

        assertTrue(taskController.contains("@taskSecurity.isAssignedToCurrentUser(#id)"));
        assertTrue(employeeController.contains("@employeeSecurity.canRead(#id)"));
    }

    private static String source(String relativePath) throws IOException {
        return Files.readString(Path.of("src/main/java/rs/logistics/logistics_system").resolve(relativePath));
    }
}
