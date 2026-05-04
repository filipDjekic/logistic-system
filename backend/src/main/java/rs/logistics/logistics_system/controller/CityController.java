package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.CityResponse;
import rs.logistics.logistics_system.service.definition.CityServiceDefinition;

@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
public class CityController {

    private final CityServiceDefinition cityService;

    @GetMapping
    public ResponseEntity<List<CityResponse>> getAll(@RequestParam(required = false) Long countryId,
                                                     @RequestParam(defaultValue = "true") boolean activeOnly) {
        if (countryId != null) {
            return ResponseEntity.ok(cityService.getActiveByCountry(countryId));
        }
        return ResponseEntity.ok(activeOnly ? cityService.getActive() : cityService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CityResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(cityService.getById(id));
    }
}
