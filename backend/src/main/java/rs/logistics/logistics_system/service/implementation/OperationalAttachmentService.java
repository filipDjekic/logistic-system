package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.OperationalAttachmentCreate;
import rs.logistics.logistics_system.dto.response.OperationalAttachmentResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.OperationalAttachment;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.OperationalAttachmentRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;
import rs.logistics.logistics_system.service.definition.OperationalAttachmentServiceDefinition;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationalAttachmentService implements OperationalAttachmentServiceDefinition {

    private final OperationalAttachmentRepository attachmentRepository;
    private final CompanyRepository companyRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final DomainEventServiceDefinition domainEventService;

    @Override
    @Transactional
    public OperationalAttachmentResponse create(OperationalAttachmentCreate dto) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Company company = resolveCompany(dto.getCompanyId(), user);
        OperationalAttachment attachment = new OperationalAttachment();
        attachment.setEntityType(dto.getEntityType());
        attachment.setEntityId(dto.getEntityId());
        attachment.setFileName(dto.getFileName().trim());
        attachment.setContentType(trim(dto.getContentType()));
        attachment.setFileUrl(dto.getFileUrl().trim());
        attachment.setSizeBytes(dto.getSizeBytes());
        attachment.setDescription(trim(dto.getDescription()));
        attachment.setCompany(company);
        attachment.setUploadedBy(user);
        OperationalAttachment saved = attachmentRepository.save(attachment);
        domainEventService.record(DomainEventType.ATTACHMENT_ADDED, saved.getEntityType(), saved.getEntityId(), saved.getFileName(), "Attachment added: " + saved.getFileName(), saved.getDescription(), company != null ? company.getId() : null);
        return toResponse(saved);
    }

    @Override
    public List<OperationalAttachmentResponse> getForEntity(OperationalEntityType entityType, Long entityId) {
        List<OperationalAttachment> attachments = authenticatedUserProvider.isOverlord()
                ? attachmentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                : attachmentRepository.findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(entityType, entityId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
        return attachments.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        OperationalAttachment attachment = attachmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        ensureAccess(attachment.getCompany() != null ? attachment.getCompany().getId() : null);
        domainEventService.record(DomainEventType.ATTACHMENT_REMOVED, attachment.getEntityType(), attachment.getEntityId(), attachment.getFileName(), "Attachment removed: " + attachment.getFileName(), attachment.getDescription(), attachment.getCompany() != null ? attachment.getCompany().getId() : null);
        attachmentRepository.delete(attachment);
    }

    private Company resolveCompany(Long requestedCompanyId, User user) {
        if (authenticatedUserProvider.isOverlord()) {
            return requestedCompanyId == null ? null : companyRepository.findById(requestedCompanyId).orElseThrow(() -> new BadRequestException("Company not found"));
        }
        Company company = user.getCompany();
        if (company == null || company.getId() == null) throw new BadRequestException("Authenticated user is not assigned to a company");
        if (requestedCompanyId != null && !requestedCompanyId.equals(company.getId())) throw new BadRequestException("Cannot attach file outside authenticated company");
        return company;
    }

    private void ensureAccess(Long companyId) {
        if (!authenticatedUserProvider.isOverlord()) {
            authenticatedUserProvider.ensureCompanyAccess(companyId);
        }
    }

    private OperationalAttachmentResponse toResponse(OperationalAttachment attachment) {
        OperationalAttachmentResponse response = new OperationalAttachmentResponse();
        response.setId(attachment.getId());
        response.setEntityType(attachment.getEntityType());
        response.setEntityId(attachment.getEntityId());
        response.setFileName(attachment.getFileName());
        response.setContentType(attachment.getContentType());
        response.setFileUrl(attachment.getFileUrl());
        response.setSizeBytes(attachment.getSizeBytes());
        response.setDescription(attachment.getDescription());
        response.setCompanyId(attachment.getCompany() != null ? attachment.getCompany().getId() : null);
        response.setUploadedById(attachment.getUploadedBy().getId());
        response.setUploadedByEmail(attachment.getUploadedBy().getEmail());
        response.setUploadedByName(attachment.getUploadedBy().getFirstName() + " " + attachment.getUploadedBy().getLastName());
        response.setCreatedAt(attachment.getCreatedAt());
        return response;
    }

    private String trim(String value) { return value == null ? null : value.trim(); }
}
