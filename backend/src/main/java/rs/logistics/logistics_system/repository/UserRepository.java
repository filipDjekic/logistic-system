package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.UserStatus;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    List<User> findByStatus(UserStatus status);

    List<User> findByRoleId(Long roleId);

    boolean existsByRoleIdAndEnabledTrueAndStatus(Long roleId, UserStatus status);

    long countByRole_NameIgnoreCaseAndEnabledTrue(String roleName);

    @Query("""
            select case when count(u) > 0 then true else false end
            from User u
            where u.id = :userId
            and (
            u.employee is not null
            or exists (select 1 from StockMovement sm where sm.createdBy.id = :userId)
            or exists (select 1 from TransportOrder t where t.createdBy.id = :userId)
            or exists (select 1 from Notification n where n.user.id = :userId)
            or exists (select 1 from ActivityLog al where al.user.id = :userId)
            or exists (select 1 from ChangeHistory ch where ch.changedBy.id = :userId)
            )
            """)
    boolean hasBusinessReferences(@Param("userId") Long userId);

    Optional<User> findByIdAndCompany_Id(Long id, Long companyId);

    List<User> findAllByCompany_Id(Long companyId);

    List<User> findByStatusAndCompany_Id(UserStatus status, Long companyId);

    List<User> findByRoleIdAndCompany_Id(Long roleId, Long companyId);

    @Query("select u.status, count(u) from User u group by u.status")
    List<Object[]> countGroupedByStatus();
}
