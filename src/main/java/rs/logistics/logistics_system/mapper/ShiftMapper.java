package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;

public class ShiftMapper {

    public static Shift toEntity(ShiftCreate dto, Employee employee) {
        Shift shift = new Shift(
                dto.getStartTime(),
                dto.getEndTime(),
                dto.getStatus(),
                dto.getNotes(),
                employee);
        return shift;
    }

    public static void updateEntity(Shift shift, ShiftUpdate dto) {
        shift.setStartTime(dto.getStartTime());
        shift.setEndTime(dto.getEndTime());
        shift.setStatus(dto.getStatus());
        shift.setNotes(dto.getNotes());
    }

    public static ShiftResponse toResponse(Shift shift) {
        ShiftResponse shiftResponse = new ShiftResponse(
                shift.getId(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getStatus(),
                shift.getNotes(),
                shift.getEmployee().getId()
        );
        return shiftResponse;
    }
}
