package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.enums.EmployeePosition;

import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    
    boolean existsByJmbg(String jmbg);
    
    List<Employee> findByActive(Boolean active);
    
    List<Employee> findByPosition(EmployeePosition position);

    List<Employee> findByLastNameContainingIgnoreCase(String lastName);
}
