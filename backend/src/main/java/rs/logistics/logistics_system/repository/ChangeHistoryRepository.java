package rs.logistics.logistics_system.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import rs.logistics.logistics_system.entity.ChangeHistory;
import rs.logistics.logistics_system.enums.ChangeType;

public interface ChangeHistoryRepository extends JpaRepository<ChangeHistory, Long> {

    Optional<ChangeHistory> findByIdAndChangedBy_Company_Id(Long id, Long companyId);

    @Query("""
            select h from ChangeHistory h
            where (:search is null or :search = ''
                   or lower(h.entityName) like lower(concat('%', :search, '%'))
                   or lower(coalesce(h.fieldName, '')) like lower(concat('%', :search, '%'))
                   or lower(coalesce(h.oldValue, '')) like lower(concat('%', :search, '%'))
                   or lower(coalesce(h.newValue, '')) like lower(concat('%', :search, '%')))
              and (:changeType is null or h.changeType = :changeType)
              and (:entityName is null or :entityName = '' or lower(h.entityName) like lower(concat('%', :entityName, '%')))
              and (:entityId is null or h.entityId = :entityId)
              and (:userId is null or h.changedBy.id = :userId)
            """)
    Page<ChangeHistory> searchHistory(
            @Param("search") String search,
            @Param("changeType") ChangeType changeType,
            @Param("entityName") String entityName,
            @Param("entityId") Long entityId,
            @Param("userId") Long userId,
            Pageable pageable
    );

    List<ChangeHistory> findAllByChangedBy_Company_Id(Long companyId);

    List<ChangeHistory> findByEntityName(String entityName);

    List<ChangeHistory> findByEntityNameAndChangedBy_Company_Id(String entityName, Long companyId);

    List<ChangeHistory> findByEntityId(Long entityId);

    List<ChangeHistory> findByEntityIdAndChangedBy_Company_Id(Long entityId, Long companyId);

    List<ChangeHistory> findByChangedById(Long userId);

    List<ChangeHistory> findByChangedByIdAndChangedBy_Company_Id(Long userId, Long companyId);

    List<ChangeHistory> findByChangedAtBetween(LocalDateTime start, LocalDateTime end);

    List<ChangeHistory> findByChangedAtBetweenAndChangedBy_Company_Id(LocalDateTime start, LocalDateTime end, Long companyId);

    long countByChangedBy_Company_Id(Long companyId);
}
