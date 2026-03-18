package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.enums.VehicleStatus;
import rs.logistics.logistics_system.service.definition.VehicleServiceDefinition;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleServiceDefinition vehicleService;

    @PostMapping
    public ResponseEntity<VehicleResponse> createVehicle(@Valid @RequestBody VehicleCreate dto) {
        VehicleResponse response = vehicleService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponse> updateVehicle(@PathVariable Long id, @RequestBody VehicleUpdate dto) {
        VehicleResponse vehicleResponse = vehicleService.update(id, dto);
        return new ResponseEntity<>(vehicleResponse, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> getVehicle(@PathVariable Long id) {
        VehicleResponse response = vehicleService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getAllVehicles() {
        List<VehicleResponse> vehicleResponse = vehicleService.getAll();
        return new ResponseEntity<>(vehicleResponse, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<VehicleResponse> changeStatus(@PathVariable Long id, @RequestParam VehicleStatus status) {
        VehicleResponse response = vehicleService.changeStatus(id, status);
        return ResponseEntity.ok(response);
    }
}
