package rs.logistics.logistics_system.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import rs.logistics.logistics_system.entity.EmployeeProfileChangeRequest;
import rs.logistics.logistics_system.enums.EmployeeProfileChangeRequestStatus;

public interface EmployeeProfileChangeRequestRepository extends JpaRepository<EmployeeProfileChangeRequest, Long> {

    List<EmployeeProfileChangeRequest> findAllByEmployee_IdOrderByCreatedAtDesc(Long employeeId);

    Page<EmployeeProfileChangeRequest> findAllByEmployee_Id(Long employeeId, Pageable pageable);

    Page<EmployeeProfileChangeRequest> findAllByCompany_Id(Long companyId, Pageable pageable);

    Page<EmployeeProfileChangeRequest> findAllByStatus(EmployeeProfileChangeRequestStatus status, Pageable pageable);

    Page<EmployeeProfileChangeRequest> findAllByCompany_IdAndStatus(
            Long companyId,
            EmployeeProfileChangeRequestStatus status,
            Pageable pageable
    );

    long countByEmployee_IdAndStatus(Long employeeId, EmployeeProfileChangeRequestStatus status);

    boolean existsByEmployee_IdAndStatus(Long employeeId, EmployeeProfileChangeRequestStatus status);

    boolean existsByEmployee_Id(Long employeeId);
}
