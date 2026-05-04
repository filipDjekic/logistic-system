package rs.logistics.logistics_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.City;

public interface CityRepository extends JpaRepository<City, Long> {

    List<City> findAllByOrderByCountry_NameAscNameAsc();

    List<City> findByActiveTrueOrderByCountry_NameAscNameAsc();

    List<City> findByCountry_IdAndActiveTrueOrderByNameAsc(Long countryId);

    Optional<City> findByIdAndActiveTrue(Long id);

    boolean existsByCountry_IdAndNameIgnoreCase(Long countryId, String name);
}
