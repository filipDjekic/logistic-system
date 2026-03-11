package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.WarehouseStatus;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseResponse {

    private Long id;

    private String name;
    private String address;
    private String city;
    private BigDecimal capacity;
    private WarehouseStatus status;

    private Long employeeId;

    public WarehouseResponse(Long id, String name, String address, String city, BigDecimal capacity, WarehouseStatus status, Long employeeId) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.city = city;
        this.capacity = capacity;
        this.status = status;
        this.employeeId = employeeId;
    }
}
