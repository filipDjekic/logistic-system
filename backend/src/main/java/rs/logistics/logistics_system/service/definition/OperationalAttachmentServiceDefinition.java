package rs.logistics.logistics_system.service.definition;

import rs.logistics.logistics_system.dto.create.OperationalAttachmentCreate;
import rs.logistics.logistics_system.dto.response.OperationalAttachmentResponse;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.enums.OperationalAttachmentType;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface OperationalAttachmentServiceDefinition {
    OperationalAttachmentResponse create(OperationalAttachmentCreate dto);
    OperationalAttachmentResponse upload(OperationalEntityType entityType, Long entityId, MultipartFile file, OperationalAttachmentType attachmentType, String description, Long companyId);
    Resource download(Long id);
    OperationalAttachmentResponse getById(Long id);
    List<OperationalAttachmentResponse> getForEntity(OperationalEntityType entityType, Long entityId);
    void delete(Long id);
}
