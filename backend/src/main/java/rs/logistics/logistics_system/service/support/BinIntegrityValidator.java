package rs.logistics.logistics_system.service.support;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.BinInventory;
import rs.logistics.logistics_system.entity.BinLocation;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.BinInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;

@Component
@RequiredArgsConstructor
public class BinIntegrityValidator {

    private final BinInventoryRepository binInventoryRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;


    public void ensureBinTrackingEnabled(Warehouse warehouse, String message) {
        if (warehouse == null || !Boolean.TRUE.equals(warehouse.getBinTrackingEnabled())) {
            throw new BadRequestException(message);
        }
    }

    public void ensureBinSelectionMatchesWarehouseMode(Warehouse warehouse, Long binLocationId) {
        if (warehouse == null) {
            throw new BadRequestException("Warehouse is required for bin validation");
        }
        boolean enabled = Boolean.TRUE.equals(warehouse.getBinTrackingEnabled());
        if (enabled && binLocationId == null) {
            throw new BadRequestException("Bin location is required because bin tracking is enabled for this warehouse");
        }
        if (!enabled && binLocationId != null) {
            throw new BadRequestException("Bin location cannot be used because bin tracking is disabled for this warehouse");
        }
    }

    public void ensureBinBelongsToWarehouse(BinLocation bin, Warehouse warehouse, String message) {
        if (bin == null || warehouse == null || bin.getWarehouse() == null || !warehouse.getId().equals(bin.getWarehouse().getId())) {
            throw new BadRequestException(message);
        }
    }

    public void ensureSameWarehouse(BinLocation source, BinLocation destination) {
        if (source == null || destination == null || source.getWarehouse() == null || destination.getWarehouse() == null
                || !source.getWarehouse().getId().equals(destination.getWarehouse().getId())) {
            throw new BadRequestException("Source and destination bin must belong to the same warehouse");
        }
    }

    public void ensureDifferentBins(BinLocation source, BinLocation destination) {
        if (source == null || destination == null || source.getId() == null || source.getId().equals(destination.getId())) {
            throw new BadRequestException("Source and destination bin must be different");
        }
    }

    public void ensureActiveBin(BinLocation bin, String message) {
        if (bin == null || !Boolean.TRUE.equals(bin.getActive())) {
            throw new BadRequestException(message);
        }
    }

    public BigDecimal requireNonNegative(BigDecimal value, String message) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException(message);
        }
        return value;
    }

    public BigDecimal requirePositive(BigDecimal value, String message) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(message);
        }
        return value;
    }

    public WarehouseInventory lockWarehouseInventory(Warehouse warehouse, Product product) {
        return warehouseInventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouse.getId(), product.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse inventory not found for selected bin product"));
    }

    public BinInventory lockOrCreateBinInventory(BinLocation bin, Product product) {
        return binInventoryRepository.findForUpdate(bin.getId(), product.getId())
                .orElseGet(() -> new BinInventory(bin, product, BigDecimal.ZERO));
    }

    public BinInventory lockRequiredBinInventory(BinLocation bin, Product product, String message) {
        return binInventoryRepository.findForUpdate(bin.getId(), product.getId())
                .orElseThrow(() -> new BadRequestException(message));
    }

    public void ensureBinInventoryDoesNotExceedWarehouseInventory(
            BinLocation bin,
            Product product,
            BigDecimal targetBinQuantity,
            WarehouseInventory warehouseInventory
    ) {
        BigDecimal normalizedTarget = requireNonNegative(
                targetBinQuantity,
                "Bin inventory quantity cannot be negative"
        );

        ensureBinCapacityNotExceeded(bin, normalizedTarget);

        BigDecimal otherBinsQuantity = binInventoryRepository.sumQuantityByWarehouseAndProductExcludingBin(
                bin.getWarehouse().getId(),
                product.getId(),
                bin.getId()
        );

        BigDecimal totalBinQuantity = zeroIfNull(otherBinsQuantity).add(normalizedTarget);
        BigDecimal warehouseQuantity = warehouseInventory == null ? BigDecimal.ZERO : warehouseInventory.getSafeQuantity();

        if (totalBinQuantity.compareTo(warehouseQuantity) > 0) {
            throw new BadRequestException("Total bin inventory cannot exceed warehouse inventory quantity");
        }
    }

    public void ensureInternalMovementDoesNotExceedWarehouseInventory(
            BinLocation sourceBin,
            BinLocation destinationBin,
            Product product,
            BigDecimal sourceTargetQuantity,
            BigDecimal destinationTargetQuantity,
            WarehouseInventory warehouseInventory
    ) {
        BigDecimal normalizedSource = requireNonNegative(sourceTargetQuantity, "Source bin inventory quantity cannot be negative");
        BigDecimal normalizedDestination = requireNonNegative(destinationTargetQuantity, "Destination bin inventory quantity cannot be negative");

        ensureBinCapacityNotExceeded(destinationBin, normalizedDestination);

        BigDecimal otherBinsQuantity = binInventoryRepository.sumQuantityByWarehouseAndProductExcludingBins(
                sourceBin.getWarehouse().getId(),
                product.getId(),
                sourceBin.getId(),
                destinationBin.getId()
        );

        BigDecimal projectedTotal = zeroIfNull(otherBinsQuantity).add(normalizedSource).add(normalizedDestination);
        BigDecimal warehouseQuantity = warehouseInventory == null ? BigDecimal.ZERO : warehouseInventory.getSafeQuantity();

        if (projectedTotal.compareTo(warehouseQuantity) > 0) {
            throw new BadRequestException("Total bin inventory cannot exceed warehouse inventory quantity");
        }
    }

    public void ensureInternalMovementCanBeApplied(BinInventory sourceInventory, BigDecimal quantity) {
        BigDecimal requested = requirePositive(quantity, "Movement quantity must be greater than zero");
        if (sourceInventory.getSafeQuantity().compareTo(requested) < 0) {
            throw new BadRequestException("Source bin does not have enough inventory for selected product");
        }
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public void ensureBinCapacityNotExceeded(BinLocation bin, BigDecimal targetQuantity) {
    if (bin == null || bin.getCapacity() == null) {
        return;
    }

    BigDecimal normalizedTarget = requireNonNegative(
            targetQuantity,
            "Bin inventory quantity cannot be negative"
    );

    if (normalizedTarget.compareTo(bin.getCapacity()) > 0) {
        throw new BadRequestException("Bin capacity exceeded");
    }
}
}
