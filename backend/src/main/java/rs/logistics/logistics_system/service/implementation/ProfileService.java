package rs.logistics.logistics_system.service.implementation;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.ProfileResponse;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.mapper.ProfileMapper;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ProfileServiceDefinition;

@Service
@RequiredArgsConstructor
public class ProfileService implements ProfileServiceDefinition {

    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final ProfileMapper profileMapper;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getCurrentProfile() {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        return profileMapper.toResponse(user);
    }
}
