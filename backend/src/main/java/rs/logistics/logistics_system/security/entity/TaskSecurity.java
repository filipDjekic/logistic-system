package rs.logistics.logistics_system.security.entity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.repository.TaskRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.enums.OperationalEntityType;
import rs.logistics.logistics_system.service.security.OperationalEntityAccessValidator;

@Component("taskSecurity")
@RequiredArgsConstructor
public class TaskSecurity {

    private final TaskRepository taskRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;
    private final OperationalEntityAccessValidator operationalEntityAccessValidator;

    public boolean isAssignedToCurrentUser(Long taskId) {
        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        return taskRepository.findById(taskId)
                .map(task ->
                        authenticatedUserProvider.isCurrentEmployeeUserInAuthenticatedCompany(task.getAssignedEmployee())
                )
                .orElse(false);
    }

    public boolean canReadTransportOrderTasks(Long transportOrderId) {
        return transportOrderId != null
                && authenticatedUserProvider.hasRole("DRIVER")
                && operationalEntityAccessValidator.canAccess(OperationalEntityType.TRANSPORT_ORDER, transportOrderId);
    }
}
