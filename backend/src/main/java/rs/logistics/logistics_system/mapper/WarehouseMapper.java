package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.WarehouseCreate;
import rs.logistics.logistics_system.dto.response.WarehouseResponse;
import rs.logistics.logistics_system.dto.update.WarehouseUpdate;
import rs.logistics.logistics_system.entity.City;
import rs.logistics.logistics_system.entity.Country;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.Timezone;
import rs.logistics.logistics_system.entity.Warehouse;

public class WarehouseMapper {

    public static Warehouse toEntity(WarehouseCreate dto, Employee employee, Country country, City city, Timezone timezone) {
        Warehouse warehouse = new Warehouse(dto.getName(), dto.getAddress(), city, dto.getCapacity(), dto.getStatus(), employee);
        warehouse.setPostalCode(dto.getPostalCode() != null ? dto.getPostalCode() : city.getPostalCode());
        warehouse.setCountry(country);
        warehouse.setTimezone(timezone);
        warehouse.setLatitude(dto.getLatitude());
        warehouse.setLongitude(dto.getLongitude());
        return warehouse;
    }

    public static void updateEntity(Warehouse warehouse, WarehouseUpdate dto, Country country, City city, Timezone timezone) {
        warehouse.setName(dto.getName());
        warehouse.setAddress(dto.getAddress());
        warehouse.setCity(city);
        warehouse.setPostalCode(dto.getPostalCode() != null ? dto.getPostalCode() : city.getPostalCode());
        warehouse.setCountry(country);
        warehouse.setTimezone(timezone);
        warehouse.setLatitude(dto.getLatitude());
        warehouse.setLongitude(dto.getLongitude());
        warehouse.setCapacity(dto.getCapacity());
    }

    public static WarehouseResponse toResponse(Warehouse warehouse) {
        Long employeeId = warehouse.getManager() != null ? warehouse.getManager().getId() : null;
        String managerName = warehouse.getManager() != null ? warehouse.getManager().getFirstName() + " " + warehouse.getManager().getLastName() : null;
        Country country = warehouse.getCountry();
        City city = warehouse.getCity();
        Timezone timezone = warehouse.getTimezone();
        WarehouseResponse response = new WarehouseResponse();
        response.setId(warehouse.getId());
        response.setName(warehouse.getName());
        response.setAddress(warehouse.getAddress());
        response.setCityId(city != null ? city.getId() : null);
        response.setCityName(city != null ? city.getName() : null);
        response.setCity(city != null ? city.getName() : null);
        response.setPostalCode(warehouse.getPostalCode());
        response.setCountryId(country != null ? country.getId() : null);
        response.setCountryCode(country != null ? country.getIso2Code() : null);
        response.setCountryName(country != null ? country.getName() : null);
        response.setTimezoneId(timezone != null ? timezone.getId() : null);
        response.setTimezoneName(timezone != null ? timezone.getName() : null);
        response.setTimezoneDisplayName(timezone != null ? timezone.getDisplayName() : null);
        response.setTimezone(timezone != null ? timezone.getName() : null);
        response.setLatitude(warehouse.getLatitude());
        response.setLongitude(warehouse.getLongitude());
        response.setCapacity(warehouse.getCapacity());
        response.setStatus(warehouse.getStatus());
        response.setActive(warehouse.getActive());
        response.setEmployeeId(employeeId);
        response.setManagerName(managerName);
        response.setCompanyId(warehouse.getCompany() != null ? warehouse.getCompany().getId() : null);
        response.setCompanyName(warehouse.getCompany() != null ? warehouse.getCompany().getName() : null);
        return response;
    }
}
