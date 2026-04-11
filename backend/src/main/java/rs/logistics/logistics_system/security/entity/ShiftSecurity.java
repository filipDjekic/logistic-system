package rs.logistics.logistics_system.security.entity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import rs.logistics.logistics_system.repository.ShiftRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;

@Component("shiftSecurity")
@RequiredArgsConstructor
public class ShiftSecurity {

    private final ShiftRepository shiftRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public boolean isOwner(Long shiftId) {
        if (authenticatedUserProvider.isOverlord()) {
            return true;
        }

        return shiftRepository.findById(shiftId)
                .map(shift ->
                        shift.getEmployee() != null
                                && shift.getEmployee().getUser() != null
                                && shift.getEmployee().getUser().getId().equals(authenticatedUserProvider.getAuthenticatedUserId())
                                && shift.getEmployee().getCompany() != null
                                && shift.getEmployee().getCompany().getId().equals(authenticatedUserProvider.getAuthenticatedCompanyId())
                )
                .orElse(false);
    }
}
