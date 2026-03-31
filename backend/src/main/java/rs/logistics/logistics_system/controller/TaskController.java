package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.EmployeeServiceDefinition;
import rs.logistics.logistics_system.service.definition.TaskServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskServiceDefinition taskService;
    private final EmployeeServiceDefinition employeeService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @PreAuthorize("hasAnyRole('ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @PostMapping
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskCreate dto) {
        TaskResponse response = taskService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> update(@PathVariable Long id, @Valid @RequestBody TaskUpdate dto) {
        TaskResponse response = taskService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('ADMIN','DISPATCHER','WAREHOUSE_MANAGER') or @taskSecurity.isAssignedToCurrentUser(#id)")
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> get(@PathVariable Long id) {
        TaskResponse response = taskService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAll() {
        List<TaskResponse> response = taskService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('USER','OPERATIVE','ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping("/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks() {
        User user = authenticatedUserProvider.getAuthenticatedUser();

        if (user.getEmployee() == null) {
            throw new BadRequestException("Authenticated user is not linked to an employee");
        }

        List<TaskResponse> response = employeeService.getTasksByEmployeeId(user.getEmployee().getId());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','DISPATCHER','WAREHOUSE_MANAGER','OPERATIVE') or @taskSecurity.isAssignedToCurrentUser(#id)")
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id, @RequestBody TaskStatus dto) {
        TaskResponse response = taskService.changeStatus(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @PatchMapping("/{id}/employee/{employeeId}")
    public ResponseEntity<TaskResponse> assignTask(@PathVariable Long id, @PathVariable Long employeeId) {
        TaskResponse response = taskService.assignTask(id, employeeId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}