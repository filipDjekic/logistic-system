package rs.logistics.logistics_system.security.entity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

@Component("taskSecurity")
@RequiredArgsConstructor
public class TaskSecurity {

    private final TaskRepository taskRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public boolean isAssignedToCurrentUser(Long taskId) {
        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        return taskRepository.findById(taskId)
                .map(task ->
                        task.getAssignedEmployee() != null
                                && task.getAssignedEmployee().getUser() != null
                                && task.getAssignedEmployee().getUser().getId().equals(authenticatedUserProvider.getAuthenticatedUserId())
                                && task.getAssignedEmployee().getCompany() != null
                                && task.getAssignedEmployee().getCompany().getId().equals(authenticatedUserProvider.getAuthenticatedCompanyId())
                )
                .orElse(false);
    }
}
