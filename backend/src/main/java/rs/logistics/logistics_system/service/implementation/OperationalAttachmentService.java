package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
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
import rs.logistics.logistics_system.service.security.OperationalEntityAccessValidator;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationalAttachmentService implements OperationalAttachmentServiceDefinition {

    private static final long MAX_ATTACHMENT_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final int MAX_ATTACHMENT_FILE_NAME_LENGTH = 180;
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of("exe", "bat", "cmd", "sh", "ps1", "js", "jar", "msi", "dll", "com", "scr");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp",
            "text/plain",
            "text/csv",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "png", "jpg", "jpeg", "webp", "txt", "csv", "docx", "xlsx");

    private final OperationalAttachmentRepository attachmentRepository;
    private final CompanyRepository companyRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final DomainEventServiceDefinition domainEventService;
    private final OperationalEntityAccessValidator operationalEntityAccessValidator;

    @Value("${logistics.attachments.storage-directory:uploads/operational-attachments}")
    private String storageDirectory;

    @Override
    @Transactional
    public OperationalAttachmentResponse create(OperationalAttachmentCreate dto) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        operationalEntityAccessValidator.ensureCanAccess(dto.getEntityType(), dto.getEntityId());
        Company company = resolveCompany(dto.getCompanyId(), user, dto.getEntityType(), dto.getEntityId());
        validateExternalAttachment(dto);
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
    @Transactional
    public OperationalAttachmentResponse upload(OperationalEntityType entityType, Long entityId, MultipartFile file, String description, Long companyId) {
        User user = authenticatedUserProvider.getAuthenticatedUser();
        operationalEntityAccessValidator.ensureCanAccess(entityType, entityId);
        Company company = resolveCompany(companyId, user, entityType, entityId);

        validateUpload(file);

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String contentType = file.getContentType() == null || file.getContentType().isBlank()
                ? "application/octet-stream"
                : file.getContentType();
        OperationalAttachment attachment = new OperationalAttachment();
        attachment.setEntityType(entityType);
        attachment.setEntityId(entityId);
        attachment.setFileName(originalFileName);
        attachment.setContentType(contentType);
        attachment.setFileUrl("pending-upload");
        attachment.setSizeBytes(file.getSize());
        attachment.setDescription(trim(description));
        attachment.setCompany(company);
        attachment.setUploadedBy(user);

        OperationalAttachment saved = attachmentRepository.save(attachment);

        Path storagePath = Paths.get(storageDirectory).toAbsolutePath().normalize();
        Path targetPath = storagePath.resolve(buildStoredFileName(saved)).normalize();

        if (!targetPath.startsWith(storagePath)) {
            throw new BadRequestException("Invalid attachment path");
        }

        try {
            Files.createDirectories(storagePath);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new BadRequestException("Attachment could not be stored");
        }

        saved.setFileUrl("/api/operational-attachments/" + saved.getId() + "/download");
        saved = attachmentRepository.save(saved);

        domainEventService.record(DomainEventType.ATTACHMENT_ADDED, saved.getEntityType(), saved.getEntityId(), saved.getFileName(), "Attachment uploaded: " + saved.getFileName(), saved.getDescription(), company != null ? company.getId() : null);
        return toResponse(saved);
    }

    @Override
    public OperationalAttachmentResponse getById(Long id) {
        OperationalAttachment attachment = getAccessibleAttachment(id);
        operationalEntityAccessValidator.ensureCanAccess(attachment.getEntityType(), attachment.getEntityId());
        return toResponse(attachment);
    }

    @Override
    public Resource download(Long id) {
        OperationalAttachment attachment = getAccessibleAttachment(id);
        operationalEntityAccessValidator.ensureCanAccess(attachment.getEntityType(), attachment.getEntityId());
        Path path = resolveStoredFilePath(attachment.getFileUrl());
        try {
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Attachment file not found");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Attachment file not found");
        }
    }

    @Override
    public List<OperationalAttachmentResponse> getForEntity(OperationalEntityType entityType, Long entityId) {
        operationalEntityAccessValidator.ensureCanAccess(entityType, entityId);
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
        operationalEntityAccessValidator.ensureCanAccess(attachment.getEntityType(), attachment.getEntityId());
        deleteStoredFileIfExists(attachment);
        domainEventService.record(DomainEventType.ATTACHMENT_REMOVED, attachment.getEntityType(), attachment.getEntityId(), attachment.getFileName(), "Attachment removed: " + attachment.getFileName(), attachment.getDescription(), attachment.getCompany() != null ? attachment.getCompany().getId() : null);
        attachmentRepository.delete(attachment);
    }


    private OperationalAttachment getAccessibleAttachment(Long id) {
        OperationalAttachment attachment = attachmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        ensureAccess(attachment.getCompany() != null ? attachment.getCompany().getId() : null);
        operationalEntityAccessValidator.ensureCanAccess(attachment.getEntityType(), attachment.getEntityId());
        return attachment;
    }

    private void validateExternalAttachment(OperationalAttachmentCreate dto) {
        String fileName = sanitizeFileName(dto.getFileName());
        if (fileName.length() > MAX_ATTACHMENT_FILE_NAME_LENGTH) {
            throw new BadRequestException("Attachment file name is too long");
        }

        String extension = fileExtension(fileName);
        if (!extension.isBlank() && (!ALLOWED_EXTENSIONS.contains(extension) || BLOCKED_EXTENSIONS.contains(extension))) {
            throw new BadRequestException("Unsupported attachment file extension");
        }

        String fileUrl = dto.getFileUrl() == null ? "" : dto.getFileUrl().trim();
        if (fileUrl.isBlank()) {
            throw new BadRequestException("Attachment file URL is required");
        }
        if (!(fileUrl.startsWith("https://") || fileUrl.startsWith("/api/operational-attachments/"))) {
            throw new BadRequestException("Attachment URL must be HTTPS or an internal attachment download URL");
        }

        String contentType = trim(dto.getContentType());
        if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Unsupported attachment content type");
        }
    }

    private void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Attachment file is required");
        }

        if (file.getSize() > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new BadRequestException("Attachment file size must be 10 MB or less");
        }

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        if (originalFileName.length() > MAX_ATTACHMENT_FILE_NAME_LENGTH) {
            throw new BadRequestException("Attachment file name is too long");
        }

        String extension = fileExtension(originalFileName);
        if (extension.isBlank() || !ALLOWED_EXTENSIONS.contains(extension) || BLOCKED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported attachment file extension");
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank() || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Unsupported attachment content type");
        }
    }

    private String sanitizeFileName(String value) {
        String fileName = value == null || value.isBlank() ? "attachment" : value.trim();
        fileName = Paths.get(fileName).getFileName().toString();
        fileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        return fileName.isBlank() ? "attachment" : fileName;
    }

    private String fileExtension(String fileName) {
        int index = fileName == null ? -1 : fileName.lastIndexOf('.');
        return index < 0 || index == fileName.length() - 1 ? "" : fileName.substring(index + 1).toLowerCase();
    }

    private Path resolveStoredFilePath(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith("/api/operational-attachments/") || !fileUrl.endsWith("/download")) {
            throw new ResourceNotFoundException("Attachment file not found");
        }

        String idSegment = fileUrl
                .replace("/api/operational-attachments/", "")
                .replace("/download", "");

        Long attachmentId;
        try {
            attachmentId = Long.parseLong(idSegment);
        } catch (NumberFormatException ex) {
            throw new ResourceNotFoundException("Attachment file not found");
        }

        OperationalAttachment attachment = attachmentRepository.findById(attachmentId).orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        Path storagePath = Paths.get(storageDirectory).toAbsolutePath().normalize();
        return storagePath.resolve(buildStoredFileName(attachment)).normalize();
    }

    private String buildStoredFileName(OperationalAttachment attachment) {
        if (attachment.getId() == null) {
            throw new BadRequestException("Attachment must be saved before file storage");
        }
        return attachment.getId() + "-" + sanitizeFileName(attachment.getFileName());
    }

    private void deleteStoredFileIfExists(OperationalAttachment attachment) {
        if (attachment.getFileUrl() == null || !attachment.getFileUrl().startsWith("/api/operational-attachments/")) {
            return;
        }

        try {
            Files.deleteIfExists(resolveStoredFilePath(attachment.getFileUrl()));
        } catch (RuntimeException | IOException ignored) {
            // Metadata delete must not fail only because the local file was already removed.
        }
    }

    private Company resolveCompany(Long requestedCompanyId, User user, OperationalEntityType entityType, Long entityId) {
        Long entityCompanyId = operationalEntityAccessValidator.resolveEntityCompanyId(entityType, entityId);

        if (authenticatedUserProvider.isOverlord()) {
            Long targetCompanyId = requestedCompanyId != null ? requestedCompanyId : entityCompanyId;
            return targetCompanyId == null ? null : companyRepository.findById(targetCompanyId).orElseThrow(() -> new BadRequestException("Company not found"));
        }

        Company company = user.getCompany();
        if (company == null || company.getId() == null) throw new BadRequestException("Authenticated user is not assigned to a company");
        if (requestedCompanyId != null && !requestedCompanyId.equals(company.getId())) throw new BadRequestException("Cannot attach file outside authenticated company");
        if (entityCompanyId != null && !entityCompanyId.equals(company.getId())) throw new BadRequestException("Cannot attach file to entity outside authenticated company");
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
