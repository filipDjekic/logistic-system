package rs.logistics.logistics_system.dto.response;

public record CountryResponse(Long id,
                              String code,
                              String code3,
                              String name,
                              String phoneCode,
                              String currencyCode,
                              Boolean euMember,
                              Boolean active) {
}
