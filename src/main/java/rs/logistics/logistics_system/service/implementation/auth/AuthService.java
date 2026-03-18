package rs.logistics.logistics_system.service.implementation.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.auth.LoginRequest;
import rs.logistics.logistics_system.dto.auth.LoginResponse;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.entity.ActivityLog;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.ActivityLogRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.JwtService;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;
import rs.logistics.logistics_system.service.definition.auth.AuthServiceDefinition;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService implements AuthServiceDefinition {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ActivityLogServiceDefinition activityLogService;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> new ResourceNotFoundException("Username not found"));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new BadRequestException("User account is disabled");
        }

        if (user.getStatus() == UserStatus.BLOCKED || user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("User account is not active");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        String token = jwtService.generateToken(user.getUsername());

        activityLogService.create(new ActivityLogCreate(
                "LOGIN",
                "USER",
                user.getId(),
                "User with ID: " + user.getId() + " successfully logged in",
                LocalDateTime.now(),
                user.getId()
        ));

        return new LoginResponse(
                token, user.getId(), user.getUsername(), user.getRole().getName()
        );
    }
}
