package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.EmployeeWarehouseAssignmentCreate;
import rs.logistics.logistics_system.dto.response.EmployeeWarehouseAssignmentResponse;
import rs.logistics.logistics_system.dto.update.EmployeeWarehouseAssignmentUpdate;
import rs.logistics.logistics_system.service.definition.EmployeeWarehouseAssignmentServiceDefinition;

import java.util.List;

@RestController
@RequestMapping("/api/employee-warehouse-assignments")
@RequiredArgsConstructor
public class EmployeeWarehouseAssignmentController {

    private final EmployeeWarehouseAssignmentServiceDefinition assignmentService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER')")
    @PostMapping
    public ResponseEntity<EmployeeWarehouseAssignmentResponse> create(@Valid @RequestBody EmployeeWarehouseAssignmentCreate dto) {
        return new ResponseEntity<>(assignmentService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeWarehouseAssignmentResponse> update(@PathVariable Long id, @Valid @RequestBody EmployeeWarehouseAssignmentUpdate dto) {
        return ResponseEntity.ok(assignmentService.update(id, dto));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER')")
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeeWarehouseAssignmentResponse>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(assignmentService.getByEmployee(employeeId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER')")
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<EmployeeWarehouseAssignmentResponse>> getByWarehouse(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(assignmentService.getByWarehouse(warehouseId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assignmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
