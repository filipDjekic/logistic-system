package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.OperationalAttachment;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.time.LocalDateTime;
import java.util.List;

public interface OperationalAttachmentRepository extends JpaRepository<OperationalAttachment, Long> {
    List<OperationalAttachment> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(OperationalEntityType entityType, Long entityId);
    List<OperationalAttachment> findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(OperationalEntityType entityType, Long entityId, Long companyId);
    List<OperationalAttachment> findByFileUrlAndCreatedAtBefore(String fileUrl, LocalDateTime createdAt);
    List<OperationalAttachment> findTop500ByFileUrlStartingWithOrderByCreatedAtAsc(String fileUrlPrefix);
}
