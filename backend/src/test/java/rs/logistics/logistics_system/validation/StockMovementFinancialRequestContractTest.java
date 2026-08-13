package rs.logistics.logistics_system.validation;

import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import rs.logistics.logistics_system.dto.create.StockAdjustmentCreate;
import rs.logistics.logistics_system.dto.create.StockInboundCreate;
import rs.logistics.logistics_system.dto.create.StockOutboundCreate;
import rs.logistics.logistics_system.dto.create.StockReturnCreate;
import rs.logistics.logistics_system.dto.create.StockWriteOffCreate;

class StockMovementFinancialRequestContractTest {

    @Test
    void publicMovementRequestsDoNotExposeFinancialSnapshotFields() {
        for (Class<?> requestType : Set.of(
                StockInboundCreate.class,
                StockOutboundCreate.class,
                StockAdjustmentCreate.class,
                StockWriteOffCreate.class,
                StockReturnCreate.class
        )) {
            Set<String> fields = Arrays.stream(requestType.getDeclaredFields())
                    .map(field -> field.getName())
                    .collect(Collectors.toSet());

            assertFalse(fields.contains("unitCost"), requestType.getSimpleName());
            assertFalse(fields.contains("totalCost"), requestType.getSimpleName());
            assertFalse(fields.contains("currency"), requestType.getSimpleName());
        }
    }
}
