package rs.logistics.logistics_system.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rs.logistics.logistics_system.entity.Company;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByTaxNumberIgnoreCase(String taxNumber);

    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);

    List<Company> findByActive(Boolean active);

    long countByActiveTrue();

    @EntityGraph(attributePaths = {"country", "timezone", "city"})
    @Query("""
            select c
            from Company c
            where (:companyId is null or c.id = :companyId)
            and (
                :search is null
                or lower(c.name) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.email, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.taxNumber, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.registrationNumber, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(c.city.name, '')) like lower(concat('%', :search, '%'))
                or (:searchId is not null and c.id = :searchId)
            )
            """)
    Page<Company> searchLookup(
            @Param("companyId") Long companyId,
            @Param("search") String search,
            @Param("searchId") Long searchId,
            Pageable pageable
    );

}
