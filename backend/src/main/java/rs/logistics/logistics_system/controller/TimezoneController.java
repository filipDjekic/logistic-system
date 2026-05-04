package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.response.TimezoneResponse;
import rs.logistics.logistics_system.service.definition.TimezoneServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/timezones")
@RequiredArgsConstructor
public class TimezoneController {

    private final TimezoneServiceDefinition timezoneService;

    @GetMapping("/active")
    public ResponseEntity<List<TimezoneResponse>> getActive() {
        return ResponseEntity.ok(timezoneService.getActive());
    }

    @GetMapping("/country/{countryId}")
    public ResponseEntity<List<TimezoneResponse>> getByCountry(@PathVariable Long countryId) {
        return ResponseEntity.ok(timezoneService.getByCountry(countryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimezoneResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(timezoneService.getById(id));
    }
}