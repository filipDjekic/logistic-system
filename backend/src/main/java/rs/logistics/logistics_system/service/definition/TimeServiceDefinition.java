package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.Warehouse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public interface TimeServiceDefinition {

    ZoneId systemZoneId();

    ZoneId zoneIdForTimezone(Timezone timezone);

    ZoneId zoneIdForCompany(Company company);

    ZoneId zoneIdForWarehouse(Warehouse warehouse);

    ZoneId zoneIdForEmployee(Employee employee);

    ZoneId zoneIdForShift(Shift shift);

    LocalDateTime nowSystem();

    LocalDateTime nowForTimezone(Timezone timezone);

    LocalDateTime nowForCompany(Company company);

    LocalDateTime nowForWarehouse(Warehouse warehouse);

    LocalDateTime nowForEmployee(Employee employee);

    LocalDateTime nowForShift(Shift shift);

    LocalDate todayForCompany(Company company);

    LocalDate todayForEmployee(Employee employee);
}
