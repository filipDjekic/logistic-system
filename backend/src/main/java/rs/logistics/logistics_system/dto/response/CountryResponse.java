package rs.logistics.logistics_system.dto.response;

import java.util.List;

public record CountryResponse(Long id,
                              String iso2Code,
                              String iso3Code,
                              String numericCode,
                              String name,
                              String currencyCode,
                              String currencyName,
                              String phoneCode,
                              Long defaultTimezoneId,
                              String defaultTimezoneName,
                              String defaultTimezoneDisplayName,
                              List<TimezoneResponse> timezones,
                              Boolean euMember,
                              Boolean active) {
}
