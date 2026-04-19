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
import rs.logistics.logistics_system.dto.create.EmployeeCreate;
import rs.logistics.logistics_system.dto.create.EmployeeWithUserCreate;
import rs.logistics.logistics_system.dto.response.EmployeeResponse;
import rs.logistics.logistics_system.dto.response.ShiftResponse;
import rs.logistics.logistics_system.dto.response.TaskResponse;
import rs.logistics.logistics_system.dto.update.EmployeeUpdate;
import rs.logistics.logistics_system.service.definition.EmployeeServiceDefinition;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeServiceDefinition employeeService;

    @PreAuthorize("hasAnyRole('OVERLORD','HR_MANAGER')")
    @PostMapping
    public ResponseEntity<EmployeeResponse> createUser(@Valid @RequestBody EmployeeCreate dto) {
        EmployeeResponse response = employeeService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER')")
    @PostMapping("/with-user")
    public ResponseEntity<EmployeeResponse> createWithUser(@Valid @RequestBody EmployeeWithUserCreate dto) {
        EmployeeResponse response = employeeService.createWithUser(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','HR_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> update(@PathVariable Long id, @Valid @RequestBody EmployeeUpdate dto) {
        EmployeeResponse response = employeeService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER') or @employeeSecurity.isSelf(#id)")
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getById(@PathVariable Long id) {
        EmployeeResponse response = employeeService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER') or @employeeSecurity.isSelf(#id)")
    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByEmployeeId(@PathVariable Long id) {
        List<TaskResponse> response = employeeService.getTasksByEmployeeId(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER') or @employeeSecurity.isSelf(#id)")
    @GetMapping("/{id}/shifts")
    public ResponseEntity<List<ShiftResponse>> getShiftsByEmployeeId(@PathVariable Long id) {
        List<ShiftResponse> response = employeeService.getShiftsByEmployeeId(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','DISPATCHER')")
    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAll() {
        List<EmployeeResponse> response = employeeService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','HR_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('OVERLORD','HR_MANAGER')")
    @PatchMapping("/terminate/{id}")
    public ResponseEntity<Void> terminateEmployee(@PathVariable Long id) {
        employeeService.terminateEmployee(id);
        return ResponseEntity.noContent().build();
    }
}
