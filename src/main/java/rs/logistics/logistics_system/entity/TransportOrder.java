package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "TRANSPORT_ORDERS")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TransportOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;

    @Column(name = "departure_time")
    private LocalDateTime departureTime;

    @Column(name = "actual_arrival_time")
    private LocalDateTime actualArrivalTime;

    @Column(name = "planned_arrival_time")
    private LocalDateTime plannedArrivalTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TransportOrderStatus status;

    @Column(name = "priority", nullable = false)
    private PriorityLevel priority;

    @Column(name = "total_weight", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalWeight;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // relations
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_warehouse_id", nullable = false)
    private Warehouse sourceWarehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_warehouse_id", nullable = false)
    private Warehouse destinationWarehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_employee_id", nullable = false)
    private Employee assignedEmployee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "transportOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TransportOrderItem> transportOrderItems;

    public TransportOrder(
            String orderNumber,
            String description,
            LocalDateTime orderDate,
            LocalDateTime departureTime,
            LocalDateTime plannedArrivalTime,
            TransportOrderStatus status,
            PriorityLevel priority,
            BigDecimal totalWeight,
            String notes,
            Warehouse sourceWarehouse,
            Warehouse destinationWarehouse,
            Vehicle vehicle,
            Employee assignedEmployee,
            User createdBy
    ) {
        this.orderNumber = orderNumber;
        this.description = description;
        this.orderDate = orderDate;
        this.departureTime = departureTime;
        this.plannedArrivalTime = plannedArrivalTime;
        this.status = status;
        this.priority = priority;
        this.totalWeight = totalWeight;
        this.notes = notes;
        this.sourceWarehouse = sourceWarehouse;
        this.destinationWarehouse = destinationWarehouse;
        this.vehicle = vehicle;
        this.assignedEmployee = assignedEmployee;
        this.createdBy = createdBy;
    }
}
