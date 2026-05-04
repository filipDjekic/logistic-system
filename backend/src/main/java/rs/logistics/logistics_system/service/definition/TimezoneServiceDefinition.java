package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.response.TimezoneResponse;
import rs.logistics.logistics_system.entity.Timezone;

import java.util.List;

public interface TimezoneServiceDefinition {

    List<TimezoneResponse> getActive();

    List<TimezoneResponse> getByCountry(Long countryId);

    TimezoneResponse getById(Long id);

    Timezone getRequiredEntity(Long id);

    Timezone getRequiredForCountry(Long timezoneId, Long countryId);
}