package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import rs.logistics.logistics_system.entity.CompanyRegistrationRequest;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CompanyRegistrationRequestRepository extends JpaRepository<CompanyRegistrationRequest, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from CompanyRegistrationRequest request where request.id = :id")
    Optional<CompanyRegistrationRequest> findByIdForUpdate(@Param("id") Long id);

    Optional<CompanyRegistrationRequest> findByPublicTrackingToken(String publicTrackingToken);
    List<CompanyRegistrationRequest> findAllByOrderBySubmittedAtDesc();
    List<CompanyRegistrationRequest> findByStatusOrderBySubmittedAtDesc(CompanyRegistrationRequestStatus status);
    boolean existsByCompanyNameIgnoreCaseAndStatus(String companyName, CompanyRegistrationRequestStatus status);
    boolean existsByCompanyNameIgnoreCaseAndStatusIn(String companyName, Collection<CompanyRegistrationRequestStatus> statuses);
    boolean existsByRegistrationNumberIgnoreCaseAndStatus(String registrationNumber, CompanyRegistrationRequestStatus status);
    boolean existsByRegistrationNumberIgnoreCaseAndStatusIn(String registrationNumber, Collection<CompanyRegistrationRequestStatus> statuses);
    boolean existsByTaxNumberIgnoreCaseAndStatus(String taxNumber, CompanyRegistrationRequestStatus status);
    boolean existsByTaxNumberIgnoreCaseAndStatusIn(String taxNumber, Collection<CompanyRegistrationRequestStatus> statuses);
    boolean existsByAdminEmailIgnoreCaseAndStatus(String adminEmail, CompanyRegistrationRequestStatus status);
    boolean existsByAdminEmailIgnoreCaseAndStatusIn(String adminEmail, Collection<CompanyRegistrationRequestStatus> statuses);
}
