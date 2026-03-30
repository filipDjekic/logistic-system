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

import java.time.LocalDateTime;
import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class ChangeHistoryController {

    private final ChangeHistoryServiceDefinition changeHistoryService;

    @GetMapping("/{id}")
    public ResponseEntity<ChangeHistoryResponse> getById(@PathVariable Long id){
        ChangeHistoryResponse response = changeHistoryService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/entity_name/{name}")
    public ResponseEntity<List<ChangeHistoryResponse>> getByEntityName(@PathVariable String name){
        List<ChangeHistoryResponse> responses = changeHistoryService.getByEntityName(name);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/entity_id/{id}")
    public ResponseEntity<List<ChangeHistoryResponse>> getByEntityId(@PathVariable Long id){
        List<ChangeHistoryResponse> responses = changeHistoryService.getByEntityId(id);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/user_id/{id}")
    public ResponseEntity<List<ChangeHistoryResponse>> getByUserId(@PathVariable Long id){
        List<ChangeHistoryResponse> responses = changeHistoryService.getByUserId(id);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/{start_date}/{end_date}")
    public ResponseEntity<List<ChangeHistoryResponse>> getByBetweenDate(@PathVariable LocalDateTime start_date, @PathVariable LocalDateTime end_date){
        List<ChangeHistoryResponse> responses = changeHistoryService.getByBetweenDate(start_date, end_date);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<ChangeHistoryResponse>> getAll(){
        List<ChangeHistoryResponse> response = changeHistoryService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
