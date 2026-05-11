package rs.logistics.logistics_system.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TemporalView {
    private LocalDateTime localDateTime;
    private Instant utcInstant;
    private OffsetDateTime offsetDateTime;
    private String zoneId;
    private String zoneDisplayName;
}
