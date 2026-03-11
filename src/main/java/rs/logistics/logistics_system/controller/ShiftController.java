package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.service.definition.ShiftServiceDefinition;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftServiceDefinition shiftService;

    @PostMapping
    public ResponseEntity<ShiftResponse> createShift(@RequestBody ShiftCreate dto, @RequestBody Employee employee){
        ShiftResponse shiftResponse = shiftService.create(dto, employee);
        return new  ResponseEntity<>(shiftResponse, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShiftResponse> updateShift(@PathVariable Long id, @RequestBody ShiftUpdate dto, @RequestBody Employee employee){
        ShiftResponse shiftResponse = shiftService.update(id, dto, employee);
        return ResponseEntity.ok(shiftResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftResponse> getById(@PathVariable Long id){
        ShiftResponse shiftResponse = shiftService.getById(id);
        return ResponseEntity.ok(shiftResponse);
    }

    @GetMapping
    public ResponseEntity<List<ShiftResponse>> getAllShifts(){
        List<ShiftResponse> response = shiftService.getAll();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id){
        shiftService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
