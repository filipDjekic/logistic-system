package rs.logistics.logistics_system.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "countries",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_countries_code", columnNames = "code"),
                @UniqueConstraint(name = "uk_countries_code_three", columnNames = "code_three"),
                @UniqueConstraint(name = "uk_countries_numeric_code", columnNames = "numeric_code")
        },
        indexes = {
                @Index(name = "idx_countries_active", columnList = "active"),
                @Index(name = "idx_countries_currency_code", columnList = "currency_code"),
                @Index(name = "idx_countries_default_timezone_id", columnList = "default_timezone_id")
        }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Country {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 2)
    private String iso2Code;

    @Column(name = "code_three", nullable = false, unique = true, length = 3)
    private String iso3Code;

    @Column(name = "numeric_code", unique = true, length = 3)
    private String numericCode;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "phone_code", length = 10)
    private String phoneCode;

    @Column(name = "currency_code", length = 3)
    private String currencyCode;

    @Column(name = "currency_name", length = 80)
    private String currencyName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_timezone_id")
    private Timezone defaultTimezone;

    @OneToMany(mappedBy = "country")
    private List<Timezone> timezones = new ArrayList<>();

    @OneToMany(mappedBy = "country")
    private List<City> cities = new ArrayList<>();

    @Column(name = "eu_member", nullable = false)
    private Boolean euMember;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    public String getCode() { return iso2Code; }
    public String getCodeThree() { return iso3Code; }
}
