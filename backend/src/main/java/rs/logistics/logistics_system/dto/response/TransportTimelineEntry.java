package rs.logistics.logistics_system.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransportTimelineEntry {
    private TransportOrderStatus status;
    private String label;
    private String description;
    private boolean completed;
    private boolean current;
    private LocalDateTime timestamp;
    private TemporalView timestampView;
}
