package rs.logistics.logistics_system.controller.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import rs.logistics.logistics_system.dto.auth.AuthMeResponse;
import rs.logistics.logistics_system.dto.auth.LoginRequest;
import rs.logistics.logistics_system.dto.auth.LoginResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.UserRepository;
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
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthMeResponse> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Company company = user.getCompany();

        AuthMeResponse.AuthMeCompanyResponse companyResponse = company == null
                ? null
                : new AuthMeResponse.AuthMeCompanyResponse(
                        company.getId(),
                        company.getName(),
                        company.getActive()
                );

        AuthMeResponse response = new AuthMeResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getEnabled(),
                user.getRole() != null ? user.getRole().getName() : null,
                companyResponse
        );

        return ResponseEntity.ok(response);
    }
}
