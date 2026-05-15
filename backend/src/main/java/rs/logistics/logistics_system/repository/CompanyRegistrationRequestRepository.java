package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.CompanyRegistrationRequest;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;

import java.util.Collection;
import java.util.List;

public interface CompanyRegistrationRequestRepository extends JpaRepository<CompanyRegistrationRequest, Long> {
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
