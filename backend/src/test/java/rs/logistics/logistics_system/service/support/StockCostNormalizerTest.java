package rs.logistics.logistics_system.service.support;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import rs.logistics.logistics_system.exception.BadRequestException;

class StockCostNormalizerTest {

    private final StockCostNormalizer normalizer = new StockCostNormalizer();

    @Test
    void calculatesFourDecimalSnapshotUsingHalfUp() {
        StockCostNormalizer.Cost cost = normalizer.normalize(
                new BigDecimal("14250.0000"),
                null,
                "rsd",
                new BigDecimal("12")
        );

        assertEquals(new BigDecimal("14250.0000"), cost.unitCost());
        assertEquals(new BigDecimal("171000.0000"), cost.totalCost());
        assertEquals("RSD", cost.currency());
    }

    @Test
    void rejectsClientTotalThatDoesNotMatchQuantityAndUnitCost() {
        assertThrows(BadRequestException.class, () -> normalizer.normalize(
                new BigDecimal("500.0000"),
                new BigDecimal("1.0000"),
                "RSD",
                new BigDecimal("20")
        ));
    }
}
