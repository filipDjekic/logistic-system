package rs.logistics.logistics_system.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationPageResponse;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.enums.NotificationStatus;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationServiceDefinition notificationService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PostMapping
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody NotificationCreate dto) {
        NotificationResponse response = notificationService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN') or @notificationSecurity.isOwner(#id)")
    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> get(@PathVariable Long id) {
        NotificationResponse response = notificationService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @GetMapping("/user/{id}")
    public ResponseEntity<NotificationPageResponse> getNotificationsForUser(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        NotificationPageResponse response = notificationService.getByUser(id, page, size);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @GetMapping("/my")
    public ResponseEntity<NotificationPageResponse> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = authenticatedUserProvider.getAuthenticatedUserId();
        NotificationPageResponse response = notificationService.getByUser(userId, page, size);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @GetMapping("/user/{id}/unread")
    public ResponseEntity<NotificationPageResponse> getUnreadNotifications(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        NotificationPageResponse response = notificationService.getByUserAndStatus(id, NotificationStatus.UNREAD, page, size);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @GetMapping("/my/unread")
    public ResponseEntity<NotificationPageResponse> getMyUnreadNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = authenticatedUserProvider.getAuthenticatedUserId();
        NotificationPageResponse response = notificationService.getByUserAndStatus(userId, NotificationStatus.UNREAD, page, size);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @GetMapping("/user/{id}/unread/count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long id) {
        Long response = notificationService.getUnreadCount(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @GetMapping("/my/unread/count")
    public ResponseEntity<Long> getMyUnreadCount() {
        Long userId = authenticatedUserProvider.getAuthenticatedUserId();
        Long response = notificationService.getUnreadCount(userId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN') or @notificationSecurity.isOwner(#id)")
    @PatchMapping("/{id}/mark_as_read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        NotificationResponse response = notificationService.markAsRead(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PatchMapping("/user/{id}/mark_all_as_read")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long id) {
        notificationService.markAllAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @PatchMapping("/my/mark_all_as_read")
    public ResponseEntity<Void> markAllMyAsRead() {
        Long userId = authenticatedUserProvider.getAuthenticatedUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}