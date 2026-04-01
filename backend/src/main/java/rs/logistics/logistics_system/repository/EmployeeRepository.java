package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.enums.EmployeePosition;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByJmbg(String jmbg);

    boolean existsByJmbgAndIdNot(String jmbg, Long id);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByUser_Id(Long userId);

    boolean existsByUser_IdAndIdNot(Long userId, Long id);

    Optional<Employee> findByUser_Id(Long userId);

    List<Employee> findByActive(Boolean active);

    List<Employee> findByPosition(EmployeePosition position);

    List<Employee> findByLastNameContainingIgnoreCase(String lastName);
}