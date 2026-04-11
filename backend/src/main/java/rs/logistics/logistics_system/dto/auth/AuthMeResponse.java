package rs.logistics.logistics_system.dto.auth;

public record AuthMeResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Boolean enabled,
        String role,
        AuthMeCompanyResponse company
) {
    public record AuthMeCompanyResponse(
            Long id,
            String name,
            Boolean active
    ) {}
}
