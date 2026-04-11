package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.CompanyCreate;
import rs.logistics.logistics_system.dto.response.CompanyResponse;
import rs.logistics.logistics_system.dto.update.CompanyUpdate;

import java.util.List;

public interface CompanyServiceDefinition {

    CompanyResponse create(CompanyCreate dto);

    CompanyResponse update(Long id, CompanyUpdate dto);

    CompanyResponse getById(Long id);

    List<CompanyResponse> getAll();

    void delete(Long id);
}