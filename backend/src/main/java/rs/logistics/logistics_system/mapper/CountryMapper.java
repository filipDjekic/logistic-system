package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.CountryResponse;
import rs.logistics.logistics_system.entity.Country;

public class CountryMapper {
    public static CountryResponse toResponse(Country country) {
        return new CountryResponse(
                country.getId(),
                country.getCode(),
                country.getCodeThree(),
                country.getName(),
                country.getPhoneCode(),
                country.getCurrencyCode(),
                country.getEuMember(),
                country.getActive()
        );
    }
}
