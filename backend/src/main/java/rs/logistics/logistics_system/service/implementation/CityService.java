package rs.logistics.logistics_system.service.implementation;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.CityResponse;
import rs.logistics.logistics_system.entity.City;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.CityMapper;
import rs.logistics.logistics_system.repository.CityRepository;
import rs.logistics.logistics_system.service.definition.CityServiceDefinition;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CityService implements CityServiceDefinition {

    private final CityRepository cityRepository;

    @Override
    public List<CityResponse> getAll() {
        return cityRepository.findAllByOrderByCountry_NameAscNameAsc()
                .stream()
                .map(CityMapper::toResponse)
                .toList();
    }

    @Override
    public List<CityResponse> getActive() {
        return cityRepository.findByActiveTrueOrderByCountry_NameAscNameAsc()
                .stream()
                .map(CityMapper::toResponse)
                .toList();
    }

    @Override
    public List<CityResponse> getActiveByCountry(Long countryId) {
        return cityRepository.findByCountry_IdAndActiveTrueOrderByNameAsc(countryId)
                .stream()
                .map(CityMapper::toResponse)
                .toList();
    }

    @Override
    public CityResponse getById(Long id) {
        return CityMapper.toResponse(cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City not found")));
    }

    @Override
    public City getRequiredActiveForCountry(Long cityId, Long countryId) {
        if (cityId == null) {
            return null;
        }
        City city = cityRepository.findByIdAndActiveTrue(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found"));
        if (city.getCountry() == null || !city.getCountry().getId().equals(countryId)) {
            throw new BadRequestException("City does not belong to selected country");
        }
        return city;
    }
}
