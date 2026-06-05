package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.TemporalView;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;
import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;
import java.time.ZoneId;

public class ShiftMapper {

    public static Shift toEntity(ShiftCreate dto, Employee employee, Timezone timezone) {
        return toEntity(dto, employee, timezone, null);
    }

    public static Shift toEntity(ShiftCreate dto, Employee employee, Timezone timezone, Warehouse warehouse) {
        Shift shift = new Shift(dto.getStartTime(), dto.getEndTime(), ShiftStatus.PLANNED, dto.getNotes(), employee);
        shift.setTimezone(timezone);
        shift.setWarehouse(warehouse);
        return shift;
    }

    public static void updateEntity(Shift shift, ShiftUpdate dto, Timezone timezone) {
        updateEntity(shift, dto, timezone, null);
    }

    public static void updateEntity(Shift shift, ShiftUpdate dto, Timezone timezone, Warehouse warehouse) {
        shift.setStartTime(dto.getStartTime());
        shift.setEndTime(dto.getEndTime());
        shift.setNotes(dto.getNotes());
        shift.setTimezone(timezone);
        shift.setWarehouse(warehouse);
    }

    public static ShiftResponse toResponse(Shift shift) {
        return toResponse(shift, null);
    }

    public static ShiftResponse toResponse(Shift shift, TimeServiceDefinition timeService) {
        Timezone timezone = shift.getTimezone();
        ShiftResponse shiftResponse = new ShiftResponse();
        shiftResponse.setId(shift.getId());
        shiftResponse.setStartTime(shift.getStartTime());
        shiftResponse.setEndTime(shift.getEndTime());
        shiftResponse.setStatus(shift.getStatus());
        shiftResponse.setNotes(shift.getNotes());
        shiftResponse.setTimezoneId(timezone != null ? timezone.getId() : null);
        shiftResponse.setTimezoneName(timezone != null ? timezone.getName() : null);
        shiftResponse.setTimezoneDisplayName(timezone != null ? timezone.getDisplayName() : null);
        shiftResponse.setTimezone(timezone != null ? timezone.getName() : null);
        if (timeService != null) {
            ZoneId zoneId = timeService.zoneIdForShift(shift);
            shiftResponse.setStartTimeView(toTemporalView(shift.getStartTime(), timezone, zoneId, timeService));
            shiftResponse.setEndTimeView(toTemporalView(shift.getEndTime(), timezone, zoneId, timeService));
        }
        shiftResponse.setEmployeeId(shift.getEmployee() != null ? shift.getEmployee().getId() : null);
        shiftResponse.setWarehouseId(shift.getWarehouse() != null ? shift.getWarehouse().getId() : null);
        shiftResponse.setWarehouseName(shift.getWarehouse() != null ? shift.getWarehouse().getName() : null);
        return shiftResponse;
    }

    private static TemporalView toTemporalView(LocalDateTime value, Timezone timezone, ZoneId zoneId, TimeServiceDefinition timeService) {
        if (value == null) {
            return null;
        }
        return new TemporalView(
                value,
                timeService.toUtcInstant(value, zoneId),
                timeService.toOffsetDateTime(value, zoneId),
                zoneId.getId(),
                timezone != null && timezone.getDisplayName() != null ? timezone.getDisplayName() : zoneId.getId()
        );
    }
}
