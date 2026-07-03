package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementRequestReview {
    @Size(max = 255)
    private String reviewNote;
}
