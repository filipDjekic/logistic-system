package rs.logistics.logistics_system.dto.auth;

public record AuthMeResponse(
        Long userId,
        String email,
        String role
) {}
