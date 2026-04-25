package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.VehicleCreate;
import org.springframework.data.domain.Pageable;

import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.enums.VehicleStatus;

import java.math.BigDecimal;
import java.util.List;

public interface VehicleServiceDefinition {

    VehicleResponse create(VehicleCreate dto);

    VehicleResponse update(Long id, VehicleUpdate dto);

    VehicleResponse getById(Long id);

    PageResponse<VehicleResponse> getAll(String search, VehicleStatus status, String type, Boolean available, BigDecimal capacityFrom, BigDecimal capacityTo, Pageable pageable);

    void delete(Long id);

    VehicleResponse changeStatus(Long id, VehicleStatus status);
}
