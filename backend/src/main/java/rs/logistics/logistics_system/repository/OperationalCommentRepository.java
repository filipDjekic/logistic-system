package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.OperationalComment;
import rs.logistics.logistics_system.enums.OperationalEntityType;

import java.util.List;
import java.util.Optional;

public interface OperationalCommentRepository extends JpaRepository<OperationalComment, Long> {
    @EntityGraph(attributePaths = {"author", "author.company", "company"})
    List<OperationalComment> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(OperationalEntityType entityType, Long entityId);
    @EntityGraph(attributePaths = {"author", "author.company", "company"})
    List<OperationalComment> findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(OperationalEntityType entityType, Long entityId, Long companyId);
    @EntityGraph(attributePaths = {"author", "author.company", "company"})
    Optional<OperationalComment> findByIdAndCompany_Id(Long id, Long companyId);
}
