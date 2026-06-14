package rs.logistics.logistics_system.repository;

import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.VehicleStatus;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Vehicle v where v.id = :id")
    Optional<Vehicle> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Vehicle v where v.id = :id and v.company.id = :companyId")
    Optional<Vehicle> findByIdAndCompanyIdForUpdate(@Param("id") Long id, @Param("companyId") Long companyId);

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    Optional<Vehicle> findByIdAndCompany_Id(Long id, Long companyId);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCaseAndCompany_Id(String registrationNumber, Long companyId);

    boolean existsByRegistrationNumberIgnoreCaseAndCompany_IdAndIdNot(String registrationNumber, Long companyId, Long id);

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
            or lower(v.vehicleModel.brand.name) like lower(concat('%', :search, '%'))
            or lower(v.vehicleModel.name) like lower(concat('%', :search, '%'))
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


    long countByStatus(VehicleStatus status);

    long countByStatusAndCompany_Id(VehicleStatus status, Long companyId);

    @Query("""
            select count(v)
            from Vehicle v
            where (:companyId is null or v.company.id = :companyId)
            and v.status = rs.logistics.logistics_system.enums.VehicleStatus.RESERVED
            and (v.updatedAt is null or v.updatedAt < :threshold)
            """)
    long countStaleReservedVehicles(@Param("companyId") Long companyId, @Param("threshold") java.time.LocalDateTime threshold);


    @Query("""
            select distinct v
            from Vehicle v
            join fetch v.company company
            where (:companyId is null or company.id = :companyId)
            and v.status = rs.logistics.logistics_system.enums.VehicleStatus.RESERVED
            and (v.updatedAt is null or v.updatedAt < :threshold)
            and not exists (
                select 1
                from TransportOrder t
                where t.vehicle.id = v.id
                and t.status in :activeTransportStatuses
            )
            """)
    List<Vehicle> findStaleReservedVehiclesWithoutActiveTransportForMonitoring(
            @Param("companyId") Long companyId,
            @Param("threshold") LocalDateTime threshold,
            @Param("activeTransportStatuses") Collection<rs.logistics.logistics_system.enums.TransportOrderStatus> activeTransportStatuses
    );

    @Query("select v.status, count(v) from Vehicle v where v.company.id = :companyId group by v.status")
    List<Object[]> countGroupedByStatusAndCompanyId(@Param("companyId") Long companyId);
    @Query("""
        select v.status, count(v)
        from Vehicle v
        where (:companyId is null or v.company.id = :companyId)
        and (:available is null or v.active = :available)
        and (:type is null or lower(v.type) like lower(concat('%', :type, '%')))
        and (:capacityFrom is null or v.capacity >= :capacityFrom)
        and (:capacityTo is null or v.capacity <= :capacityTo)
        and (
            :search is null
            or lower(v.registrationNumber) like lower(concat('%', :search, '%'))
            or lower(v.vehicleModel.brand.name) like lower(concat('%', :search, '%'))
            or lower(v.vehicleModel.name) like lower(concat('%', :search, '%'))
            or lower(v.type) like lower(concat('%', :search, '%'))
            or lower(v.fuelType) like lower(concat('%', :search, '%'))
            or lower(str(v.yearOfProduction)) like lower(concat('%', :search, '%'))
            or lower(str(v.id)) like lower(concat('%', :search, '%'))
        )
        group by v.status
    """)
    List<Object[]> countGroupedByStatusFiltered(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("type") String type,
            @Param("available") Boolean available,
            @Param("capacityFrom") BigDecimal capacityFrom,
            @Param("capacityTo") BigDecimal capacityTo
    );


    @Query("""
            select v
            from Vehicle v
            where v.company.id = :companyId
            and v.status = rs.logistics.logistics_system.enums.VehicleStatus.AVAILABLE
            and v.active = true
            order by v.registrationNumber asc
            """)
    List<Vehicle> findAvailableCandidatesByCompanyId(@Param("companyId") Long companyId, Pageable pageable);

}
