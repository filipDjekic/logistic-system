package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.dashboard.CompanyAdminDashboardResponse;
import rs.logistics.logistics_system.entity.ActivityLog;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.repository.ActivityLogRepository;
import rs.logistics.logistics_system.repository.ChangeHistoryRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.dashboard.CompanyAdminDashboardServiceDefinition;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CompanyAdminDashboardService implements CompanyAdminDashboardServiceDefinition {

    private static final List<TransportOrderStatus> ACTIVE_TRANSPORT_STATUSES = List.of(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.IN_TRANSIT
    );

    private static final List<TaskStatus> OPEN_TASK_STATUSES = List.of(
            TaskStatus.NEW,
            TaskStatus.IN_PROGRESS
    );

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final EmployeeRepository employeeRepository;
    private final TransportOrderRepository transportOrderRepository;
    private final TaskRepository taskRepository;
    private final VehicleRepository vehicleRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final WarehouseInventoryRepository warehouseInventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ChangeHistoryRepository changeHistoryRepository;

    @Override
    @Transactional(readOnly = true)
    public CompanyAdminDashboardResponse getOverview() {
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        return new CompanyAdminDashboardResponse(
                employeeRepository.countByCompany_Id(companyId),
                employeeRepository.countByCompany_IdAndActiveTrue(companyId),
                transportOrderRepository.countByCreatedBy_Company_Id(companyId),
                transportOrderRepository.countByCreatedBy_Company_IdAndStatusIn(companyId, ACTIVE_TRANSPORT_STATUSES),
                countTransportOrdersByStatus(companyId),
                taskRepository.findAllByAssignedEmployee_Company_Id(companyId).size(),
                countOpenTasks(companyId),
                countTasksByStatus(companyId),
                vehicleRepository.countByCompany_Id(companyId),
                countVehiclesByStatus(companyId),
                warehouseRepository.countByCompany_Id(companyId),
                productRepository.countByCompany_Id(companyId),
                warehouseInventoryRepository.countByWarehouse_Company_Id(companyId),
                warehouseInventoryRepository.countLowStockRowsByCompanyId(companyId),
                safeBigDecimal(warehouseInventoryRepository.sumQuantityByCompanyId(companyId)),
                safeBigDecimal(warehouseInventoryRepository.sumAvailableQuantityByCompanyId(companyId)),
                stockMovementRepository.countByWarehouse_Company_Id(companyId),
                activityLogRepository.countByUser_Company_Id(companyId),
                changeHistoryRepository.countByChangedBy_Company_Id(companyId),
                recentActivities(companyId)
        );
    }

    private Map<String, Long> countTransportOrdersByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(TransportOrderStatus.values());
        transportOrderRepository.countGroupedByStatusAndCompanyId(companyId)
                .forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private long countOpenTasks(Long companyId) {
        return taskRepository.findAllByAssignedEmployee_Company_Id(companyId)
                .stream()
                .filter(task -> OPEN_TASK_STATUSES.contains(task.getStatus()))
                .count();
    }

    private Map<String, Long> countTasksByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        taskRepository.findAllByAssignedEmployee_Company_Id(companyId)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(task -> task.getStatus(), java.util.stream.Collectors.counting()))
                .forEach((status, count) -> result.put(status.name(), count));
        return result;
    }

    private Map<String, Long> countVehiclesByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(VehicleStatus.values());
        vehicleRepository.countGroupedByStatusAndCompanyId(companyId)
                .forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private Map<String, Long> emptyEnumMap(Enum<?>[] values) {
        Map<String, Long> result = new LinkedHashMap<>();
        Arrays.stream(values).forEach(value -> result.put(value.name(), 0L));
        return result;
    }

    private BigDecimal safeBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private List<CompanyAdminDashboardResponse.RecentActivityResponse> recentActivities(Long companyId) {
        return activityLogRepository.findTop10ByUser_Company_IdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(this::toRecentActivity)
                .toList();
    }

    private CompanyAdminDashboardResponse.RecentActivityResponse toRecentActivity(ActivityLog activityLog) {
        User user = activityLog.getUser();
        return new CompanyAdminDashboardResponse.RecentActivityResponse(
                activityLog.getId(),
                activityLog.getAction(),
                activityLog.getEntityName(),
                activityLog.getEntityId(),
                activityLog.getEntityIdentifier(),
                activityLog.getDescription(),
                activityLog.getCreatedAt(),
                user == null ? null : user.getId(),
                user == null ? null : user.getEmail()
        );
    }
}
