package rs.logistics.logistics_system.service.definition.auth;

import rs.logistics.logistics_system.dto.auth.LoginRequest;
import rs.logistics.logistics_system.dto.auth.LoginResponse;

public interface AuthServiceDefinition {

    LoginResponse login(LoginRequest request);
}
