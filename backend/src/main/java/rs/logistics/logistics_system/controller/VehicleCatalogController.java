package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.VehicleBrandResponse;
import rs.logistics.logistics_system.dto.response.VehicleModelResponse;
import rs.logistics.logistics_system.service.implementation.VehicleCatalogService;

@RestController
@RequestMapping("/api/vehicle-catalog")
@RequiredArgsConstructor
public class VehicleCatalogController {

    private final VehicleCatalogService vehicleCatalogService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER')")
    @GetMapping("/brands")
    public List<VehicleBrandResponse> getBrands() {
        return vehicleCatalogService.getBrands();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER')")
    @GetMapping("/brands/{brandId}/models")
    public List<VehicleModelResponse> getModelsByBrand(@PathVariable Long brandId) {
        return vehicleCatalogService.getModelsByBrand(brandId);
    }
}