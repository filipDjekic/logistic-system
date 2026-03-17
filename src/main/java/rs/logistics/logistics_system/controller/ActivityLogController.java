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

    @GetMapping("/user/{id}/{start_date}/{end_date}")
    public ResponseEntity<List<ActivityLogResponse>> getBetweenDate(@PathVariable Long id, @PathVariable LocalDateTime start_date, @PathVariable LocalDateTime end_date){
        List<ActivityLogResponse> response = activityLogService.getBetweenDates(start_date, end_date, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/{date}")
    public ResponseEntity<List<ActivityLogResponse>> getByDate(@PathVariable Long id, @PathVariable LocalDateTime date){
        List<ActivityLogResponse> response = activityLogService.getByDate(date, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/{before_date}")
    public ResponseEntity<List<ActivityLogResponse>> getBeforeDate(@PathVariable Long id, @PathVariable LocalDateTime before_date){
        List<ActivityLogResponse> response = activityLogService.getBeforeDate(before_date, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/{id}/{after_date}")
    public ResponseEntity<List<ActivityLogResponse>> getAfterDate(@PathVariable Long id, @PathVariable LocalDateTime after_date){
        List<ActivityLogResponse> response = activityLogService.getAfterDate(after_date, id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        activityLogService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
