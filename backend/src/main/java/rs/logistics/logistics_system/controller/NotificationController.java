package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationPageResponse;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.dto.update.NotificationUpdate;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationServiceDefinition notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody NotificationCreate dto) {
        NotificationResponse response = notificationService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> get(@PathVariable Long id) {
        NotificationResponse response = notificationService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<NotificationPageResponse> getNotificationsForUser(@PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        NotificationPageResponse response = notificationService.getByUser(id, page, size);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{id}/unread")
    public ResponseEntity<NotificationPageResponse> getUnreadNotifications(@PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        NotificationPageResponse response = notificationService.getByUserAndStatus(id, NotificationStatus.UNREAD, page, size);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/unread/count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long id) {
        Long response = notificationService.getUnreadCount(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/{id}/mark_as_read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        NotificationResponse response = notificationService.markAsRead(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("user/{id}/mark_all_as_read")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long id) {
        notificationService.markAllAsRead(id);
        return ResponseEntity.noContent().build();
    }
}
