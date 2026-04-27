package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
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
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderItemRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
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
    private final TaskRepository taskRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final TransportOrderItemRepository transportOrderItemRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final NotificationRepository notificationRepository;

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
                trimToNull(search),
                changeType,
                trimToNull(entityName),
                entityId,
                userId,
                pageable
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
        List<ChangeHistory> data = _changeHistoryRepository.findByEntityName(entityName);
        return toAccessibleResponses(data);
    }

    @Override
    public List<ChangeHistoryResponse> getByEntityId(Long entityId) {
        List<ChangeHistory> data = _changeHistoryRepository.findByEntityId(entityId);
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
        List<ChangeHistory> data = _changeHistoryRepository.findAll();
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
            case "COMPANY" -> companyRepository.findById(entityId)
                    .map(company -> company.getId().equals(companyId))
                    .orElse(false);

            case "USER" -> userRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();

            case "EMPLOYEE" -> employeeRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();

            case "VEHICLE" -> vehicleRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();

            case "WAREHOUSE" -> warehouseRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();

            case "PRODUCT" -> productRepository.findByIdAndCompany_Id(entityId, companyId).isPresent();

            case "SHIFT" -> shiftRepository.findByIdAndEmployee_Company_Id(entityId, companyId).isPresent();

            case "STOCK_MOVEMENT" -> stockMovementRepository.findByIdAndWarehouse_Company_Id(entityId, companyId).isPresent();

            case "TASK" -> taskRepository.findByIdAndAssignedEmployee_Company_Id(entityId, companyId)
                    .map(task -> {
                        if (authenticatedUserProvider.isCompanyAdmin()
                                || authenticatedUserProvider.hasRole("HR_MANAGER")
                                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                                || authenticatedUserProvider.hasRole("DISPATCHER")) {
                            return true;
                        }

                        Long assignedUserId = task.getAssignedEmployee() != null && task.getAssignedEmployee().getUser() != null
                                ? task.getAssignedEmployee().getUser().getId()
                                : null;

                        return assignedUserId != null && assignedUserId.equals(currentUserId);
                    })
                    .orElse(false);

            case "TRANSPORT_ORDER" -> transportOrderRepository.findByIdAndCreatedBy_Company_Id(entityId, companyId)
                    .map(transportOrder -> {
                        if (authenticatedUserProvider.isCompanyAdmin()
                                || authenticatedUserProvider.hasRole("DISPATCHER")) {
                            return true;
                        }

                        Long assignedUserId = transportOrder.getAssignedEmployee() != null
                                && transportOrder.getAssignedEmployee().getUser() != null
                                ? transportOrder.getAssignedEmployee().getUser().getId()
                                : null;

                        return assignedUserId != null && assignedUserId.equals(currentUserId);
                    })
                    .orElse(false);

            case "TRANSPORT_ORDER_ITEM" -> transportOrderItemRepository.findByIdAndTransportOrder_CreatedBy_Company_Id(entityId, companyId)
                    .map(item -> {
                        if (authenticatedUserProvider.isCompanyAdmin()
                                || authenticatedUserProvider.hasRole("DISPATCHER")) {
                            return true;
                        }

                        Long assignedUserId = item.getTransportOrder() != null
                                && item.getTransportOrder().getAssignedEmployee() != null
                                && item.getTransportOrder().getAssignedEmployee().getUser() != null
                                ? item.getTransportOrder().getAssignedEmployee().getUser().getId()
                                : null;

                        return assignedUserId != null && assignedUserId.equals(currentUserId);
                    })
                    .orElse(false);

            case "WAREHOUSE_INVENTORY" -> warehouseRepository.findByIdAndCompany_Id(entityId, companyId).isPresent()
                    || warehouseInventoryRepository.findByWarehouse_IdAndWarehouse_Company_Id(entityId, companyId)
                    .stream()
                    .findAny()
                    .isPresent();

            case "NOTIFICATION" -> notificationRepository.findByIdAndUser_Company_Id(entityId, companyId)
                    .map(notification -> notification.getUser() != null && notification.getUser().getId().equals(currentUserId))
                    .orElse(false);

            default -> changeHistory.getChangedBy() != null
                    && changeHistory.getChangedBy().getCompany() != null
                    && companyId.equals(changeHistory.getChangedBy().getCompany().getId());
        };
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}