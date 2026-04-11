package rs.logistics.logistics_system.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.UserRepository;

@Component
@RequiredArgsConstructor
public class AuthenticatedUserProvider {

    private final UserRepository userRepository;

    public User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            throw new ResourceNotFoundException("Authenticated user is not found");
        }

        String principal = authentication.getName();

        return userRepository.findByEmail(principal)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public Long getAuthenticatedUserId() {
        return getAuthenticatedUser().getId();
    }

    public Company getAuthenticatedCompany() {
        return getAuthenticatedUser().getCompany();
    }

    public Long getAuthenticatedCompanyId() {
        Company company = getAuthenticatedCompany();
        return company != null ? company.getId() : null;
    }

    public Long getAuthenticatedCompanyIdOrThrow() {
        Long companyId = getAuthenticatedCompanyId();

        if (companyId == null) {
            throw new ForbiddenException("Authenticated user is not assigned to a company");
        }

        return companyId;
    }

    public boolean isSelf(Long userId) {
        return getAuthenticatedUserId().equals(userId);
    }

    public boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return false;
        }

        String expectedAuthority = "ROLE_" + role;

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> expectedAuthority.equals(authority.getAuthority()));
    }

    public boolean isOverlord() {
        return hasRole("OVERLORD");
    }

    public boolean isCompanyAdmin() {
        return hasRole("COMPANY_ADMIN");
    }

    public void ensureCompanyAccess(Long companyId) {
        if (isOverlord()) {
            return;
        }

        Long authenticatedCompanyId = getAuthenticatedCompanyIdOrThrow();

        if (companyId == null || !authenticatedCompanyId.equals(companyId)) {
            throw new ForbiddenException("You do not have access to data outside your company");
        }
    }

    public void ensureSameCompany(Long leftCompanyId, Long rightCompanyId, String message) {
        if (leftCompanyId == null || rightCompanyId == null || !leftCompanyId.equals(rightCompanyId)) {
            throw new ForbiddenException(message);
        }
    }
}
