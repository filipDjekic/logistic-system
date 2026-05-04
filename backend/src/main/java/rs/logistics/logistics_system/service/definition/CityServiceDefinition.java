package rs.logistics.logistics_system.service.definition;

import java.util.List;

import rs.logistics.logistics_system.dto.response.CityResponse;
import rs.logistics.logistics_system.entity.City;

public interface CityServiceDefinition {

    List<CityResponse> getAll();

    List<CityResponse> getActive();

    List<CityResponse> getActiveByCountry(Long countryId);

    CityResponse getById(Long id);

    City getRequiredActiveForCountry(Long cityId, Long countryId);
}
