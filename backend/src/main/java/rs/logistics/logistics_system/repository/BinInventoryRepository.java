package rs.logistics.logistics_system.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.BinInventory;
import rs.logistics.logistics_system.entity.BinInventoryId;

import java.util.Optional;

public interface BinInventoryRepository extends JpaRepository<BinInventory, BinInventoryId> {
    Optional<BinInventory> findByBinLocation_IdAndProduct_Id(Long binLocationId, Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select bi from BinInventory bi where bi.binLocation.id = :binLocationId and bi.product.id = :productId")
    Optional<BinInventory> findForUpdate(@Param("binLocationId") Long binLocationId, @Param("productId") Long productId);

    @Query("""
            select bi
            from BinInventory bi
            join bi.binLocation b
            join b.warehouse w
            join b.zone z
            join bi.product p
            where (:companyId is null or w.company.id = :companyId)
            and (:warehouseId is null or w.id = :warehouseId)
            and (:zoneId is null or z.id = :zoneId)
            and (:binLocationId is null or b.id = :binLocationId)
            and (:productId is null or p.id = :productId)
            and (
                :search is null
                or lower(b.code) like lower(concat('%', :search, '%'))
                or lower(z.code) like lower(concat('%', :search, '%'))
                or lower(p.name) like lower(concat('%', :search, '%'))
                or lower(p.sku) like lower(concat('%', :search, '%'))
            )
            """)
    Page<BinInventory> search(@Param("companyId") Long companyId,
                              @Param("warehouseId") Long warehouseId,
                              @Param("zoneId") Long zoneId,
                              @Param("binLocationId") Long binLocationId,
                              @Param("productId") Long productId,
                              @Param("search") String search,
                              Pageable pageable);
}
