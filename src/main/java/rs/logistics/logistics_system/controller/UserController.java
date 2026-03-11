package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.UserCreate;
import rs.logistics.logistics_system.dto.response.UserResponse;
import rs.logistics.logistics_system.dto.update.UserUpdate;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.service.definition.UserServiceDefinition;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserServiceDefinition userService;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody UserCreate dto, @RequestBody Role role) {
        UserResponse userResponse = userService.create(dto, role);
        return new ResponseEntity<>(userResponse, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UserUpdate dto, @RequestBody Role role) {
        UserResponse userResponse = userService.update(id, dto, role);
        return ResponseEntity.ok(userResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        UserResponse response = userService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public  ResponseEntity<List<UserResponse>> getAll() {
        List<UserResponse> userResponse = userService.getAll();
        return ResponseEntity.ok(userResponse);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
