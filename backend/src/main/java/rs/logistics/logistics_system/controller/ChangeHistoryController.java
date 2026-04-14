package rs.logistics.logistics_system.controller;

import java.time.LocalDateTime;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class ChangeHistoryController {

    private final ChangeHistoryServiceDefinition changeHistoryService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER','DISPATCHER','DRIVER','WORKER')")
    @GetMapping("/{id}")
    public ResponseEntity<ChangeHistoryResponse> getById(@PathVariable Long id) {
        ChangeHistoryResponse response = changeHistoryService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER','DISPATCHER','DRIVER','WORKER')")
    @GetMapping("/entity_name/{name}")
    public ResponseEntity<List<ChangeHistoryResponse>> getByEntityName(@PathVariable String name) {
        List<ChangeHistoryResponse> responses = changeHistoryService.getByEntityName(name);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER','WAREHOUSE_MANAGER','DISPATCHER','DRIVER','WORKER')")
    @GetMapping("/entity_id/{id}")
    public ResponseEntity<List<ChangeHistoryResponse>> getByEntityId(@PathVariable Long id) {
        List<ChangeHistoryResponse> responses = changeHistoryService.getByEntityId(id);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping("/user_id/{id}")
    public ResponseEntity<List<ChangeHistoryResponse>> getByUserId(@PathVariable Long id) {
        List<ChangeHistoryResponse> responses = changeHistoryService.getByUserId(id);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping("/{start_date}/{end_date}")
    public ResponseEntity<List<ChangeHistoryResponse>> getByBetweenDate(
            @PathVariable("start_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @PathVariable("end_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<ChangeHistoryResponse> responses = changeHistoryService.getByBetweenDate(startDate, endDate);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping
    public ResponseEntity<List<ChangeHistoryResponse>> getAll() {
        List<ChangeHistoryResponse> response = changeHistoryService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}