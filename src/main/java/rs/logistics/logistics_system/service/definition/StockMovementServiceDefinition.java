package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.StockMovementCreate;
import rs.logistics.logistics_system.dto.response.StockMovementResponse;
import rs.logistics.logistics_system.dto.update.StockMovementUpdate;

import java.util.List;

public interface StockMovementServiceDefinition {

    StockMovementResponse create(StockMovementCreate dto);

    StockMovementResponse update(Long id, StockMovementUpdate dto);

    StockMovementResponse getById(Long id);

    List<StockMovementResponse> getAll();

    void delete(Long id);
}
