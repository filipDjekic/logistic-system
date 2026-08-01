package rs.logistics.logistics_system.controller;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import rs.logistics.logistics_system.dto.response.OperationalAttachmentResponse;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.service.definition.OperationalAttachmentServiceDefinition;
import rs.logistics.logistics_system.testsupport.IntegrationTestSupport;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OperationalAttachmentControllerSecurityTest extends IntegrationTestSupport {

    @MockitoBean
    private OperationalAttachmentServiceDefinition attachmentService;

    @Test
    void anonymousDownloadIsRejectedBeforeAttachmentLookup() throws Exception {
        mockMvc.perform(get("/api/operational-attachments/17/download"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(attachmentService);
    }

    @Test
    @WithMockUser(roles = "DISPATCHER")
    void authorizedDownloadReturnsAttachmentHeadersAndContent() throws Exception {
        OperationalAttachmentResponse attachment = new OperationalAttachmentResponse();
        attachment.setFileName("delivery-note.pdf");
        attachment.setContentType("application/pdf");
        when(attachmentService.getById(17L)).thenReturn(attachment);
        when(attachmentService.download(17L)).thenReturn(new ByteArrayResource("test".getBytes()));

        mockMvc.perform(get("/api/operational-attachments/17/download"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("delivery-note.pdf")
                ))
                .andExpect(content().bytes("test".getBytes()));
    }

    @Test
    @WithMockUser(roles = "DISPATCHER")
    void inaccessibleAttachmentDoesNotReturnFileContent() throws Exception {
        when(attachmentService.getById(17L))
                .thenThrow(new ResourceNotFoundException("Attachment not found"));

        mockMvc.perform(get("/api/operational-attachments/17/download"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("test"))));
    }
}
