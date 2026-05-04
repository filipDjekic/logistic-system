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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(
        name = "TRANSPORT_ORDERS",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_transport_orders_order_number", columnNames = "order_number")
        },
        indexes = {
                @Index(name = "idx_transport_orders_created_by_user_id", columnList = "created_by_user_id"),
                @Index(name = "idx_transport_orders_assigned_employee_id", columnList = "assigned_employee_id"),
                @Index(name = "idx_transport_orders_vehicle_id", columnList = "vehicle_id"),
                @Index(name = "idx_transport_orders_status", columnList = "status"),
                @Index(name = "idx_transport_orders_created_by_status", columnList = "created_by_user_id, status"),
                @Index(name = "idx_transport_orders_vehicle_status_time", columnList = "vehicle_id, status, departure_time, planned_arrival_time"),
                @Index(name = "idx_transport_orders_driver_status_time", columnList = "assigned_employee_id, status, departure_time, planned_arrival_time"),
                @Index(name = "idx_transport_orders_source_warehouse_id", columnList = "source_warehouse_id"),
                @Index(name = "idx_transport_orders_destination_warehouse_id", columnList = "destination_warehouse_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
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

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // relations
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_warehouse_id", nullable = false)
    private Warehouse sourceWarehouse;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_warehouse_id", nullable = false)
    private Warehouse destinationWarehouse;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_employee_id", nullable = false)
    private Employee assignedEmployee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "transportOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TransportOrderItem> transportOrderItems = new ArrayList<>();

    @OneToMany(mappedBy = "transportOrder")
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "transportOrder")
    private List<StockMovement> stockMovements = new ArrayList<>();

    public TransportOrder(
            String orderNumber,
            String description,
            LocalDateTime orderDate,
            LocalDateTime departureTime,
            LocalDateTime plannedArrivalTime,
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
        this.priority = priority;
        this.totalWeight = totalWeight;
        this.notes = notes;
        this.sourceWarehouse = sourceWarehouse;
        this.destinationWarehouse = destinationWarehouse;
        this.vehicle = vehicle;
        this.assignedEmployee = assignedEmployee;
        this.createdBy = createdBy;
    }

    // methods

    public BigDecimal calculateTotalWeight() {
        return transportOrderItems == null
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : transportOrderItems.stream()
                  .filter(Objects::nonNull)
                  .map(TransportOrderItem::getWeight)
                  .filter(Objects::nonNull)
                  .reduce(BigDecimal.ZERO, BigDecimal::add)
                  .setScale(2, RoundingMode.HALF_UP);
    }

    public void recalculateTotalWeight() {
        this.totalWeight = calculateTotalWeight();
    }

    public boolean fitsAssignedVehicleCapacity() {
        if (this.vehicle == null) {
            return true;
        }

        BigDecimal weightToCheck = this.totalWeight != null ? this.totalWeight : calculateTotalWeight();
        return this.vehicle.canCarry(weightToCheck);
    }
}