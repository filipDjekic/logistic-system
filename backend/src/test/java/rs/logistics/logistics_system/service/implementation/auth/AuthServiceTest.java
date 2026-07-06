package rs.logistics.logistics_system.service.implementation.auth;

import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import rs.logistics.logistics_system.dto.auth.LoginRequest;
import rs.logistics.logistics_system.dto.auth.LoginResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.security.JwtService;
import rs.logistics.logistics_system.service.definition.AuditFacadeDefinition;
import rs.logistics.logistics_system.testsupport.ServiceTestSupport;
import rs.logistics.logistics_system.testsupport.TestEntityFactory;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest extends ServiceTestSupport {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticatedUserProvider authenticatedUserProvider;

    @Mock
    private AuditFacadeDefinition auditFacade;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginSuccessReturnsTokenUserIdAndRole() {
        Company company = TestEntityFactory.company(1L);
        User user = TestEntityFactory.user(10L, "admin@example.com", "COMPANY_ADMIN", company);
        LoginRequest request = new LoginRequest("admin@example.com", "correct-password");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        LoginResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals(10L, response.getUserId());
        assertEquals("COMPANY_ADMIN", response.getRole());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(user);
        verify(auditFacade).log(
                eq("LOGIN"),
                eq("USER"),
                eq(10L),
                eq("User with ID: 10 successfully logged in"),
                eq(user)
        );
    }

    @Test
    void loginFailRejectsInvalidPasswordAndDoesNotIssueToken() {
        Company company = TestEntityFactory.company(1L);
        User user = TestEntityFactory.user(10L, "admin@example.com", "COMPANY_ADMIN", company);
        LoginRequest request = new LoginRequest("admin@example.com", "wrong-password");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));

        verify(jwtService, never()).generateToken(any(User.class));
        verify(auditFacade, never()).log(anyString(), anyString(), any(Long.class), anyString(), any(User.class));
    }
}
