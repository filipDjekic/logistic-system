package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.StockAdjustmentCreate;
import rs.logistics.logistics_system.dto.create.StockInboundCreate;
import rs.logistics.logistics_system.dto.create.StockMovementRequestCreate;
import rs.logistics.logistics_system.dto.create.StockOutboundCreate;
import rs.logistics.logistics_system.dto.create.StockReturnCreate;
import rs.logistics.logistics_system.dto.create.StockTransferCreate;
import rs.logistics.logistics_system.dto.create.StockWriteOffCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.StockMovementRequestResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.update.StockMovementRequestReview;
import rs.logistics.logistics_system.entity.BinLocation;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.StockMovementRequest;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementRequestStatus;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.StockMovementRequestMapper;
import rs.logistics.logistics_system.repository.BinLocationRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.StockMovementRequestRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.StockMovementRequestServiceDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StockMovementRequestService implements StockMovementRequestServiceDefinition {

    private final StockMovementRequestRepository stockMovementRequestRepository;
    private final StockMovementRepository stockMovementRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final BinLocationRepository binLocationRepository;
    private final StockMovementServiceDefinition stockMovementService;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final WarehouseAccessGuard warehouseAccessGuard;
    private final TimeServiceDefinition timeService;

    @Override
    @Transactional
    public StockMovementRequestResponse create(StockMovementRequestCreate dto) {
        validateWorkerRequestType(dto);
        Warehouse warehouse = resolveWarehouse(dto.getWarehouseId());
        warehouseAccessGuard.ensureCanMutateWarehouse(warehouse);
        Product product = resolveProduct(dto.getProductId());
        authenticatedUserProvider.ensureSameCompany(warehouse.getCompany().getId(), product.getCompany().getId(), "Product is not in the same company as the warehouse");

        StockMovementRequest request = new StockMovementRequest();
        request.setMovementType(dto.getMovementType());
        request.setQuantity(dto.getQuantity());
        request.setAdjustmentDirection(dto.getAdjustmentDirection());
        request.setReasonDescription(dto.getReasonDescription());
        request.setWarehouse(warehouse);
        request.setProduct(product);
        request.setRequestedBy(authenticatedUserProvider.getAuthenticatedUser());

        if (dto.getDestinationWarehouseId() != null) {
            Warehouse destinationWarehouse = resolveWarehouse(dto.getDestinationWarehouseId());
            warehouseAccessGuard.ensureCanMutateWarehouse(destinationWarehouse);
            authenticatedUserProvider.ensureSameCompany(warehouse.getCompany().getId(), destinationWarehouse.getCompany().getId(), "Destination warehouse is not in the same company");
            request.setDestinationWarehouse(destinationWarehouse);
        }

        if (dto.getBinLocationId() != null) {
            request.setBinLocation(resolveScopedBin(dto.getBinLocationId(), warehouse.getId()));
        }
        if (dto.getDestinationBinLocationId() != null) {
            if (request.getDestinationWarehouse() == null) {
                throw new BadRequestException("Destination warehouse is required when destination bin is selected");
            }
            request.setDestinationBinLocation(resolveScopedBin(dto.getDestinationBinLocationId(), request.getDestinationWarehouse().getId()));
        }

        return StockMovementRequestMapper.toResponse(stockMovementRequestRepository.save(request));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockMovementRequestResponse> search(StockMovementRequestStatus status, Pageable pageable) {
        Page<StockMovementRequest> page;
        if (authenticatedUserProvider.isOverlord()) {
            page = status == null ? stockMovementRequestRepository.findAll(pageable) : stockMovementRequestRepository.findByStatus(status, pageable);
        } else if (authenticatedUserProvider.isCompanyAdmin()) {
            page = stockMovementRequestRepository.searchByCompany(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(), status, pageable);
        } else if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            List<Long> warehouseIds = warehouseAccessGuard.mutationWarehouseIdsForScopedUser();
            page = warehouseIds == null
                    ? stockMovementRequestRepository.searchByCompany(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(), status, pageable)
                    : warehouseIds.isEmpty()
                    ? Page.empty(pageable)
                    : stockMovementRequestRepository.searchByWarehouseIds(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(), warehouseIds, status, pageable);
        } else if (authenticatedUserProvider.hasRole("WORKER")) {
            page = stockMovementRequestRepository.searchByRequestedBy(authenticatedUserProvider.getAuthenticatedUserId(), status, pageable);
        } else {
            throw new ForbiddenException("You cannot read stock movement requests");
        }
        return PageResponse.fromContent(page.getContent().stream().map(StockMovementRequestMapper::toResponse).toList(), page);
    }

    @Override
    @Transactional(readOnly = true)
    public StockMovementRequestResponse getById(Long id) {
        StockMovementRequest request = getScopedRequest(id);
        return StockMovementRequestMapper.toResponse(request);
    }

    @Override
    @Transactional
    public StockMovementRequestResponse approve(Long id, StockMovementRequestReview review) {
        StockMovementRequest request = getScopedManagerRequest(id);
        ensureRequested(request);
        StockMovementResponse created = createMovementFromRequest(request);
        request.setStatus(StockMovementRequestStatus.APPROVED);
        request.setReviewNote(review != null ? review.getReviewNote() : null);
        request.setReviewedBy(authenticatedUserProvider.getAuthenticatedUser());
        request.setReviewedAt(timeService.nowSystem());
        request.setCreatedMovement(stockMovementRepository.findById(created.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Created stock movement not found")));
        return StockMovementRequestMapper.toResponse(stockMovementRequestRepository.save(request));
    }

    @Override
    @Transactional
    public StockMovementRequestResponse reject(Long id, StockMovementRequestReview review) {
        StockMovementRequest request = getScopedManagerRequest(id);
        ensureRequested(request);
        request.setStatus(StockMovementRequestStatus.REJECTED);
        request.setReviewNote(review != null ? review.getReviewNote() : null);
        request.setReviewedBy(authenticatedUserProvider.getAuthenticatedUser());
        request.setReviewedAt(timeService.nowSystem());
        return StockMovementRequestMapper.toResponse(stockMovementRequestRepository.save(request));
    }

    @Override
    @Transactional
    public StockMovementRequestResponse cancel(Long id) {
        StockMovementRequest request = getScopedRequest(id);
        if (!authenticatedUserProvider.hasRole("WORKER") || request.getRequestedBy() == null || !request.getRequestedBy().getId().equals(authenticatedUserProvider.getAuthenticatedUserId())) {
            throw new ForbiddenException("Only the requesting worker can cancel this stock movement request");
        }
        ensureRequested(request);
        request.setStatus(StockMovementRequestStatus.CANCELLED);
        return StockMovementRequestMapper.toResponse(stockMovementRequestRepository.save(request));
    }

    private void validateWorkerRequestType(StockMovementRequestCreate dto) {
        if (dto.getMovementType() == null) {
            throw new BadRequestException("Movement type is required");
        }
        if (dto.getMovementType() == StockMovementType.TRANSFER_IN || dto.getMovementType() == StockMovementType.RESERVATION || dto.getMovementType() == StockMovementType.RESERVATION_RELEASE) {
            throw new BadRequestException("This movement type cannot be requested by a worker");
        }
        if (dto.getMovementType() == StockMovementType.TRANSFER_OUT && dto.getDestinationWarehouseId() == null) {
            throw new BadRequestException("Destination warehouse is required for transfer request");
        }
        if (dto.getMovementType() == StockMovementType.ADJUSTMENT && dto.getAdjustmentDirection() == null) {
            throw new BadRequestException("Adjustment direction is required for adjustment request");
        }
        if (dto.getMovementType() != StockMovementType.ADJUSTMENT && dto.getAdjustmentDirection() != null) {
            throw new BadRequestException("Adjustment direction is allowed only for adjustment request");
        }
    }

    private StockMovementResponse createMovementFromRequest(StockMovementRequest request) {
        return switch (request.getMovementType()) {
            case INBOUND -> stockMovementService.inbound(toInbound(request));
            case OUTBOUND -> stockMovementService.outbound(toOutbound(request));
            case TRANSFER_OUT -> stockMovementService.transfer(toTransfer(request)).getFirst();
            case ADJUSTMENT -> stockMovementService.adjustment(toAdjustment(request));
            case WRITE_OFF -> stockMovementService.writeOff(toWriteOff(request));
            case RETURN_IN, RETURN_OUT -> stockMovementService.returnStock(toReturn(request));
            case TRANSFER_IN, RESERVATION, RESERVATION_RELEASE -> throw new BadRequestException("Unsupported request movement type");
        };
    }

    private StockInboundCreate toInbound(StockMovementRequest request) {
        StockInboundCreate dto = new StockInboundCreate();
        applyCommon(dto, request);
        dto.setWarehouseId(request.getWarehouse().getId());
        dto.setBinLocationId(request.getBinLocation() != null ? request.getBinLocation().getId() : null);
        return dto;
    }

    private StockOutboundCreate toOutbound(StockMovementRequest request) {
        StockOutboundCreate dto = new StockOutboundCreate();
        applyCommon(dto, request);
        dto.setWarehouseId(request.getWarehouse().getId());
        dto.setBinLocationId(request.getBinLocation() != null ? request.getBinLocation().getId() : null);
        return dto;
    }

    private StockTransferCreate toTransfer(StockMovementRequest request) {
        if (request.getDestinationWarehouse() == null) {
            throw new BadRequestException("Destination warehouse is required for transfer request");
        }
        StockTransferCreate dto = new StockTransferCreate();
        dto.setQuantity(request.getQuantity());
        dto.setReasonDescription(request.getReasonDescription());
        dto.setSourceWarehouseId(request.getWarehouse().getId());
        dto.setDestinationWarehouseId(request.getDestinationWarehouse().getId());
        dto.setProductId(request.getProduct().getId());
        dto.setSourceBinLocationId(request.getBinLocation() != null ? request.getBinLocation().getId() : null);
        dto.setDestinationBinLocationId(request.getDestinationBinLocation() != null ? request.getDestinationBinLocation().getId() : null);
        return dto;
    }

    private StockAdjustmentCreate toAdjustment(StockMovementRequest request) {
        StockAdjustmentCreate dto = new StockAdjustmentCreate();
        dto.setQuantity(request.getQuantity());
        dto.setDirection(request.getAdjustmentDirection() != null ? request.getAdjustmentDirection() : StockAdjustmentDirection.INCREASE);
        dto.setReasonDescription(request.getReasonDescription());
        dto.setWarehouseId(request.getWarehouse().getId());
        dto.setProductId(request.getProduct().getId());
        dto.setBinLocationId(request.getBinLocation() != null ? request.getBinLocation().getId() : null);
        return dto;
    }

    private StockWriteOffCreate toWriteOff(StockMovementRequest request) {
        StockWriteOffCreate dto = new StockWriteOffCreate();
        applyCommon(dto, request);
        dto.setWarehouseId(request.getWarehouse().getId());
        dto.setBinLocationId(request.getBinLocation() != null ? request.getBinLocation().getId() : null);
        return dto;
    }

    private StockReturnCreate toReturn(StockMovementRequest request) {
        StockReturnCreate dto = new StockReturnCreate();
        applyCommon(dto, request);
        dto.setWarehouseId(request.getWarehouse().getId());
        dto.setBinLocationId(request.getBinLocation() != null ? request.getBinLocation().getId() : null);
        return dto;
    }

    private void applyCommon(StockInboundCreate dto, StockMovementRequest request) {
        dto.setQuantity(request.getQuantity());
        dto.setReasonDescription(request.getReasonDescription());
        dto.setProductId(request.getProduct().getId());
    }

    private void applyCommon(StockOutboundCreate dto, StockMovementRequest request) {
        dto.setQuantity(request.getQuantity());
        dto.setReasonDescription(request.getReasonDescription());
        dto.setProductId(request.getProduct().getId());
    }

    private void applyCommon(StockWriteOffCreate dto, StockMovementRequest request) {
        dto.setQuantity(request.getQuantity());
        dto.setReasonDescription(request.getReasonDescription());
        dto.setProductId(request.getProduct().getId());
    }

    private void applyCommon(StockReturnCreate dto, StockMovementRequest request) {
        dto.setQuantity(request.getQuantity());
        dto.setReasonDescription(request.getReasonDescription());
        dto.setProductId(request.getProduct().getId());
    }

    private StockMovementRequest getScopedRequest(Long id) {
        StockMovementRequest request = authenticatedUserProvider.isOverlord()
                ? stockMovementRequestRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Stock movement request not found"))
                : stockMovementRequestRepository.findByIdAndWarehouse_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement request not found"));
        if (authenticatedUserProvider.hasRole("WORKER")) {
            if (request.getRequestedBy() != null && request.getRequestedBy().getId().equals(authenticatedUserProvider.getAuthenticatedUserId())) {
                return request;
            }
            throw new ResourceNotFoundException("Stock movement request not found");
        }
        if (authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            warehouseAccessGuard.ensureCanMutateWarehouse(request.getWarehouse());
        }
        return request;
    }

    private StockMovementRequest getScopedManagerRequest(Long id) {
        StockMovementRequest request = authenticatedUserProvider.isOverlord()
                ? stockMovementRequestRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Stock movement request not found"))
                : stockMovementRequestRepository.findByIdAndWarehouse_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new ResourceNotFoundException("Stock movement request not found"));
        warehouseAccessGuard.ensureCanMutateWarehouse(request.getWarehouse());
        if (request.getDestinationWarehouse() != null) {
            warehouseAccessGuard.ensureCanMutateWarehouse(request.getDestinationWarehouse());
        }
        return request;
    }

    private void ensureRequested(StockMovementRequest request) {
        if (request.getStatus() != StockMovementRequestStatus.REQUESTED) {
            throw new BadRequestException("Only requested stock movement requests can be changed");
        }
    }

    private Warehouse resolveWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        authenticatedUserProvider.ensureCompanyAccess(warehouse.getCompany().getId());
        return warehouse;
    }

    private Product resolveProduct(Long id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        authenticatedUserProvider.ensureCompanyAccess(product.getCompany().getId());
        return product;
    }

    private BinLocation resolveScopedBin(Long id, Long warehouseId) {
        BinLocation bin = binLocationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Bin location not found"));
        if (bin.getWarehouse() == null || !warehouseId.equals(bin.getWarehouse().getId())) {
            throw new BadRequestException("Bin location does not belong to selected warehouse");
        }
        return bin;
    }
}
