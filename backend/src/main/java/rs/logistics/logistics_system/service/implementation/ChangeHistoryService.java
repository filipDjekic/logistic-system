package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.enums.ChangeType;
import rs.logistics.logistics_system.entity.ChangeHistory;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.repository.ChangeHistoryRepository;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.StockMovementRequestRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderItemRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.security.WarehouseAccessGuard;
import rs.logistics.logistics_system.service.support.PageRequestSanitizer;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChangeHistoryService implements ChangeHistoryServiceDefinition {

    private final ChangeHistoryRepository _changeHistoryRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final VehicleRepository vehicleRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final ShiftRepository shiftRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockMovementRequestRepository stockMovementRequestRepository;
    private final TaskRepository taskRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final TransportOrderItemRepository transportOrderItemRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final NotificationRepository notificationRepository;
    private final WarehouseAccessGuard warehouseAccessGuard;

    @Override
    public ChangeHistoryResponse getById(Long id) {
        ChangeHistory changeHistory = _changeHistoryRepository.findById(id)
                .orElseThrow(() -> new rs.logistics.logistics_system.exception.ResourceNotFoundException("Change history not found"));

        ensureCanAccess(changeHistory);

        return rs.logistics.logistics_system.mapper.ChangeHistoryMapper.toResponse(changeHistory);
    }

    @Override
    public PageResponse<ChangeHistoryResponse> search(String search, ChangeType changeType, String entityName, Long entityId, Long userId, Pageable pageable) {
        if (!authenticatedUserProvider.isOverlord() && userId != null) {
            throw new ForbiddenException("Only OVERLORD can filter change history by user");
        }

        Page<ChangeHistory> page = _changeHistoryRepository.searchHistory(
                authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow(),
                trimToNull(search),
                changeType,
                trimToNull(entityName),
                entityId,
                userId,
                PageRequestSanitizer.sanitize(pageable, Sort.by(Sort.Direction.DESC, "changedAt"))
        );

        List<ChangeHistoryResponse> content = page.getContent()
                .stream()
                .filter(this::canAccess)
                .map(rs.logistics.logistics_system.mapper.ChangeHistoryMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.fromContent(content, page);
    }

    @Override
    public List<ChangeHistoryResponse> getByEntityName(String entityName) {
        List<ChangeHistory> data = authenticatedUserProvider.isOverlord()
                ? _changeHistoryRepository.findByEntityName(entityName)
                : _changeHistoryRepository.findByEntityNameAndChangedBy_Company_Id(entityName, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
        return toAccessibleResponses(data);
    }

    @Override
    public List<ChangeHistoryResponse> getByEntityId(Long entityId) {
        List<ChangeHistory> data = authenticatedUserProvider.isOverlord()
                ? _changeHistoryRepository.findByEntityId(entityId)
                : _changeHistoryRepository.findByEntityIdAndChangedBy_Company_Id(entityId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
        return toAccessibleResponses(data);
    }

    @Override
    public List<ChangeHistoryResponse> getByUserId(Long userId) {
        ensureOverlordOnly();
        List<ChangeHistory> data = _changeHistoryRepository.findByChangedById(userId);
        return toAccessibleResponses(data);
    }

    @Override
    public List<ChangeHistoryResponse> getByBetweenDate(LocalDateTime start, LocalDateTime end) {
        ensureOverlordOnly();
        List<ChangeHistory> data = _changeHistoryRepository.findByChangedAtBetween(start, end);
        return toAccessibleResponses(data);
    }

    @Override
    public List<ChangeHistoryResponse> getAll() {
        ensureOverlordOnly();
        List<ChangeHistory> data = _changeHistoryRepository.findAll(PageRequest.of(0, 100)).getContent();
        return toAccessibleResponses(data);
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private void ensureOverlordOnly() {
        if (!authenticatedUserProvider.isOverlord()) {
            throw new ForbiddenException("Only OVERLORD can access global change history queries");
        }
    }

    private List<ChangeHistoryResponse> toAccessibleResponses(List<ChangeHistory> data) {
        return data.stream()
                .filter(this::canAccess)
                .map(rs.logistics.logistics_system.mapper.ChangeHistoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    private void ensureCanAccess(ChangeHistory changeHistory) {
        if (!canAccess(changeHistory)) {
            throw new rs.logistics.logistics_system.exception.ResourceNotFoundException("Change history not found");
        }
    }

    private boolean canAccess(ChangeHistory changeHistory) {
        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        String entityName = normalize(changeHistory.getEntityName());
        Long entityId = changeHistory.getEntityId();
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Long currentUserId = authenticatedUserProvider.getAuthenticatedUserId();

        return switch (entityName) {
            case "COMPANY" -> canAccessCompanyScopedHistory(entityId, companyId);

            case "USER" -> canAccessUserHistory(entityId, companyId, currentUserId);

            case "EMPLOYEE" -> canAccessEmployeeHistory(entityId, companyId, currentUserId);

            case "VEHICLE" -> canAccessVehicleHistory(entityId, companyId);

            case "WAREHOUSE" -> canAccessWarehouseHistory(entityId, companyId);

            case "PRODUCT" -> canAccessCompanyLevelEntity() && productRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();

            case "SHIFT" -> canAccessShiftHistory(entityId, companyId, currentUserId);

            case "STOCK_MOVEMENT" -> stockMovementRepository.findByIdAndWarehouse_Company_Id(entityId, companyId)
                    .map(stockMovement -> canReadWarehouseById(stockMovement.getWarehouse() != null ? stockMovement.getWarehouse().getId() : null))
                    .orElse(false);

            case "STOCK_MOVEMENT_REQUEST" -> stockMovementRequestRepository.findByIdAndWarehouse_Company_Id(entityId, companyId)
                    .map(request -> canReadWarehouseById(request.getWarehouse() != null ? request.getWarehouse().getId() : null))
                    .orElse(false);

            case "TASK" -> taskRepository.findByIdAndAssignedEmployee_Company_Id(entityId, companyId)
                    .map(task -> {
                        if (canAccessCompanyLevelEntity()) {
                            return true;
                        }

                        Long assignedUserId = task.getAssignedEmployee() != null && task.getAssignedEmployee().getUser() != null
                                ? task.getAssignedEmployee().getUser().getId()
                                : null;
                        if (assignedUserId != null && assignedUserId.equals(currentUserId)) {
                            return true;
                        }

                        Long assignedWarehouseId = task.getAssignedEmployee() != null
                                && task.getAssignedEmployee().getPrimaryWarehouse() != null
                                ? task.getAssignedEmployee().getPrimaryWarehouse().getId()
                                : null;
                        return canReadWarehouseById(assignedWarehouseId);
                    })
                    .orElse(false);

            case "TRANSPORT_ORDER" -> transportOrderRepository.findByIdAndCreatedBy_Company_Id(entityId, companyId)
                    .map(transportOrder -> {
                        if (canAccessCompanyLevelEntity()) {
                            return true;
                        }

                        Long assignedUserId = transportOrder.getAssignedEmployee() != null
                                && transportOrder.getAssignedEmployee().getUser() != null
                                ? transportOrder.getAssignedEmployee().getUser().getId()
                                : null;
                        if (assignedUserId != null && assignedUserId.equals(currentUserId)) {
                            return true;
                        }

                        return canReadWarehouseById(transportOrder.getSourceWarehouse() != null ? transportOrder.getSourceWarehouse().getId() : null)
                                || canReadWarehouseById(transportOrder.getDestinationWarehouse() != null ? transportOrder.getDestinationWarehouse().getId() : null);
                    })
                    .orElse(false);

            case "TRANSPORT_ORDER_ITEM" -> transportOrderItemRepository.findByIdAndTransportOrder_CreatedBy_Company_Id(entityId, companyId)
                    .map(item -> {
                        if (canAccessCompanyLevelEntity()) {
                            return true;
                        }

                        Long assignedUserId = item.getTransportOrder() != null
                                && item.getTransportOrder().getAssignedEmployee() != null
                                && item.getTransportOrder().getAssignedEmployee().getUser() != null
                                ? item.getTransportOrder().getAssignedEmployee().getUser().getId()
                                : null;
                        if (assignedUserId != null && assignedUserId.equals(currentUserId)) {
                            return true;
                        }

                        if (item.getTransportOrder() == null) {
                            return false;
                        }

                        return canReadWarehouseById(item.getTransportOrder().getSourceWarehouse() != null ? item.getTransportOrder().getSourceWarehouse().getId() : null)
                                || canReadWarehouseById(item.getTransportOrder().getDestinationWarehouse() != null ? item.getTransportOrder().getDestinationWarehouse().getId() : null);
                    })
                    .orElse(false);

            case "WAREHOUSE_INVENTORY" -> canAccessWarehouseInventory(changeHistory, companyId);

            case "NOTIFICATION" -> notificationRepository.findByIdAndUser_Company_Id(entityId, companyId)
                    .map(notification -> notification.getUser() != null && notification.getUser().getId().equals(currentUserId))
                    .orElse(false);

            default -> canAccessCompanyLevelEntity()
                    && changeHistory.getChangedBy() != null
                    && changeHistory.getChangedBy().getCompany() != null
                    && companyId.equals(changeHistory.getChangedBy().getCompany().getId());
        };
    }

    private boolean canAccessCompanyScopedHistory(Long entityId, Long companyId) {
        if (!canAccessCompanyLevelEntity()) {
            return false;
        }
        return companyRepository.findById(entityId)
                .map(company -> company.getId().equals(companyId))
                .orElse(false);
    }

    private boolean canAccessUserHistory(Long entityId, Long companyId, Long currentUserId) {
        if (entityId != null && entityId.equals(currentUserId)) {
            return true;
        }
        return canAccessCompanyLevelEntity() && userRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();
    }

    private boolean canAccessEmployeeHistory(Long entityId, Long companyId, Long currentUserId) {
        return employeeRepository.findByIdAndCompany_Id(entityId, companyId)
                .map(employee -> {
                    Long employeeUserId = employee.getUser() != null ? employee.getUser().getId() : null;
                    if (employeeUserId != null && employeeUserId.equals(currentUserId)) {
                        return true;
                    }

                    if (canAccessCompanyLevelEntity()) {
                        return true;
                    }

                    Long primaryWarehouseId = employee.getPrimaryWarehouse() != null ? employee.getPrimaryWarehouse().getId() : null;
                    return canReadWarehouseById(primaryWarehouseId);
                })
                .orElse(false);
    }

    private boolean canAccessVehicleHistory(Long entityId, Long companyId) {
        return vehicleRepository.findByIdAndCompany_Id(entityId, companyId)
                .map(vehicle -> canAccessCompanyLevelEntity() || isVehicleAssignedToCurrentUser(vehicle.getId(), companyId))
                .orElse(false);
    }

    private boolean isVehicleAssignedToCurrentUser(Long vehicleId, Long companyId) {
        Long currentUserId = authenticatedUserProvider.getAuthenticatedUserId();
        return transportOrderRepository.findByVehicleIdAndCreatedBy_Company_Id(vehicleId, companyId)
                .stream()
                .anyMatch(transportOrder -> transportOrder.getAssignedEmployee() != null
                        && transportOrder.getAssignedEmployee().getUser() != null
                        && currentUserId.equals(transportOrder.getAssignedEmployee().getUser().getId()));
    }

    private boolean canAccessWarehouseHistory(Long entityId, Long companyId) {
        return warehouseRepository.findByIdAndCompany_Id(entityId, companyId)
                .map(warehouse -> canReadWarehouseById(warehouse.getId()))
                .orElse(false);
    }

    private boolean canAccessShiftHistory(Long entityId, Long companyId, Long currentUserId) {
        return shiftRepository.findByIdAndEmployee_Company_Id(entityId, companyId)
                .map(shift -> {
                    Long shiftUserId = shift.getEmployee() != null && shift.getEmployee().getUser() != null
                            ? shift.getEmployee().getUser().getId()
                            : null;
                    if (shiftUserId != null && shiftUserId.equals(currentUserId)) {
                        return true;
                    }

                    if (canAccessCompanyLevelEntity()) {
                        return true;
                    }

                    Long primaryWarehouseId = shift.getEmployee() != null && shift.getEmployee().getPrimaryWarehouse() != null
                            ? shift.getEmployee().getPrimaryWarehouse().getId()
                            : null;
                    return canReadWarehouseById(primaryWarehouseId);
                })
                .orElse(false);
    }

    private boolean canAccessCompanyLevelEntity() {
        return authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("HR_MANAGER")
                || authenticatedUserProvider.hasRole("DISPATCHER");
    }

    private boolean canReadWarehouseById(Long warehouseId) {
        if (warehouseId == null) {
            return false;
        }

        if (warehouseAccessGuard.canReadAllWarehouses()) {
            return true;
        }

        List<Long> assignedWarehouseIds = warehouseAccessGuard.assignedWarehouseIdsForScopedUser();
        return assignedWarehouseIds != null && assignedWarehouseIds.contains(warehouseId);
    }

    private boolean canAccessWarehouseInventory(ChangeHistory changeHistory, Long companyId) {
        String identifier = changeHistory.getEntityIdentifier();

        if (identifier != null) {
            Long warehouseId = extractIdentifierPart(identifier, "warehouseId");
            Long productId = extractIdentifierPart(identifier, "productId");

            if (warehouseId != null && productId != null) {
                return warehouseInventoryRepository.findByWarehouse_IdAndProduct_IdAndWarehouse_Company_Id(warehouseId, productId, companyId)
                        .map(inventory -> canReadWarehouseById(inventory.getWarehouse() != null ? inventory.getWarehouse().getId() : null))
                        .orElse(false);
            }

            if (warehouseId != null) {
                return warehouseRepository.findByIdAndCompany_Id(warehouseId, companyId)
                        .map(warehouse -> canReadWarehouseById(warehouse.getId()))
                        .orElse(false);
            }
        }

        return changeHistory.getEntityId() != null
                && warehouseRepository.findByIdAndCompany_Id(changeHistory.getEntityId(), companyId)
                .map(warehouse -> canReadWarehouseById(warehouse.getId()))
                .orElse(false);
    }

    private Long extractIdentifierPart(String identifier, String key) {
        String prefix = key + "=";
        for (String part : identifier.split(",")) {
            String trimmed = part.trim();
            if (trimmed.startsWith(prefix)) {
                try {
                    return Long.valueOf(trimmed.substring(prefix.length()).trim());
                } catch (NumberFormatException ex) {
                    return null;
                }
            }
        }
        return null;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}