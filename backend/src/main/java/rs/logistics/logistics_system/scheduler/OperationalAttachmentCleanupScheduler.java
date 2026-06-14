package rs.logistics.logistics_system.scheduler;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.OperationalAttachment;
import rs.logistics.logistics_system.repository.OperationalAttachmentRepository;

@Component
@RequiredArgsConstructor
public class OperationalAttachmentCleanupScheduler {

    private static final String PENDING_UPLOAD = "pending-upload";
    private static final String INTERNAL_ATTACHMENT_PREFIX = "/api/operational-attachments/";

    private final OperationalAttachmentRepository attachmentRepository;

    @Value("${logistics.attachments.storage-directory:uploads/operational-attachments}")
    private String storageDirectory;

    @Scheduled(cron = "${app.attachments.cleanup-cron:0 45 3 * * *}")
    @Transactional
    public void cleanupAttachments() {
        cleanupStalePendingMetadata();
        cleanupMissingFileMetadata();
        cleanupOrphanFiles();
    }

    private void cleanupStalePendingMetadata() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        attachmentRepository.findByFileUrlAndCreatedAtBefore(PENDING_UPLOAD, cutoff)
                .forEach(attachmentRepository::delete);
    }

    private void cleanupMissingFileMetadata() {
        attachmentRepository.findTop500ByFileUrlStartingWithOrderByCreatedAtAsc(INTERNAL_ATTACHMENT_PREFIX)
                .stream()
                .filter(attachment -> !Files.exists(resolveStoredPath(attachment)))
                .forEach(attachmentRepository::delete);
    }

    private void cleanupOrphanFiles() {
        Path storagePath = storagePath();
        if (!Files.isDirectory(storagePath)) {
            return;
        }

        try (Stream<Path> files = Files.list(storagePath)) {
            files.filter(Files::isRegularFile)
                    .filter(path -> attachmentIdFromStoredFile(path.getFileName().toString()) == null
                            || attachmentRepository.findById(attachmentIdFromStoredFile(path.getFileName().toString())).isEmpty())
                    .forEach(this::deleteQuietly);
        } catch (IOException ignored) {

        }
    }

    private Path resolveStoredPath(OperationalAttachment attachment) {
        return storagePath().resolve(attachment.getId() + "-" + sanitizeFileName(attachment.getFileName())).normalize();
    }

    private Path storagePath() {
        return Paths.get(storageDirectory).toAbsolutePath().normalize();
    }

    private Long attachmentIdFromStoredFile(String fileName) {
        if (fileName == null || !fileName.contains("-")) {
            return null;
        }

        try {
            return Long.parseLong(fileName.substring(0, fileName.indexOf('-')));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String sanitizeFileName(String value) {
        String fileName = value == null || value.isBlank() ? "attachment" : value.trim();
        fileName = Paths.get(fileName).getFileName().toString();
        fileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        return fileName.isBlank() ? "attachment" : fileName;
    }

    private void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
        }
    }
}
