package rs.logistics.logistics_system.dto.response.shiftimport;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ShiftImportRowPreview {

    private int rowNumber;
    private boolean valid;
    private Long employeeId;
    private String employeeLabel;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long timezoneId;
    private Long warehouseId;
    private String notes;
    private List<String> errors = new ArrayList<>();

    public ShiftImportRowPreview(int rowNumber) {
        this.rowNumber = rowNumber;
    }

    public void addError(String error) {
        this.valid = false;
        this.errors.add(error);
    }
}
