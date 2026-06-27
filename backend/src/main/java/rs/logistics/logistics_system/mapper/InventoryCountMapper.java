package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.InventoryCountLineResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionSummaryResponse;
import rs.logistics.logistics_system.entity.BinLocation;
import rs.logistics.logistics_system.entity.InventoryCountLine;
import rs.logistics.logistics_system.entity.InventoryCountSession;
import rs.logistics.logistics_system.entity.WarehouseZone;
import rs.logistics.logistics_system.repository.InventoryCountLineRepository;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public class InventoryCountMapper {

    public static InventoryCountSessionSummaryResponse toSummaryResponse(InventoryCountSession session, int lineCount, int countedLineCount, int discrepancyLineCount) {
        return new InventoryCountSessionSummaryResponse(
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
                lineCount,
                countedLineCount,
                discrepancyLineCount
        );
    }


    public static InventoryCountSessionResponse toResponse(InventoryCountSession session, int lineCount, int countedLineCount, int discrepancyLineCount, List<InventoryCountLineResponse> lines) {
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
                lineCount,
                countedLineCount,
                discrepancyLineCount,
                lines != null ? lines : List.of()
        );
    }

    public static InventoryCountSessionResponse toResponse(InventoryCountSession session) {
        List<InventoryCountLineResponse> lines = session.getLines() == null ? List.of() : session.getLines().stream()
                .sorted(Comparator
                        .comparing((InventoryCountLine line) -> line.getProduct().getName(), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(line -> line.getBinLocation() != null ? line.getBinLocation().getCode() : "", String.CASE_INSENSITIVE_ORDER))
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


    public static InventoryCountLineResponse toLineResponse(InventoryCountLineRepository.InventoryCountLineRow row) {
        return new InventoryCountLineResponse(
                row.getId(),
                row.getProductId(),
                row.getProductName(),
                row.getProductSku(),
                row.getBinLocationId(),
                row.getBinLocationCode(),
                row.getBinLocationName(),
                row.getWarehouseZoneId(),
                row.getWarehouseZoneCode(),
                row.getWarehouseZoneName(),
                row.getSystemQuantity(),
                row.getCountedQuantity(),
                row.getDifferenceQuantity(),
                row.getNote(),
                row.getAdjustmentMovementId()
        );
    }

    public static InventoryCountLineResponse toLineResponse(InventoryCountLine line) {
        BinLocation binLocation = line.getBinLocation();
        WarehouseZone zone = binLocation != null ? binLocation.getZone() : null;
        return new InventoryCountLineResponse(
                line.getId(),
                line.getProduct().getId(),
                line.getProduct().getName(),
                line.getProduct().getSku(),
                binLocation != null ? binLocation.getId() : null,
                binLocation != null ? binLocation.getCode() : null,
                binLocation != null ? binLocation.getName() : null,
                zone != null ? zone.getId() : null,
                zone != null ? zone.getCode() : null,
                zone != null ? zone.getName() : null,
                line.getSystemQuantity(),
                line.getCountedQuantity(),
                line.getDifferenceQuantity(),
                line.getNote(),
                line.getAdjustmentMovementId()
        );
    }
}
