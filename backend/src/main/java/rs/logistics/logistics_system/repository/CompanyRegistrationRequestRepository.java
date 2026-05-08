package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.CompanyRegistrationRequest;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;

import java.util.List;

public interface CompanyRegistrationRequestRepository extends JpaRepository<CompanyRegistrationRequest, Long> {
    List<CompanyRegistrationRequest> findAllByOrderBySubmittedAtDesc();
    List<CompanyRegistrationRequest> findByStatusOrderBySubmittedAtDesc(CompanyRegistrationRequestStatus status);
    boolean existsByCompanyNameIgnoreCaseAndStatus(String companyName, CompanyRegistrationRequestStatus status);
    boolean existsByRegistrationNumberIgnoreCaseAndStatus(String registrationNumber, CompanyRegistrationRequestStatus status);
    boolean existsByTaxNumberIgnoreCaseAndStatus(String taxNumber, CompanyRegistrationRequestStatus status);
    boolean existsByAdminEmailIgnoreCaseAndStatus(String adminEmail, CompanyRegistrationRequestStatus status);
}
