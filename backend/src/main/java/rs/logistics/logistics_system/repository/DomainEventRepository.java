package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.DomainEvent;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.util.List;

public interface DomainEventRepository extends JpaRepository<DomainEvent, Long> {
    List<DomainEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(OperationalEntityType entityType, Long entityId);
    List<DomainEvent> findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(OperationalEntityType entityType, Long entityId, Long companyId);
    List<DomainEvent> findTop50ByOrderByCreatedAtDesc();
    List<DomainEvent> findTop50ByCompany_IdOrderByCreatedAtDesc(Long companyId);
}
