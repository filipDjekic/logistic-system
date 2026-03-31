package rs.logistics.logistics_system.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.EmployeeServiceDefinition;
import rs.logistics.logistics_system.service.definition.ShiftServiceDefinition;

@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftServiceDefinition shiftService;
    private final EmployeeServiceDefinition employeeService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    @PostMapping
    public ResponseEntity<ShiftResponse> createShift(@Valid @RequestBody ShiftCreate dto) {
        ShiftResponse shiftResponse = shiftService.create(dto);
        return new ResponseEntity<>(shiftResponse, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ShiftResponse> updateShift(@PathVariable Long id, @Valid @RequestBody ShiftUpdate dto) {
        ShiftResponse shiftResponse = shiftService.update(id, dto);
        return ResponseEntity.ok(shiftResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER') or @shiftSecurity.isOwner(#id)")
    @GetMapping("/{id}")
    public ResponseEntity<ShiftResponse> getById(@PathVariable Long id) {
        ShiftResponse shiftResponse = shiftService.getById(id);
        return ResponseEntity.ok(shiftResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    @GetMapping
    public ResponseEntity<List<ShiftResponse>> getAllShifts() {
        List<ShiftResponse> response = shiftService.getAll();
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('USER','OPERATIVE','ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping("/my")
    public ResponseEntity<List<ShiftResponse>> getMyShifts() {
        User user = authenticatedUserProvider.getAuthenticatedUser();

        if (user.getEmployee() == null) {
            throw new BadRequestException("Authenticated user is not linked to an employee");
        }

        List<ShiftResponse> response = employeeService.getShiftsByEmployeeId(user.getEmployee().getId());
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    @GetMapping("/by-date")
    public ResponseEntity<List<ShiftResponse>> getShiftsByDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ShiftResponse> response = shiftService.getShiftsByDate(date);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    @GetMapping("/between-dates")
    public ResponseEntity<List<ShiftResponse>> getShiftsBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<ShiftResponse> response = shiftService.getShiftBetweenDates(start, end);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        shiftService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    @PatchMapping("/cancel-shift")
    public ResponseEntity<Void> cancelShift(@RequestParam Long id) {
        shiftService.cancelShift(id);
        return ResponseEntity.noContent().build();
    }
}