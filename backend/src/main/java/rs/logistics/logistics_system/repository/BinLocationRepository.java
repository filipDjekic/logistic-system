package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.BinLocation;

import java.util.List;
import java.util.Optional;

public interface BinLocationRepository extends JpaRepository<BinLocation, Long> {
    Optional<BinLocation> findByIdAndWarehouse_Company_Id(Long id, Long companyId);
    boolean existsByWarehouse_IdAndCodeIgnoreCase(Long warehouseId, String code);
    boolean existsByWarehouse_IdAndCodeIgnoreCaseAndIdNot(Long warehouseId, String code, Long id);
    List<BinLocation> findByWarehouse_IdOrderByCodeAsc(Long warehouseId);
    List<BinLocation> findByZone_IdOrderByCodeAsc(Long zoneId);

    @Query("""
            select b
            from BinLocation b
            join b.warehouse w
            join b.zone z
            where (:companyId is null or w.company.id = :companyId)
            and (:warehouseId is null or w.id = :warehouseId)
            and (:zoneId is null or z.id = :zoneId)
            and (:active is null or b.active = :active)
            and (
                :search is null
                or lower(b.code) like lower(concat('%', :search, '%'))
                or lower(b.name) like lower(concat('%', :search, '%'))
                or lower(z.code) like lower(concat('%', :search, '%'))
                or lower(w.name) like lower(concat('%', :search, '%'))
            )
            """)
    Page<BinLocation> search(@Param("companyId") Long companyId,
                             @Param("warehouseId") Long warehouseId,
                             @Param("zoneId") Long zoneId,
                             @Param("active") Boolean active,
                             @Param("search") String search,
                             Pageable pageable);
}
