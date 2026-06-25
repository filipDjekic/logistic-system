package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.service.implementation.dashboard.cache.DashboardResponseCache;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.dashboard.OverlordDashboardResponse;
import rs.logistics.logistics_system.entity.ActivityLog;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.repository.ActivityLogRepository;
import rs.logistics.logistics_system.repository.ChangeHistoryRepository;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ProductRepository;
import rs.logistics.logistics_system.repository.StockMovementRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseInventoryRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.service.definition.dashboard.OverlordDashboardServiceDefinition;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OverlordDashboardService implements OverlordDashboardServiceDefinition {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
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
    private final DashboardResponseCache dashboardResponseCache;

    @Override
    @Transactional(readOnly = true)
    public OverlordDashboardResponse getOverview() {
        return dashboardResponseCache.get("overlord", this::buildOverview);
    }

    private OverlordDashboardResponse buildOverview() {
        Map<String, Long> usersByStatus = countUsersByStatus();
        Map<String, Long> transportOrdersByStatus = countTransportOrdersByStatus();
        Map<String, Long> tasksByStatus = countTasksByStatus();
        Map<String, Long> vehiclesByStatus = countVehiclesByStatus();
        long lowStockRowsTotal = warehouseInventoryRepository.countLowStockRows();

        return new OverlordDashboardResponse(
                companyRepository.count(),
                companyRepository.countByActiveTrue(),
                userRepository.count(),
                usersByStatus,
                employeeRepository.count(),
                employeeRepository.countByActiveTrue(),
                transportOrderRepository.count(),
                transportOrdersByStatus,
                taskRepository.count(),
                tasksByStatus,
                vehicleRepository.count(),
                vehiclesByStatus,
                warehouseRepository.count(),
                productRepository.count(),
                warehouseInventoryRepository.count(),
                lowStockRowsTotal,
                safeBigDecimal(warehouseInventoryRepository.sumQuantity()),
                safeBigDecimal(warehouseInventoryRepository.sumAvailableQuantity()),
                safeBigDecimal(warehouseInventoryRepository.sumTotalValue()),
                stockMovementRepository.count(),
                activityLogRepository.count(),
                changeHistoryRepository.count(),
                recentActivities(),
                List.of(
                        DashboardResponseFactory.statusChart("usersByStatus", "Users by status", usersByStatus),
                        DashboardResponseFactory.statusChart("transportOrdersByStatus", "Transport orders by status", transportOrdersByStatus),
                        DashboardResponseFactory.statusChart("tasksByStatus", "Tasks by status", tasksByStatus),
                        DashboardResponseFactory.statusChart("vehiclesByStatus", "Vehicles by status", vehiclesByStatus)
                ),
                List.of(
                        DashboardResponseFactory.lowStockAlert(lowStockRowsTotal),
                        DashboardResponseFactory.alert("INFO", "SYSTEM_ACTIVITY", "Activity logs", "System-wide activity log rows available for audit review.", activityLogRepository.count())
                )
        );
    }

    private Map<String, Long> countUsersByStatus() {
        Map<String, Long> result = emptyEnumMap(UserStatus.values());
        userRepository.countGroupedByStatus().forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private Map<String, Long> countTransportOrdersByStatus() {
        Map<String, Long> result = emptyEnumMap(TransportOrderStatus.values());
        transportOrderRepository.countGroupedByStatus().forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private Map<String, Long> countTasksByStatus() {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        taskRepository.countGroupedByStatus().forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private Map<String, Long> countVehiclesByStatus() {
        Map<String, Long> result = emptyEnumMap(VehicleStatus.values());
        vehicleRepository.countGroupedByStatus().forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
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

    private List<OverlordDashboardResponse.RecentActivityResponse> recentActivities() {
        return activityLogRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toRecentActivity)
                .toList();
    }

    private OverlordDashboardResponse.RecentActivityResponse toRecentActivity(ActivityLog activityLog) {
        User user = activityLog.getUser();
        return new OverlordDashboardResponse.RecentActivityResponse(
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
