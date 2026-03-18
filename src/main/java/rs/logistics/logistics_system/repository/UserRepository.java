package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.UserStatus;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByStatus(UserStatus status);

    List<User> findByRoleId(Long roleId);

    boolean existsByRoleIdAndEnabledTrueAndStatus(Long roleId, UserStatus status);
}
