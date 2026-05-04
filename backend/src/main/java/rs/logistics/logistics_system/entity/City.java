package rs.logistics.logistics_system.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "cities",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_cities_country_name", columnNames = {"country_id", "name"})
        },
        indexes = {
                @Index(name = "idx_cities_country_id", columnList = "country_id"),
                @Index(name = "idx_cities_country_active", columnList = "country_id, active"),
                @Index(name = "idx_cities_name", columnList = "name")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    public City(String name, String postalCode, Country country) {
        this.name = name;
        this.postalCode = postalCode;
        this.country = country;
        this.active = true;
    }
}
