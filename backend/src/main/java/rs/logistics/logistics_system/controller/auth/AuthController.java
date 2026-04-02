package rs.logistics.logistics_system.controller.auth;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.auth.AuthMeResponse;
import rs.logistics.logistics_system.dto.auth.LoginRequest;
import rs.logistics.logistics_system.dto.auth.LoginResponse;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.CustomUserDetailsService;
import rs.logistics.logistics_system.service.definition.auth.AuthServiceDefinition;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthServiceDefinition authService;
    private final UserRepository userRepository;

    public AuthController(AuthServiceDefinition authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request){
        LoginResponse response = authService.login(request);

        return  ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthMeResponse> me(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        String role = user.getRole() != null ? user.getRole().getName() : null;

        AuthMeResponse response = new AuthMeResponse(
                user.getId(),
                user.getEmail(),
                role
        );

        return ResponseEntity.ok(response);
    }
}
