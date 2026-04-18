package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.auth.ChangePasswordRequest;
import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.AssignRoleRequest;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.service.definition.UserServiceDefinition;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserServiceDefinition userService;

    @PreAuthorize("hasRole('OVERLORD')")
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreate dto) {
        UserResponse userResponse = userService.create(dto);
        return new ResponseEntity<>(userResponse, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','HR_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdate dto) {
        UserResponse userResponse = userService.update(id, dto);
        return ResponseEntity.ok(userResponse);
    }

    @PreAuthorize("hasRole('OVERLORD') or @authenticatedUserProvider.isSelf(#id)")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        UserResponse response = userService.getById(id);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','HR_MANAGER')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll() {
        List<UserResponse> userResponse = userService.getAll();
        return ResponseEntity.ok(userResponse);
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @PatchMapping("/{id}/enable")
    public ResponseEntity<Void> enableUser(@PathVariable Long id) {
        userService.enableUser(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @PatchMapping("/{id}/disable")
    public ResponseEntity<Void> disableUser(@PathVariable Long id) {
        userService.disableUser(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('OVERLORD') or @authenticatedUserProvider.isSelf(#id)")
    @PatchMapping("/{id}/change_password")
    public ResponseEntity<Void> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @PatchMapping("/{id}/assign-role")
    public ResponseEntity<UserResponse> assignRole(@PathVariable Long id, @Valid @RequestBody AssignRoleRequest request) {
        return ResponseEntity.ok(userService.assignRole(id, request.getRoleId()));
    }
}
