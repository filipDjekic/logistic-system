package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.CountryResponse;
import rs.logistics.logistics_system.entity.Country;

public class CountryMapper {

    public static CountryResponse toResponse(Country country) {
    var defaultTimezone = country.getDefaultTimezone();

    return new CountryResponse(
            country.getId(),
            country.getIso2Code(),
            country.getIso3Code(),
            country.getNumericCode(),
            country.getName(),
            country.getCurrencyCode(),
            country.getCurrencyName(),
            country.getPhoneCode(),
            defaultTimezone != null ? defaultTimezone.getId() : null,
            defaultTimezone != null ? defaultTimezone.getName() : null,
            defaultTimezone != null ? defaultTimezone.getDisplayName() : null,
            country.getTimezones() == null
                    ? java.util.List.of()
                    : country.getTimezones()
                        .stream()
                        .filter(timezone -> Boolean.TRUE.equals(timezone.getActive()))
                        .map(TimezoneMapper::toResponse)
                        .toList(),
            country.getEuMember(),
            country.getActive()
    );
}
}
