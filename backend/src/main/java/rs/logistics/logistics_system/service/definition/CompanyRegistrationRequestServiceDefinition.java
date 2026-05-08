package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.CompanyRegistrationReject;
import rs.logistics.logistics_system.dto.create.CompanyRegistrationRequestCreate;
import rs.logistics.logistics_system.dto.response.CompanyRegistrationRequestResponse;
import rs.logistics.logistics_system.enums.CompanyRegistrationRequestStatus;

import java.util.List;

public interface CompanyRegistrationRequestServiceDefinition {
    CompanyRegistrationRequestResponse submit(CompanyRegistrationRequestCreate dto);
    List<CompanyRegistrationRequestResponse> getAll(CompanyRegistrationRequestStatus status);
    CompanyRegistrationRequestResponse getById(Long id);
    CompanyRegistrationRequestResponse approve(Long id);
    CompanyRegistrationRequestResponse reject(Long id, CompanyRegistrationReject dto);
    CompanyRegistrationRequestResponse cancel(Long id);
}
