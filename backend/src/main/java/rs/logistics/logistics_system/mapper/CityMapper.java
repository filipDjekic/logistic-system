package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.CityResponse;
import rs.logistics.logistics_system.entity.City;
import rs.logistics.logistics_system.entity.Country;

public class CityMapper {

    public static CityResponse toResponse(City city) {
        Country country = city.getCountry();
        return new CityResponse(
                city.getId(),
                city.getName(),
                city.getPostalCode(),
                country != null ? country.getId() : null,
                country != null ? country.getIso2Code() : null,
                country != null ? country.getName() : null,
                city.getActive()
        );
    }
}
