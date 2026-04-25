package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.VehicleStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    Optional<Vehicle> findByIdAndCompany_Id(Long id, Long companyId);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCaseAndIdNot(String registrationNumber, Long id);

    List<Vehicle> findAllByCompany_Id(Long companyId);

    List<Vehicle> findByStatus(VehicleStatus status);

    List<Vehicle> findByStatusAndCompany_Id(VehicleStatus status, Long companyId);

    List<Vehicle> findByActive(Boolean active);

    List<Vehicle> findByActiveAndCompany_Id(Boolean active, Long companyId);

    @Query("""
        select v from Vehicle v
        where (:companyId is null or v.company.id = :companyId)
        and (:status is null or v.status = :status)
        and (:available is null or v.active = :available)
        and (:type is null or lower(v.type) like lower(concat('%', :type, '%')))
        and (:capacityFrom is null or v.capacity >= :capacityFrom)
        and (:capacityTo is null or v.capacity <= :capacityTo)
        and (
            :search is null
            or lower(v.registrationNumber) like lower(concat('%', :search, '%'))
            or lower(v.brand) like lower(concat('%', :search, '%'))
            or lower(v.model) like lower(concat('%', :search, '%'))
            or lower(v.type) like lower(concat('%', :search, '%'))
            or lower(v.fuelType) like lower(concat('%', :search, '%'))
            or lower(str(v.yearOfProduction)) like lower(concat('%', :search, '%'))
            or lower(str(v.id)) like lower(concat('%', :search, '%'))
        )
    """)
    Page<Vehicle> searchVehicles(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("status") VehicleStatus status,
            @Param("type") String type,
            @Param("available") Boolean available,
            @Param("capacityFrom") BigDecimal capacityFrom,
            @Param("capacityTo") BigDecimal capacityTo,
            Pageable pageable
    );

    @Query("select v.status, count(v) from Vehicle v group by v.status")
    List<Object[]> countGroupedByStatus();

    long countByCompany_Id(Long companyId);

    @Query("select v.status, count(v) from Vehicle v where v.company.id = :companyId group by v.status")
    List<Object[]> countGroupedByStatusAndCompanyId(@Param("companyId") Long companyId);
}
