package rs.logistics.logistics_system.service.implementation;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.VehicleBrandResponse;
import rs.logistics.logistics_system.dto.response.VehicleModelResponse;
import rs.logistics.logistics_system.entity.VehicleBrand;
import rs.logistics.logistics_system.entity.VehicleModel;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.VehicleBrandRepository;
import rs.logistics.logistics_system.repository.VehicleModelRepository;

@Service
@RequiredArgsConstructor
public class VehicleCatalogService {

    private final VehicleBrandRepository vehicleBrandRepository;
    private final VehicleModelRepository vehicleModelRepository;

    @Transactional(readOnly = true)
    public List<VehicleBrandResponse> getBrands() {
        return vehicleBrandRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(brand -> new VehicleBrandResponse(brand.getId(), brand.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleModelResponse> getModelsByBrand(Long brandId) {
        return vehicleModelRepository.findByBrand_IdAndActiveTrueOrderByNameAsc(brandId)
                .stream()
                .map(model -> new VehicleModelResponse(
                        model.getId(),
                        model.getBrand().getId(),
                        model.getBrand().getName(),
                        model.getName()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleModel getRequiredModel(Long vehicleModelId) {
        if (vehicleModelId == null) {
            throw new BadRequestException("Vehicle model is required");
        }

        VehicleModel model = vehicleModelRepository.findById(vehicleModelId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle model not found"));

        if (!Boolean.TRUE.equals(model.getActive()) || !Boolean.TRUE.equals(model.getBrand().getActive())) {
            throw new BadRequestException("Selected vehicle model is not active");
        }

        return model;
    }

    @Transactional
    public VehicleModel getOrCreateModel(String brandName, String modelName) {
        String normalizedBrand = normalize(brandName, "brand");
        String normalizedModel = normalize(modelName, "model");

        VehicleBrand brand = vehicleBrandRepository.findByNameIgnoreCase(normalizedBrand)
                .orElseGet(() -> vehicleBrandRepository.save(new VehicleBrand(normalizedBrand)));

        return vehicleModelRepository.findByBrand_IdAndNameIgnoreCase(brand.getId(), normalizedModel)
                .orElseGet(() -> vehicleModelRepository.save(new VehicleModel(brand, normalizedModel)));
    }

    private String normalize(String value, String field) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException("Vehicle " + field + " is required");
        }

        String normalized = value.trim();

        if (normalized.length() > 60) {
            throw new BadRequestException("Vehicle " + field + " must be at most 60 characters");
        }

        return normalized;
    }
}