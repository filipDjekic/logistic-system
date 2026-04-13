package rs.logistics.logistics_system.config;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.entity.Role;
import rs.logistics.logistics_system.repository.RoleRepository;
import rs.logistics.logistics_system.security.RoleCatalog;

@Component
@RequiredArgsConstructor
public class RoleDataInitializer {

    private final RoleRepository roleRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void ensureSystemRoles() {
        Map<String, String> descriptions = new LinkedHashMap<>();
        descriptions.put(RoleCatalog.OVERLORD, "Global system owner with unrestricted access.");
        descriptions.put(RoleCatalog.COMPANY_ADMIN, "Company administrator responsible for company setup and user administration.");
        descriptions.put(RoleCatalog.HR_MANAGER, "Manages employees, shifts and HR-related operational flows.");
        descriptions.put(RoleCatalog.WAREHOUSE_MANAGER, "Manages warehouse operations, inventory and stock movements.");
        descriptions.put(RoleCatalog.DISPATCHER, "Coordinates transport planning and transport execution flows.");
        descriptions.put(RoleCatalog.DRIVER, "Participates in transport execution and sees only driver-relevant work.");
        descriptions.put(RoleCatalog.WORKER, "Handles assigned operational warehouse and logistics tasks.");

        descriptions.forEach((roleName, description) -> {
            Role role = roleRepository.findByName(roleName)
                    .orElseGet(() -> new Role(roleName, description));

            boolean changed = false;

            if (!roleName.equals(role.getName())) {
                role.setName(roleName);
                changed = true;
            }

            if (role.getDescription() == null || role.getDescription().isBlank()) {
                role.setDescription(description);
                changed = true;
            }

            if (role.getId() == null || changed) {
                roleRepository.save(role);
            }
        });
    }
}