package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.Task;

import java.time.LocalDate;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
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

    Instant toUtcInstant(LocalDateTime localDateTime, ZoneId zoneId);

    OffsetDateTime toOffsetDateTime(LocalDateTime localDateTime, ZoneId zoneId);

    LocalDateTime fromUtcInstant(Instant instant, ZoneId zoneId);

    ZoneId zoneIdForTransportSource(TransportOrder transportOrder);

    ZoneId zoneIdForTransportDestination(TransportOrder transportOrder);

    ZoneId zoneIdForTask(Task task);
}

