package rs.logistics.logistics_system.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import rs.logistics.logistics_system.entity.ChangeHistory;

public interface ChangeHistoryRepository extends JpaRepository<ChangeHistory, Long> {

    Optional<ChangeHistory> findByIdAndChangedBy_Company_Id(Long id, Long companyId);

    List<ChangeHistory> findAllByChangedBy_Company_Id(Long companyId);

    List<ChangeHistory> findByEntityName(String entityName);

    List<ChangeHistory> findByEntityNameAndChangedBy_Company_Id(String entityName, Long companyId);

    List<ChangeHistory> findByEntityId(Long entityId);

    List<ChangeHistory> findByEntityIdAndChangedBy_Company_Id(Long entityId, Long companyId);

    List<ChangeHistory> findByChangedById(Long userId);

    List<ChangeHistory> findByChangedByIdAndChangedBy_Company_Id(Long userId, Long companyId);

    List<ChangeHistory> findByChangedAtBetween(LocalDateTime start, LocalDateTime end);

    List<ChangeHistory> findByChangedAtBetweenAndChangedBy_Company_Id(LocalDateTime start, LocalDateTime end, Long companyId);
}
