package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.dto.update.ChangeHistoryUpdate;
import rs.logistics.logistics_system.entity.ChangeHistory;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class ChangeHistoryController {

    private final ChangeHistoryServiceDefinition changeHistoryService;

    @PostMapping
    public ResponseEntity<ChangeHistoryResponse> save(@Valid @RequestBody ChangeHistoryCreate dto){
        ChangeHistoryResponse response = changeHistoryService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChangeHistoryResponse> update(@PathVariable Long id, @RequestBody ChangeHistoryUpdate dto){
        ChangeHistoryResponse response = changeHistoryService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChangeHistoryResponse> getById(@PathVariable Long id){
        ChangeHistoryResponse response = changeHistoryService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<ChangeHistoryResponse>> getAll(){
        List<ChangeHistoryResponse> response = changeHistoryService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id){
        changeHistoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
