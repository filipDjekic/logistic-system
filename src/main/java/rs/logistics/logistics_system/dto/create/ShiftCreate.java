package rs.logistics.logistics_system.dto.create;

import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;
import java.time.LocalDateTime;

public class ShiftCreate {

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ShiftStatus status;
    private String notes;

    private Long employeeId;

    public ShiftCreate() {}

    public ShiftCreate(LocalDateTime startTime,
                       LocalDateTime endTime,
                       ShiftStatus status,
                       String notes,
                       Long employeeId) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
        this.employeeId = employeeId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    public LocalDateTime getEndTime() {
        return endTime;
    }
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    public ShiftStatus getStatus() {
        return status;
    }
    public void setStatus(ShiftStatus status) {
        this.status = status;
    }
    public String getNotes() {
        return notes;
    }
    public void setNotes(String notes) {
        this.notes = notes;
    }
    public Long getEmployeeId() {
        return employeeId;
    }
    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }
}
