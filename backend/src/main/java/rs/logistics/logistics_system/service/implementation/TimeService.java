package rs.logistics.logistics_system.service.implementation;

import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Shift;
import rs.logistics.logistics_system.entity.Task;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.TransportOrder;
import rs.logistics.logistics_system.entity.Warehouse;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.service.definition.TimeServiceDefinition;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.zone.ZoneRulesException;

@Service
public class TimeService implements TimeServiceDefinition {

    private static final ZoneId FALLBACK_ZONE = ZoneId.of("Europe/Belgrade");

    @Override
    public ZoneId systemZoneId() {
        return FALLBACK_ZONE;
    }

    @Override
    public ZoneId zoneIdForTimezone(Timezone timezone) {
        if (timezone == null || timezone.getName() == null || timezone.getName().isBlank()) {
            return FALLBACK_ZONE;
        }

        try {
            return ZoneId.of(timezone.getName().trim());
        } catch (ZoneRulesException ex) {
            throw new BadRequestException("Invalid timezone configured: " + timezone.getName());
        }
    }

    @Override
    public ZoneId zoneIdForCompany(Company company) {
        if (company != null && company.getTimezone() != null) {
            return zoneIdForTimezone(company.getTimezone());
        }

        Country country = company != null ? company.getCountry() : null;
        if (country != null && country.getDefaultTimezone() != null) {
            return zoneIdForTimezone(country.getDefaultTimezone());
        }

        return FALLBACK_ZONE;
    }

    @Override
    public ZoneId zoneIdForWarehouse(Warehouse warehouse) {
        if (warehouse != null && warehouse.getTimezone() != null) {
            return zoneIdForTimezone(warehouse.getTimezone());
        }

        if (warehouse != null && warehouse.getCompany() != null) {
            return zoneIdForCompany(warehouse.getCompany());
        }

        Country country = warehouse != null ? warehouse.getCountry() : null;
        if (country != null && country.getDefaultTimezone() != null) {
            return zoneIdForTimezone(country.getDefaultTimezone());
        }

        return FALLBACK_ZONE;
    }

    @Override
    public ZoneId zoneIdForEmployee(Employee employee) {
        if (employee != null && employee.getTimezone() != null) {
            return zoneIdForTimezone(employee.getTimezone());
        }

        if (employee != null && employee.getPrimaryWarehouse() != null) {
            return zoneIdForWarehouse(employee.getPrimaryWarehouse());
        }

        if (employee != null && employee.getCompany() != null) {
            return zoneIdForCompany(employee.getCompany());
        }

        Country country = employee != null ? employee.getCountry() : null;
        if (country != null && country.getDefaultTimezone() != null) {
            return zoneIdForTimezone(country.getDefaultTimezone());
        }

        return FALLBACK_ZONE;
    }

    @Override
    public ZoneId zoneIdForShift(Shift shift) {
        if (shift != null && shift.getTimezone() != null) {
            return zoneIdForTimezone(shift.getTimezone());
        }

        if (shift != null && shift.getEmployee() != null) {
            return zoneIdForEmployee(shift.getEmployee());
        }

        return FALLBACK_ZONE;
    }

    @Override
    public LocalDateTime nowSystem() {
        return LocalDateTime.now(systemZoneId());
    }

    @Override
    public LocalDateTime nowForTimezone(Timezone timezone) {
        return LocalDateTime.now(zoneIdForTimezone(timezone));
    }

    @Override
    public LocalDateTime nowForCompany(Company company) {
        return LocalDateTime.now(zoneIdForCompany(company));
    }

    @Override
    public LocalDateTime nowForWarehouse(Warehouse warehouse) {
        return LocalDateTime.now(zoneIdForWarehouse(warehouse));
    }

    @Override
    public LocalDateTime nowForEmployee(Employee employee) {
        return LocalDateTime.now(zoneIdForEmployee(employee));
    }

    @Override
    public LocalDateTime nowForShift(Shift shift) {
        return LocalDateTime.now(zoneIdForShift(shift));
    }

    @Override
    public LocalDate todayForCompany(Company company) {
        return LocalDate.now(zoneIdForCompany(company));
    }

    @Override
    public LocalDate todayForEmployee(Employee employee) {
        return LocalDate.now(zoneIdForEmployee(employee));
    }

    @Override
    public Instant toUtcInstant(LocalDateTime localDateTime, ZoneId zoneId) {
        if (localDateTime == null) {
            return null;
        }
        ZoneId effectiveZoneId = zoneId != null ? zoneId : systemZoneId();
        return localDateTime.atZone(effectiveZoneId).toInstant();
    }

    @Override
    public OffsetDateTime toOffsetDateTime(LocalDateTime localDateTime, ZoneId zoneId) {
        if (localDateTime == null) {
            return null;
        }
        ZoneId effectiveZoneId = zoneId != null ? zoneId : systemZoneId();
        return localDateTime.atZone(effectiveZoneId).toOffsetDateTime();
    }

    @Override
    public LocalDateTime fromUtcInstant(Instant instant, ZoneId zoneId) {
        if (instant == null) {
            return null;
        }
        ZoneId effectiveZoneId = zoneId != null ? zoneId : systemZoneId();
        return LocalDateTime.ofInstant(instant, effectiveZoneId);
    }

    @Override
    public ZoneId zoneIdForTransportSource(TransportOrder transportOrder) {
        return zoneIdForWarehouse(transportOrder != null ? transportOrder.getSourceWarehouse() : null);
    }

    @Override
    public ZoneId zoneIdForTransportDestination(TransportOrder transportOrder) {
        return zoneIdForWarehouse(transportOrder != null ? transportOrder.getDestinationWarehouse() : null);
    }

    @Override
    public ZoneId zoneIdForTask(Task task) {
        if (task != null && task.getAssignedEmployee() != null) {
            return zoneIdForEmployee(task.getAssignedEmployee());
        }
        if (task != null && task.getTransportOrder() != null) {
            return zoneIdForTransportSource(task.getTransportOrder());
        }
        if (task != null && task.getStockMovement() != null) {
            return zoneIdForWarehouse(task.getStockMovement().getWarehouse());
        }
        return systemZoneId();
    }
}

