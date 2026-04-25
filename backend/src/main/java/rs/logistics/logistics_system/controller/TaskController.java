package rs.logistics.logistics_system.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.TaskCreate;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.TaskUpdate;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.exception.BadRequestException;
import rs.logistics.logistics_system.exception.ForbiddenException;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.TaskServiceDefinition;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskServiceDefinition taskService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @PostMapping
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskCreate dto) {
        TaskResponse response = taskService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER','WAREHOUSE_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> update(@PathVariable Long id, @Valid @RequestBody TaskUpdate dto) {
        TaskResponse response = taskService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER') or @taskSecurity.isAssignedToCurrentUser(#id)")
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> get(@PathVariable Long id) {
        TaskResponse response = taskService.getById(id);

        if (authenticatedUserProvider.hasRole("DRIVER") && response.getTransportOrderId() == null) {
            throw new ForbiddenException("DRIVER can access only transport-linked tasks");
        }

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping
    public ResponseEntity<PageResponse<TaskResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long assignedEmployeeId,
            @RequestParam(required = false) Long transportOrderId,
            @RequestParam(required = false) Long stockMovementId,
            @RequestParam(required = false) String linkedProcessType,
            @PageableDefault(size = 20, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        PageResponse<TaskResponse> response = taskService.getAll(search, status, priority, assignedEmployeeId, transportOrderId, stockMovementId, linkedProcessType, pageable);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER','WAREHOUSE_MANAGER','DRIVER','WORKER')")
    @GetMapping("/my")
    public ResponseEntity<PageResponse<TaskResponse>> getMyTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long transportOrderId,
            @RequestParam(required = false) Long stockMovementId,
            @RequestParam(required = false) String linkedProcessType,
            @PageableDefault(size = 20, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        User user = authenticatedUserProvider.getAuthenticatedUser();

        if (user.getEmployee() == null) {
            throw new BadRequestException("Authenticated user is not linked to an employee");
        }

        PageResponse<TaskResponse> response = taskService.getMyTasks(search, status, priority, transportOrderId, stockMovementId, linkedProcessType, pageable);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER','WAREHOUSE_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','DISPATCHER','WAREHOUSE_MANAGER') or @taskSecurity.isAssignedToCurrentUser(#id)")
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id, @RequestBody TaskStatus dto) {
        TaskResponse response = taskService.changeStatus(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @PatchMapping("/{id}/employee/{employeeId}")
    public ResponseEntity<TaskResponse> assignTask(@PathVariable Long id, @PathVariable Long employeeId) {
        TaskResponse response = taskService.assignTask(id, employeeId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
