package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.VehicleCreate;
import rs.logistics.logistics_system.dto.response.VehicleResponse;
import rs.logistics.logistics_system.dto.update.VehicleUpdate;
import rs.logistics.logistics_system.entity.Vehicle;
import rs.logistics.logistics_system.enums.VehicleStatus;

import java.util.List;

public interface VehicleServiceDefinition {

    VehicleResponse create(VehicleCreate dto);

    VehicleResponse update(Long id, VehicleUpdate dto);

    VehicleResponse getById(Long id);

    List<VehicleResponse> getAll();

    void delete(Long id);

    VehicleResponse changeStatus(Long id, VehicleStatus status);
}
