package rs.logistics.logistics_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.enums.EmployeePosition;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByJmbg(String jmbg);

    boolean existsByJmbgAndIdNot(String jmbg, Long id);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByUser_Id(Long userId);

    boolean existsByUser_IdAndIdNot(Long userId, Long id);

    Optional<Employee> findByUser_Id(Long userId);

    Optional<Employee> findByIdAndCompany_Id(Long id, Long companyId);

    List<Employee> findAllByCompany_Id(Long companyId);

    List<Employee> findByActive(Boolean active);

    List<Employee> findByActiveAndCompany_Id(Boolean active, Long companyId);

    List<Employee> findByPosition(EmployeePosition position);

    List<Employee> findByPositionAndCompany_Id(EmployeePosition position, Long companyId);

    List<Employee> findByLastNameContainingIgnoreCase(String lastName);

    List<Employee> findByLastNameContainingIgnoreCaseAndCompany_Id(String lastName, Long companyId);
}
