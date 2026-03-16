package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseCreate {

    @NotBlank
    @Size(min = 1, max = 100)
    private String name;

    @NotBlank
    @Size(min = 1, max = 200)
    private String address;

    @NotBlank
    @Size(min = 1, max = 200)
    private String city;

    @NotNull
    @Positive
    private BigDecimal capacity;

    @NotNull
    private WarehouseStatus status;

    @NotNull
    private Long employeeId;

    public WarehouseCreate(String name, String address, String city, BigDecimal capacity, WarehouseStatus status, Long employeeId) {
        this.name  = name;
        this.address = address;
        this.city = city;
        this.capacity = capacity;
        this.status = status;
        this.employeeId = employeeId;
    }
}
