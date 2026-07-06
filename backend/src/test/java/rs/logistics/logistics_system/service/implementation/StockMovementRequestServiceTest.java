package rs.logistics.logistics_system.service.implementation;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.test.util.ReflectionTestUtils;
import rs.logistics.logistics_system.dto.create.StockInboundCreate;
import rs.logistics.logistics_system.dto.response.StockMovementRequestResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.update.StockMovementRequestReview;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.StockMovementRequest;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.ProductUnit;
import rs.logistics.logistics_system.enums.StockMovementRequestStatus;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.repository.BinLocationRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.StockMovementRequestRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;
import rs.logistics.logistics_system.testsupport.ServiceTestSupport;
import rs.logistics.logistics_system.testsupport.TestEntityFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StockMovementRequestServiceTest extends ServiceTestSupport {

    @Mock
    private StockMovementRequestRepository stockMovementRequestRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private BinLocationRepository binLocationRepository;

    @Mock
    private StockMovementServiceDefinition stockMovementService;

    @Mock
    private AuthenticatedUserProvider authenticatedUserProvider;

    @Mock
    private WarehouseAccessGuard warehouseAccessGuard;

    @Mock
    private TimeServiceDefinition timeService;

    @Mock
    private AuditFacadeDefinition auditFacade;

    @InjectMocks
    private StockMovementRequestService stockMovementRequestService;

    @Test
    void approveRequestedInboundRequestCreatesStockMovementAndAttachesIt() {
        Company company = TestEntityFactory.company(1L);
        Warehouse warehouse = TestEntityFactory.warehouse(10L, company);
        Product product = product(20L, company);
        User requester = TestEntityFactory.user(30L, "worker@example.com", "WORKER", company);
        User reviewer = TestEntityFactory.user(40L, "manager@example.com", "WAREHOUSE_MANAGER", company);
        LocalDateTime reviewedAt = LocalDateTime.of(2026, 1, 15, 9, 30);

        StockMovementRequest requested = request(100L, 7L, StockMovementRequestStatus.REQUESTED, warehouse, product, requester, null);
        StockMovement createdMovement = movement(200L);
        StockMovementRequest approved = request(100L, 9L, StockMovementRequestStatus.APPROVED, warehouse, product, requester, createdMovement);
        approved.setReviewedBy(reviewer);
        approved.setReviewedAt(reviewedAt);
        approved.setReviewNote("Approved for stock correction");

        StockMovementRequestReview review = new StockMovementRequestReview();
        review.setExpectedVersion(7L);
        review.setReviewNote("Approved for stock correction");

        StockMovementResponse createdMovementResponse = new StockMovementResponse();
        createdMovementResponse.setId(200L);

        when(authenticatedUserProvider.isOverlord()).thenReturn(false);
        when(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).thenReturn(1L);
        when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(reviewer);
        when(timeService.nowSystem()).thenReturn(reviewedAt);
        when(stockMovementRequestRepository.findByIdAndWarehouse_Company_Id(100L, 1L))
                .thenReturn(Optional.of(requested), Optional.of(approved), Optional.of(approved));
        when(stockMovementRequestRepository.approveIfRequestedAndVersionMatches(
                eq(100L), eq(7L), eq(StockMovementRequestStatus.REQUESTED), eq(StockMovementRequestStatus.APPROVED),
                eq("Approved for stock correction"), eq(reviewer), eq(reviewedAt)
        )).thenReturn(1);
        when(stockMovementService.inbound(any(StockInboundCreate.class))).thenReturn(createdMovementResponse);
        when(stockMovementRepository.findById(200L)).thenReturn(Optional.of(createdMovement));
        when(stockMovementRequestRepository.attachCreatedMovementIfMissing(100L, StockMovementRequestStatus.APPROVED, createdMovement))
                .thenReturn(1);

        StockMovementRequestResponse response = stockMovementRequestService.approve(100L, review);

        assertEquals(100L, response.getId());
        assertEquals(StockMovementRequestStatus.APPROVED, response.getStatus());
        assertEquals(200L, response.getCreatedMovementId());
        assertEquals(9L, response.getVersion());

        ArgumentCaptor<StockInboundCreate> inboundCaptor = ArgumentCaptor.forClass(StockInboundCreate.class);
        verify(stockMovementService).inbound(inboundCaptor.capture());
        StockInboundCreate inbound = inboundCaptor.getValue();
        assertEquals(10L, inbound.getWarehouseId());
        assertEquals(20L, inbound.getProductId());
        assertEquals(BigDecimal.valueOf(5), inbound.getQuantity());
        assertEquals("Need more stock", inbound.getReasonDescription());

        verify(warehouseAccessGuard, atLeastOnce()).ensureCanMutateWarehouse(warehouse);
        verify(stockMovementRequestRepository).approveIfRequestedAndVersionMatches(
                100L,
                7L,
                StockMovementRequestStatus.REQUESTED,
                StockMovementRequestStatus.APPROVED,
                "Approved for stock correction",
                reviewer,
                reviewedAt
        );
        verify(stockMovementRequestRepository).attachCreatedMovementIfMissing(100L, StockMovementRequestStatus.APPROVED, createdMovement);
        verify(auditFacade).recordStatusChange("STOCK_MOVEMENT_REQUEST", 100L, "SMR-100", "status", StockMovementRequestStatus.REQUESTED, StockMovementRequestStatus.APPROVED);
    }

    private Product product(Long id, Company company) {
        Product product = new Product("Product " + id, "Test product", "SKU-" + id, ProductUnit.PIECE, BigDecimal.TEN, false, BigDecimal.ONE);
        TestEntityFactory.setId(product, id);
        product.setCompany(company);
        return product;
    }

    private StockMovementRequest request(Long id,
                                         Long version,
                                         StockMovementRequestStatus status,
                                         Warehouse warehouse,
                                         Product product,
                                         User requestedBy,
                                         StockMovement createdMovement) {
        StockMovementRequest request = new StockMovementRequest();
        TestEntityFactory.setId(request, id);
        ReflectionTestUtils.setField(request, "version", version);
        request.setMovementType(StockMovementType.INBOUND);
        request.setStatus(status);
        request.setQuantity(BigDecimal.valueOf(5));
        request.setReasonDescription("Need more stock");
        request.setWarehouse(warehouse);
        request.setProduct(product);
        request.setRequestedBy(requestedBy);
        request.setCreatedMovement(createdMovement);
        return request;
    }

    private StockMovement movement(Long id) {
        StockMovement movement = new StockMovement();
        TestEntityFactory.setId(movement, id);
        return movement;
    }
}
