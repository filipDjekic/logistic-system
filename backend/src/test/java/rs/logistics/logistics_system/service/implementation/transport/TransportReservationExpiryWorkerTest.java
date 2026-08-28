package rs.logistics.logistics_system.service.implementation.transport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.TransportOrderItem;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.repository.TransportOrderItemRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.testsupport.TestEntityFactory;

@ExtendWith(MockitoExtension.class)
class TransportReservationExpiryWorkerTest {

    @Mock private TransportOrderRepository orderRepository;
    @Mock private TransportOrderItemRepository itemRepository;
    @Mock private WarehouseInventoryRepository inventoryRepository;
    @Mock private AuditFacadeDefinition auditFacade;
    @InjectMocks private TransportReservationExpiryWorker worker;

    @Test
    void expiresWithSystemAuditAndBoundsReleaseToAggregateReservation() {
        LocalDateTime now = LocalDateTime.of(2026, 8, 28, 22, 26);
        Warehouse warehouse = new Warehouse();
        TestEntityFactory.setId(warehouse, 10L);
        Product product = new Product();
        TestEntityFactory.setId(product, 20L);

        TransportOrder order = expiredOrder(now, warehouse);
        TransportOrderItem item = reservedItem(order, product, "8.00");
        order.setTransportOrderItems(List.of(item));

        WarehouseInventory inventory = new WarehouseInventory();
        inventory.setReservedQuantity(new BigDecimal("3.00"));
        when(orderRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(order));
        when(inventoryRepository.findByWarehouseIdAndProductIdForUpdate(10L, 20L))
                .thenReturn(Optional.of(inventory));

        assertThat(worker.expire(30L, now)).isTrue();

        assertThat(inventory.getSafeReservedQuantity()).isZero();
        assertThat(item.getSafeReservedQuantity()).isZero();
        assertThat(order.getReservationExpiresAt()).isNull();
        verify(inventoryRepository).save(inventory);
        verify(itemRepository).save(item);
        verify(auditFacade).logSystem("TRANSPORT_RESERVATION_EXPIRED", "TRANSPORT_ORDER", 30L,
                "TO-30", "Expired DRAFT transport reservation released");
    }

    @Test
    void clearsExpiredItemWhenAggregateInventoryNoLongerExists() {
        LocalDateTime now = LocalDateTime.of(2026, 8, 28, 22, 26);
        Warehouse warehouse = new Warehouse();
        TestEntityFactory.setId(warehouse, 10L);
        Product product = new Product();
        TestEntityFactory.setId(product, 20L);
        TransportOrder order = expiredOrder(now, warehouse);
        TransportOrderItem item = reservedItem(order, product, "2.00");
        order.setTransportOrderItems(List.of(item));

        when(orderRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(order));
        when(inventoryRepository.findByWarehouseIdAndProductIdForUpdate(10L, 20L))
                .thenReturn(Optional.empty());

        assertThat(worker.expire(30L, now)).isTrue();
        assertThat(item.getSafeReservedQuantity()).isZero();
        verify(itemRepository).save(item);
    }

    private TransportOrder expiredOrder(LocalDateTime now, Warehouse warehouse) {
        TransportOrder order = new TransportOrder();
        TestEntityFactory.setId(order, 30L);
        order.setOrderNumber("TO-30");
        order.setStatus(TransportOrderStatus.DRAFT);
        order.setSourceWarehouse(warehouse);
        order.setReservationExpiresAt(now.minusMinutes(1));
        return order;
    }

    private TransportOrderItem reservedItem(TransportOrder order, Product product, String quantity) {
        TransportOrderItem item = new TransportOrderItem();
        item.setTransportOrder(order);
        item.setProduct(product);
        item.setReservedQuantity(new BigDecimal(quantity));
        return item;
    }
}
