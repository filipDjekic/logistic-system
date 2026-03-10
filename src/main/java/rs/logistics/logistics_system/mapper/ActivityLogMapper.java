package rs.logistics.logistics_system.mapper;

import rs.logistics.logistics_system.dto.create.ActivityLogCreate;
import rs.logistics.logistics_system.dto.response.ActivityLogResponse;
import rs.logistics.logistics_system.entity.ActivityLog;
import rs.logistics.logistics_system.entity.User;

public class ActivityLogMapper {

    public static ActivityLog toEntity(ActivityLogCreate dto, User user){
        ActivityLog activityLog = new ActivityLog(
                dto.getAction(),
                dto.getEntityName(),
                dto.getEntityId(),
                dto.getDescription(),
                dto.getCreatedAt(),
                user
        );
        return activityLog;
    }

    public static void updateEntity(ActivityLogCreate dto, User user, ActivityLog activityLog){
        activityLog.setAction(dto.getAction());
        activityLog.setEntityName(dto.getEntityName());
        activityLog.setEntityId(dto.getEntityId());
        activityLog.setDescription(dto.getDescription());
        activityLog.setCreatedAt(dto.getCreatedAt());
        activityLog.setUser(user);
    }

    public static ActivityLogResponse  toResponse(ActivityLog activityLog){
        ActivityLogResponse response = new ActivityLogResponse(
                activityLog.getId(),
                activityLog.getAction(),
                activityLog.getEntityName(),
                activityLog.getEntityId(),
                activityLog.getDescription(),
                activityLog.getCreatedAt(),
                activityLog.getUser().getId()
        );
        return response;
    }
}
