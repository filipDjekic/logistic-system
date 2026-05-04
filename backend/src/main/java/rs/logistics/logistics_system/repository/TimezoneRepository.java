package rs.logistics.logistics_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rs.logistics.logistics_system.entity.Timezone;

import java.util.List;
import java.util.Optional;

public interface TimezoneRepository extends JpaRepository<Timezone, Long> {

    List<Timezone> findByActiveTrueOrderByCountryNameAscDisplayNameAsc();

    List<Timezone> findByCountryIdAndActiveTrueOrderByDisplayNameAsc(Long countryId);

    Optional<Timezone> findByNameIgnoreCase(String name);

    boolean existsByCountryIdAndIdAndActiveTrue(Long countryId, Long id);
}