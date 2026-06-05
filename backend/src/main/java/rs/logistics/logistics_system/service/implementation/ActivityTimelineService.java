package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rs.logistics.logistics_system.dto.response.ActivityTimelineItemResponse;
import rs.logistics.logistics_system.entity.DomainEvent;
import rs.logistics.logistics_system.entity.OperationalAttachment;
import rs.logistics.logistics_system.entity.OperationalComment;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.ActivityTimelineItemType;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.repository.DomainEventRepository;
import rs.logistics.logistics_system.repository.OperationalAttachmentRepository;
import rs.logistics.logistics_system.repository.OperationalCommentRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ActivityTimelineServiceDefinition;
import rs.logistics.logistics_system.service.security.OperationalEntityAccessValidator;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityTimelineService implements ActivityTimelineServiceDefinition {

    private final OperationalCommentRepository commentRepository;
    private final OperationalAttachmentRepository attachmentRepository;
    private final DomainEventRepository domainEventRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final OperationalEntityAccessValidator operationalEntityAccessValidator;

    @Override
    public List<ActivityTimelineItemResponse> getForEntity(OperationalEntityType entityType, Long entityId) {
        operationalEntityAccessValidator.ensureCanAccess(entityType, entityId);
        Long companyId = authenticatedUserProvider.isOverlord() ? null : authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow();
        List<ActivityTimelineItemResponse> timeline = new ArrayList<>();

        List<OperationalComment> comments = companyId == null
                ? commentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                : commentRepository.findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(entityType, entityId, companyId);
        comments.forEach(comment -> timeline.add(fromComment(comment)));

        List<OperationalAttachment> attachments = companyId == null
                ? attachmentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                : attachmentRepository.findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(entityType, entityId, companyId);
        attachments.forEach(attachment -> timeline.add(fromAttachment(attachment)));

        List<DomainEvent> events = companyId == null
                ? domainEventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                : domainEventRepository.findByEntityTypeAndEntityIdAndCompany_IdOrderByCreatedAtDesc(entityType, entityId, companyId);
        events.forEach(event -> timeline.add(fromDomainEvent(event)));

        return sort(timeline);
    }

    @Override
    public List<ActivityTimelineItemResponse> getRecent() {
        List<DomainEvent> events = authenticatedUserProvider.isOverlord()
                ? domainEventRepository.findTop50ByOrderByCreatedAtDesc()
                : domainEventRepository.findTop50ByCompany_IdOrderByCreatedAtDesc(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());
        return events.stream().map(this::fromDomainEvent).toList();
    }

    private List<ActivityTimelineItemResponse> sort(List<ActivityTimelineItemResponse> items) {
        return items.stream()
                .sorted(Comparator.comparing(ActivityTimelineItemResponse::getOccurredAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    private ActivityTimelineItemResponse fromComment(OperationalComment comment) {
        return new ActivityTimelineItemResponse(ActivityTimelineItemType.COMMENT, comment.getId(), comment.getEntityType(), comment.getEntityId(), "Comment", comment.getContent(), name(comment.getAuthor()), email(comment.getAuthor()), comment.getCreatedAt());
    }

    private ActivityTimelineItemResponse fromAttachment(OperationalAttachment attachment) {
        return new ActivityTimelineItemResponse(ActivityTimelineItemType.ATTACHMENT, attachment.getId(), attachment.getEntityType(), attachment.getEntityId(), "Attachment: " + attachment.getFileName(), attachment.getDescription(), name(attachment.getUploadedBy()), email(attachment.getUploadedBy()), attachment.getCreatedAt());
    }

    private ActivityTimelineItemResponse fromDomainEvent(DomainEvent event) {
        return new ActivityTimelineItemResponse(ActivityTimelineItemType.DOMAIN_EVENT, event.getId(), event.getEntityType(), event.getEntityId(), event.getEventType().name(), event.getSummary(), name(event.getCreatedBy()), email(event.getCreatedBy()), event.getCreatedAt());
    }

    private String name(User user) {
        return user == null ? null : user.getFirstName() + " " + user.getLastName();
    }

    private String email(User user) {
        return user == null ? null : user.getEmail();
    }
}
