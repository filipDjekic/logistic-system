package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.WarehouseZone;
import rs.logistics.logistics_system.enums.WarehouseZoneType;

import java.util.List;
import java.util.Optional;

public interface WarehouseZoneRepository extends JpaRepository<WarehouseZone, Long> {
    Optional<WarehouseZone> findByIdAndWarehouse_Company_Id(Long id, Long companyId);
    boolean existsByWarehouse_IdAndCodeIgnoreCase(Long warehouseId, String code);
    boolean existsByWarehouse_IdAndCodeIgnoreCaseAndIdNot(Long warehouseId, String code, Long id);
    List<WarehouseZone> findByWarehouse_IdOrderByCodeAsc(Long warehouseId);

    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "warehouse.timezone"})
    @Query("""
            select wz
            from WarehouseZone wz
            join wz.warehouse w
            where (:companyId is null or w.company.id = :companyId)
            and (:warehouseId is null or w.id = :warehouseId)
            and (:active is null or wz.active = :active)
            and (:type is null or wz.type = :type)
            and (
                :search is null
                or lower(wz.code) like lower(concat('%', :search, '%'))
                or lower(wz.name) like lower(concat('%', :search, '%'))
                or lower(w.name) like lower(concat('%', :search, '%'))
            )
            """)
    Page<WarehouseZone> search(@Param("companyId") Long companyId,
                               @Param("warehouseId") Long warehouseId,
                               @Param("active") Boolean active,
                               @Param("type") WarehouseZoneType type,
                               @Param("search") String search,
                               Pageable pageable);


    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "warehouse.timezone"})
    @Query("""
            select wz
            from WarehouseZone wz
            join wz.warehouse w
            where w.company.id = :companyId
            and w.id in :warehouseIds
            and (:warehouseId is null or w.id = :warehouseId)
            and (:active is null or wz.active = :active)
            and (:type is null or wz.type = :type)
            and (
                :search is null
                or lower(wz.code) like lower(concat('%', :search, '%'))
                or lower(wz.name) like lower(concat('%', :search, '%'))
                or lower(w.name) like lower(concat('%', :search, '%'))
            )
            """)
    Page<WarehouseZone> searchAssigned(@Param("companyId") Long companyId,
                                       @Param("warehouseIds") java.util.Collection<Long> warehouseIds,
                                       @Param("warehouseId") Long warehouseId,
                                       @Param("active") Boolean active,
                                       @Param("type") WarehouseZoneType type,
                                       @Param("search") String search,
                                       Pageable pageable);
}
