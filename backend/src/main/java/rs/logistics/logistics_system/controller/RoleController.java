package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import rs.logistics.logistics_system.dto.create.RoleCreate;
import rs.logistics.logistics_system.dto.response.RoleResponse;
import rs.logistics.logistics_system.dto.update.RoleUpdate;
import rs.logistics.logistics_system.service.definition.RoleServiceDefinition;

@PreAuthorize("hasRole('OVERLORD')")
@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleServiceDefinition roleService;

    public RoleController(RoleServiceDefinition roleService) {
        this.roleService = roleService;
    }

    @PostMapping
    public ResponseEntity<RoleResponse> create(@Valid @RequestBody RoleCreate dto) {
        RoleResponse response = roleService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleResponse> update(@PathVariable Long id,@Valid @RequestBody RoleUpdate dto) {
        RoleResponse response = roleService.update(id, dto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleResponse> getById(@PathVariable Long id){
        RoleResponse response = roleService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<RoleResponse>> getAll(){
        List<RoleResponse> list = roleService.getAll();
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
