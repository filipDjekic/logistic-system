package rs.logistics.logistics_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.annotation.processing.Generated;

@Entity
@Table(name = "countries")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Country {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 2)
    private String code;

    @Column(name = "codeThree", nullable = false, unique = true, length = 3)
    private String codeThree;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "phoneCode", length = 10)
    private String phoneCode;

    @Column(name = "currencyCode", length = 3)
    private String currencyCode;

    @Column(name = "euMember", nullable = false)
    private Boolean euMember;

    @Column(name = "active", nullable = false)
    private Boolean active = true;
}
