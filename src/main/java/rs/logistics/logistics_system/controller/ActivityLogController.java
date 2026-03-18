package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.dto.update.ActivityLogUpdate;
import rs.logistics.logistics_system.service.definition.ActivityLogServiceDefinition;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/activity_logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogServiceDefinition activityLogService;

    @PostMapping
    public ResponseEntity<ActivityLogResponse> create(@Valid @RequestBody ActivityLogCreate dto){
        ActivityLogResponse response = activityLogService.create(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivityLogResponse> update(@PathVariable Long id, @RequestBody ActivityLogUpdate dto){
        ActivityLogResponse response = activityLogService.update(id, dto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityLogResponse> get(@PathVariable Long id){
        ActivityLogResponse response = activityLogService.getById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<ActivityLogResponse>> getAll(){
        List<ActivityLogResponse> response = activityLogService.getAll();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<List<ActivityLogResponse>> getByUserId(@PathVariable Long id){
        List<ActivityLogResponse> response = activityLogService.getByUserId(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/action/{action}")
    public ResponseEntity<List<ActivityLogResponse>> getByUserIdAndAction(@PathVariable Long id, @PathVariable String action){
        List<ActivityLogResponse> response = activityLogService.getByAction(action, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/entity/{entityName}")
    public ResponseEntity<List<ActivityLogResponse>> getByEntityName(@PathVariable Long id, @PathVariable String entityName){
        List<ActivityLogResponse> response = activityLogService.getByEntityName(entityName, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/before")
    public ResponseEntity<List<ActivityLogResponse>> getByDateBefore(
            @PathVariable Long id,
            @RequestParam LocalDateTime date) {
        List<ActivityLogResponse> response = activityLogService.getBeforeDate(date, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/after")
    public ResponseEntity<List<ActivityLogResponse>> getByDateAfter(
            @PathVariable Long id,
            @RequestParam LocalDateTime date) {
        List<ActivityLogResponse> response = activityLogService.getAfterDate(date, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/between")
    public ResponseEntity<List<ActivityLogResponse>> getByDateBetween(
            @PathVariable Long id,
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        List<ActivityLogResponse> response = activityLogService.getBetweenDates(start, end, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        activityLogService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
