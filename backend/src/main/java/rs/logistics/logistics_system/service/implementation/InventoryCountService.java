package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.InventoryCountSessionCreate;
import rs.logistics.logistics_system.dto.create.StockAdjustmentCreate;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.update.InventoryCountLineUpdate;
import rs.logistics.logistics_system.entity.InventoryCountLine;
import rs.logistics.logistics_system.entity.InventoryCountSession;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.WarehouseInventory;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementDiscrepancyReason;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.InventoryCountMapper;
import rs.logistics.logistics_system.repository.InventoryCountLineRepository;
import rs.logistics.logistics_system.repository.InventoryCountSessionRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.InventoryCountServiceDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryCountService implements InventoryCountServiceDefinition {

    private final InventoryCountSessionRepository sessionRepository;
    private final InventoryCountLineRepository lineRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final StockMovementServiceDefinition stockMovementService;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final WarehouseAccessGuard warehouseAccessGuard;

    @Override
    @Transactional
    public InventoryCountSessionResponse create(InventoryCountSessionCreate dto) {
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        warehouseAccessGuard.ensureCanReadWarehouse(warehouse);
        if (sessionRepository.existsByWarehouse_IdAndStatusIn(warehouse.getId(), List.of(
                InventoryCountSessionStatus.OPEN,
                InventoryCountSessionStatus.COUNTING,
                InventoryCountSessionStatus.REVIEW
        ))) {
            throw new BadRequestException("Warehouse already has an active inventory count session");
        }
        User user = authenticatedUserProvider.getAuthenticatedUser();
        InventoryCountSession session = new InventoryCountSession(generateCode(warehouse.getId()), dto.getDescription(), warehouse, user);
        InventoryCountSession saved = sessionRepository.saveAndFlush(session);
        List<WarehouseInventory> rows = warehouseInventoryRepository.findByWarehouse_Id(warehouse.getId());
        for (WarehouseInventory row : rows) {
            saved.getLines().add(new InventoryCountLine(saved, row.getProduct(), row.getSafeQuantity()));
        }
        return InventoryCountMapper.toResponse(sessionRepository.saveAndFlush(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryCountSessionResponse> getAll(Long warehouseId) {
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyId();
        List<InventoryCountSession> sessions = warehouseId != null
                ? sessionRepository.findByWarehouse_IdOrderByCreatedAtDesc(warehouseId)
                : authenticatedUserProvider.isOverlord()
                    ? sessionRepository.findAll()
                    : sessionRepository.findByWarehouse_Company_IdOrderByCreatedAtDesc(companyId);
        return sessions.stream()
                .filter(session -> { warehouseAccessGuard.ensureCanReadWarehouse(session.getWarehouse()); return true; })
                .map(InventoryCountMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryCountSessionResponse getById(Long id) {
        InventoryCountSession session = getSession(id);
        warehouseAccessGuard.ensureCanReadWarehouse(session.getWarehouse());
        return InventoryCountMapper.toResponse(session);
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse start(Long id) {
        InventoryCountSession session = getSession(id);
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.OPEN);
        session.setStatus(InventoryCountSessionStatus.COUNTING);
        return InventoryCountMapper.toResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse updateLine(Long sessionId, Long lineId, InventoryCountLineUpdate dto) {
        InventoryCountSession session = getSession(sessionId);
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        if (session.getStatus() != InventoryCountSessionStatus.COUNTING && session.getStatus() != InventoryCountSessionStatus.OPEN) {
            throw new BadRequestException("Inventory count lines can only be updated while session is open or counting");
        }
        InventoryCountLine line = lineRepository.findById(lineId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory count line not found"));
        if (!line.getSession().getId().equals(sessionId)) {
            throw new BadRequestException("Inventory count line does not belong to selected session");
        }
        line.setCountedQuantity(dto.getCountedQuantity());
        line.setNote(dto.getNote());
        lineRepository.saveAndFlush(line);
        if (session.getStatus() == InventoryCountSessionStatus.OPEN) {
            session.setStatus(InventoryCountSessionStatus.COUNTING);
            sessionRepository.saveAndFlush(session);
        }
        return InventoryCountMapper.toResponse(getSession(sessionId));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse submitReview(Long id) {
        InventoryCountSession session = getSession(id);
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        if (session.getStatus() != InventoryCountSessionStatus.COUNTING && session.getStatus() != InventoryCountSessionStatus.OPEN) {
            throw new BadRequestException("Inventory count session cannot be submitted for review from current status");
        }
        boolean missingCounts = session.getLines().stream().anyMatch(line -> line.getCountedQuantity() == null);
        if (missingCounts) {
            throw new BadRequestException("All inventory count lines must be counted before review");
        }
        session.setStatus(InventoryCountSessionStatus.REVIEW);
        return InventoryCountMapper.toResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse createAdjustments(Long id) {
        InventoryCountSession session = getSession(id);
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.REVIEW);
        for (InventoryCountLine line : session.getLines()) {
            BigDecimal difference = line.getDifferenceQuantity() == null ? BigDecimal.ZERO : line.getDifferenceQuantity();
            if (difference.compareTo(BigDecimal.ZERO) == 0 || line.getAdjustmentMovementId() != null) {
                continue;
            }
            StockAdjustmentCreate dto = new StockAdjustmentCreate();
            dto.setWarehouseId(session.getWarehouse().getId());
            dto.setProductId(line.getProduct().getId());
            dto.setQuantity(difference.abs());
            dto.setDirection(difference.compareTo(BigDecimal.ZERO) > 0 ? StockAdjustmentDirection.INCREASE : StockAdjustmentDirection.DECREASE);
            dto.setExpectedQuantity(line.getSystemQuantity());
            dto.setActualQuantity(line.getCountedQuantity());
            dto.setDiscrepancyReason(resolveDiscrepancyReason(difference));
            dto.setDiscrepancyNote(line.getNote());
            dto.setReferenceType(StockMovementReferenceType.INVENTORY_COUNT);
            dto.setReferenceId(session.getId());
            dto.setReferenceNumber(session.getCode());
            dto.setReferenceNote("Inventory count adjustment");
            dto.setReasonDescription("Inventory count discrepancy for " + session.getCode());
            StockMovementResponse movement = stockMovementService.adjustment(dto);
            line.setAdjustmentMovementId(movement.getId());
            lineRepository.save(line);
        }
        session.setStatus(InventoryCountSessionStatus.ADJUSTMENTS_CREATED);
        session.setReviewedBy(authenticatedUserProvider.getAuthenticatedUser());
        session.setReviewedAt(LocalDateTime.now());
        return InventoryCountMapper.toResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse cancel(Long id) {
        InventoryCountSession session = getSession(id);
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        if (session.getStatus() == InventoryCountSessionStatus.ADJUSTMENTS_CREATED) {
            throw new BadRequestException("Inventory count session with created adjustments cannot be cancelled");
        }
        session.setStatus(InventoryCountSessionStatus.CANCELLED);
        return InventoryCountMapper.toResponse(sessionRepository.saveAndFlush(session));
    }

    private InventoryCountSession getSession(Long id) {
        return sessionRepository.findWithLinesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory count session not found"));
    }

    private void requireStatus(InventoryCountSession session, InventoryCountSessionStatus status) {
        if (session.getStatus() != status) {
            throw new BadRequestException("Inventory count session must be " + status);
        }
    }

    private String generateCode(Long warehouseId) {
        return "IC-" + warehouseId + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    private StockMovementDiscrepancyReason resolveDiscrepancyReason(BigDecimal difference) {
        return difference.compareTo(BigDecimal.ZERO) > 0 ? StockMovementDiscrepancyReason.OVERAGE : StockMovementDiscrepancyReason.SHORTAGE;
    }
}
