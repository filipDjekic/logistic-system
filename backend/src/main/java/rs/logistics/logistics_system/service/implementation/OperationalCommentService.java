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

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationalCommentService implements OperationalCommentServiceDefinition {

    private final OperationalCommentRepository commentRepository;
    private final CompanyRepository companyRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final DomainEventServiceDefinition domainEventService;

    @Override
    @Transactional
    public OperationalCommentResponse create(OperationalCommentCreate dto) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        Company company = resolveCompany(dto.getCompanyId(), user);
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
        List<OperationalComment> comments = authenticatedUserProvider.isOverlord()
                ? commentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                : commentRepository.findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(entityType, entityId, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
        return comments.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        OperationalComment comment = authenticatedUserProvider.isOverlord()
                ? commentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Comment not found"))
                : commentRepository.findByIdAndCompany_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()).orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!authenticatedUserProvider.isOverlord() && !comment.getAuthor().getId().equals(authenticatedUserProvider.getAuthenticatedUserId()) && !authenticatedUserProvider.isCompanyAdmin()) {
            throw new BadRequestException("Only author or company admin can delete comment");
        }
        Long companyId = comment.getCompany() != null ? comment.getCompany().getId() : null;
        domainEventService.record(DomainEventType.COMMENT_DELETED, comment.getEntityType(), comment.getEntityId(), null, "Comment deleted", comment.getContent(), companyId);
        commentRepository.delete(comment);
    }

    private Company resolveCompany(Long requestedCompanyId, User user) {
        if (authenticatedUserProvider.isOverlord()) {
            return requestedCompanyId == null ? null : companyRepository.findById(requestedCompanyId).orElseThrow(() -> new BadRequestException("Company not found"));
        }
        Company company = user.getCompany();
        if (company == null || company.getId() == null) throw new BadRequestException("Authenticated user is not assigned to a company");
        if (requestedCompanyId != null && !requestedCompanyId.equals(company.getId())) throw new BadRequestException("Cannot comment outside authenticated company");
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
