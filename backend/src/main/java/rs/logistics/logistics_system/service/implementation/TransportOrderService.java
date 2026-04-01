package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
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
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.enums.WarehouseStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TransportOrderMapper;
import rs.logistics.logistics_system.repository.EmployeeRepository;
import rs.logistics.logistics_system.repository.TransportOrderRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.repository.WarehouseRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;
import rs.logistics.logistics_system.service.definition.StockMovementServiceDefinition;
import rs.logistics.logistics_system.service.definition.TransportOrderServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseInventoryServiceDefinition;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransportOrderService implements TransportOrderServiceDefinition {

    private final TransportOrderRepository _transportOrderRepository;
    private final WarehouseRepository _warehouseRepository;
    private final VehicleRepository _vehicleRepository;
    private final EmployeeRepository _employeeRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    private static final List<TransportOrderStatus> ACTIVE_STATUSES = Arrays.asList(TransportOrderStatus.ASSIGNED, TransportOrderStatus.IN_TRANSIT);
    private static final List<TransportOrderStatus> SCHEDULE_BLOCKING_STATUSES = Arrays.asList(TransportOrderStatus.ASSIGNED, TransportOrderStatus.IN_TRANSIT);
    private static final List<TransportOrderStatus> VEHICLE_BUSY_STATUSES = Arrays.asList(TransportOrderStatus.ASSIGNED, TransportOrderStatus.IN_TRANSIT);

    private final NotificationServiceDefinition notificationService;
    private final StockMovementServiceDefinition stockMovementService;
    private final WarehouseInventoryServiceDefinition warehouseInventoryService;
    private final AuditFacadeDefinition auditFacade;

    @Override
    @Transactional
    public TransportOrderResponse create(TransportOrderCreate dto) {
        validateCreateOrUpdateRequest(dto);
        validateUniqueOrderNumber(dto.getOrderNumber());

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));

        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));

        User createdBy = authenticatedUserProvider.getAuthenticatedUser();

        validateSchedule(dto.getDepartureTime(), dto.getPlannedArrivalTime());
        validateWarehouses(warehouseSource, warehouseDestination);
        validateAssignedEmployee(assignedEmployee);
        validateVehicleForAssignment(vehicle);
        checkVehicleAvailability(vehicle.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime());
        checkDriverAvailability(assignedEmployee.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime());

        TransportOrder transportOrder = TransportOrderMapper.toEntity(
                dto,
                warehouseSource,
                warehouseDestination,
                vehicle,
                assignedEmployee,
                createdBy
        );
        transportOrder.setStatus(TransportOrderStatus.CREATED);

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

        return TransportOrderMapper.toResponse(saved);
    }

    @Transactional
    @Override
    public TransportOrderResponse update(Long id, TransportOrderUpdate dto) {
        if (dto.getVehicleId() == null || dto.getAssignedEmployeeId() == null || dto.getSourceWarehouseId() == null || dto.getDestinationWarehouseId() == null) {
            throw new BadRequestException("Invalid request");
        }

        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        validateUniqueOrderNumberForUpdate(transportOrder.getId(), dto.getOrderNumber());

        if (transportOrder.getStatus() == TransportOrderStatus.IN_TRANSIT || transportOrder.getStatus() == TransportOrderStatus.DELIVERED || transportOrder.getStatus() == TransportOrderStatus.CANCELLED) {
            throw new BadRequestException("Transport order cannot be updated in current status");
        }

        if (transportOrder.getStatus() != TransportOrderStatus.CREATED) {
            if (!dto.getSourceWarehouseId().equals(transportOrder.getSourceWarehouse().getId())) {
                throw new BadRequestException("Source warehouse cannot be changed once transport order is no longer in CREATED status");
            }

            if (!dto.getDestinationWarehouseId().equals(transportOrder.getDestinationWarehouse().getId())) {
                throw new BadRequestException("Destination warehouse cannot be changed once transport order is no longer in CREATED status");
            }
        }

        Warehouse warehouseSource = _warehouseRepository.findById(dto.getSourceWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        Warehouse warehouseDestination = _warehouseRepository.findById(dto.getDestinationWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));
        Vehicle vehicle = _vehicleRepository.findById(dto.getVehicleId()).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        Employee assignedEmployee = _employeeRepository.findById(dto.getAssignedEmployeeId()).orElseThrow(() -> new ResourceNotFoundException("Assigned employee not found"));

        validateSchedule(dto.getDepartureTime(), dto.getPlannedArrivalTime());
        validateWarehouses(warehouseSource, warehouseDestination);
        validateAssignedEmployee(assignedEmployee);

        if (!dto.getVehicleId().equals(transportOrder.getVehicle().getId())) {
            validateVehicleForAssignment(vehicle);
        }

        checkVehicleAvailabilityForUpdate(vehicle.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime(), transportOrder.getId());
        checkDriverAvailabilityForUpdate(assignedEmployee.getId(), dto.getDepartureTime(), dto.getPlannedArrivalTime(), transportOrder.getId());

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

        if (updated.getStatus() == TransportOrderStatus.ASSIGNED) {
            if (!previousVehicle.getId().equals(updated.getVehicle().getId())) {
                markVehicleAsBusy(updated.getVehicle());
                refreshVehicleAvailability(previousVehicle.getId());
            } else {
                markVehicleAsBusy(updated.getVehicle());
            }
        }

        auditFacade.log(
                "UPDATE",
                "TRANSPORT_ORDER",
                updated.getId(),
                "Transport order updated (ID: " + updated.getId() + ")"
        );

        return TransportOrderMapper.toResponse(updated);
    }

    @Override
    public TransportOrderResponse getById(Long id) {
        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));
        return TransportOrderMapper.toResponse(transportOrder);
    }

    @Override
    public List<TransportOrderResponse> getAll() {
        return _transportOrderRepository.findAll().stream().map(TransportOrderMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void delete(Long id) {
        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

        if (transportOrder.getStatus() != TransportOrderStatus.CREATED) {
            throw new BadRequestException("Only transport orders in CREATED status can be deleted");
        }

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
        TransportOrder transportOrder = _transportOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transport order not found"));

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

            checkDriverAvailabilityForUpdate(
                    transportOrder.getAssignedEmployee().getId(),
                    transportOrder.getDepartureTime(),
                    transportOrder.getPlannedArrivalTime(),
                    transportOrder.getId()
            );

            reserveInventoryForOrder(transportOrder);
            markVehicleAsBusy(transportOrder.getVehicle());

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

        if (status == TransportOrderStatus.IN_TRANSIT) {
            validateOperationalWarehousesForExecution(transportOrder);

            transportOrder.recalculateTotalWeight();
            validateTransportOrderWeightAgainstVehicleCapacity(transportOrder);

            if (transportOrder.getVehicle().getStatus() != VehicleStatus.IN_USE) {
                throw new BadRequestException("Vehicle must be in use before transport starts");
            }

            if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
                throw new BadRequestException("Transport order must contain at least one item before transport starts");
            }

            markVehicleAsBusy(transportOrder.getVehicle());

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

        if (status == TransportOrderStatus.DELIVERED) {
            validateOperationalWarehousesForExecution(transportOrder);

            executeDeliveryInventoryFlow(transportOrder);
            transportOrder.setActualArrivalTime(LocalDateTime.now());
            refreshVehicleAvailability(transportOrder.getVehicle().getId());

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
        }

        if (status == TransportOrderStatus.CANCELLED) {
            if (current == TransportOrderStatus.ASSIGNED) {
                releaseInventoryForOrder(transportOrder);
            }

            refreshVehicleAvailability(transportOrder.getVehicle().getId());

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

        transportOrder.setStatus(status);
        TransportOrder saved = _transportOrderRepository.save(transportOrder);

        auditFacade.recordStatusChange("TRANSPORT_ORDER", saved.getId(), "status", current, saved.getStatus());
        auditFacade.log(
                "STATUS_CHANGE",
                "TRANSPORT_ORDER",
                saved.getId(),
                "Transport order status changed from " + current + " to " + saved.getStatus() + " (ID: " + saved.getId() + ")"
        );

        return TransportOrderMapper.toResponse(saved);
    }

    // HELPERS

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

        switch (current) {
            case CREATED:
                if (next != TransportOrderStatus.ASSIGNED && next != TransportOrderStatus.CANCELLED) {
                    throw new BadRequestException("Transport order in CREATED status can only change to ASSIGNED or CANCELLED");
                }
                break;
            case ASSIGNED:
                if (next != TransportOrderStatus.IN_TRANSIT && next != TransportOrderStatus.CANCELLED) {
                    throw new BadRequestException("Transport order in ASSIGNED status can only change to IN_TRANSIT or CANCELLED");
                }
                break;
            case IN_TRANSIT:
                if (next != TransportOrderStatus.DELIVERED) {
                    throw new BadRequestException("Transport order in IN_TRANSIT status can only change to DELIVERED");
                }
                break;
            case DELIVERED:
            case CANCELLED:
                throw new BadRequestException("Transport order status cannot be changed anymore");
            default:
                throw new BadRequestException("Unsupported transport order status");
        }
    }

    private void reserveInventoryForOrder(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException("Transport order must contain at least one item before assignment");
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            warehouseInventoryService.reserveStock(
                    transportOrder.getSourceWarehouse().getId(),
                    item.getProduct().getId(),
                    item.getQuantity()
            );
        }
    }

    private void releaseInventoryForOrder(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            return;
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            warehouseInventoryService.releaseReservedStock(
                    transportOrder.getSourceWarehouse().getId(),
                    item.getProduct().getId(),
                    item.getQuantity()
            );
        }
    }

    private void executeDeliveryInventoryFlow(TransportOrder transportOrder) {
        if (transportOrder.getTransportOrderItems() == null || transportOrder.getTransportOrderItems().isEmpty()) {
            throw new BadRequestException("Transport order must contain at least one item to complete delivery");
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            validateTransportOrderItem(item);

            stockMovementService.create(new StockMovementCreate(
                    StockMovementType.TRANSFER_OUT,
                    item.getQuantity(),
                    StockMovementReasonCode.TRANSPORT_DISPATCH,
                    "Transport order dispatched from source warehouse",
                    StockMovementReferenceType.TRANSPORT_ORDER,
                    transportOrder.getId(),
                    transportOrder.getOrderNumber(),
                    "Source warehouse transfer out",
                    transportOrder.getId(),
                    transportOrder.getSourceWarehouse().getId(),
                    item.getProduct().getId()
            ));
        }

        for (TransportOrderItem item : transportOrder.getTransportOrderItems()) {
            stockMovementService.create(new StockMovementCreate(
                    StockMovementType.TRANSFER_IN,
                    item.getQuantity(),
                    StockMovementReasonCode.TRANSPORT_RECEIPT,
                    "Transport order received at destination warehouse",
                    StockMovementReferenceType.TRANSPORT_ORDER,
                    transportOrder.getId(),
                    transportOrder.getOrderNumber(),
                    "Destination warehouse transfer in",
                    transportOrder.getId(),
                    transportOrder.getDestinationWarehouse().getId(),
                    item.getProduct().getId()
            ));
        }
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

    private void markVehicleAsBusy(Vehicle vehicle) {
        if (vehicle.getStatus() != VehicleStatus.IN_USE) {
            vehicle.setStatus(VehicleStatus.IN_USE);
            _vehicleRepository.save(vehicle);
        }
    }

    private void refreshVehicleAvailability(Long vehicleId) {
        Vehicle vehicle = _vehicleRepository.findById(vehicleId).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        boolean stillBusy = _transportOrderRepository.existsByVehicleIdAndStatusIn(
                vehicleId,
                VEHICLE_BUSY_STATUSES
        );

        vehicle.setStatus(stillBusy ? VehicleStatus.IN_USE : VehicleStatus.AVAILABLE);
        _vehicleRepository.save(vehicle);
    }

    private void validateTransportOrderWeightAgainstVehicleCapacity(TransportOrder transportOrder) {
        if (transportOrder == null) {
            throw new BadRequestException("Transport order is required");
        }

        transportOrder.recalculateTotalWeight();

        if (!transportOrder.fitsAssignedVehicleCapacity()) {
            throw new BadRequestException("Total weight exceeds vehicle capacity");
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
}