package rs.logistics.logistics_system.dto.additional;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransportOrderStatusUpdate {

    private TransportOrderStatus status;
}
