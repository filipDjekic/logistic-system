package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.InternalWarehouseMovement;

public interface InternalWarehouseMovementRepository extends JpaRepository<InternalWarehouseMovement, Long> {
    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "product", "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone", "createdBy"})
    @Query("""
            select m
            from InternalWarehouseMovement m
            join m.warehouse w
            join m.product p
            join m.sourceBin sb
            join m.destinationBin db
            where (:companyId is null or w.company.id = :companyId)
            and (:warehouseId is null or w.id = :warehouseId)
            and (:productId is null or p.id = :productId)
            and (:zoneId is null or sb.zone.id = :zoneId or db.zone.id = :zoneId)
            and (:binLocationId is null or sb.id = :binLocationId or db.id = :binLocationId)
            and (
                :search is null
                or lower(p.name) like lower(concat('%', :search, '%'))
                or lower(p.sku) like lower(concat('%', :search, '%'))
                or lower(sb.code) like lower(concat('%', :search, '%'))
                or lower(db.code) like lower(concat('%', :search, '%'))
                or lower(coalesce(m.note, '')) like lower(concat('%', :search, '%'))
            )
            """)
    Page<InternalWarehouseMovement> search(@Param("companyId") Long companyId,
                                           @Param("warehouseId") Long warehouseId,
                                           @Param("productId") Long productId,
                                           @Param("zoneId") Long zoneId,
                                           @Param("binLocationId") Long binLocationId,
                                           @Param("search") String search,
                                           Pageable pageable);


    @EntityGraph(attributePaths = {"warehouse", "warehouse.company", "product", "sourceBin", "sourceBin.zone", "destinationBin", "destinationBin.zone", "createdBy"})
    @Query("""
            select m
            from InternalWarehouseMovement m
            join m.warehouse w
            join m.product p
            join m.sourceBin sb
            join m.destinationBin db
            where w.company.id = :companyId
            and w.id in :warehouseIds
            and (:warehouseId is null or w.id = :warehouseId)
            and (:productId is null or p.id = :productId)
            and (:zoneId is null or sb.zone.id = :zoneId or db.zone.id = :zoneId)
            and (:binLocationId is null or sb.id = :binLocationId or db.id = :binLocationId)
            and (
                :search is null
                or lower(p.name) like lower(concat('%', :search, '%'))
                or lower(p.sku) like lower(concat('%', :search, '%'))
                or lower(sb.code) like lower(concat('%', :search, '%'))
                or lower(db.code) like lower(concat('%', :search, '%'))
                or lower(coalesce(m.note, '')) like lower(concat('%', :search, '%'))
            )
            """)
    Page<InternalWarehouseMovement> searchAssigned(@Param("companyId") Long companyId,
                                                   @Param("warehouseIds") java.util.Collection<Long> warehouseIds,
                                                   @Param("warehouseId") Long warehouseId,
                                                   @Param("productId") Long productId,
                                                   @Param("zoneId") Long zoneId,
                                                   @Param("binLocationId") Long binLocationId,
                                                   @Param("search") String search,
                                                   Pageable pageable);
}
