package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.entity.Timezone;

public class ShiftMapper {

    public static Shift toEntity(ShiftCreate dto, Employee employee, Timezone timezone) {
        Shift shift = new Shift(dto.getStartTime(), dto.getEndTime(), dto.getStatus(), dto.getNotes(), employee);
        shift.setTimezone(timezone);
        return shift;
    }

    public static void updateEntity(Shift shift, ShiftUpdate dto, Timezone timezone) {
        shift.setStartTime(dto.getStartTime());
        shift.setEndTime(dto.getEndTime());
        shift.setStatus(dto.getStatus());
        shift.setNotes(dto.getNotes());
        shift.setTimezone(timezone);
    }

    public static ShiftResponse toResponse(Shift shift) {
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
        shiftResponse.setEmployeeId(shift.getEmployee() != null ? shift.getEmployee().getId() : null);
        return shiftResponse;
    }
}
