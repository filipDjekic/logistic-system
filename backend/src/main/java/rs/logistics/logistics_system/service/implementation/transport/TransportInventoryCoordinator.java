package rs.logistics.logistics_system.service.implementation.transport;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.StockTransferCreate;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.TransportOrderItem;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.repository.TransportOrderItemRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;

@Component
@RequiredArgsConstructor
public class TransportInventoryCoordinator {

    private final TransportOrderItemRepository transportOrderItemRepository;
    private final StockMovementServiceDefinition stockMovementService;
    private final WarehouseInventoryServiceDefinition warehouseInventoryService;
    private final AuditFacadeDefinition auditFacade;
    private final StockMovementRepository stockMovementRepository;

    public void validateReservedInventory(TransportOrder order) {
        requireItems(order, "Transport order must contain at least one reserved item before assignment");
        for (TransportOrderItem item : order.getTransportOrderItems()) {
            validateItem(item);
            var inventory = warehouseInventoryService.findByWarehouseAndProduct(
                    order.getSourceWarehouse().getId(), item.getProduct().getId());
            if (!item.isFullyReservedForRequestedQuantity()) {
                throw new BadRequestException("Transport order item reservation does not match requested quantity");
            }
            if (inventory.getReservedQuantity() == null
                    || inventory.getReservedQuantity().compareTo(item.getSafeReservedQuantity()) < 0) {
                throw new BadRequestException("Source inventory does not contain this transport item reservation");
            }
        }
    }

    public void releaseReservations(TransportOrder order) {
        if (order.getTransportOrderItems() == null || order.getTransportOrderItems().isEmpty()) {
            return;
        }
        for (TransportOrderItem item : order.getTransportOrderItems()) {
            validateItem(item);
            BigDecimal before = item.getSafeReservedQuantity();
            if (before.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }
            warehouseInventoryService.releaseReservedStock(
                    order.getSourceWarehouse().getId(), item.getProduct().getId(), before);
            item.releaseReservation();
            transportOrderItemRepository.save(item);
            auditQuantity("TRANSPORT_ITEM_RESERVATION_RELEASED", item, "reservedQuantity", before, BigDecimal.ZERO);
        }
    }

    public void dispatch(TransportOrder order) {
        requireItems(order, "Transport order must contain at least one item before transport starts");
        for (TransportOrderItem item : order.getTransportOrderItems()) {
            validateItem(item);
            if (!item.isFullyReservedForRequestedQuantity()) {
                throw new BadRequestException("Transport order item must be fully reserved before dispatch");
            }
            BigDecimal quantity = item.getSafeReservedQuantity();
            stockMovementService.dispatchTransport(buildTransfer(order, item, quantity,
                    "Transport order dispatch", "Transport order source warehouse dispatch"));
            applyItemMutation(() -> item.markDispatched(quantity));
            transportOrderItemRepository.save(item);
            auditQuantity("TRANSPORT_ITEM_DISPATCHED", item, "dispatchedQuantity", BigDecimal.ZERO, item.getSafeDispatchedQuantity());
        }
    }

    public void receive(TransportOrder order) {
        requireItems(order, "Transport order must contain at least one item to complete delivery");
        for (TransportOrderItem item : order.getTransportOrderItems()) {
            validateItem(item);
            if (!item.isFullyDispatched()) {
                throw new BadRequestException("Transport order item must be fully dispatched before delivery");
            }
            BigDecimal before = item.getSafeDeliveredQuantity();
            BigDecimal quantity = item.getPendingDeliveryQuantity();
            requirePositivePending(quantity, "Transport order item has no pending dispatched quantity to deliver");
            stockMovementService.receiveTransport(buildTransfer(order, item, quantity,
                    "Transport order delivery", "Transport order destination warehouse receipt"));
            applyItemMutation(() -> item.markDelivered(quantity));
            transportOrderItemRepository.save(item);
            auditQuantity("TRANSPORT_ITEM_DELIVERED", item, "deliveredQuantity", before, item.getSafeDeliveredQuantity());
        }
    }

    public void returnFailed(TransportOrder order) {
        requireItems(order, "Transport order must contain at least one item before failure can be closed");
        for (TransportOrderItem item : order.getTransportOrderItems()) {
            validateItem(item);
            BigDecimal before = item.getSafeDispatchedQuantity();
            BigDecimal quantity = item.getPendingDeliveryQuantity();
            requirePositivePending(quantity, "Transport order item has no dispatched quantity pending return");
            stockMovementService.returnFailedTransportToSource(buildTransfer(order, item, quantity,
                    "Failed transport return", "Failed transport returned to source warehouse"));
            applyItemMutation(() -> item.markReturnedAfterFailure(quantity));
            transportOrderItemRepository.save(item);
            auditQuantity("TRANSPORT_ITEM_RETURNED_AFTER_FAILURE", item, "dispatchedQuantity", before, item.getSafeDispatchedQuantity());
        }
    }

    private StockTransferCreate buildTransfer(TransportOrder order, TransportOrderItem item, BigDecimal quantity,
                                              String reason, String note) {
        StockTransferCreate transfer = new StockTransferCreate();
        transfer.setQuantity(quantity);
        transfer.setReasonDescription(reason);
        transfer.setReferenceNumber(order.getOrderNumber());
        transfer.setReferenceNote(note);
        transfer.setTransportOrderId(order.getId());
        transfer.setSourceWarehouseId(order.getSourceWarehouse().getId());
        transfer.setDestinationWarehouseId(order.getDestinationWarehouse().getId());
        transfer.setProductId(item.getProduct().getId());
        var dispatchMovement = stockMovementRepository
                .findTopByTransportOrder_IdAndProduct_IdAndReasonCodeOrderByCreatedAtDesc(
                        order.getId(), item.getProduct().getId(), StockMovementReasonCode.TRANSPORT_DISPATCH)
                .orElse(null);
        if (dispatchMovement != null && dispatchMovement.getUnitCost() != null && dispatchMovement.getCurrency() != null) {
            transfer.setUnitCost(dispatchMovement.getUnitCost());
            transfer.setCurrency(dispatchMovement.getCurrency());
        } else {
            var sourceInventory = warehouseInventoryService.findByWarehouseAndProduct(
                    order.getSourceWarehouse().getId(), item.getProduct().getId());
            if (sourceInventory.getAverageUnitCost() != null && sourceInventory.getCurrency() != null) {
                transfer.setUnitCost(sourceInventory.getAverageUnitCost());
                transfer.setCurrency(sourceInventory.getCurrency());
            }
        }
        return transfer;
    }

    private void requireItems(TransportOrder order, String message) {
        if (order == null || order.getTransportOrderItems() == null || order.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException(message);
        }
    }

    private void validateItem(TransportOrderItem item) {
        if (item == null || item.getProduct() == null || item.getProduct().getId() == null) {
            throw new BadRequestException("Transport order item product is required");
        }
        if (!item.getProduct().isOperational()) {
            throw new BadRequestException("Transport order item product is not active");
        }
        if (item.getQuantity() == null || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transport order item quantity must be greater than 0");
        }
    }

    private void requirePositivePending(BigDecimal quantity, String message) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(message);
        }
    }

    private void applyItemMutation(Runnable mutation) {
        try {
            mutation.run();
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new BadRequestException(ex.getMessage());
        }
    }

    private void auditQuantity(String action, TransportOrderItem item, String field,
                               BigDecimal oldValue, BigDecimal newValue) {
        auditFacade.recordFieldChange("TRANSPORT_ORDER_ITEM", item.getId(), field, oldValue, newValue);
        auditFacade.log(action, "TRANSPORT_ORDER_ITEM", item.getId(),
                "Transport order item " + item.getId() + " for transport order "
                        + (item.getTransportOrder() != null ? item.getTransportOrder().getId() : null)
                        + " changed " + field + " from " + oldValue + " to " + newValue);
    }
}
