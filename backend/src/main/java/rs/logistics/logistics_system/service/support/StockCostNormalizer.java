package rs.logistics.logistics_system.service.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.exception.BadRequestException;

@Component
public class StockCostNormalizer {
    public static final int SCALE = 4;

    public Cost normalize(BigDecimal unitCost, BigDecimal totalCost, String currency, BigDecimal quantity) {
        if (unitCost != null && unitCost.signum() < 0 || totalCost != null && totalCost.signum() < 0) {
            throw new BadRequestException("Stock movement cost cannot be negative.");
        }
        boolean hasCost = unitCost != null || totalCost != null;
        String normalizedCurrency = currency == null || currency.isBlank() ? null : currency.trim().toUpperCase();
        if (hasCost && normalizedCurrency == null) {
            throw new BadRequestException("Currency is required when stock movement cost is provided.");
        }
        if (!hasCost && normalizedCurrency != null) {
            throw new BadRequestException("Currency cannot be provided without stock movement cost.");
        }
        if (!hasCost) return new Cost(null, null, null);
        if (quantity == null || quantity.signum() <= 0) {
            throw new BadRequestException("A positive actual quantity is required to calculate stock movement cost.");
        }

        BigDecimal normalizedUnit = unitCost == null
                ? totalCost.divide(quantity, SCALE, RoundingMode.HALF_UP)
                : unitCost.setScale(SCALE, RoundingMode.HALF_UP);
        BigDecimal calculatedTotal = normalizedUnit.multiply(quantity).setScale(SCALE, RoundingMode.HALF_UP);
        if (totalCost != null && totalCost.setScale(SCALE, RoundingMode.HALF_UP).compareTo(calculatedTotal) != 0) {
            throw new BadRequestException("Total cost must equal unit cost multiplied by actual quantity.");
        }
        return new Cost(normalizedUnit, calculatedTotal, normalizedCurrency);
    }

    public record Cost(BigDecimal unitCost, BigDecimal totalCost, String currency) {}
}
