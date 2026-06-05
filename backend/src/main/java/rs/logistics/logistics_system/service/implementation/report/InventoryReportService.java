package rs.logistics.logistics_system.service.implementation.report;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.report.InventoryReportResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.report.InventoryReportServiceDefinition;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class InventoryReportService implements InventoryReportServiceDefinition {

    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final EmployeeRepository employeeRepository;
    private final WarehouseRepository warehouseRepository;
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

        validateReportFilters(companyId, warehouseId, productId);

        Set<Long> managedWarehouseIds = resolveManagedWarehouseIdsForWarehouseManager();
        validateWarehouseFilterAllowedForWarehouseManager(warehouseId, managedWarehouseIds);

        List<WarehouseInventory> inventoryRows = warehouseInventoryRepository.searchInventory(
                companyId,
                null,
                warehouseId,
                productId,
                null,
                Pageable.unpaged()
        ).getContent().stream()
                .filter(row -> isAllowedWarehouseForWarehouseManager(row.getWarehouse(), managedWarehouseIds))
                .toList();

        List<StockMovement> movementRows = stockMovementRepository.searchMovements(
                companyId,
                null,
                null,
                movementType,
                null,
                warehouseId,
                productId,
                null,
                fromDate,
                toDate,
                Pageable.unpaged()
        ).getContent().stream()
                .filter(row -> isAllowedWarehouseForWarehouseManager(row.getWarehouse(), managedWarehouseIds))
                .toList();

        BigDecimal totalQuantity = sumInventory(inventoryRows, WarehouseInventory::getQuantity);
        BigDecimal totalAvailable = sumInventory(inventoryRows, WarehouseInventory::getAvailableQuantity);
        BigDecimal totalReserved = sumInventory(inventoryRows, WarehouseInventory::getReservedQuantity);

        long lowStockRows = inventoryRows.stream().filter(WarehouseInventory::isLowStock).count();
        long criticalLowStockRows = inventoryRows.stream()
                .filter(row -> safe(row.getAvailableQuantity()).compareTo(BigDecimal.ZERO) <= 0)
                .count();
        long reservationMovements = movementRows.stream().filter(row -> row.getMovementType() == StockMovementType.RESERVATION).count();
        long reservationReleaseMovements = movementRows.stream().filter(row -> row.getMovementType() == StockMovementType.RESERVATION_RELEASE).count();

        return new InventoryReportResponse(
                fromDate,
                toDate,
                inventoryRows.size(),
                lowStockRows,
                totalQuantity,
                totalAvailable,
                totalReserved,
                percentage(totalAvailable, totalQuantity),
                percentage(totalReserved, totalQuantity),
                inventoryHealthScore(inventoryRows.size(), lowStockRows, criticalLowStockRows),
                criticalLowStockRows,
                movementRows.size(),
                reservationMovements,
                reservationReleaseMovements,
                sumMovementQuantity(movementRows, StockMovementType.INBOUND, StockMovementType.RETURN_IN),
                sumMovementQuantity(movementRows, StockMovementType.OUTBOUND, StockMovementType.WRITE_OFF, StockMovementType.RETURN_OUT),
                sumTransferQuantity(movementRows),
                sumMovementQuantity(movementRows, StockMovementType.ADJUSTMENT),
                countMovementsByType(movementRows),
                buildWarehouseSummary(inventoryRows, movementRows),
                buildProductSummary(inventoryRows, movementRows),
                buildInventoryRows(inventoryRows),
                buildMovementRows(movementRows)
        );
    }


    @Override
    @Transactional(readOnly = true)
    public byte[] exportInventoryReportCsv(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long warehouseId,
            Long productId,
            StockMovementType movementType
    ) {
        InventoryReportResponse report = getInventoryReport(fromDate, toDate, warehouseId, productId, movementType);

        List<List<?>> rows = new java.util.ArrayList<>();
        rows.add(java.util.Arrays.asList("Inventory report"));
        rows.add(java.util.Arrays.asList("fromDate", report.fromDate(), "toDate", report.toDate()));
        rows.add(java.util.Arrays.asList("inventoryRowsTotal", report.inventoryRowsTotal(), "lowStockRowsTotal", report.lowStockRowsTotal(), "stockMovementsTotal", report.stockMovementsTotal()));
        rows.add(java.util.Arrays.asList("totalInventoryQuantity", report.totalInventoryQuantity(), "totalAvailableQuantity", report.totalAvailableQuantity(), "totalReservedQuantity", report.totalReservedQuantity()));
        rows.add(java.util.Arrays.asList("inboundQuantity", report.inboundQuantity(), "outboundQuantity", report.outboundQuantity(), "transferQuantity", report.transferQuantity(), "adjustmentQuantity", report.adjustmentQuantity()));

        ReportCsvExportHelper.addSectionTitle(rows, "Inventory rows");
        rows.add(java.util.Arrays.asList("warehouseId", "warehouseName", "productId", "productName", "sku", "unit", "quantity", "reservedQuantity", "availableQuantity", "minStockLevel", "lowStock", "lastUpdated"));
        report.inventoryRows().forEach(row -> rows.add(java.util.Arrays.asList(
                row.warehouseId(),
                row.warehouseName(),
                row.productId(),
                row.productName(),
                row.sku(),
                row.unit(),
                row.quantity(),
                row.reservedQuantity(),
                row.availableQuantity(),
                row.minStockLevel(),
                row.lowStock(),
                row.lastUpdated()
        )));

        ReportCsvExportHelper.addSectionTitle(rows, "Stock movement rows");
        rows.add(java.util.Arrays.asList("id", "movementType", "quantity", "reasonCode", "referenceType", "referenceId", "referenceNumber", "warehouseId", "warehouseName", "productId", "productName", "sku", "createdAt"));
        report.movementRows().forEach(row -> rows.add(java.util.Arrays.asList(
                row.id(),
                row.movementType(),
                row.quantity(),
                row.reasonCode(),
                row.referenceType(),
                row.referenceId(),
                row.referenceNumber(),
                row.warehouseId(),
                row.warehouseName(),
                row.productId(),
                row.productName(),
                row.sku(),
                row.createdAt()
        )));

        ReportCsvExportHelper.addSectionTitle(rows, "Warehouse summary");
        rows.add(java.util.Arrays.asList("warehouseId", "warehouseName", "city", "inventoryRows", "lowStockRows", "quantity", "availableQuantity", "reservedQuantity", "stockMovements"));
        report.perWarehouse().forEach(row -> rows.add(java.util.Arrays.asList(row.warehouseId(), row.warehouseName(), row.city(), row.inventoryRows(), row.lowStockRows(), row.quantity(), row.availableQuantity(), row.reservedQuantity(), row.stockMovements())));

        ReportCsvExportHelper.addSectionTitle(rows, "Product summary");
        rows.add(java.util.Arrays.asList("productId", "productName", "sku", "unit", "inventoryRows", "lowStockRows", "quantity", "availableQuantity", "reservedQuantity", "stockMovements"));
        report.perProduct().forEach(row -> rows.add(java.util.Arrays.asList(row.productId(), row.productName(), row.sku(), row.unit(), row.inventoryRows(), row.lowStockRows(), row.quantity(), row.availableQuantity(), row.reservedQuantity(), row.stockMovements())));

        ReportCsvExportHelper.addSectionTitle(rows, "Movement type breakdown");
        ReportCsvExportHelper.addMapRows(rows, report.movementsByType(), "movementType", "count");

        return ReportCsvExportHelper.toCsvBytes(rows);
    }

    private void validateReportFilters(Long companyId, Long warehouseId, Long productId) {
        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        if (warehouseId != null && warehouseRepository.findByIdAndCompany_Id(warehouseId, companyId).isEmpty()) {
            throw new ForbiddenException("Warehouse is outside authenticated company scope");
        }

        if (productId != null && !warehouseInventoryRepository.existsProductInCompany(productId, companyId)) {
            throw new ForbiddenException("Product is outside authenticated company scope");
        }
    }

    private Set<Long> resolveManagedWarehouseIdsForWarehouseManager() {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return Set.of();
        }

        User user = authenticatedUserProvider.getAuthenticatedUser();
        Employee employee = employeeRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user is not linked to an employee"));

        return warehouseRepository.findByManagerIdAndCompany_Id(
                        employee.getId(),
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                )
                .stream()
                .map(Warehouse::getId)
                .collect(Collectors.toSet());
    }

    private void validateWarehouseFilterAllowedForWarehouseManager(Long warehouseId, Set<Long> managedWarehouseIds) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER") || warehouseId == null) {
            return;
        }

        if (!managedWarehouseIds.contains(warehouseId)) {
            throw new ForbiddenException("WAREHOUSE_MANAGER can report only managed warehouses");
        }
    }

    private boolean isAllowedWarehouseForWarehouseManager(Warehouse warehouse, Set<Long> managedWarehouseIds) {
        if (!authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return true;
        }

        return warehouse != null && managedWarehouseIds.contains(warehouse.getId());
    }

    private void validateDateRange(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("fromDate cannot be after toDate");
        }
    }

    private BigDecimal percentage(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return safe(part)
                .multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal inventoryHealthScore(long totalRows, long lowStockRows, long criticalLowStockRows) {
        if (totalRows <= 0) {
            return BigDecimal.valueOf(100);
        }
        BigDecimal lowStockPenalty = BigDecimal.valueOf(lowStockRows)
                .multiply(BigDecimal.valueOf(35))
                .divide(BigDecimal.valueOf(totalRows), 2, RoundingMode.HALF_UP);
        BigDecimal criticalPenalty = BigDecimal.valueOf(criticalLowStockRows)
                .multiply(BigDecimal.valueOf(50))
                .divide(BigDecimal.valueOf(totalRows), 2, RoundingMode.HALF_UP);
        BigDecimal score = BigDecimal.valueOf(100).subtract(lowStockPenalty).subtract(criticalPenalty);
        return score.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : score;
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

    private BigDecimal sumMovementQuantity(List<StockMovement> rows, StockMovementType... types) {
        java.util.Set<StockMovementType> allowedTypes = java.util.Set.of(types);
        return rows.stream()
                .filter(row -> allowedTypes.contains(row.getMovementType()))
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
                            warehouse.getCity() != null ? warehouse.getCity().getName() : null,
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
