package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.InventoryCountLineResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionResponse;
import rs.logistics.logistics_system.entity.InventoryCountLine;
import rs.logistics.logistics_system.entity.InventoryCountSession;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public class InventoryCountMapper {
    public static InventoryCountSessionResponse toResponse(InventoryCountSession session) {
        List<InventoryCountLineResponse> lines = session.getLines() == null ? List.of() : session.getLines().stream()
                .sorted(Comparator.comparing(line -> line.getProduct().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(InventoryCountMapper::toLineResponse)
                .toList();
        int counted = (int) lines.stream().filter(line -> line.getCountedQuantity() != null).count();
        int discrepancies = (int) lines.stream().filter(line -> line.getDifferenceQuantity() != null && line.getDifferenceQuantity().compareTo(BigDecimal.ZERO) != 0).count();
        return new InventoryCountSessionResponse(
                session.getId(),
                session.getCode(),
                session.getDescription(),
                session.getStatus(),
                session.getWarehouse().getId(),
                session.getWarehouse().getName(),
                session.getCreatedBy() != null ? session.getCreatedBy().getId() : null,
                session.getReviewedBy() != null ? session.getReviewedBy().getId() : null,
                session.getReviewedAt(),
                session.getCreatedAt(),
                session.getUpdatedAt(),
                lines.size(),
                counted,
                discrepancies,
                lines
        );
    }

    public static InventoryCountLineResponse toLineResponse(InventoryCountLine line) {
        return new InventoryCountLineResponse(
                line.getId(),
                line.getProduct().getId(),
                line.getProduct().getName(),
                line.getProduct().getSku(),
                line.getSystemQuantity(),
                line.getCountedQuantity(),
                line.getDifferenceQuantity(),
                line.getNote(),
                line.getAdjustmentMovementId()
        );
    }
}
