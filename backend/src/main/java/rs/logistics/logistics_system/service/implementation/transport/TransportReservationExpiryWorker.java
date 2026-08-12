package rs.logistics.logistics_system.service.implementation.transport;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.TransportOrderItem;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.repository.TransportOrderItemRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;

@Service
@RequiredArgsConstructor
public class TransportReservationExpiryWorker {
    private final TransportOrderRepository orderRepository;
    private final TransportOrderItemRepository itemRepository;
    private final WarehouseInventoryRepository inventoryRepository;
    private final AuditFacadeDefinition auditFacade;

    @Transactional
    public boolean expire(Long orderId, LocalDateTime now) {
        var order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null || order.getStatus() != TransportOrderStatus.DRAFT || !order.isReservationExpired(now)) return false;

        order.getTransportOrderItems().stream()
                .sorted(Comparator.comparing(i -> i.getProduct().getId()))
                .forEach(item -> release(order.getSourceWarehouse().getId(), item));
        order.setReservationExpiresAt(null);
        orderRepository.save(order);
        auditFacade.log("TRANSPORT_RESERVATION_EXPIRED", "TRANSPORT_ORDER", order.getId(),
                "Expired DRAFT transport reservation released");
        return true;
    }

    private void release(Long warehouseId, TransportOrderItem item) {
        BigDecimal amount = item.getSafeReservedQuantity();
        if (amount.signum() == 0) return;
        var inventory = inventoryRepository.findByWarehouseIdAndProductIdForUpdate(warehouseId, item.getProduct().getId())
                .orElseThrow(() -> new IllegalStateException("Reserved transport inventory no longer exists"));
        inventory.release(amount);
        inventoryRepository.save(inventory);
        item.releaseReservation();
        itemRepository.save(item);
    }
}
