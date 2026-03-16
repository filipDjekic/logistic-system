package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.ShiftCreate;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.update.ShiftUpdate;
import rs.logistics.logistics_system.service.definition.ShiftServiceDefinition;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftServiceDefinition shiftService;

    @PostMapping
    public ResponseEntity<ShiftResponse> createShift(@Valid @RequestBody ShiftCreate dto){
        ShiftResponse shiftResponse = shiftService.create(dto);
        return new  ResponseEntity<>(shiftResponse, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShiftResponse> updateShift(@PathVariable Long id, @RequestBody ShiftUpdate dto){
        ShiftResponse shiftResponse = shiftService.update(id, dto);
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
