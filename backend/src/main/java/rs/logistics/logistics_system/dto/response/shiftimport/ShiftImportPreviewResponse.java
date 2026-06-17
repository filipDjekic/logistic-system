package rs.logistics.logistics_system.dto.response.shiftimport;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShiftImportPreviewResponse {

    private int totalRows;
    private int validRows;
    private int invalidRows;
    private boolean importable;
    private Integer importedRows;
    private List<ShiftImportRowPreview> rows;
}
