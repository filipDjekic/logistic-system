package rs.logistics.logistics_system.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "VEHICLE_BRANDS",
        uniqueConstraints = @UniqueConstraint(name = "uk_vehicle_brands_name", columnNames = "name")
)
@Getter
@Setter
@NoArgsConstructor
public class VehicleBrand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", length = 60, nullable = false)
    private String name;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    public VehicleBrand(String name) {
        this.name = name;
        this.active = true;
    }
}