package rs.logistics.logistics_system.security;

import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class RoleCatalog {

    public static final String OVERLORD = "OVERLORD";
    public static final String COMPANY_ADMIN = "COMPANY_ADMIN";
    public static final String HR_MANAGER = "HR_MANAGER";
    public static final String WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER";
    public static final String DISPATCHER = "DISPATCHER";
    public static final String DRIVER = "DRIVER";
    public static final String WORKER = "WORKER";

    public static final List<String> ALL = List.of(
            OVERLORD,
            COMPANY_ADMIN,
            HR_MANAGER,
            WAREHOUSE_MANAGER,
            DISPATCHER,
            DRIVER,
            WORKER
    );

    private static final Set<String> ALL_SET = Set.copyOf(ALL);

    private RoleCatalog() {
    }

    public static boolean isSupported(String roleName) {
        if (roleName == null) {
            return false;
        }

        return ALL_SET.contains(normalize(roleName));
    }

    public static String normalize(String roleName) {
        return roleName == null ? null : roleName.trim().toUpperCase(Locale.ROOT);
    }
}