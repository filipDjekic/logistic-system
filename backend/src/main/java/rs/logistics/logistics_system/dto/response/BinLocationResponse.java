package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.WarehouseZoneType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class BinLocationResponse {
    private Long id;
    private Long warehouseId;
    private String warehouseName;
    private Long zoneId;
    private String zoneCode;
    private String zoneName;
    private WarehouseZoneType zoneType;
    private Long companyId;
    private String code;
    private String name;
    private BigDecimal capacity;
    private Boolean active;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
