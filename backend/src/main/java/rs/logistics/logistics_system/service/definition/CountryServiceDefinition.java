package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.response.CountryResponse;

import java.util.List;

public interface CountryServiceDefinition {
    List<CountryResponse> getAll();

    List<CountryResponse> getActive();

    CountryResponse getById(Long id);

    CountryResponse getByCode(String code);
}
