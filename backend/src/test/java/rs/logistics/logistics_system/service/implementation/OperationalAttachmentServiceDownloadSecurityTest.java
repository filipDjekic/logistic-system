package rs.logistics.logistics_system.service.implementation;

import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import rs.logistics.logistics_system.entity.Company;
import rs.logistics.logistics_system.entity.OperationalAttachment;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.repository.CompanyRepository;
import rs.logistics.logistics_system.repository.OperationalAttachmentRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.DomainEventServiceDefinition;
import rs.logistics.logistics_system.service.security.OperationalEntityAccessValidator;
import rs.logistics.logistics_system.testsupport.ServiceTestSupport;
import rs.logistics.logistics_system.testsupport.TestEntityFactory;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OperationalAttachmentServiceDownloadSecurityTest extends ServiceTestSupport {

    @Mock private OperationalAttachmentRepository attachmentRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private AuthenticatedUserProvider authenticatedUserProvider;
    @Mock private DomainEventServiceDefinition domainEventService;
    @Mock private OperationalEntityAccessValidator operationalEntityAccessValidator;

    @InjectMocks
    private OperationalAttachmentService service;

    @Test
    void rejectsInternalFileUrlThatReferencesAnotherAttachmentId() {
        Company company = TestEntityFactory.company(1L);
        OperationalAttachment attachment = new OperationalAttachment();
        TestEntityFactory.setId(attachment, 17L);
        attachment.setEntityType(OperationalEntityType.TRANSPORT_ORDER);
        attachment.setEntityId(42L);
        attachment.setFileName("delivery-note.pdf");
        attachment.setFileUrl("/api/operational-attachments/99/download");
        attachment.setCompany(company);

        when(attachmentRepository.findById(17L)).thenReturn(Optional.of(attachment));
        when(authenticatedUserProvider.isOverlord()).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> service.download(17L));

        verify(authenticatedUserProvider).ensureCompanyAccess(1L);
        verify(operationalEntityAccessValidator, times(2))
                .ensureCanAccess(OperationalEntityType.TRANSPORT_ORDER, 42L);
        verify(attachmentRepository, never()).findById(99L);
    }
}
