package rs.logistics.logistics_system.service.implementation.auth;

import rs.logistics.logistics_system.dto.auth.LoginRequest;
import rs.logistics.logistics_system.dto.auth.LoginResponse;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.auth.AuthServiceDefinition;

import java.util.UUID;

public class AuthService implements AuthServiceDefinition {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> new RuntimeException("Username not found"));

        if(!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Wrong password");
        }

        String token = UUID.randomUUID().toString();

        return new LoginResponse(
                token, user.getId(), user.getUsername(), user.getRole().getName()
        );
    }
}
