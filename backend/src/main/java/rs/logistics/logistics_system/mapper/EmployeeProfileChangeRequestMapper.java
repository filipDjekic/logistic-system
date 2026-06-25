package rs.logistics.logistics_system.mapper;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.response.EmployeeProfileChangeRequestResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.Employee;
import rs.logistics.logistics_system.entity.EmployeeProfileChangeRequest;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.BadRequestException;

@Component
@RequiredArgsConstructor
public class EmployeeProfileChangeRequestMapper {

    private static final TypeReference<LinkedHashMap<String, Object>> CHANGES_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    public EmployeeProfileChangeRequestResponse toResponse(EmployeeProfileChangeRequest request) {
        EmployeeProfileChangeRequestResponse response = new EmployeeProfileChangeRequestResponse();
        response.setId(request.getId());
        response.setStatus(request.getStatus());
        response.setRequestedChanges(fromJson(request.getRequestedChangesJson()));
        response.setReason(request.getReason());
        response.setReviewedAt(request.getReviewedAt());
        response.setRejectionReason(request.getRejectionReason());
        response.setCreatedAt(request.getCreatedAt());
        response.setUpdatedAt(request.getUpdatedAt());
        response.setVersion(request.getVersion());

        Employee employee = request.getEmployee();
        if (employee != null) {
            response.setEmployeeId(employee.getId());
            response.setEmployeeFullName(fullName(employee.getFirstName(), employee.getLastName()));
        }

        User requestedBy = request.getRequestedBy();
        if (requestedBy != null) {
            response.setRequestedByUserId(requestedBy.getId());
            response.setRequestedByFullName(fullName(requestedBy.getFirstName(), requestedBy.getLastName()));
        }

        Company company = request.getCompany();
        if (company != null) {
            response.setCompanyId(company.getId());
            response.setCompanyName(company.getName());
        }

        User reviewedBy = request.getReviewedBy();
        if (reviewedBy != null) {
            response.setReviewedByUserId(reviewedBy.getId());
            response.setReviewedByFullName(fullName(reviewedBy.getFirstName(), reviewedBy.getLastName()));
        }

        return response;
    }

    public String toJson(Map<String, Object> requestedChanges) {
        try {
            return objectMapper.writeValueAsString(requestedChanges);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Profile change request payload is not valid");
        }
    }

    public Map<String, Object> fromJson(String requestedChangesJson) {
        if (requestedChangesJson == null || requestedChangesJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(requestedChangesJson, CHANGES_TYPE);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Stored profile change request payload is not valid");
        }
    }

    private String fullName(String firstName, String lastName) {
        String normalized = ((firstName == null ? "" : firstName.trim()) + " " + (lastName == null ? "" : lastName.trim())).trim();
        return normalized.isBlank() ? null : normalized;
    }
}
