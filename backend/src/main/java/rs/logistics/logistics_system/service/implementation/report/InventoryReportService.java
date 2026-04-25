package rs.logistics.logistics_system.service.implementation.report;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.report.InventoryReportResponse;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.report.InventoryReportServiceDefinition;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class InventoryReportService implements InventoryReportServiceDefinition {

    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    @Transactional(readOnly = true)
    public InventoryReportResponse getInventoryReport(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long warehouseId,
            Long productId,
            StockMovementType movementType
    ) {
        validateDateRange(fromDate, toDate);

        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        List<WarehouseInventory> inventoryRows = warehouseInventoryRepository.searchInventory(
                companyId,
                null,
                warehouseId,
                productId,
                null,
                Pageable.unpaged()
        ).getContent();

        List<StockMovement> movementRows = stockMovementRepository.searchMovements(
                companyId,
                null,
                null,
                movementType,
                warehouseId,
                productId,
                null,
                fromDate,
                toDate,
                Pageable.unpaged()
        ).getContent();

        BigDecimal totalQuantity = sumInventory(inventoryRows, WarehouseInventory::getQuantity);
        BigDecimal totalAvailable = sumInventory(inventoryRows, WarehouseInventory::getAvailableQuantity);
        BigDecimal totalReserved = sumInventory(inventoryRows, WarehouseInventory::getReservedQuantity);

        return new InventoryReportResponse(
                fromDate,
                toDate,
                inventoryRows.size(),
                inventoryRows.stream().filter(WarehouseInventory::isLowStock).count(),
                totalQuantity,
                totalAvailable,
                totalReserved,
                movementRows.size(),
                sumMovementQuantity(movementRows, StockMovementType.INBOUND),
                sumMovementQuantity(movementRows, StockMovementType.OUTBOUND),
                sumTransferQuantity(movementRows),
                sumMovementQuantity(movementRows, StockMovementType.ADJUSTMENT),
                countMovementsByType(movementRows),
                buildWarehouseSummary(inventoryRows, movementRows),
                buildProductSummary(inventoryRows, movementRows),
                buildInventoryRows(inventoryRows),
                buildMovementRows(movementRows)
        );
    }

    private void validateDateRange(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate cannot be after toDate");
        }
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal sumInventory(List<WarehouseInventory> rows, Function<WarehouseInventory, BigDecimal> extractor) {
        return rows.stream()
                .map(extractor)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumMovementQuantity(List<StockMovement> rows, StockMovementType type) {
        return rows.stream()
                .filter(row -> row.getMovementType() == type)
                .map(StockMovement::getQuantity)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumTransferQuantity(List<StockMovement> rows) {
        return rows.stream()
                .filter(row -> row.getMovementType() == StockMovementType.TRANSFER_IN
                        || row.getMovementType() == StockMovementType.TRANSFER_OUT)
                .map(StockMovement::getQuantity)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<String, Long> countMovementsByType(List<StockMovement> rows) {
        Map<StockMovementType, Long> grouped = rows.stream()
                .map(StockMovement::getMovementType)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        Map<String, Long> result = new LinkedHashMap<>();
        for (StockMovementType value : StockMovementType.values()) {
            result.put(value.name(), grouped.getOrDefault(value, 0L));
        }
        return result;
    }

    private List<InventoryReportResponse.WarehouseInventorySummaryResponse> buildWarehouseSummary(
            List<WarehouseInventory> inventoryRows,
            List<StockMovement> movementRows
    ) {
        Map<Long, Long> movementsByWarehouse = movementRows.stream()
                .filter(row -> row.getWarehouse() != null)
                .collect(Collectors.groupingBy(row -> row.getWarehouse().getId(), Collectors.counting()));

        return inventoryRows.stream()
                .filter(row -> row.getWarehouse() != null)
                .collect(Collectors.groupingBy(row -> row.getWarehouse().getId()))
                .values()
                .stream()
                .map(group -> {
                    Warehouse warehouse = group.get(0).getWarehouse();
                    return new InventoryReportResponse.WarehouseInventorySummaryResponse(
                            warehouse.getId(),
                            warehouse.getName(),
                            warehouse.getCity(),
                            group.size(),
                            group.stream().filter(WarehouseInventory::isLowStock).count(),
                            sumInventory(group, WarehouseInventory::getQuantity),
                            sumInventory(group, WarehouseInventory::getAvailableQuantity),
                            sumInventory(group, WarehouseInventory::getReservedQuantity),
                            movementsByWarehouse.getOrDefault(warehouse.getId(), 0L)
                    );
                })
                .sorted(Comparator.comparing(InventoryReportResponse.WarehouseInventorySummaryResponse::quantity).reversed())
                .toList();
    }

    private List<InventoryReportResponse.ProductInventorySummaryResponse> buildProductSummary(
            List<WarehouseInventory> inventoryRows,
            List<StockMovement> movementRows
    ) {
        Map<Long, Long> movementsByProduct = movementRows.stream()
                .filter(row -> row.getProduct() != null)
                .collect(Collectors.groupingBy(row -> row.getProduct().getId(), Collectors.counting()));

        return inventoryRows.stream()
                .filter(row -> row.getProduct() != null)
                .collect(Collectors.groupingBy(row -> row.getProduct().getId()))
                .values()
                .stream()
                .map(group -> {
                    Product product = group.get(0).getProduct();
                    return new InventoryReportResponse.ProductInventorySummaryResponse(
                            product.getId(),
                            product.getName(),
                            product.getSku(),
                            product.getUnit() != null ? product.getUnit().name() : null,
                            group.size(),
                            group.stream().filter(WarehouseInventory::isLowStock).count(),
                            sumInventory(group, WarehouseInventory::getQuantity),
                            sumInventory(group, WarehouseInventory::getAvailableQuantity),
                            sumInventory(group, WarehouseInventory::getReservedQuantity),
                            movementsByProduct.getOrDefault(product.getId(), 0L)
                    );
                })
                .sorted(Comparator.comparing(InventoryReportResponse.ProductInventorySummaryResponse::quantity).reversed())
                .toList();
    }

    private List<InventoryReportResponse.InventoryRowResponse> buildInventoryRows(List<WarehouseInventory> rows) {
        return rows.stream()
                .sorted(Comparator
                        .comparing((WarehouseInventory row) -> row.getWarehouse() != null ? row.getWarehouse().getName() : "")
                        .thenComparing(row -> row.getProduct() != null ? row.getProduct().getName() : ""))
                .map(row -> {
                    Warehouse warehouse = row.getWarehouse();
                    Product product = row.getProduct();
                    return new InventoryReportResponse.InventoryRowResponse(
                            warehouse != null ? warehouse.getId() : null,
                            warehouse != null ? warehouse.getName() : null,
                            product != null ? product.getId() : null,
                            product != null ? product.getName() : null,
                            product != null ? product.getSku() : null,
                            product != null && product.getUnit() != null ? product.getUnit().name() : null,
                            safe(row.getQuantity()),
                            safe(row.getReservedQuantity()),
                            safe(row.getAvailableQuantity()),
                            row.getMinStockLevel(),
                            row.isLowStock(),
                            row.getLastUpdated()
                    );
                })
                .toList();
    }

    private List<InventoryReportResponse.StockMovementRowResponse> buildMovementRows(List<StockMovement> rows) {
        return rows.stream()
                .sorted(Comparator.comparing(StockMovement::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(row -> {
                    Warehouse warehouse = row.getWarehouse();
                    Product product = row.getProduct();
                    return new InventoryReportResponse.StockMovementRowResponse(
                            row.getId(),
                            row.getMovementType() != null ? row.getMovementType().name() : null,
                            safe(row.getQuantity()),
                            row.getReasonCode() != null ? row.getReasonCode().name() : null,
                            row.getReferenceType() != null ? row.getReferenceType().name() : null,
                            row.getReferenceId(),
                            row.getReferenceNumber(),
                            warehouse != null ? warehouse.getId() : null,
                            warehouse != null ? warehouse.getName() : null,
                            product != null ? product.getId() : null,
                            product != null ? product.getName() : null,
                            product != null ? product.getSku() : null,
                            row.getCreatedAt()
                    );
                })
                .toList();
    }
}
