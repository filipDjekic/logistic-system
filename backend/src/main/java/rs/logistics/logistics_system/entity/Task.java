package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "TASKS")
@Getter
@Setter
@NoArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private TaskPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TaskStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_employee_id", nullable = false)
    private Employee assignedEmployee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transport_order_id")
    private TransportOrder transportOrder;

    public Task(String title, String description, LocalDateTime dueDate, TaskPriority priority, Employee assignedEmployee, TransportOrder transportOrder) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.assignedEmployee = assignedEmployee;
        this.transportOrder = transportOrder;
    }

    // methods

    public boolean isFinalStatus(){
        return this.status == TaskStatus.COMPLETED || this.status == TaskStatus.CANCELLED;
    }

    public void validateNotFinalForUpdate() {
        if(isFinalStatus()) {
            throw new IllegalStateException("Final task cannot be updated.");
        }
    }

    public void validateDueDate(LocalDateTime dueDate) {
        if(dueDate == null || dueDate.isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Due date is invalid.");
        }
    }

    public void assignEmployee(Employee employee) {
        if(employee == null) {
            throw new IllegalStateException("Assigned employee is required.");
        }

        this.assignedEmployee = employee;
    }

    public boolean hasOperationalHistory() {
        if (this.status != TaskStatus.NEW) {
            return true;
        }

        if (this.transportOrder != null) {
            return true;
        }

        if (this.createdAt != null && this.updatedAt != null && !this.updatedAt.equals(this.createdAt)) {
            return true;
        }

        return false;
    }

    public boolean canBeHardDeleted() {
        return this.status == TaskStatus.NEW && !hasOperationalHistory();
    }

    public void validateHardDeleteAllowed() {
        if (!canBeHardDeleted()) {
            throw new IllegalStateException(
                    "Task cannot be hard deleted because it is already part of operational history. Cancel or close it instead."
            );
        }
    }
}
