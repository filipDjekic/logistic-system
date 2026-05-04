package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.TimezoneResponse;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.TimezoneMapper;
import rs.logistics.logistics_system.repository.TimezoneRepository;
import rs.logistics.logistics_system.service.definition.TimezoneServiceDefinition;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimezoneService implements TimezoneServiceDefinition {

    private final TimezoneRepository timezoneRepository;

    @Override
    public List<TimezoneResponse> getActive() {
        return timezoneRepository.findByActiveTrueOrderByCountryNameAscDisplayNameAsc()
                .stream()
                .map(TimezoneMapper::toResponse)
                .toList();
    }

    @Override
    public List<TimezoneResponse> getByCountry(Long countryId) {
        return timezoneRepository.findByCountryIdAndActiveTrueOrderByDisplayNameAsc(countryId)
                .stream()
                .map(TimezoneMapper::toResponse)
                .toList();
    }

    @Override
    public TimezoneResponse getById(Long id) {
        return TimezoneMapper.toResponse(getRequiredEntity(id));
    }

    @Override
    public Timezone getRequiredEntity(Long id) {
        return timezoneRepository.findById(id)
                .filter(timezone -> Boolean.TRUE.equals(timezone.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Timezone not found"));
    }

    @Override
    public Timezone getRequiredForCountry(Long timezoneId, Long countryId) {
        Timezone timezone = getRequiredEntity(timezoneId);

        if (timezone.getCountry() == null || !timezone.getCountry().getId().equals(countryId)) {
            throw new BadRequestException("Timezone does not belong to selected country");
        }

        return timezone;
    }
}