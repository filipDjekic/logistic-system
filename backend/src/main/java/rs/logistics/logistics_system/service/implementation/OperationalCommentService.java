package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.create.OperationalCommentCreate;
import rs.logistics.logistics_system.dto.response.OperationalCommentResponse;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.OperationalComment;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.DomainEventType;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.OperationalCommentRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;
import rs.logistics.logistics_system.service.definition.OperationalCommentServiceDefinition;
import rs.logistics.logistics_system.service.security.OperationalEntityAccessValidator;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationalCommentService implements OperationalCommentServiceDefinition {

    private final OperationalCommentRepository commentRepository;
    private final CompanyRepository companyRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final DomainEventServiceDefinition domainEventService;
    private final OperationalEntityAccessValidator operationalEntityAccessValidator;

    @Override
    @Transactional
    public OperationalCommentResponse create(OperationalCommentCreate dto) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        operationalEntityAccessValidator.ensureCanCreateOperationalContent(dto.getEntityType(), dto.getEntityId());
        Company company = resolveCompany(null, user, dto.getEntityType(), dto.getEntityId());
        OperationalComment comment = new OperationalComment();
        comment.setEntityType(dto.getEntityType());
        comment.setEntityId(dto.getEntityId());
        comment.setContent(dto.getContent().trim());
        comment.setInternalNote(Boolean.TRUE.equals(dto.getInternalNote()));
        comment.setCompany(company);
        comment.setAuthor(user);
        OperationalComment saved = commentRepository.save(comment);
        domainEventService.record(DomainEventType.COMMENT_CREATED, saved.getEntityType(), saved.getEntityId(), null, "Comment added", saved.getContent(), company != null ? company.getId() : null);
        return toResponse(saved);
    }

    @Override
    public List<OperationalCommentResponse> getForEntity(OperationalEntityType entityType, Long entityId) {
        operationalEntityAccessValidator.ensureCanAccess(entityType, entityId);
        List<OperationalComment> comments = authenticatedUserProvider.isOverlord()
                ? commentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                : commentRepository.findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(entityType, entityId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
        return comments.stream()
                .filter(this::canSeeComment)
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        OperationalComment comment = authenticatedUserProvider.isOverlord()
                ? commentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Comment not found"))
                : commentRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        operationalEntityAccessValidator.ensureCanAccess(comment.getEntityType(), comment.getEntityId());
        if (!authenticatedUserProvider.isOverlord()
                && !comment.getAuthor().getId().equals(authenticatedUserProvider.getAuthenticatedUserId())
                && !authenticatedUserProvider.isCompanyAdmin()
                && !authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                && !authenticatedUserProvider.hasRole("DISPATCHER")) {
            throw new BadRequestException("Only author or operational coordinator can delete comment");
        }
        Long companyId = comment.getCompany() != null ? comment.getCompany().getId() : null;
        domainEventService.record(DomainEventType.COMMENT_DELETED, comment.getEntityType(), comment.getEntityId(), null, "Comment deleted", comment.getContent(), companyId);
        commentRepository.delete(comment);
    }

    private boolean canSeeComment(OperationalComment comment) {
        return !Boolean.TRUE.equals(comment.getInternalNote()) || canSeeInternalOperationalNotes();
    }

    private boolean canSeeInternalOperationalNotes() {
        return authenticatedUserProvider.isOverlord()
                || authenticatedUserProvider.isCompanyAdmin()
                || authenticatedUserProvider.hasRole("HR_MANAGER")
                || authenticatedUserProvider.hasRole("WAREHOUSE_MANAGER")
                || authenticatedUserProvider.hasRole("DISPATCHER");
    }

    private Company resolveCompany(Long requestedCompanyId, User user, OperationalEntityType entityType, Long entityId) {
        Long entityCompanyId = operationalEntityAccessValidator.resolveEntityCompanyId(entityType, entityId);

        if (authenticatedUserProvider.isOverlord()) {
            Long targetCompanyId = requestedCompanyId != null ? requestedCompanyId : entityCompanyId;
            return targetCompanyId == null ? null : companyRepository.findById(targetCompanyId).orElseThrow(() -> new BadRequestException("Company not found"));
        }

        Company company = user.getCompany();
        if (company == null || company.getId() == null) throw new BadRequestException("Authenticated user is not assigned to a company");
        if (requestedCompanyId != null && !requestedCompanyId.equals(company.getId())) throw new BadRequestException("Cannot comment outside authenticated company");
        if (entityCompanyId != null && !entityCompanyId.equals(company.getId())) throw new BadRequestException("Cannot comment on entity outside authenticated company");
        return company;
    }

    private OperationalCommentResponse toResponse(OperationalComment comment) {
        OperationalCommentResponse response = new OperationalCommentResponse();
        response.setId(comment.getId());
        response.setEntityType(comment.getEntityType());
        response.setEntityId(comment.getEntityId());
        response.setContent(comment.getContent());
        response.setInternalNote(comment.getInternalNote());
        response.setCompanyId(comment.getCompany() != null ? comment.getCompany().getId() : null);
        response.setAuthorId(comment.getAuthor().getId());
        response.setAuthorEmail(comment.getAuthor().getEmail());
        response.setAuthorName(comment.getAuthor().getFirstName() + " " + comment.getAuthor().getLastName());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        return response;
    }
}
