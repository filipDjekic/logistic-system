package rs.logistics.logistics_system.service.implementation;

import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.test.util.ReflectionTestUtils;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.dto.response.WarehouseInventoryResponse;
import rs.logistics.logistics_system.dto.update.WarehouseInventoryUpdate;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.ProductUnit;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ConflictException;
import rs.logistics.logistics_system.repository.BinInventoryRepository;
import rs.logistics.logistics_system.repository.InventoryCountSessionRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;
import rs.logistics.logistics_system.testsupport.ServiceTestSupport;
import rs.logistics.logistics_system.testsupport.TestEntityFactory;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WarehouseInventoryServiceUpdateTest extends ServiceTestSupport {

    @Mock private WarehouseInventoryRepository warehouseInventoryRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private ProductRepository productRepository;
    @Mock private BinInventoryRepository binInventoryRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private InventoryCountSessionRepository inventoryCountSessionRepository;
    @Mock private AuditFacadeDefinition auditFacade;
    @Mock private NotificationServiceDefinition notificationService;
    @Mock private AuthenticatedUserProvider authenticatedUserProvider;
    @Mock private AppProperties appProperties;
    @Mock private WarehouseAccessGuard warehouseAccessGuard;

    @InjectMocks
    private WarehouseInventoryService service;

    @Test
    void updatesMinimumStockWhenQuantityIsOmitted() {
        Fixture fixture = fixture();
        WarehouseInventoryUpdate update = update(null, BigDecimal.valueOf(5), 4L);
        when(warehouseInventoryRepository.saveAndFlush(fixture.inventory())).thenReturn(fixture.inventory());

        WarehouseInventoryResponse response = service.update(11L, 22L, update);

        assertEquals(0, BigDecimal.valueOf(12).compareTo(response.getQuantity()));
        assertEquals(0, BigDecimal.valueOf(5).compareTo(response.getMinStockLevel()));
        verify(warehouseInventoryRepository).saveAndFlush(fixture.inventory());
    }

    @Test
    void rejectsDirectQuantityChange() {
        fixture();
        WarehouseInventoryUpdate update = update(BigDecimal.valueOf(13), BigDecimal.valueOf(5), 4L);

        assertThrows(BadRequestException.class, () -> service.update(11L, 22L, update));

        verify(warehouseInventoryRepository, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void preservesOptimisticLockCheck() {
        fixture();
        WarehouseInventoryUpdate update = update(null, BigDecimal.valueOf(5), 3L);

        assertThrows(ConflictException.class, () -> service.update(11L, 22L, update));

        verify(warehouseInventoryRepository, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }

    private Fixture fixture() {
        Company company = TestEntityFactory.company(1L);
        Warehouse warehouse = TestEntityFactory.warehouse(11L, company);
        Product product = new Product(
                "Euro pallet",
                "Standard pallet",
                "PAL-22",
                ProductUnit.PIECE,
                BigDecimal.TEN,
                false,
                BigDecimal.ONE
        );
        TestEntityFactory.setId(product, 22L);
        product.setCompany(company);

        WarehouseInventory inventory = new WarehouseInventory(
                warehouse,
                product,
                BigDecimal.valueOf(12),
                BigDecimal.valueOf(3)
        );
        ReflectionTestUtils.setField(inventory, "version", 4L);

        when(authenticatedUserProvider.isOverlord()).thenReturn(true);
        when(warehouseRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(warehouse));
        when(productRepository.findById(22L)).thenReturn(Optional.of(product));
        when(warehouseInventoryRepository.findByWarehouse_IdAndProduct_Id(11L, 22L))
                .thenReturn(Optional.of(inventory));
        return new Fixture(inventory);
    }

    private WarehouseInventoryUpdate update(BigDecimal quantity, BigDecimal minStockLevel, Long version) {
        WarehouseInventoryUpdate update = new WarehouseInventoryUpdate();
        update.setExpectedVersion(version);
        update.setWarehouseId(11L);
        update.setProductId(22L);
        update.setQuantity(quantity);
        update.setMinStockLevel(minStockLevel);
        return update;
    }

    private record Fixture(WarehouseInventory inventory) {
    }
}
