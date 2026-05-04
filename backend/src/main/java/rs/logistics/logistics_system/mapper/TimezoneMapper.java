package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.response.TimezoneResponse;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Timezone;

public class TimezoneMapper {

    public static TimezoneResponse toResponse(Timezone timezone) {
        Country country = timezone.getCountry();

        return new TimezoneResponse(
                timezone.getId(),
                timezone.getName(),
                timezone.getDisplayName(),
                timezone.getUtcOffsetMinutes(),
                country != null ? country.getId() : null,
                country != null ? country.getIso2Code() : null,
                country != null ? country.getName() : null,
                timezone.getActive()
        );
    }
}