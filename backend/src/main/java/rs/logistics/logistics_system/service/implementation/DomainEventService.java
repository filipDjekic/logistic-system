package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.DomainEventCreate;
import rs.logistics.logistics_system.dto.response.DomainEventResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.DomainEvent;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.DomainEventRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;
import rs.logistics.logistics_system.service.security.OperationalEntityAccessValidator;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DomainEventService implements DomainEventServiceDefinition {

    private final DomainEventRepository domainEventRepository;
    private final CompanyRepository companyRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final OperationalEntityAccessValidator operationalEntityAccessValidator;

    @Override
    @Transactional
    public DomainEventResponse create(DomainEventCreate dto) {
        return record(dto.getEventType(), dto.getEntityType(), dto.getEntityId(), dto.getEntityIdentifier(), dto.getSummary(), dto.getPayload(), dto.getCompanyId());
    }

    @Override
    @Transactional
    public DomainEventResponse record(DomainEventType eventType, OperationalEntityType entityType, Long entityId, String entityIdentifier, String summary, String payload, Long companyId) {
        if (eventType == null || entityType == null || entityId == null || summary == null || summary.isBlank()) {
            throw new BadRequestException("Domain event type, entity and summary are required");
        }

        User actor = authenticatedUserProvider.getAuthenticatedUser();
        operationalEntityAccessValidator.ensureCanAccess(entityType, entityId);
        Company company = resolveCompany(companyId, actor, entityType, entityId);

        DomainEvent event = new DomainEvent();
        event.setEventType(eventType);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setEntityIdentifier(trim(entityIdentifier));
        event.setSummary(summary.trim());
        event.setPayload(trim(payload));
        event.setCompany(company);
        event.setCreatedBy(actor);
        return toResponse(domainEventRepository.save(event));
    }

    @Override
    public List<DomainEventResponse> getForEntity(OperationalEntityType entityType, Long entityId) {
        operationalEntityAccessValidator.ensureCanAccess(entityType, entityId);
        List<DomainEvent> events = authenticatedUserProvider.isOverlord()
                ? domainEventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                : domainEventRepository.findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(entityType, entityId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
        return events.stream().map(this::toResponse).toList();
    }

    @Override
    public List<DomainEventResponse> getRecent() {
        List<DomainEvent> events = authenticatedUserProvider.isOverlord()
                ? domainEventRepository.findTop50ByOrderByCreatedAtDesc()
                : domainEventRepository.findTop50ByCompany_IdOrderByCreatedAtDesc(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
        return events.stream().map(this::toResponse).toList();
    }

    private Company resolveCompany(Long requestedCompanyId, User actor, OperationalEntityType entityType, Long entityId) {
        Long entityCompanyId = operationalEntityAccessValidator.resolveEntityCompanyId(entityType, entityId);

        if (authenticatedUserProvider.isOverlord()) {
            Long targetCompanyId = requestedCompanyId != null ? requestedCompanyId : entityCompanyId;
            if (targetCompanyId == null) {
                return null;
            }
            return companyRepository.findById(targetCompanyId).orElseThrow(() -> new BadRequestException("Company not found"));
        }

        Company company = actor.getCompany();
        if (company == null || company.getId() == null) {
            throw new BadRequestException("Authenticated user is not assigned to a company");
        }
        if (requestedCompanyId != null && !requestedCompanyId.equals(company.getId())) {
            throw new BadRequestException("Cannot create event outside authenticated company");
        }
        if (entityCompanyId != null && !entityCompanyId.equals(company.getId())) {
            throw new BadRequestException("Cannot create event for entity outside authenticated company");
        }
        return company;
    }

    private DomainEventResponse toResponse(DomainEvent event) {
        DomainEventResponse response = new DomainEventResponse();
        response.setId(event.getId());
        response.setEventType(event.getEventType());
        response.setEntityType(event.getEntityType());
        response.setEntityId(event.getEntityId());
        response.setEntityIdentifier(event.getEntityIdentifier());
        response.setSummary(event.getSummary());
        response.setPayload(event.getPayload());
        response.setCompanyId(event.getCompany() != null ? event.getCompany().getId() : null);
        response.setCreatedById(event.getCreatedBy() != null ? event.getCreatedBy().getId() : null);
        response.setCreatedByEmail(event.getCreatedBy() != null ? event.getCreatedBy().getEmail() : null);
        response.setCreatedByName(event.getCreatedBy() != null ? event.getCreatedBy().getFirstName() + " " + event.getCreatedBy().getLastName() : null);
        response.setCreatedAt(event.getCreatedAt());
        return response;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
