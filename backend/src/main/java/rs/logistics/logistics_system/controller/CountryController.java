package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.response.CountryResponse;
import rs.logistics.logistics_system.service.definition.CountryServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/countries")
@RequiredArgsConstructor
public class CountryController {

    private final CountryServiceDefinition countryService;

    @GetMapping
    public ResponseEntity<List<CountryResponse>> getAll() {
        return ResponseEntity.ok(countryService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<CountryResponse>> getActive() {
        return ResponseEntity.ok(countryService.getActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CountryResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(countryService.getById(id));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<CountryResponse> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(countryService.getByCode(code));
    }
}
