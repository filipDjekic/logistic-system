package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.InventoryCountSessionCreate;
import rs.logistics.logistics_system.dto.create.StockAdjustmentCreate;
import rs.logistics.logistics_system.dto.response.AllowedStatusTransitionsResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountLineResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionResponse;
import rs.logistics.logistics_system.dto.response.InventoryCountSessionSummaryResponse;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.update.InventoryCountLineUpdate;
import rs.logistics.logistics_system.entity.BinLocation;
import rs.logistics.logistics_system.entity.BinInventory;
import rs.logistics.logistics_system.entity.InventoryCountLine;
import rs.logistics.logistics_system.entity.InventoryCountSession;
import rs.logistics.logistics_system.entity.Product;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.enums.NotificationCategory;
import rs.logistics.logistics_system.enums.NotificationSeverity;
import rs.logistics.logistics_system.enums.NotificationSourceType;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementDiscrepancyReason;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementStatus;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.InventoryCountMapper;
import rs.logistics.logistics_system.repository.BinInventoryRepository;
import rs.logistics.logistics_system.repository.InventoryCountLineRepository;
import rs.logistics.logistics_system.repository.InventoryCountSessionRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.lifecycle.LifecycleEntityType;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionContext;
import rs.logistics.logistics_system.lifecycle.LifecycleTransitionEngine;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;
import rs.logistics.logistics_system.service.definition.InventoryCountServiceDefinition;
import rs.logistics.logistics_system.service.support.OptimisticLockGuard;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryCountService implements InventoryCountServiceDefinition {

    private static final int SNAPSHOT_LINE_BATCH_SIZE = 500;

    private record BinProductKey(Long binLocationId, Long productId) {
    }

    private final InventoryCountSessionRepository sessionRepository;
    private final InventoryCountLineRepository lineRepository;
    private final BinInventoryRepository binInventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final StockMovementServiceDefinition stockMovementService;
    private final StockMovementRepository stockMovementRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final WarehouseAccessGuard warehouseAccessGuard;
    private final LifecycleTransitionEngine lifecycleTransitionEngine;
    private final DomainEventServiceDefinition domainEventService;
    private final NotificationServiceDefinition notificationService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public InventoryCountSessionResponse create(InventoryCountSessionCreate dto) {
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        warehouseAccessGuard.ensureCanMutateWarehouse(warehouse);
        if (sessionRepository.existsByWarehouse_IdAndStatusIn(warehouse.getId(), List.of(
                InventoryCountSessionStatus.DRAFT,
                InventoryCountSessionStatus.OPEN,
                InventoryCountSessionStatus.COUNTING,
                InventoryCountSessionStatus.REVIEW,
                InventoryCountSessionStatus.APPROVED,
                InventoryCountSessionStatus.ADJUSTMENTS_CREATED
        ))) {
            throw new BadRequestException("Warehouse already has an active inventory count session");
        }
        User user = authenticatedUserProvider.getAuthenticatedUser();
        InventoryCountSession session = new InventoryCountSession(generateCode(warehouse.getId()), dto.getDescription(), warehouse, user);
        InventoryCountSession saved = sessionRepository.saveAndFlush(session);
        List<BinInventoryRepository.InventoryCountSnapshotRow> rows = binInventoryRepository
                .findInventoryCountSnapshotRowsByWarehouseId(warehouse.getId());
        if (rows.isEmpty()) {
            throw new BadRequestException("Warehouse has no bin inventory rows available for location-based inventory count");
        }

        Long sessionId = saved.getId();
        List<InventoryCountLine> batch = new ArrayList<>(Math.min(rows.size(), SNAPSHOT_LINE_BATCH_SIZE));
        InventoryCountSession sessionRef = entityManager.getReference(InventoryCountSession.class, sessionId);
        for (BinInventoryRepository.InventoryCountSnapshotRow row : rows) {
            if (row.getProductId() == null || row.getBinLocationId() == null) {
                throw new BadRequestException("Inventory count snapshot contains an invalid bin inventory row");
            }
            Product productRef = entityManager.getReference(Product.class, row.getProductId());
            BinLocation binLocationRef = entityManager.getReference(BinLocation.class, row.getBinLocationId());
            batch.add(new InventoryCountLine(sessionRef, productRef, binLocationRef, nonNullQuantity(row.getQuantity())));

            if (batch.size() == SNAPSHOT_LINE_BATCH_SIZE) {
                saveSnapshotLineBatch(batch);
                sessionRef = entityManager.getReference(InventoryCountSession.class, sessionId);
            }
        }
        saveSnapshotLineBatch(batch);
        return toHeaderResponse(getSessionHeader(sessionId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryCountSessionSummaryResponse> getAll(Long warehouseId, Pageable pageable) {
        Page<InventoryCountSession> page = findAccessibleSessions(warehouseId, pageable);
        if (page.isEmpty()) {
            return PageResponse.fromContent(List.of(), page);
        }

        List<Long> sessionIds = page.getContent().stream().map(InventoryCountSession::getId).toList();
        Map<Long, InventoryCountSessionRepository.InventoryCountSessionLineStats> statsBySessionId = sessionRepository
                .findLineStatsBySessionIds(sessionIds)
                .stream()
                .collect(Collectors.toMap(InventoryCountSessionRepository.InventoryCountSessionLineStats::getSessionId, Function.identity()));
        List<InventoryCountSessionSummaryResponse> content = page.getContent().stream()
                .map(session -> {
                    InventoryCountSessionRepository.InventoryCountSessionLineStats stats = statsBySessionId.get(session.getId());
                    return InventoryCountMapper.toSummaryResponse(
                            session,
                            toInt(stats != null ? stats.getLineCount() : null),
                            toInt(stats != null ? stats.getCountedLineCount() : null),
                            toInt(stats != null ? stats.getDiscrepancyLineCount() : null)
                    );
                })
                .toList();
        return PageResponse.fromContent(content, page);
    }

    private Page<InventoryCountSession> findAccessibleSessions(Long warehouseId, Pageable pageable) {
        if (authenticatedUserProvider.isOverlord()) {
            return warehouseId != null
                    ? sessionRepository.findByWarehouse_IdOrderByCreatedAtDesc(warehouseId, pageable)
                    : sessionRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyId();
        List<Long> scopedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        if (scopedWarehouseIds != null) {
            if (warehouseId != null) {
                if (!scopedWarehouseIds.contains(warehouseId)) {
                    return Page.empty(pageable);
                }
                return sessionRepository.findByWarehouse_IdAndWarehouse_Company_IdOrderByCreatedAtDesc(warehouseId, companyId, pageable);
            }
            if (scopedWarehouseIds.isEmpty()) {
                return Page.empty(pageable);
            }
            return sessionRepository.findByWarehouse_IdInOrderByCreatedAtDesc(scopedWarehouseIds, pageable);
        }

        return warehouseId != null
                ? sessionRepository.findByWarehouse_IdAndWarehouse_Company_IdOrderByCreatedAtDesc(warehouseId, companyId, pageable)
                : sessionRepository.findByWarehouse_Company_IdOrderByCreatedAtDesc(companyId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryCountSessionResponse getById(Long id) {
        InventoryCountSession session = getSessionHeader(id);
        warehouseAccessGuard.ensureCanReadWarehouse(session.getWarehouse());
        InventoryCountSessionRepository.InventoryCountSessionLineStats stats = sessionRepository
                .findLineStatsBySessionIds(List.of(id))
                .stream()
                .findFirst()
                .orElse(null);
        return InventoryCountMapper.toResponse(
                session,
                toInt(stats != null ? stats.getLineCount() : null),
                toInt(stats != null ? stats.getCountedLineCount() : null),
                toInt(stats != null ? stats.getDiscrepancyLineCount() : null),
                List.of()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryCountLineResponse> getLines(Long id, String search, Long zoneId, Long binLocationId, String status, Pageable pageable) {
        InventoryCountSession session = getSessionHeader(id);
        warehouseAccessGuard.ensureCanReadWarehouse(session.getWarehouse());
        Page<InventoryCountLineRepository.InventoryCountLineRow> page = lineRepository.searchBySessionId(
                id,
                normalize(search),
                zoneId,
                binLocationId,
                normalizeStatus(status),
                pageable
        );
        List<InventoryCountLineResponse> content = page.getContent().stream()
                .map(InventoryCountMapper::toLineResponse)
                .toList();
        return PageResponse.fromContent(content, page);
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse open(Long id) {
        InventoryCountSession session = getSessionHeaderForUpdate(id);
        requireInventoryCountManager();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.DRAFT);
        transition(session, InventoryCountSessionStatus.OPEN, "Inventory count opened");
        return toHeaderResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse start(Long id) {
        InventoryCountSession session = getSessionHeaderForUpdate(id);
        requireInventoryCountManager();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.OPEN);
        transition(session, InventoryCountSessionStatus.COUNTING, "Inventory count started");
        return toHeaderResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse updateLine(Long sessionId, Long lineId, InventoryCountLineUpdate dto) {
        InventoryCountSession session = getSessionHeaderForUpdate(sessionId);
        requireInventoryCountCounter();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.COUNTING);
        InventoryCountLine line = lineRepository.findByIdAndSession_Id(lineId, sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory count line not found for selected session"));
        ensureCanUpdateCountLine(session, line);
        OptimisticLockGuard.requireExpectedVersion(dto.getExpectedVersion(), line.getVersion(), "Inventory count line");
        validateCountingLineLocation(session, line, dto);
        line.setCountedQuantity(dto.getCountedQuantity());
        line.setNote(dto.getNote());
        lineRepository.saveAndFlush(line);
        return getById(sessionId);
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse submitReview(Long id) {
        InventoryCountSession session = getSessionHeaderForUpdate(id);
        requireInventoryCountManager();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.COUNTING);
        if (lineRepository.existsUncountedBySessionId(id)) {
            throw new BadRequestException("All inventory count lines must be counted before review");
        }
        transition(session, InventoryCountSessionStatus.REVIEW, "Inventory count submitted for review");
        return toHeaderResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse approve(Long id) {
        InventoryCountSession session = getSessionHeaderForUpdate(id);
        requireInventoryCountManager();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.REVIEW);
        transition(session, InventoryCountSessionStatus.APPROVED, "Inventory count approved");
        session.setReviewedBy(authenticatedUserProvider.getAuthenticatedUser());
        session.setReviewedAt(LocalDateTime.now());
        return toHeaderResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse reject(Long id) {
        InventoryCountSession session = getSessionHeaderForUpdate(id);
        requireInventoryCountManager();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.REVIEW);
        transition(session, InventoryCountSessionStatus.REJECTED, "Inventory count rejected");
        session.setReviewedBy(authenticatedUserProvider.getAuthenticatedUser());
        session.setReviewedAt(LocalDateTime.now());
        return toHeaderResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse createAdjustments(Long id) {
        InventoryCountSession session = getSessionHeaderForUpdate(id);
        requireInventoryCountManager();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.APPROVED);
        validateAdjustmentBatchCanBeCreated(session);
        List<InventoryCountLine> adjustmentLines = lineRepository.findAdjustmentCandidateLines(session.getId());
        validateSnapshotStillMatchesCurrentStock(session.getId(), adjustmentLines);

        for (InventoryCountLine line : adjustmentLines) {
            BigDecimal difference = safe(line.getDifferenceQuantity());
            if (difference.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }
            validateAdjustmentLine(session, line);

            StockAdjustmentCreate dto = new StockAdjustmentCreate();
            dto.setWarehouseId(session.getWarehouse().getId());
            dto.setProductId(line.getProduct().getId());
            dto.setBinLocationId(line.getBinLocation().getId());
            dto.setQuantity(difference.abs());
            dto.setDirection(difference.compareTo(BigDecimal.ZERO) > 0 ? StockAdjustmentDirection.INCREASE : StockAdjustmentDirection.DECREASE);
            dto.setExpectedQuantity(safe(line.getSystemQuantity()));
            dto.setActualQuantity(safe(line.getCountedQuantity()));
            dto.setDiscrepancyReason(resolveDiscrepancyReason(difference));
            dto.setDiscrepancyNote(resolveAdjustmentNote(line));
            dto.setReferenceType(StockMovementReferenceType.INVENTORY_COUNT);
            dto.setReferenceId(session.getId());
            dto.setReferenceNumber(session.getCode());
            dto.setReferenceNote("Inventory count line #" + line.getId()
                    + " / bin " + line.getBinLocation().getCode());
            dto.setReasonDescription("Inventory count discrepancy for " + session.getCode()
                    + " at bin " + line.getBinLocation().getCode());
            StockMovementResponse movement = stockMovementService.adjustment(dto);
            line.setAdjustmentMovementId(movement.getId());
            lineRepository.save(line);
        }
        transition(session, InventoryCountSessionStatus.ADJUSTMENTS_CREATED, "Inventory count stock adjustments created");
        return toHeaderResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse close(Long id) {
        InventoryCountSession session = getSessionHeaderForUpdate(id);
        requireInventoryCountManager();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        requireStatus(session, InventoryCountSessionStatus.ADJUSTMENTS_CREATED);
        transition(session, InventoryCountSessionStatus.CLOSED, "Inventory count closed");
        return toHeaderResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional
    public InventoryCountSessionResponse cancel(Long id) {
        InventoryCountSession session = getSessionHeaderForUpdate(id);
        requireInventoryCountManager();
        warehouseAccessGuard.ensureCanMutateWarehouse(session.getWarehouse());
        if (session.getStatus() == InventoryCountSessionStatus.ADJUSTMENTS_CREATED || session.getStatus() == InventoryCountSessionStatus.CLOSED) {
            throw new BadRequestException("Inventory count session with created adjustments or closed status cannot be cancelled");
        }
        transition(session, InventoryCountSessionStatus.CANCELLED, "Inventory count cancelled");
        return toHeaderResponse(sessionRepository.saveAndFlush(session));
    }

    @Override
    @Transactional(readOnly = true)
    public AllowedStatusTransitionsResponse allowedStatusTransitions(Long id) {
        InventoryCountSession session = getSessionHeader(id);
        warehouseAccessGuard.ensureCanReadWarehouse(session.getWarehouse());
        List<String> allowed = lifecycleTransitionEngine.allowedStatuses(
                        LifecycleEntityType.INVENTORY_COUNT,
                        InventoryCountSessionStatus.class,
                        session.getStatus()
                ).stream()
                .sorted(Comparator.comparing(Enum::name))
                .map(Enum::name)
                .toList();
        return new AllowedStatusTransitionsResponse(session.getStatus().name(), allowed, session.getVersion());
    }

    private InventoryCountSessionResponse toHeaderResponse(InventoryCountSession session) {
        InventoryCountSessionRepository.InventoryCountSessionLineStats stats = sessionRepository
                .findLineStatsBySessionIds(List.of(session.getId()))
                .stream()
                .findFirst()
                .orElse(null);
        return InventoryCountMapper.toResponse(
                session,
                toInt(stats != null ? stats.getLineCount() : null),
                toInt(stats != null ? stats.getCountedLineCount() : null),
                toInt(stats != null ? stats.getDiscrepancyLineCount() : null),
                List.of()
        );
    }

    private void validateSnapshotStillMatchesCurrentStock(Long sessionId, List<InventoryCountLine> lines) {
        if (lines.isEmpty()) {
            return;
        }

        Map<BinProductKey, BigDecimal> currentQuantityByBinProduct = binInventoryRepository
                .findAdjustmentStockRowsForUpdate(sessionId)
                .stream()
                .collect(Collectors.toMap(
                        binInventory -> new BinProductKey(binInventory.getBinLocation().getId(), binInventory.getProduct().getId()),
                        BinInventory::getSafeQuantity
                ));

        for (InventoryCountLine line : lines) {
            if (line.getBinLocation() == null) {
                throw new BadRequestException("Inventory count line requires a bin location before adjustment creation");
            }
            BigDecimal currentQuantity = currentQuantityByBinProduct.getOrDefault(
                    new BinProductKey(line.getBinLocation().getId(), line.getProduct().getId()),
                    BigDecimal.ZERO
            );

            if (currentQuantity.compareTo(safe(line.getSystemQuantity())) != 0) {
                throw new BadRequestException("Inventory count snapshot is stale for product "
                        + line.getProduct().getName()
                        + " at bin "
                        + line.getBinLocation().getCode()
                        + ". Current stock changed after the count was opened; cancel and create a new count session.");
            }
        }
    }

    private void validateAdjustmentBatchCanBeCreated(InventoryCountSession session) {
        if (lineRepository.existsLinkedAdjustmentBySessionId(session.getId())) {
            throw new BadRequestException("Inventory count session already has linked adjustment movements");
        }
        boolean existingAdjustmentBatch = stockMovementRepository.existsByReferenceTypeAndReferenceIdAndMovementTypeAndStatusNot(
                StockMovementReferenceType.INVENTORY_COUNT,
                session.getId(),
                StockMovementType.ADJUSTMENT,
                StockMovementStatus.CANCELLED
        );
        if (existingAdjustmentBatch) {
            throw new BadRequestException("Inventory count session already has created stock adjustment movements");
        }
    }

    private void validateAdjustmentLine(InventoryCountSession session, InventoryCountLine line) {
        if (line.getCountedQuantity() == null) {
            throw new BadRequestException("Inventory count line must be counted before adjustment creation");
        }
        if (line.getAdjustmentMovementId() != null) {
            throw new BadRequestException("Inventory count line already has an adjustment movement");
        }
        if (line.getBinLocation() == null) {
            throw new BadRequestException("Inventory count adjustment requires a bin location");
        }
        if (line.getBinLocation().getWarehouse() == null || !line.getBinLocation().getWarehouse().getId().equals(session.getWarehouse().getId())) {
            throw new BadRequestException("Inventory count line bin location does not belong to selected warehouse");
        }
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private int toInt(Long value) {
        return value == null ? 0 : Math.toIntExact(value);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeStatus(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }

    private InventoryCountSession getSessionHeader(Long id) {
        return sessionRepository.findHeaderById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory count session not found"));
    }

    private InventoryCountSession getSession(Long id) {
        return sessionRepository.findWithLinesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory count session not found"));
    }

    private InventoryCountSession getSessionHeaderForUpdate(Long id) {
        return sessionRepository.findHeaderByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory count session not found"));
    }

    private InventoryCountSession getSessionForUpdate(Long id) {
        return sessionRepository.findWithLinesByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory count session not found"));
    }


    private void ensureCanUpdateCountLine(InventoryCountSession session, InventoryCountLine line) {
        if (authenticatedUserProvider.isOverlord() || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")) {
            return;
        }

        if (!authenticatedUserProvider.hasRole("WORKER")) {
            throw new BadRequestException("Only warehouse counters and warehouse managers can count inventory lines");
        }

        if (line.getBinLocation() == null || line.getBinLocation().getWarehouse() == null) {
            throw new BadRequestException("Inventory count line is missing warehouse scope");
        }

        if (!line.getBinLocation().getWarehouse().getId().equals(session.getWarehouse().getId())) {
            throw new BadRequestException("Inventory count line does not belong to selected warehouse");
        }

        warehouseAccessGuard.ensureCanMutateWarehouse(line.getBinLocation().getWarehouse());
    }

    private void validateCountingLineLocation(InventoryCountSession session, InventoryCountLine line, InventoryCountLineUpdate dto) {
        if (line.getBinLocation() == null) {
            throw new BadRequestException("Inventory count line is missing bin location");
        }
        if (line.getBinLocation().getWarehouse() == null || !line.getBinLocation().getWarehouse().getId().equals(session.getWarehouse().getId())) {
            throw new BadRequestException("Inventory count line bin location does not belong to selected warehouse");
        }
        if (dto.getBinLocationId() != null && !dto.getBinLocationId().equals(line.getBinLocation().getId())) {
            throw new BadRequestException("Inventory count line bin location cannot be changed during counting");
        }
    }

    private void transition(InventoryCountSession session, InventoryCountSessionStatus nextStatus, String reason) {
        InventoryCountSessionStatus oldStatus = session.getStatus();
        LifecycleTransitionContext<InventoryCountSessionStatus> context = lifecycleTransitionEngine.validate(
                LifecycleEntityType.INVENTORY_COUNT,
                session.getId(),
                InventoryCountSessionStatus.class,
                oldStatus,
                nextStatus,
                reason,
                null,
                session.getVersion()
        );
        session.setStatus(nextStatus);
        lifecycleTransitionEngine.afterTransition(context, InventoryCountSessionStatus.class);
        recordInventoryCountDomainEvent(session, oldStatus, nextStatus, reason);
        publishInventoryCountLifecycleNotification(session, oldStatus, nextStatus);
    }

    private void recordInventoryCountDomainEvent(InventoryCountSession session, InventoryCountSessionStatus oldStatus, InventoryCountSessionStatus newStatus, String reason) {
        Long companyId = session.getWarehouse() != null && session.getWarehouse().getCompany() != null
                ? session.getWarehouse().getCompany().getId()
                : authenticatedUserProvider.getAuthenticatedCompanyId();
        String payload = "{\"sessionId\":" + session.getId()
                + ",\"code\":\"" + session.getCode() + "\""
                + ",\"warehouseId\":" + session.getWarehouse().getId()
                + ",\"oldStatus\":\"" + oldStatus + "\""
                + ",\"newStatus\":\"" + newStatus + "\""
                + ",\"reason\":\"" + sanitize(reason) + "\"}";
        domainEventService.record(
                DomainEventType.INVENTORY_LIFECYCLE,
                OperationalEntityType.INVENTORY_COUNT,
                session.getId(),
                session.getCode(),
                "Inventory count status changed",
                payload,
                companyId
        );
    }

    private String sanitize(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void requireInventoryCountManager() {
        if (!(authenticatedUserProvider.isOverlord()
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER"))) {
            throw new BadRequestException("Only warehouse managers can perform this inventory count action");
        }
    }

    private void requireInventoryCountCounter() {
        if (!(authenticatedUserProvider.isOverlord()
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                || authenticatedUserProvider.hasRole("WORKER"))) {
            throw new BadRequestException("Only warehouse counters and warehouse managers can count inventory lines");
        }
    }

    private void publishInventoryCountLifecycleNotification(InventoryCountSession session, InventoryCountSessionStatus oldStatus, InventoryCountSessionStatus newStatus) {
        if (session.getCreatedBy() == null || session.getCreatedBy().getId() == null) {
            return;
        }
        Long actorId = authenticatedUserProvider.hasAuthenticatedUserContext() ? authenticatedUserProvider.getAuthenticatedUserId() : null;
        if (actorId != null && actorId.equals(session.getCreatedBy().getId())) {
            return;
        }
        notificationService.createOperationalNotification(
                session.getCreatedBy().getId(),
                "Inventory count " + session.getCode(),
                "Inventory count changed from " + oldStatus + " to " + newStatus + ".",
                NotificationType.INFO,
                NotificationSeverity.INFO,
                NotificationCategory.INVENTORY,
                NotificationSourceType.WAREHOUSE_INVENTORY,
                session.getWarehouse() != null ? session.getWarehouse().getId() : null,
                "inventory-count:" + session.getId() + ":" + newStatus
        );
    }

    private void requireStatus(InventoryCountSession session, InventoryCountSessionStatus status) {
        if (session.getStatus() != status) {
            throw new BadRequestException("Inventory count session must be " + status);
        }
    }

    private void saveSnapshotLineBatch(List<InventoryCountLine> batch) {
        if (batch.isEmpty()) {
            return;
        }
        lineRepository.saveAll(batch);
        lineRepository.flush();
        entityManager.clear();
        batch.clear();
    }

    private BigDecimal nonNullQuantity(BigDecimal quantity) {
        return quantity == null ? BigDecimal.ZERO : quantity;
    }

    private String generateCode(Long warehouseId) {
        return "IC-" + warehouseId + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    private String resolveAdjustmentNote(InventoryCountLine line) {
        if (line.getNote() != null && !line.getNote().isBlank()) {
            return line.getNote().trim();
        }
        String binCode = line.getBinLocation() != null ? line.getBinLocation().getCode() : "unknown bin";
        String productName = line.getProduct() != null ? line.getProduct().getName() : "unknown product";
        return "Inventory count discrepancy for " + productName + " at " + binCode;
    }

    private StockMovementDiscrepancyReason resolveDiscrepancyReason(BigDecimal difference) {
        return difference.compareTo(BigDecimal.ZERO) > 0 ? StockMovementDiscrepancyReason.OVERAGE : StockMovementDiscrepancyReason.SHORTAGE;
    }
}
