package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.StockTransferCreate;
import rs.logistics.logistics_system.config.AppProperties;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.TransportOrderItem;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.NotificationType;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TaskType;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.TransportOrderItemRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.VehicleMaintenanceRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.definition.TaskServiceDefinition;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.service.definition.DriverWorkloadServiceDefinition;
import rs.logistics.logistics_system.service.definition.TransportOrderServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;

@Service
@RequiredArgsConstructor
public class TransportOrderService implements TransportOrderServiceDefinition {

    private final TransportOrderRepository _transportOrderRepository;
    private final TransportOrderItemRepository transportOrderItemRepository;
    private final WarehouseRepository _warehouseRepository;
    private final VehicleRepository _vehicleRepository;
    private final EmployeeRepository _employeeRepository;
    private final VehicleMaintenanceRepository vehicleMaintenanceRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AppProperties appProperties;

    private static final List<TransportOrderStatus> SCHEDULE_BLOCKING_STATUSES = Arrays.asList(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.IN_TRANSIT,
            TransportOrderStatus.RETURNING,
            TransportOrderStatus.RESCHEDULED
    );
    private static final List<TransportOrderStatus> VEHICLE_RESERVED_STATUSES = Arrays.asList(
            TransportOrderStatus.ASSIGNED,
            TransportOrderStatus.PICKING,
            TransportOrderStatus.PACKING,
            TransportOrderStatus.READY_FOR_LOADING,
            TransportOrderStatus.LOADING,
            TransportOrderStatus.RESCHEDULED
    );
    private static final List<TransportOrderStatus> VEHICLE_BUSY_STATUSES = Arrays.asList(TransportOrderStatus.IN_TRANSIT, TransportOrderStatus.RETURNING);
    private static final Set<TransportOrderStatus> TERMINAL_STATUSES = Set.of(TransportOrderStatus.DELIVERED, TransportOrderStatus.FAILED, TransportOrderStatus.CANCELLED);

    private final NotificationServiceDefinition notificationService;
    private final StockMovementServiceDefinition stockMovementService;
    private final WarehouseInventoryServiceDefinition warehouseInventoryService;
    private final TimeServiceDefinition timeService;
    private final TaskServiceDefinition taskService;
    private final DriverWorkloadServiceDefinition driverWorkloadService;
    private final AuditFacadeDefinition auditFacade;

    @Override
    @Transactional
    public TransportOrderResponse create(TransportOrderCreate dto) {
        validateCreateOrUpdateRequest(dto);
        validateUniqueOrderNumber(dto.getOrderNumber());

        Warehouse warehouseSource = getAccessibleWarehouse(dto.getSourceWarehouseId(), "Source warehouse not found");
        Warehouse warehouseDestination = getAccessibleWarehouse(dto.getDestinationWarehouseId(), "Destination warehouse not found");
        Vehicle vehicle = getAccessibleVehicle(dto.getVehicleId(), "Vehicle not found");
        Employee assignedEmployee = getAccessibleEmployee(dto.getAssignedEmployeeId(), "Assigned employee not found");
        User createdBy = authenticatedUserProvider.getAuthenticatedUser();

        validateCrossCompanyContext(warehouseSource, warehouseDestination, vehicle, assignedEmployee, createdBy);
        validateSchedule(dto.getDepartureTime(), dto.getPlannedArrivalTime());
        validateWarehouses(warehouseSource, warehouseDestination);
        validateAssignedEmployee(assignedEmployee);
        validateVehicleForAssignment(vehicle);
        checkVehicleAvailability(vehicle.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime());
        checkVehicleMaintenanceAvailability(vehicle.getId(), dto.getPlannedArrivalTime());
        checkDriverAvailability(assignedEmployee.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime());
        driverWorkloadService.validateDriverCanTakeTransport(assignedEmployee.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime(), null);

        TransportOrder transportOrder = TransportOrderMapper.toEntity(
                dto,
                warehouseSource,
                warehouseDestination,
                vehicle,
                assignedEmployee,
                createdBy
        );
        transportOrder.setStatus(TransportOrderStatus.DRAFT);

        transportOrder.recalculateTotalWeight();
        validateTransportOrderWeightAgainstVehicleCapacity(transportOrder);

        TransportOrder saved = _transportOrderRepository.save(transportOrder);

        auditFacade.recordCreate("TRANSPORT_ORDER", saved.getId());
        auditFacade.log(
                "CREATE",
                "TRANSPORT_ORDER",
                saved.getId(),
                "Transport order created (ID: " + saved.getId() + ")"
        );

        createOperationalTaskForNewTransportOrder(saved);

        return TransportOrderMapper.toResponse(saved, timeService);
    }

    @Transactional
    @Override
    public TransportOrderResponse update(Long id, TransportOrderUpdate dto) {
        if (dto.getVehicleId() == null || dto.getAssignedEmployeeId() == null || dto.getSourceWarehouseId() == null || dto.getDestinationWarehouseId() == null) {
            throw new BadRequestException("Invalid request");
        }

        TransportOrder transportOrder = getTransportOrderOrThrow(id);

        validateUniqueOrderNumberForUpdate(transportOrder.getId(), dto.getOrderNumber());

        if (transportOrder.getStatus() == TransportOrderStatus.IN_TRANSIT || transportOrder.getStatus() == TransportOrderStatus.RETURNING || TERMINAL_STATUSES.contains(transportOrder.getStatus())) {
            throw new BadRequestException("Transport order cannot be updated in current status");
        }

        if (!isInitialStatus(transportOrder.getStatus())) {
            if (!dto.getSourceWarehouseId().equals(transportOrder.getSourceWarehouse().getId())) {
                throw new BadRequestException("Source warehouse cannot be changed once transport order is no longer in DRAFT/CREATED status");
            }

            if (!dto.getDestinationWarehouseId().equals(transportOrder.getDestinationWarehouse().getId())) {
                throw new BadRequestException("Destination warehouse cannot be changed once transport order is no longer in DRAFT/CREATED status");
            }
        }

        if (hasTransportItems(transportOrder)
                && (!dto.getSourceWarehouseId().equals(transportOrder.getSourceWarehouse().getId())
                    || !dto.getDestinationWarehouseId().equals(transportOrder.getDestinationWarehouse().getId()))) {
            throw new BadRequestException("Warehouses cannot be changed while transport order has reserved items");
        }

        Warehouse warehouseSource = getAccessibleWarehouse(dto.getSourceWarehouseId(), "Source warehouse not found");
        Warehouse warehouseDestination = getAccessibleWarehouse(dto.getDestinationWarehouseId(), "Destination warehouse not found");
        Vehicle vehicle = getAccessibleVehicle(dto.getVehicleId(), "Vehicle not found");
        Employee assignedEmployee = getAccessibleEmployee(dto.getAssignedEmployeeId(), "Assigned employee not found");

        validateCrossCompanyContext(warehouseSource, warehouseDestination, vehicle, assignedEmployee, transportOrder.getCreatedBy());
        validateSchedule(dto.getDepartureTime(), dto.getPlannedArrivalTime());
        validateWarehouses(warehouseSource, warehouseDestination);
        validateAssignedEmployee(assignedEmployee);

        if (!dto.getVehicleId().equals(transportOrder.getVehicle().getId())) {
            validateVehicleForAssignment(vehicle);
        }

        checkVehicleAvailabilityForUpdate(vehicle.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime(), transportOrder.getId());
        checkVehicleMaintenanceAvailability(vehicle.getId(), dto.getPlannedArrivalTime());
        checkDriverAvailabilityForUpdate(assignedEmployee.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime(), transportOrder.getId());
        driverWorkloadService.validateDriverCanTakeTransport(assignedEmployee.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime(), transportOrder.getId());

        Vehicle previousVehicle = transportOrder.getVehicle();
        Employee previousEmployee = transportOrder.getAssignedEmployee();

        Long oldAssignedEmployeeId = transportOrder.getAssignedEmployee() != null ? transportOrder.getAssignedEmployee().getId() : null;
        Long oldVehicleId = transportOrder.getVehicle() != null ? transportOrder.getVehicle().getId() : null;
        Long oldSourceWarehouseId = transportOrder.getSourceWarehouse() != null ? transportOrder.getSourceWarehouse().getId() : null;
        Long oldDestinationWarehouseId = transportOrder.getDestinationWarehouse() != null ? transportOrder.getDestinationWarehouse().getId() : null;
        LocalDateTime oldDepartureTime = transportOrder.getDepartureTime();
        LocalDateTime oldPlannedArrivalTime = transportOrder.getPlannedArrivalTime();

        TransportOrderMapper.updateEntity(
                dto,
                transportOrder,
                warehouseSource,
                warehouseDestination,
                vehicle,
                assignedEmployee
        );

        transportOrder.recalculateTotalWeight();
        validateTransportOrderWeightAgainstVehicleCapacity(transportOrder);

        TransportOrder updated = _transportOrderRepository.save(transportOrder);

        auditFacade.recordFieldChange("TRANSPORT_ORDER", updated.getId(), "assignedEmployee", oldAssignedEmployeeId, updated.getAssignedEmployee() != null ? updated.getAssignedEmployee().getId() : null);
        auditFacade.recordFieldChange("TRANSPORT_ORDER", updated.getId(), "vehicle", oldVehicleId, updated.getVehicle() != null ? updated.getVehicle().getId() : null);
        auditFacade.recordFieldChange("TRANSPORT_ORDER", updated.getId(), "sourceWarehouse", oldSourceWarehouseId, updated.getSourceWarehouse() != null ? updated.getSourceWarehouse().getId() : null);
        auditFacade.recordFieldChange("TRANSPORT_ORDER", updated.getId(), "destinationWarehouse", oldDestinationWarehouseId, updated.getDestinationWarehouse() != null ? updated.getDestinationWarehouse().getId() : null);
        auditFacade.recordFieldChange("TRANSPORT_ORDER", updated.getId(), "departureTime", oldDepartureTime, updated.getDepartureTime());
        auditFacade.recordFieldChange("TRANSPORT_ORDER", updated.getId(), "plannedArrivalTime", oldPlannedArrivalTime, updated.getPlannedArrivalTime());

        if (previousVehicle != null && !previousVehicle.getId().equals(updated.getVehicle().getId())) {
            refreshVehicleAvailability(previousVehicle.getId());
        }

        if (updated.getStatus() == TransportOrderStatus.ASSIGNED) {
            markVehicleAsReserved(updated.getVehicle());
        }

        if (previousEmployee != null
                && previousEmployee.getUser() != null
                && !previousEmployee.getId().equals(updated.getAssignedEmployee().getId())) {
            notifyOnce(
                    new HashSet<>(),
                    previousEmployee.getUser().getId(),
                    "Transport reassigned",
                    "Transport order #" + updated.getId() + " is no longer assigned to you.",
                    NotificationType.WARNING
            );
        }

        if (updated.getAssignedEmployee() != null
                && updated.getAssignedEmployee().getUser() != null
                && (previousEmployee == null || !previousEmployee.getId().equals(updated.getAssignedEmployee().getId()))) {
            notifyOnce(
                    new HashSet<>(),
                    updated.getAssignedEmployee().getUser().getId(),
                    "Transport assigned",
                    "Transport order #" + updated.getId() + " has been assigned to you.",
                    NotificationType.INFO
            );
        }

        auditFacade.log(
                "UPDATE",
                "TRANSPORT_ORDER",
                updated.getId(),
                "Transport order updated (ID: " + updated.getId() + ")"
        );

        return TransportOrderMapper.toResponse(updated, timeService);
    }

    @Override
    public TransportOrderResponse getById(Long id) {
        return TransportOrderMapper.toResponse(getTransportOrderOrThrow(id), timeService);
    }

    @Override
    public PageResponse<TransportOrderResponse> getAll(Pageable pageable) {
        return getAll(null, null, null, null, null, null, null, null, null, pageable);
    }

    @Override
    public PageResponse<TransportOrderResponse> getAll(
            TransportOrderStatus status,
            PriorityLevel priority,
            Long sourceWarehouseId,
            Long destinationWarehouseId,
            Long vehicleId,
            Long assignedEmployeeId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String search,
            Pageable pageable
    ) {
        Long companyId = authenticatedUserProvider.isOverlord()
                ? null
                : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();

        Long driverUserId = authenticatedUserProvider.hasRole("DRIVER")
                ? authenticatedUserProvider.getAuthenticatedUserId()
                : null;

        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();

        return PageResponse.from(_transportOrderRepository.searchTransportOrders(
                companyId,
                driverUserId,
                status,
                priority,
                sourceWarehouseId,
                destinationWarehouseId,
                vehicleId,
                assignedEmployeeId,
                fromDate,
                toDate,
                normalizedSearch,
                pageable
        ).map(order -> TransportOrderMapper.toResponse(order, timeService)));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TransportOrder transportOrder = getTransportOrderOrThrow(id);

        if (!isInitialStatus(transportOrder.getStatus())) {
            throw new BadRequestException("Only transport orders in DRAFT/CREATED status can be deleted");
        }

        releaseInventoryForOrder(transportOrder);

        _transportOrderRepository.delete(transportOrder);

        auditFacade.recordDelete("TRANSPORT_ORDER", id);
        auditFacade.log(
                "DELETE",
                "TRANSPORT_ORDER",
                id,
                "Transport order deleted (ID: " + id + ")"
        );
    }

    @Override
    @Transactional
    public TransportOrderResponse changeStatus(Long id, TransportOrderStatus status) {
        TransportOrder transportOrder = getTransportOrderOrThrow(id);

        validateDriverStatusAccess(transportOrder, status);

        TransportOrderStatus current = transportOrder.getStatus();
        Set<Long> notifiedUserIds = new HashSet<>();

        if (status == null) {
            throw new BadRequestException("Transport order status is required");
        }

        if (current == status) {
            throw new BadRequestException("Transport order already has selected status");
        }

        validateStatusTransition(current, status);

        if (status == TransportOrderStatus.ASSIGNED) {
            validateOperationalWarehousesForExecution(transportOrder);

            transportOrder.recalculateTotalWeight();
            validateTransportOrderWeightAgainstVehicleCapacity(transportOrder);

            validateVehicleForAssignment(transportOrder.getVehicle());
            validateAssignedEmployee(transportOrder.getAssignedEmployee());

            checkVehicleAvailabilityForUpdate(
                    transportOrder.getVehicle().getId(),
                    transportOrder.getDepartureTime(),
                    transportOrder.getPlannedArrivalTime(),
                    transportOrder.getId()
            );
            checkVehicleMaintenanceAvailability(transportOrder.getVehicle().getId(), transportOrder.getPlannedArrivalTime());

            checkDriverAvailabilityForUpdate(
                    transportOrder.getAssignedEmployee().getId(),
                    transportOrder.getDepartureTime(),
                    transportOrder.getPlannedArrivalTime(),
                    transportOrder.getId()
            );
            driverWorkloadService.validateDriverCanTakeTransport(
                    transportOrder.getAssignedEmployee().getId(),
                    transportOrder.getDepartureTime(),
                    transportOrder.getPlannedArrivalTime(),
                    transportOrder.getId()
            );

            validateReservedInventoryForOrder(transportOrder);
            markVehicleAsReserved(transportOrder.getVehicle());

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport assigned",
                        "Transport order #" + transportOrder.getId() + " has been assigned to you.",
                        NotificationType.INFO
                );
            }
        }

        if (status == TransportOrderStatus.PICKING
                || status == TransportOrderStatus.PACKING
                || status == TransportOrderStatus.READY_FOR_LOADING
                || status == TransportOrderStatus.LOADING) {
            validateOperationalWarehousesForExecution(transportOrder);
            validateVehicleReservedForExecution(transportOrder);
            validateReservedInventoryForOrder(transportOrder);
            validateTransportOrderWeightAgainstVehicleCapacity(transportOrder);
            createWarehouseTaskForTransportPhase(transportOrder, status);
        }

        if (status == TransportOrderStatus.IN_TRANSIT) {
            validateOperationalWarehousesForExecution(transportOrder);

            transportOrder.recalculateTotalWeight();
            validateTransportOrderWeightAgainstVehicleCapacity(transportOrder);

            validateVehicleReservedForExecution(transportOrder);

            if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
                throw new BadRequestException("Transport order must contain at least one item before transport starts");
            }

            executeDispatchInventoryFlow(transportOrder);
            markVehicleAsInUse(transportOrder.getVehicle());

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport started",
                        "Transport order #" + transportOrder.getId() + " is now in transit.",
                        NotificationType.INFO
                );
            }
        }

        if (status == TransportOrderStatus.RETURNING) {
            if (transportOrder.getVehicle().getStatus() != VehicleStatus.IN_USE) {
                throw new BadRequestException("Only an IN_USE vehicle can start return flow");
            }
            markVehicleAsInUse(transportOrder.getVehicle());
        }

        if (status == TransportOrderStatus.RESCHEDULED) {
            if (!current.isBeforeDispatch()) {
                throw new BadRequestException("Only pre-dispatch transport can be rescheduled");
            }
            refreshVehicleAvailability(transportOrder.getVehicle().getId());
        }

        if (status == TransportOrderStatus.DELIVERED) {
            validateOperationalWarehousesForExecution(transportOrder);

            if (transportOrder.getVehicle().getStatus() != VehicleStatus.IN_USE) {
                throw new BadRequestException("Vehicle must be IN_USE before transport can be delivered");
            }

            executeDeliveryInventoryFlow(transportOrder);
            transportOrder.setActualArrivalTime(nowForTransportDestination(transportOrder));

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport delivered",
                        "Transport order #" + transportOrder.getId() + " has been successfully delivered.",
                        NotificationType.INFO
                );
            }

            if (transportOrder.getDestinationWarehouse() != null
                    && transportOrder.getDestinationWarehouse().getManager() != null
                    && transportOrder.getDestinationWarehouse().getManager().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getDestinationWarehouse().getManager().getUser().getId(),
                        "Incoming transport delivered",
                        "Transport order #" + transportOrder.getId() + " has arrived at warehouse '" + transportOrder.getDestinationWarehouse().getName() + "'.",
                        NotificationType.INFO
                );
            }
            createWarehouseTaskForTransportPhase(transportOrder, TransportOrderStatus.DELIVERED);
            taskService.closeTransportTasks(transportOrder.getId(), TaskStatus.COMPLETED);
        }

        if (status == TransportOrderStatus.FAILED) {
            if (transportOrder.getVehicle().getStatus() != VehicleStatus.IN_USE) {
                throw new BadRequestException("Only an IN_USE vehicle can be closed as failed transport");
            }

            executeFailedReturnInventoryFlow(transportOrder);
            transportOrder.setActualArrivalTime(nowForTransportSource(transportOrder));

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport failed",
                        "Transport order #" + transportOrder.getId() + " has been closed as failed.",
                        NotificationType.WARNING
                );
            }

            if (transportOrder.getSourceWarehouse() != null
                    && transportOrder.getSourceWarehouse().getManager() != null
                    && transportOrder.getSourceWarehouse().getManager().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getSourceWarehouse().getManager().getUser().getId(),
                        "Transport failed",
                        "Transport order #" + transportOrder.getId() + " from warehouse '" + transportOrder.getSourceWarehouse().getName() + "' has failed after dispatch.",
                        NotificationType.WARNING
                );
            }

            if (transportOrder.getDestinationWarehouse() != null
                    && transportOrder.getDestinationWarehouse().getManager() != null
                    && transportOrder.getDestinationWarehouse().getManager().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getDestinationWarehouse().getManager().getUser().getId(),
                        "Transport failed",
                        "Transport order #" + transportOrder.getId() + " to warehouse '" + transportOrder.getDestinationWarehouse().getName() + "' has failed before delivery.",
                        NotificationType.WARNING
                );
            }
        }

        if (status == TransportOrderStatus.CANCELLED) {
            if (current.isBeforeDispatch()) {
                releaseInventoryForOrder(transportOrder);
            }

            if (transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getAssignedEmployee().getUser().getId(),
                        "Transport cancelled",
                        "Transport order #" + transportOrder.getId() + " has been cancelled.",
                        NotificationType.WARNING
                );
            }

            if (transportOrder.getSourceWarehouse() != null
                    && transportOrder.getSourceWarehouse().getManager() != null
                    && transportOrder.getSourceWarehouse().getManager().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getSourceWarehouse().getManager().getUser().getId(),
                        "Transport cancelled",
                        "Transport order #" + transportOrder.getId() + " from warehouse '" + transportOrder.getSourceWarehouse().getName() + "' has been cancelled.",
                        NotificationType.WARNING
                );
            }

            if (transportOrder.getDestinationWarehouse() != null
                    && transportOrder.getDestinationWarehouse().getManager() != null
                    && transportOrder.getDestinationWarehouse().getManager().getUser() != null) {
                notifyOnce(
                        notifiedUserIds,
                        transportOrder.getDestinationWarehouse().getManager().getUser().getId(),
                        "Transport cancelled",
                        "Transport order #" + transportOrder.getId() + " to warehouse '" + transportOrder.getDestinationWarehouse().getName() + "' has been cancelled.",
                        NotificationType.WARNING
                );
            }
        }

        if (status == TransportOrderStatus.CANCELLED || status == TransportOrderStatus.FAILED) {
            taskService.closeTransportTasks(transportOrder.getId(), TaskStatus.CANCELLED);
        }

        transportOrder.setStatus(status);
        TransportOrder saved = _transportOrderRepository.save(transportOrder);

        if (TERMINAL_STATUSES.contains(saved.getStatus()) || saved.getStatus() == TransportOrderStatus.RESCHEDULED) {
            refreshVehicleAvailability(saved.getVehicle().getId());
        }

        auditFacade.recordStatusChange("TRANSPORT_ORDER", saved.getId(), "status", current, saved.getStatus());
        auditFacade.log(
                "STATUS_CHANGE",
                "TRANSPORT_ORDER",
                saved.getId(),
                "Transport order status changed from " + current + " to " + saved.getStatus() + " (ID: " + saved.getId() + ")"
        );

        return TransportOrderMapper.toResponse(saved, timeService);
    }

    // HELPERS



    private LocalDateTime nowForTransportSource(TransportOrder transportOrder) {
        return timeService.nowForWarehouse(transportOrder != null ? transportOrder.getSourceWarehouse() : null);
    }

    private LocalDateTime nowForTransportDestination(TransportOrder transportOrder) {
        return timeService.nowForWarehouse(transportOrder != null ? transportOrder.getDestinationWarehouse() : null);
    }
    private void createOperationalTaskForNewTransportOrder(TransportOrder transportOrder) {
        if (transportOrder.getAssignedEmployee() == null) {
            return;
        }

        LocalDateTime dueDate = transportOrder.getDepartureTime();
        LocalDateTime now = nowForTransportSource(transportOrder);
        if (dueDate == null || dueDate.isBefore(now)) {
            dueDate = transportOrder.getPlannedArrivalTime();
        }
        if (dueDate == null || dueDate.isBefore(now)) {
            dueDate = now.plusHours(1);
        }

        TaskCreate taskCreate = new TaskCreate(
                "Transport order " + transportOrder.getOrderNumber(),
                "Operational driving task generated automatically for transport order " + transportOrder.getOrderNumber() + ".",
                dueDate,
                TaskPriority.valueOf(transportOrder.getPriority().name()),
                transportOrder.getAssignedEmployee().getId(),
                transportOrder.getId(),
                null
        );
        taskCreate.setTaskType(TaskType.DRIVING);
        taskService.create(taskCreate);
    }

    private void createWarehouseTaskForTransportPhase(TransportOrder transportOrder, TransportOrderStatus phase) {
        Warehouse warehouse = phase == TransportOrderStatus.DELIVERED
                ? transportOrder.getDestinationWarehouse()
                : transportOrder.getSourceWarehouse();
        if (warehouse == null || warehouse.getManager() == null) {
            return;
        }
        TaskType taskType = switch (phase) {
            case PICKING -> TaskType.PICKING;
            case PACKING -> TaskType.PACKING;
            case LOADING, READY_FOR_LOADING -> TaskType.LOADING;
            case DELIVERED -> TaskType.UNLOADING;
            default -> null;
        };
        if (taskType == null) {
            return;
        }
        LocalDateTime now = phase == TransportOrderStatus.DELIVERED
                ? nowForTransportDestination(transportOrder)
                : nowForTransportSource(transportOrder);
        TaskCreate taskCreate = new TaskCreate(
                taskType + " for " + transportOrder.getOrderNumber(),
                "Automatically generated " + taskType + " task for transport order " + transportOrder.getOrderNumber() + ".",
                now.plusHours(1),
                TaskPriority.valueOf(transportOrder.getPriority().name()),
                warehouse.getManager().getId(),
                transportOrder.getId(),
                null
        );
        taskCreate.setTaskType(taskType);
        taskService.create(taskCreate);
    }

    private void validateCreateOrUpdateRequest(TransportOrderCreate dto) {
        if (dto.getVehicleId() == null || dto.getAssignedEmployeeId() == null || dto.getSourceWarehouseId() == null || dto.getDestinationWarehouseId() == null) {
            throw new BadRequestException("Invalid request");
        }
    }

    private void checkVehicleAvailability(Long vehicleId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime) {
        if (_transportOrderRepository.existsVehicleScheduleOverlap(
                vehicleId,
                SCHEDULE_BLOCKING_STATUSES,
                departureTime,
                plannedArrivalTime
        )) {
            throw new BadRequestException("Vehicle is not available in selected time range");
        }
    }

    private void checkDriverAvailability(Long employeeId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime) {
        if (_transportOrderRepository.existsDriverScheduleOverlap(
                employeeId,
                SCHEDULE_BLOCKING_STATUSES,
                departureTime,
                plannedArrivalTime
        )) {
            throw new BadRequestException("Driver is not available in selected time range");
        }
    }

    private void checkVehicleAvailabilityForUpdate(Long vehicleId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime, Long transportOrderId) {
        if (_transportOrderRepository.existsVehicleScheduleOverlapExcludingOrder(
                vehicleId,
                SCHEDULE_BLOCKING_STATUSES,
                departureTime,
                plannedArrivalTime,
                transportOrderId
        )) {
            throw new BadRequestException("Vehicle is not available in selected time range");
        }
    }

    private void checkDriverAvailabilityForUpdate(Long employeeId, LocalDateTime departureTime, LocalDateTime plannedArrivalTime, Long transportOrderId) {
        if (_transportOrderRepository.existsDriverScheduleOverlapExcludingOrder(
                employeeId,
                SCHEDULE_BLOCKING_STATUSES,
                departureTime,
                plannedArrivalTime,
                transportOrderId
        )) {
            throw new BadRequestException("Driver is not available in selected time range");
        }
    }

    private void validateWarehouses(Warehouse source, Warehouse destination) {
        if (source == null || destination == null) {
            throw new BadRequestException("Source and destination warehouses are required");
        }

        if (source.getId() == null || destination.getId() == null) {
            throw new BadRequestException("Warehouse IDs are required");
        }

        if (source.getId().equals(destination.getId())) {
            throw new BadRequestException("Source and destination warehouses must be different");
        }

        if (!Boolean.TRUE.equals(source.getActive())) {
            throw new BadRequestException("Source warehouse is not active");
        }

        if (!Boolean.TRUE.equals(destination.getActive())) {
            throw new BadRequestException("Destination warehouse is not active");
        }

        if (source.getStatus() != WarehouseStatus.ACTIVE) {
            throw new BadRequestException("Source warehouse is not available for transport operations");
        }

        if (destination.getStatus() != WarehouseStatus.ACTIVE) {
            throw new BadRequestException("Destination warehouse is not available for transport operations");
        }
    }

    private void validateAssignedEmployee(Employee employee) {
        if (employee == null) {
            throw new BadRequestException("Assigned employee is required");
        }

        if (employee.getId() == null) {
            throw new BadRequestException("Assigned employee ID is required");
        }

        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new BadRequestException("Assigned employee is not active");
        }

        if (employee.getPosition() != EmployeePosition.DRIVER) {
            throw new BadRequestException("Assigned employee must have DRIVER position");
        }
    }

    private void validateVehicleForAssignment(Vehicle vehicle) {
        if (vehicle == null) {
            throw new BadRequestException("Vehicle is required");
        }

        if (vehicle.getId() == null) {
            throw new BadRequestException("Vehicle ID is required");
        }

        if (!Boolean.TRUE.equals(vehicle.getActive())) {
            throw new BadRequestException("Vehicle is not active");
        }

        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new BadRequestException("Vehicle is not available for assignment");
        }

        if (vehicleMaintenanceRepository.existsByVehicleIdAndStatusIn(
                vehicle.getId(),
                Set.of(VehicleMaintenanceStatus.IN_PROGRESS)
        )) {
            throw new BadRequestException("Vehicle has in-progress maintenance and cannot be assigned to transport");
        }
    }

    private void checkVehicleMaintenanceAvailability(Long vehicleId, LocalDateTime plannedArrivalTime) {
        if (vehicleMaintenanceRepository.existsActiveMaintenanceBeforeEnd(
                vehicleId,
                Set.of(VehicleMaintenanceStatus.PLANNED, VehicleMaintenanceStatus.IN_PROGRESS),
                plannedArrivalTime
        )) {
            throw new BadRequestException("Vehicle has planned or active maintenance before this transport ends");
        }
    }

    private boolean isInitialStatus(TransportOrderStatus status) {
        return status == TransportOrderStatus.DRAFT || status == TransportOrderStatus.CREATED;
    }

    private void validateVehicleReservedForExecution(TransportOrder transportOrder) {
        if (transportOrder.getVehicle() == null) {
            throw new BadRequestException("Transport order vehicle is required");
        }
        if (transportOrder.getVehicle().getStatus() != VehicleStatus.RESERVED) {
            throw new BadRequestException("Vehicle must be RESERVED before this transport phase");
        }
    }

    private void validateSchedule(LocalDateTime departure, LocalDateTime arrival) {
        if (departure == null || arrival == null) {
            throw new BadRequestException("Departure time and planned arrival time are required");
        }

        if (!departure.isBefore(arrival)) {
            throw new BadRequestException("Departure time must be before planned arrival time");
        }
    }

    private void validateStatusTransition(TransportOrderStatus current, TransportOrderStatus next) {
        if (current == null || next == null) {
            throw new BadRequestException("Invalid transport order status transition");
        }

        if (!appProperties.isTransportOrderStatusTransitionAllowed(current, next)) {
            throw new BadRequestException("Transport order status cannot be changed from " + current + " to " + next);
        }
    }

    private void validateReservedInventoryForOrder(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException("Transport order must contain at least one reserved item before assignment");
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            var inventory = warehouseInventoryService.findByWarehouseAndProduct(
                    transportOrder.getSourceWarehouse().getId(),
                    item.getProduct().getId()
            );

            if (!item.isFullyReservedForRequestedQuantity()) {
                throw new BadRequestException("Transport order item reservation does not match requested quantity");
            }

            if (inventory.getReservedQuantity() == null || inventory.getReservedQuantity().compareTo(item.getSafeReservedQuantity()) < 0) {
                throw new BadRequestException("Source inventory does not contain this transport item reservation");
            }
        }
    }

    private void releaseInventoryForOrder(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            return;
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            BigDecimal reservedByItem = item.getSafeReservedQuantity();
            if (reservedByItem.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            warehouseInventoryService.releaseReservedStock(
                    transportOrder.getSourceWarehouse().getId(),
                    item.getProduct().getId(),
                    reservedByItem
            );

            item.releaseReservation();
            transportOrderItemRepository.save(item);
            auditTransportItemQuantity("TRANSPORT_ITEM_RESERVATION_RELEASED", item, "reservedQuantity", reservedByItem, BigDecimal.ZERO);
        }
    }

    private void executeDispatchInventoryFlow(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException("Transport order must contain at least one item before transport starts");
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            if (!item.isFullyReservedForRequestedQuantity()) {
                throw new BadRequestException("Transport order item must be fully reserved before dispatch");
            }

            BigDecimal quantityToDispatch = item.getSafeReservedQuantity();
            StockTransferCreate transfer = buildTransportTransfer(transportOrder, item, quantityToDispatch, "Transport order dispatch", "Transport order source warehouse dispatch");
            stockMovementService.dispatchTransport(transfer);

            try {
                item.markDispatched(quantityToDispatch);
            } catch (IllegalArgumentException | IllegalStateException ex) {
                throw new BadRequestException(ex.getMessage());
            }

            transportOrderItemRepository.save(item);
            auditTransportItemQuantity("TRANSPORT_ITEM_DISPATCHED", item, "dispatchedQuantity", BigDecimal.ZERO, item.getSafeDispatchedQuantity());
        }
    }

    private void executeDeliveryInventoryFlow(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException("Transport order must contain at least one item to complete delivery");
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            if (!item.isFullyDispatched()) {
                throw new BadRequestException("Transport order item must be fully dispatched before delivery");
            }

            BigDecimal deliveredBefore = item.getSafeDeliveredQuantity();
            BigDecimal quantityToDeliver = item.getPendingDeliveryQuantity();
            if (quantityToDeliver.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Transport order item has no pending dispatched quantity to deliver");
            }

            StockTransferCreate transfer = buildTransportTransfer(transportOrder, item, quantityToDeliver, "Transport order delivery", "Transport order destination warehouse receipt");
            stockMovementService.receiveTransport(transfer);

            try {
                item.markDelivered(quantityToDeliver);
            } catch (IllegalArgumentException | IllegalStateException ex) {
                throw new BadRequestException(ex.getMessage());
            }

            transportOrderItemRepository.save(item);
            auditTransportItemQuantity("TRANSPORT_ITEM_DELIVERED", item, "deliveredQuantity", deliveredBefore, item.getSafeDeliveredQuantity());
        }
    }


    private void executeFailedReturnInventoryFlow(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException("Transport order must contain at least one item before failure can be closed");
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            BigDecimal returnedBefore = item.getSafeDispatchedQuantity();
            BigDecimal quantityToReturn = item.getPendingDeliveryQuantity();
            if (quantityToReturn.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Transport order item has no dispatched quantity pending return");
            }

            StockTransferCreate transfer = buildTransportTransfer(
                    transportOrder,
                    item,
                    quantityToReturn,
                    "Failed transport return",
                    "Failed transport returned to source warehouse"
            );
            stockMovementService.returnFailedTransportToSource(transfer);

            try {
                item.markReturnedAfterFailure(quantityToReturn);
            } catch (IllegalArgumentException | IllegalStateException ex) {
                throw new BadRequestException(ex.getMessage());
            }

            transportOrderItemRepository.save(item);
            auditTransportItemQuantity("TRANSPORT_ITEM_RETURNED_AFTER_FAILURE", item, "dispatchedQuantity", returnedBefore, item.getSafeDispatchedQuantity());
        }
    }

    private StockTransferCreate buildTransportTransfer(TransportOrder transportOrder, TransportOrderItem item, BigDecimal quantity, String reasonDescription, String referenceNote) {
        StockTransferCreate transfer = new StockTransferCreate();
        transfer.setQuantity(quantity);
        transfer.setReasonDescription(reasonDescription);
        transfer.setReferenceNumber(transportOrder.getOrderNumber());
        transfer.setReferenceNote(referenceNote);
        transfer.setTransportOrderId(transportOrder.getId());
        transfer.setSourceWarehouseId(transportOrder.getSourceWarehouse().getId());
        transfer.setDestinationWarehouseId(transportOrder.getDestinationWarehouse().getId());
        transfer.setProductId(item.getProduct().getId());
        return transfer;
    }


    private void auditTransportItemQuantity(String action,
                                            TransportOrderItem item,
                                            String field,
                                            BigDecimal oldValue,
                                            BigDecimal newValue) {
        if (item == null || item.getId() == null) {
            return;
        }

        auditFacade.recordFieldChange("TRANSPORT_ORDER_ITEM", item.getId(), field, oldValue, newValue);
        auditFacade.log(
                action,
                "TRANSPORT_ORDER_ITEM",
                item.getId(),
                "Transport order item " + item.getId()
                        + " for transport order " + (item.getTransportOrder() != null ? item.getTransportOrder().getId() : null)
                        + " changed " + field + " from " + oldValue + " to " + newValue
        );
    }

    private boolean hasTransportItems(TransportOrder transportOrder) {
        return transportOrder.getTransportOrderItems() != null && !transportOrder.getTransportOrderItems().isEmpty();
    }

    private void validateTransportOrderItem(TransportOrderItem item) {
        if (item == null) {
            throw new BadRequestException("Transport order item is required");
        }

        if (item.getProduct() == null || item.getProduct().getId() == null) {
            throw new BadRequestException("Transport order item product is required");
        }

        if (!item.getProduct().isOperational()) {
            throw new BadRequestException("Transport order item product is not active");
        }

        if (item.getQuantity() == null || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transport order item quantity must be greater than 0");
        }
    }

    private void markVehicleAsReserved(Vehicle vehicle) {
        if (vehicle.getStatus() != VehicleStatus.RESERVED) {
            vehicle.setStatus(VehicleStatus.RESERVED);
            _vehicleRepository.save(vehicle);
        }
    }

    private void markVehicleAsInUse(Vehicle vehicle) {
        if (vehicle.getStatus() != VehicleStatus.IN_USE) {
            vehicle.setStatus(VehicleStatus.IN_USE);
            _vehicleRepository.save(vehicle);
        }
    }

    private void refreshVehicleAvailability(Long vehicleId) {
        Vehicle vehicle = _vehicleRepository.findById(vehicleId).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        boolean hasInTransitTransport = _transportOrderRepository.existsByVehicleIdAndStatusIn(
                vehicleId,
                VEHICLE_BUSY_STATUSES
        );

        if (hasInTransitTransport) {
            if (vehicle.getStatus() != VehicleStatus.IN_USE) {
                vehicle.setStatus(VehicleStatus.IN_USE);
                _vehicleRepository.save(vehicle);
            }
            return;
        }

        boolean hasReservedTransport = _transportOrderRepository.existsByVehicleIdAndStatusIn(
                vehicleId,
                VEHICLE_RESERVED_STATUSES
        );

        if (hasReservedTransport) {
            if (vehicle.getStatus() != VehicleStatus.RESERVED) {
                vehicle.setStatus(VehicleStatus.RESERVED);
                _vehicleRepository.save(vehicle);
            }
            return;
        }

        if (vehicle.getStatus() == VehicleStatus.RESERVED || vehicle.getStatus() == VehicleStatus.IN_USE) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            _vehicleRepository.save(vehicle);
        }
    }

    private void validateTransportOrderWeightAgainstVehicleCapacity(TransportOrder transportOrder) {
        if (transportOrder == null) {
            throw new BadRequestException("Transport order is required");
        }

        transportOrder.recalculateTotalWeight();

        if (!transportOrder.fitsAssignedVehicleCapacity()) {
            throw new BadRequestException("Total weight exceeds vehicle capacity");
        }

        Vehicle vehicle = transportOrder.getVehicle();
        if (vehicle == null || transportOrder.getTransportOrderItems() == null) {
            return;
        }

        if (vehicle.getMaxItems() != null) {
            BigDecimal totalItems = transportOrder.getTransportOrderItems().stream()
                    .filter(item -> item != null && item.getQuantity() != null)
                    .map(TransportOrderItem::getQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalItems.compareTo(BigDecimal.valueOf(vehicle.getMaxItems())) > 0) {
                throw new BadRequestException("Total item quantity exceeds vehicle max items");
            }
        }
    }

    private void validateUniqueOrderNumber(String orderNumber) {
        if (orderNumber == null || orderNumber.isBlank()) {
            throw new BadRequestException("Transport order number is required");
        }

        if (_transportOrderRepository.existsByOrderNumber(orderNumber.trim())) {
            throw new BadRequestException("Transport order with this order number already exists");
        }
    }

    private void validateUniqueOrderNumberForUpdate(Long transportOrderId, String orderNumber) {
        if (orderNumber == null || orderNumber.isBlank()) {
            throw new BadRequestException("Transport order number is required");
        }

        if (_transportOrderRepository.existsByOrderNumberAndIdNot(orderNumber.trim(), transportOrderId)) {
            throw new BadRequestException("Transport order with this order number already exists");
        }
    }

    private void validateOperationalWarehousesForExecution(TransportOrder transportOrder) {
        if (transportOrder.getSourceWarehouse() == null || transportOrder.getDestinationWarehouse() == null) {
            throw new BadRequestException("Transport order must have source and destination warehouse");
        }

        Warehouse source = transportOrder.getSourceWarehouse();
        Warehouse destination = transportOrder.getDestinationWarehouse();

        if (!source.isOperational()) {
            throw new BadRequestException("Source warehouse is not operational for transport execution");
        }

        if (!destination.isOperational()) {
            throw new BadRequestException("Destination warehouse is not operational for transport execution");
        }
    }

    private void notifyOnce(Set<Long> notifiedUserIds, Long userId, String title, String message, NotificationType type) {
        if (userId == null) {
            return;
        }

        if (!notifiedUserIds.add(userId)) {
            return;
        }

        notificationService.createSystemNotification(userId, title, message, type);
    }

    private void validateDriverStatusAccess(TransportOrder transportOrder, TransportOrderStatus targetStatus) {
        if (!authenticatedUserProvider.hasRole("DRIVER")) {
            return;
        }

        Long authenticatedUserId = authenticatedUserProvider.getAuthenticatedUserId();
        Long assignedUserId = transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null
                ? transportOrder.getAssignedEmployee().getUser().getId()
                : null;

        if (assignedUserId == null || !authenticatedUserId.equals(assignedUserId)) {
            throw new BadRequestException("Driver can update only own transport orders");
        }

        if (targetStatus != TransportOrderStatus.LOADING
                && targetStatus != TransportOrderStatus.IN_TRANSIT
                && targetStatus != TransportOrderStatus.DELIVERED
                && targetStatus != TransportOrderStatus.RETURNING
                && targetStatus != TransportOrderStatus.FAILED) {
            throw new BadRequestException("Driver can only progress own transport execution statuses");
        }
    }

    private TransportOrder getTransportOrderOrThrow(Long id) {
        TransportOrder transportOrder;

        if (authenticatedUserProvider.isOverlord()) {
            transportOrder = _transportOrderRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));
        } else {
            transportOrder = _transportOrderRepository.findByIdAndCreatedBy_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                    .orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));
        }

        if (authenticatedUserProvider.hasRole("DRIVER")) {
            Long authenticatedUserId = authenticatedUserProvider.getAuthenticatedUserId();
            Long assignedUserId = transportOrder.getAssignedEmployee() != null && transportOrder.getAssignedEmployee().getUser() != null
                    ? transportOrder.getAssignedEmployee().getUser().getId()
                    : null;

            if (assignedUserId == null || !authenticatedUserId.equals(assignedUserId)) {
                throw new ResourceNotFoundException("Transport order not found");
            }
        }

        return transportOrder;
    }

    private Warehouse getAccessibleWarehouse(Long id, String message) {
        if (authenticatedUserProvider.isOverlord()) {
            return _warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException(message));
        }

        return _warehouseRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException(message));
    }

    private Vehicle getAccessibleVehicle(Long id, String message) {
        if (authenticatedUserProvider.isOverlord()) {
            return _vehicleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException(message));
        }

        return _vehicleRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException(message));
    }

    private Employee getAccessibleEmployee(Long id, String message) {
        if (authenticatedUserProvider.isOverlord()) {
            return _employeeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException(message));
        }

        return _employeeRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException(message));
    }

    private void validateCrossCompanyContext(Warehouse source,Warehouse destination,Vehicle vehicle,Employee assignedEmployee,User createdBy) {
        if (authenticatedUserProvider.isOverlord()) {
            return;
        }

        Long createdByCompanyId = createdBy != null && createdBy.getCompany() != null ? createdBy.getCompany().getId() : null;
        Long sourceCompanyId = source != null && source.getCompany() != null ? source.getCompany().getId() : null;
        Long destinationCompanyId = destination != null && destination.getCompany() != null ? destination.getCompany().getId() : null;
        Long vehicleCompanyId = vehicle != null && vehicle.getCompany() != null ? vehicle.getCompany().getId() : null;
        Long employeeCompanyId = assignedEmployee != null && assignedEmployee.getCompany() != null ? assignedEmployee.getCompany().getId() : null;

        authenticatedUserProvider.ensureSameCompany(createdByCompanyId, sourceCompanyId, "Source warehouse must belong to the same company");
        authenticatedUserProvider.ensureSameCompany(createdByCompanyId, destinationCompanyId, "Destination warehouse must belong to the same company");
        authenticatedUserProvider.ensureSameCompany(createdByCompanyId, vehicleCompanyId, "Vehicle must belong to the same company");
        authenticatedUserProvider.ensureSameCompany(createdByCompanyId, employeeCompanyId, "Assigned employee must belong to the same company");
    }
}
