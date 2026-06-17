package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.ShiftCreate;
import org.springframework.data.domain.Pageable;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.shiftimport.ShiftImportPreviewResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface ShiftServiceDefinition {

    ShiftResponse create(ShiftCreate dto);

    ShiftImportPreviewResponse previewImport(MultipartFile file);

    ShiftImportPreviewResponse confirmImport(MultipartFile file);

    ShiftResponse update(Long id, ShiftUpdate dto);

    ShiftResponse getById(Long id);

    PageResponse<ShiftResponse> getAll(Pageable pageable);

    void delete(Long id);

    List<ShiftResponse> getShiftsByDate(LocalDate date);

    List<ShiftResponse> getShiftBetweenDates(LocalDateTime start, LocalDateTime end);

    void cancelShift(Long id);

    ShiftResponse assignShiftToEmployee(Long shiftId, Long employeeId);

    void synchronizeShiftStatuses();
}
