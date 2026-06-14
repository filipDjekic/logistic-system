package rs.logistics.logistics_system.service.implementation.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.auth.AuthMeResponse;
import rs.logistics.logistics_system.dto.auth.LoginRequest;
import rs.logistics.logistics_system.dto.auth.LoginResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.security.JwtService;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.service.definition.auth.AuthServiceDefinition;

@Service
@RequiredArgsConstructor
public class AuthService implements AuthServiceDefinition {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final AuditFacadeDefinition auditFacade;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new BadRequestException("User account is disabled");
        }

        if (user.getStatus() == UserStatus.BLOCKED || user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("User account is not active");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        String token = jwtService.generateToken(user);

        auditFacade.log(
                "LOGIN",
                "USER",
                user.getId(),
                "User with ID: " + user.getId() + " successfully logged in",
                user
        );

        return new LoginResponse(
                token,
                user.getId(),
                user.getRole().getName()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AuthMeResponse getCurrentUserProfile() {
        User authenticatedUser = authenticatedUserProvider.getAuthenticatedUser();

        User user = userRepository.findByEmailWithRoleAndCompany(authenticatedUser.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        Company company = user.getCompany();

        AuthMeResponse.AuthMeCompanyResponse companyResponse = company == null
                ? null
                : new AuthMeResponse.AuthMeCompanyResponse(
                        company.getId(),
                        company.getName(),
                        company.getActive()
                );

        return new AuthMeResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getEnabled(),
                user.getRole() != null ? user.getRole().getName() : null,
                companyResponse
        );
    }
}
