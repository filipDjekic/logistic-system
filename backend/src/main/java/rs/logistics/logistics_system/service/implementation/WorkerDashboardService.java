package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.WorkerDashboardResponse;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.entity.StockMovement;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.ShiftStatus;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.WorkerDashboardServiceDefinition;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkerDashboardService implements WorkerDashboardServiceDefinition {

    private static final List<TaskStatus> OPEN_TASK_STATUSES = List.of(
            TaskStatus.NEW,
            TaskStatus.IN_PROGRESS
    );

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final EmployeeRepository employeeRepository;
    private final TaskRepository taskRepository;
    private final ShiftRepository shiftRepository;

    @Override
    @Transactional(readOnly = true)
    public WorkerDashboardResponse getOverview() {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Long companyId = authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        Employee worker = employeeRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user is not linked to an employee"));

        if (worker.getPosition() != EmployeePosition.WORKER) {
            throw new ForbiddenException("Only workers can access worker dashboard");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        List<Task> assignedTasks = taskRepository
                .findByAssignedEmployeeIdAndAssignedEmployee_Company_Id(worker.getId(), companyId);
        List<Shift> shifts = shiftRepository
                .findByEmployeeIdAndEmployee_Company_Id(worker.getId(), companyId);

        List<Task> openTasks = assignedTasks.stream()
                .filter(task -> OPEN_TASK_STATUSES.contains(task.getStatus()))
                .sorted(taskComparator())
                .toList();

        List<Task> todayTasks = assignedTasks.stream()
                .filter(task -> isTodayTask(task, startOfDay, endOfDay))
                .sorted(taskComparator())
                .toList();

        WorkerDashboardResponse.WorkerShiftResponse currentShift = shifts.stream()
                .filter(shift -> shift.getStatus() == ShiftStatus.ACTIVE)
                .filter(shift -> !shift.getStartTime().isAfter(now) && shift.getEndTime().isAfter(now))
                .min(Comparator.comparing(Shift::getStartTime))
                .map(this::mapShift)
                .orElse(null);

        WorkerDashboardResponse.WorkerShiftResponse nextShift = shifts.stream()
                .filter(shift -> shift.getStatus() == ShiftStatus.PLANNED || shift.getStatus() == ShiftStatus.ACTIVE)
                .filter(shift -> shift.getStartTime().isAfter(now))
                .min(Comparator.comparing(Shift::getStartTime))
                .map(this::mapShift)
                .orElse(null);

        return new WorkerDashboardResponse(
                openTasks.size(),
                todayTasks.size(),
                countTasksByStatus(assignedTasks),
                countTasksByType(assignedTasks),
                currentShift,
                nextShift,
                openTasks.stream().limit(10).map(this::mapTask).toList(),
                todayTasks.stream().limit(10).map(this::mapTask).toList()
        );
    }

    private boolean isTodayTask(Task task, LocalDateTime startOfDay, LocalDateTime endOfDay) {
        if (task.getDueDate() == null) {
            return false;
        }

        return !task.getDueDate().isBefore(startOfDay) && task.getDueDate().isBefore(endOfDay);
    }

    private Comparator<Task> taskComparator() {
        return Comparator
                .comparing((Task task) -> task.getDueDate() == null ? LocalDateTime.MAX : task.getDueDate())
                .thenComparing(task -> task.getCreatedAt() == null ? LocalDateTime.MAX : task.getCreatedAt())
                .thenComparing(Task::getId);
    }

    private Map<String, Long> countTasksByStatus(List<Task> tasks) {
        Map<String, Long> result = emptyEnumMap(TaskStatus.values());
        tasks.stream()
                .collect(Collectors.groupingBy(Task::getStatus, Collectors.counting()))
                .forEach((status, count) -> result.put(status.name(), count));
        return result;
    }

    private Map<String, Long> countTasksByType(List<Task> tasks) {
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("LOADING", 0L);
        result.put("UNLOADING", 0L);
        result.put("WAREHOUSE", 0L);
        result.put("TRANSPORT", 0L);
        result.put("OTHER", 0L);

        tasks.stream()
                .collect(Collectors.groupingBy(this::resolveTaskType, Collectors.counting()))
                .forEach(result::put);
        return result;
    }

    private WorkerDashboardResponse.WorkerTaskResponse mapTask(Task task) {
        StockMovement stockMovement = task.getStockMovement();
        TransportOrder transportOrder = task.getTransportOrder();

        return new WorkerDashboardResponse.WorkerTaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority().name(),
                task.getStatus().name(),
                resolveTaskType(task),
                task.getDueDate(),
                stockMovement == null ? null : stockMovement.getId(),
                stockMovement == null ? null : stockMovement.getMovementType().name(),
                stockMovement == null || stockMovement.getWarehouse() == null ? null : stockMovement.getWarehouse().getId(),
                stockMovement == null || stockMovement.getWarehouse() == null ? null : stockMovement.getWarehouse().getName(),
                stockMovement == null || stockMovement.getProduct() == null ? null : stockMovement.getProduct().getId(),
                stockMovement == null || stockMovement.getProduct() == null ? null : stockMovement.getProduct().getName(),
                transportOrder == null ? null : transportOrder.getId(),
                transportOrder == null ? null : transportOrder.getOrderNumber()
        );
    }

    private String resolveTaskType(Task task) {
        StockMovement stockMovement = task.getStockMovement();
        if (stockMovement != null) {
            StockMovementType movementType = stockMovement.getMovementType();
            if (movementType == StockMovementType.TRANSFER_OUT || movementType == StockMovementType.OUTBOUND) {
                return "LOADING";
            }
            if (movementType == StockMovementType.TRANSFER_IN || movementType == StockMovementType.INBOUND) {
                return "UNLOADING";
            }
            return "WAREHOUSE";
        }

        if (task.getTransportOrder() != null) {
            return "TRANSPORT";
        }

        return "OTHER";
    }

    private WorkerDashboardResponse.WorkerShiftResponse mapShift(Shift shift) {
        return new WorkerDashboardResponse.WorkerShiftResponse(
                shift.getId(),
                shift.getStatus().name(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getNotes()
        );
    }

    private Map<String, Long> emptyEnumMap(Enum<?>[] values) {
        Map<String, Long> result = new LinkedHashMap<>();
        Arrays.stream(values).forEach(value -> result.put(value.name(), 0L));
        return result;
    }
}
