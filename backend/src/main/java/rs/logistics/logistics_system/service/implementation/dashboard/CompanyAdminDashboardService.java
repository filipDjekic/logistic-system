package rs.logistics.logistics_system.service.implementation.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.service.implementation.dashboard.cache.DashboardResponseCache;
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
    private final DashboardResponseCache dashboardResponseCache;

    @Override
    @Transactional(readOnly = true)
    public CompanyAdminDashboardResponse getOverview() {
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        return dashboardResponseCache.get("company-admin:" + companyId, () -> buildOverview(companyId));
    }

    private CompanyAdminDashboardResponse buildOverview(Long companyId) {
        long activeTransportOrders = transportOrderRepository.countByCreatedBy_Company_IdAndStatusIn(companyId, ACTIVE_TRANSPORT_STATUSES);
        Map<String, Long> transportOrdersByStatus = countTransportOrdersByStatus(companyId);
        long openTasksTotal = countOpenTasks(companyId);
        Map<String, Long> tasksByStatus = countTasksByStatus(companyId);
        Map<String, Long> vehiclesByStatus = countVehiclesByStatus(companyId);
        long lowStockRowsTotal = warehouseInventoryRepository.countLowStockRowsByCompanyId(companyId);

        return new CompanyAdminDashboardResponse(
                employeeRepository.countByCompany_Id(companyId),
                employeeRepository.countByCompany_IdAndActiveTrue(companyId),
                transportOrderRepository.countByCreatedBy_Company_Id(companyId),
                activeTransportOrders,
                transportOrdersByStatus,
                taskRepository.countByAssignedEmployee_Company_Id(companyId),
                openTasksTotal,
                tasksByStatus,
                vehicleRepository.countByCompany_Id(companyId),
                vehiclesByStatus,
                warehouseRepository.countByCompany_Id(companyId),
                productRepository.countByCompany_Id(companyId),
                warehouseInventoryRepository.countByWarehouse_Company_Id(companyId),
                lowStockRowsTotal,
                safeBigDecimal(warehouseInventoryRepository.sumQuantityByCompanyId(companyId)),
                safeBigDecimal(warehouseInventoryRepository.sumAvailableQuantityByCompanyId(companyId)),
                safeBigDecimal(warehouseInventoryRepository.sumTotalValueByCompanyId(companyId)),
                stockMovementRepository.countByWarehouse_Company_Id(companyId),
                activityLogRepository.countByUser_Company_Id(companyId),
                changeHistoryRepository.countByChangedBy_Company_Id(companyId),
                recentActivities(companyId),
                List.of(
                        DashboardResponseFactory.statusChart("transportOrdersByStatus", "Transport orders by status", transportOrdersByStatus),
                        DashboardResponseFactory.statusChart("tasksByStatus", "Tasks by status", tasksByStatus),
                        DashboardResponseFactory.statusChart("vehiclesByStatus", "Vehicles by status", vehiclesByStatus),
                        DashboardResponseFactory.comparisonChart("inventoryHealth", "Inventory health", "Low stock", lowStockRowsTotal, "Available rows", Math.max(warehouseInventoryRepository.countByWarehouse_Company_Id(companyId) - lowStockRowsTotal, 0))
                ),
                List.of(
                        DashboardResponseFactory.activeTransportsAlert(activeTransportOrders),
                        DashboardResponseFactory.openTasksAlert(openTasksTotal),
                        DashboardResponseFactory.lowStockAlert(lowStockRowsTotal)
                )
        );
    }

    private Map<String, Long> countTransportOrdersByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(TransportOrderStatus.values());
        transportOrderRepository.countGroupedByStatusAndCompanyId(companyId)
                .forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
        return result;
    }

    private long countOpenTasks(Long companyId) {
        return taskRepository.countByAssignedEmployee_Company_IdAndStatusIn(companyId, OPEN_TASK_STATUSES);
    }

    private Map<String, Long> countTasksByStatus(Long companyId) {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        taskRepository.countGroupedByStatusAndCompanyId(companyId)
                .forEach(row -> result.put(String.valueOf(row[0]), (Long) row[1]));
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
