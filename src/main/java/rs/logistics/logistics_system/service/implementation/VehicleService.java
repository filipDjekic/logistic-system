package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.mapper.VehicleMapper;
import rs.logistics.logistics_system.repository.VehicleRepository;
import rs.logistics.logistics_system.service.definition.VehicleServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService implements VehicleServiceDefinition {

    private final VehicleRepository _vehicleRepository;


    @Override
    public VehicleResponse create(VehicleCreate dto) {
        Vehicle vehicle = VehicleMapper.toEntity(dto);
        Vehicle saved = _vehicleRepository.save(vehicle);
        return VehicleMapper.toResponse(saved);
    }

    @Override
    public VehicleResponse update(Long id, VehicleUpdate dto) {
        Vehicle vehicle = _vehicleRepository.findById(id).orElseThrow(() -> new RuntimeException("Vehicle Not Found"));
        VehicleMapper.updateEntity(vehicle, dto);
        Vehicle updated = _vehicleRepository.save(vehicle);
        return VehicleMapper.toResponse(updated);
    }

    @Override
    public VehicleResponse getById(Long id) {
        Vehicle vehicle = _vehicleRepository.findById(id).orElseThrow(() -> new RuntimeException("Vehicle Not Found"));
        return VehicleMapper.toResponse(vehicle);
    }

    @Override
    public List<VehicleResponse> getAll() {
        return _vehicleRepository.findAll().stream().map(VehicleMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Vehicle vehicle = _vehicleRepository.findById(id).orElseThrow(() -> new RuntimeException("Vehicle Not Found"));
        _vehicleRepository.delete(vehicle);
    }
}
