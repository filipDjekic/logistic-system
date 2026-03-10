package rs.logistics.logistics_system.dto.response;

import rs.logistics.logistics_system.enums.ShiftStatus;

import java.time.LocalDateTime;

public class ShiftResponse {

    private Long id;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ShiftStatus status;
    private String notes;

    private Long employeeId;

    public ShiftResponse() {}

    public ShiftResponse(Long id,
                         LocalDateTime startTime,
                         LocalDateTime endTime,
                         ShiftStatus status,
                         String notes,
                         Long employeeId) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
        this.employeeId = employeeId;
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
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
