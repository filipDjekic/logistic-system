package rs.logistics.logistics_system.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.UserStatus;
import rs.logistics.logistics_system.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));

        boolean disabled = Boolean.FALSE.equals(user.getEnabled()) || user.getStatus() == UserStatus.INACTIVE;
        boolean locked = user.getStatus() == UserStatus.BLOCKED;

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().getName())
                .disabled(disabled)
                .accountLocked(locked)
                .build();
    }
}