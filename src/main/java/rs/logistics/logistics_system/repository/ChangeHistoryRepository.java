package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.ChangeHistory;

import java.time.LocalDateTime;
import java.util.List;

public interface ChangeHistoryRepository extends JpaRepository<ChangeHistory, Long> {

    List<ChangeHistory> findByEntityName(String entityName);

    List<ChangeHistory> findByEntityId(Long entityId);

    List<ChangeHistory> findByChangedById(Long userId);

    List<ChangeHistory> findByChangedAtBetween(LocalDateTime start, LocalDateTime end);
}
