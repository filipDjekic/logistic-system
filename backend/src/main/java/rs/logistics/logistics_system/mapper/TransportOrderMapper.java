package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.TransportOrderCreate;
import rs.logistics.logistics_system.dto.response.TransportOrderResponse;
import rs.logistics.logistics_system.dto.response.TemporalView;
import rs.logistics.logistics_system.dto.response.TransportTimelineEntry;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.dto.update.TransportOrderUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.time.LocalDateTime;
import java.time.ZoneId;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class TransportOrderMapper {

    public static TransportOrder toEntity(TransportOrderCreate dto, Warehouse warehouseSource, Warehouse warehouseDestination, Vehicle vehicle, Employee assignedEmployee, User createdBy) {
        return new TransportOrder(
                dto.getOrderNumber(),
                dto.getDescription(),
                dto.getOrderDate(),
                dto.getDepartureTime(),
                dto.getPlannedArrivalTime(),
                dto.getPriority(),
                BigDecimal.ZERO,
                dto.getNotes(),
                warehouseSource,
                warehouseDestination,
                vehicle,
                assignedEmployee,
                createdBy
        );
    }

    public static void updateEntity(TransportOrderUpdate dto, TransportOrder transportOrder, Warehouse warehouseSource, Warehouse warehouseDestination, Vehicle vehicle, Employee assignedEmployee) {
        transportOrder.setOrderNumber(dto.getOrderNumber());
        transportOrder.setDescription(dto.getDescription());
        transportOrder.setOrderDate(dto.getOrderDate());
        transportOrder.setDepartureTime(dto.getDepartureTime());
        transportOrder.setPlannedArrivalTime(dto.getPlannedArrivalTime());
        transportOrder.setActualArrivalTime(dto.getActualArrivalTime());
        transportOrder.setPriority(dto.getPriority());
        transportOrder.setNotes(dto.getNotes());
        transportOrder.setSourceWarehouse(warehouseSource);
        transportOrder.setDestinationWarehouse(warehouseDestination);
        transportOrder.setVehicle(vehicle);
        transportOrder.setAssignedEmployee(assignedEmployee);
    }

    public static TransportOrderResponse toResponse(TransportOrder transportOrder) {
        return toResponse(transportOrder, null);
    }

    public static TransportOrderResponse toResponse(TransportOrder transportOrder, TimeServiceDefinition timeService) {
        TransportOrderResponse response = new TransportOrderResponse(
                transportOrder.getId(),
                transportOrder.getOrderNumber(),
                transportOrder.getDescription(),
                transportOrder.getOrderDate(),
                transportOrder.getDepartureTime(),
                transportOrder.getPlannedArrivalTime(),
                transportOrder.getActualArrivalTime(),
                transportOrder.getStatus(),
                transportOrder.getPriority(),
                transportOrder.getTotalWeight(),
                transportOrder.getNotes(),
                transportOrder.getSourceWarehouse().getId(),
                transportOrder.getDestinationWarehouse().getId(),
                transportOrder.getVehicle().getId(),
                transportOrder.getAssignedEmployee().getId(),
                transportOrder.getCreatedBy().getId()
        );

        response.setAllowedNextStatuses(transportOrder.getStatus() != null ? transportOrder.getStatus().defaultNextStatuses() : List.of());

        if (timeService != null) {
            ZoneId sourceZone = timeService.zoneIdForTransportSource(transportOrder);
            ZoneId destinationZone = timeService.zoneIdForTransportDestination(transportOrder);
            response.setSourceTimezone(sourceZone.getId());
            response.setDestinationTimezone(destinationZone.getId());
            response.setOrderDateView(toTemporalView(transportOrder.getOrderDate(), sourceZone, timeService));
            response.setDepartureTimeView(toTemporalView(transportOrder.getDepartureTime(), sourceZone, timeService));
            response.setPlannedArrivalTimeView(toTemporalView(transportOrder.getPlannedArrivalTime(), destinationZone, timeService));
            response.setActualArrivalTimeView(toTemporalView(transportOrder.getActualArrivalTime(), destinationZone, timeService));
            response.setTimeline(buildTimeline(transportOrder, sourceZone, destinationZone, timeService));
        } else {
            response.setTimeline(buildTimeline(transportOrder, null, null, null));
        }

        return response;
    }

    private static List<TransportTimelineEntry> buildTimeline(TransportOrder transportOrder, ZoneId sourceZone, ZoneId destinationZone, TimeServiceDefinition timeService) {
        List<TransportOrderStatus> flow = List.of(
                TransportOrderStatus.DRAFT,
                TransportOrderStatus.ASSIGNED,
                TransportOrderStatus.PICKING,
                TransportOrderStatus.PACKING,
                TransportOrderStatus.READY_FOR_LOADING,
                TransportOrderStatus.LOADING,
                TransportOrderStatus.IN_TRANSIT,
                TransportOrderStatus.DELIVERED
        );

        TransportOrderStatus current = normalizeInitialStatus(transportOrder.getStatus());
        int currentIndex = flow.indexOf(current);
        List<TransportTimelineEntry> entries = new ArrayList<>();
        for (int i = 0; i < flow.size(); i++) {
            TransportOrderStatus status = flow.get(i);
            LocalDateTime timestamp = timestampForStatus(transportOrder, status);
            ZoneId zone = zoneForStatus(status, sourceZone, destinationZone);
            entries.add(new TransportTimelineEntry(
                    status,
                    labelForStatus(status),
                    descriptionForStatus(status),
                    current.isTerminal() ? terminalCompleted(status, current) : currentIndex >= 0 && i < currentIndex,
                    status == current,
                    timestamp,
                    timeService != null && zone != null ? toTemporalView(timestamp, zone, timeService) : null
            ));
        }

        if (current == TransportOrderStatus.FAILED || current == TransportOrderStatus.RETURNING || current == TransportOrderStatus.RESCHEDULED || current == TransportOrderStatus.CANCELLED) {
            LocalDateTime timestamp = timestampForStatus(transportOrder, current);
            ZoneId zone = zoneForStatus(current, sourceZone, destinationZone);
            entries.add(new TransportTimelineEntry(
                    current,
                    labelForStatus(current),
                    descriptionForStatus(current),
                    true,
                    true,
                    timestamp,
                    timeService != null && zone != null ? toTemporalView(timestamp, zone, timeService) : null
            ));
        }

        return entries;
    }

    private static TransportOrderStatus normalizeInitialStatus(TransportOrderStatus status) {
        return status == TransportOrderStatus.CREATED ? TransportOrderStatus.DRAFT : status;
    }

    private static boolean terminalCompleted(TransportOrderStatus status, TransportOrderStatus current) {
        return current == TransportOrderStatus.DELIVERED && status != TransportOrderStatus.DELIVERED;
    }

    private static LocalDateTime timestampForStatus(TransportOrder transportOrder, TransportOrderStatus status) {
        if (status == TransportOrderStatus.DRAFT || status == TransportOrderStatus.CREATED || status == TransportOrderStatus.ASSIGNED) {
            return transportOrder.getOrderDate();
        }
        if (status == TransportOrderStatus.IN_TRANSIT || status == TransportOrderStatus.RETURNING) {
            return transportOrder.getDepartureTime();
        }
        if (status == TransportOrderStatus.DELIVERED || status == TransportOrderStatus.FAILED || status == TransportOrderStatus.CANCELLED) {
            return transportOrder.getActualArrivalTime();
        }
        return null;
    }

    private static ZoneId zoneForStatus(TransportOrderStatus status, ZoneId sourceZone, ZoneId destinationZone) {
        if (status == TransportOrderStatus.DELIVERED) {
            return destinationZone;
        }
        return sourceZone != null ? sourceZone : destinationZone;
    }

    private static String labelForStatus(TransportOrderStatus status) {
        return switch (status) {
            case DRAFT, CREATED -> "Draft";
            case ASSIGNED -> "Assigned";
            case PICKING -> "Picking";
            case PACKING -> "Packing";
            case READY_FOR_LOADING -> "Ready for loading";
            case LOADING -> "Loading";
            case IN_TRANSIT -> "In transit";
            case DELIVERED -> "Delivered";
            case FAILED -> "Failed";
            case RETURNING -> "Returning";
            case RESCHEDULED -> "Rescheduled";
            case CANCELLED -> "Cancelled";
        };
    }

    private static String descriptionForStatus(TransportOrderStatus status) {
        return switch (status) {
            case DRAFT, CREATED -> "Transport created and waiting for assignment confirmation.";
            case ASSIGNED -> "Driver, vehicle and reserved inventory are locked for this transport.";
            case PICKING -> "Warehouse team is preparing reserved goods.";
            case PACKING -> "Reserved goods are being packed for dispatch.";
            case READY_FOR_LOADING -> "Goods are packed and ready to be loaded.";
            case LOADING -> "Goods are being loaded into the vehicle.";
            case IN_TRANSIT -> "Goods left the source warehouse and the vehicle is in use.";
            case DELIVERED -> "Goods arrived at the destination warehouse.";
            case FAILED -> "Transport failed and was closed.";
            case RETURNING -> "Transport is returning goods to the source warehouse.";
            case RESCHEDULED -> "Transport is waiting for a new execution schedule.";
            case CANCELLED -> "Transport was cancelled before completion.";
        };
    }

    private static TemporalView toTemporalView(LocalDateTime value, ZoneId zoneId, TimeServiceDefinition timeService) {
        if (value == null) {
            return null;
        }
        return new TemporalView(
                value,
                timeService.toUtcInstant(value, zoneId),
                timeService.toOffsetDateTime(value, zoneId),
                zoneId.getId(),
                zoneId.getId()
        );
    }
}
