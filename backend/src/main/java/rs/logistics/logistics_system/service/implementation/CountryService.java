package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.response.CountryResponse;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.CountryMapper;
import rs.logistics.logistics_system.repository.CountryRepository;
import rs.logistics.logistics_system.service.definition.CountryServiceDefinition;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CountryService implements CountryServiceDefinition {

    private final CountryRepository countryRepository;

    @Override
    public List<CountryResponse> getAll() {
        return countryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(CountryMapper::toResponse)
                .toList();
    }

    @Override
    public List<CountryResponse> getActive() {
        return countryRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(CountryMapper::toResponse)
                .toList();
    }

    @Override
    public CountryResponse getById(Long id) {
        Country country = countryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Country with id not found"));

        return CountryMapper.toResponse(country);
    }

    @Override
    public CountryResponse getByCode(String code) {
        Country country = countryRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("Country with code not found"));

        return CountryMapper.toResponse(country);
    }
}
