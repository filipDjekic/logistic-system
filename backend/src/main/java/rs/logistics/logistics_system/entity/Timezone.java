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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name="timezones",
    uniqueConstraints = {
        @UniqueConstraint(name="uk_timezones_name", columnNames="name")
    },
    indexes = {
        @Index(name = "idx_timezones_country_id", columnList = "country_id"),
        @Index(name = "idx_timezones_active", columnList = "active")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class Timezone {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 80, unique = true)
    private String name;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "utc_offset_minutes", nullable = false)
    private Integer utcOffsetMinutes;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    public Timezone(String name, String displayName, Integer utcOffsetMinutes, Country country) {
        this.name = name;
        this.displayName = displayName;
        this.utcOffsetMinutes = utcOffsetMinutes;
        this.country = country;
        this.active = true;
    }
}
