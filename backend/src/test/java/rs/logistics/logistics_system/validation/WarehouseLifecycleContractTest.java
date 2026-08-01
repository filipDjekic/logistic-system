package rs.logistics.logistics_system.validation;

import jakarta.persistence.Version;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WarehouseLifecycleContractTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createContractDoesNotExposeStatus() {
        assertFalse(hasField(WarehouseCreate.class, "status"));
    }

    @Test
    void updateRequiresExpectedVersion() {
        WarehouseUpdate update = new WarehouseUpdate();

        assertTrue(validator.validateProperty(update, "expectedVersion").stream()
                .anyMatch(violation -> violation.getMessage().contains("must not be null")));
    }

    @Test
    void warehouseUsesOptimisticLockAndArchivedLifecycleState() throws Exception {
        Field version = Warehouse.class.getDeclaredField("version");

        assertNotNull(version.getAnnotation(Version.class));
        assertEquals(WarehouseStatus.ARCHIVED, WarehouseStatus.valueOf("ARCHIVED"));
    }

    private static boolean hasField(Class<?> type, String name) {
        for (Field field : type.getDeclaredFields()) {
            if (field.getName().equals(name)) {
                return true;
            }
        }
        return false;
    }
}
