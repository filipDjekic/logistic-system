package rs.logistics.logistics_system.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class SqlServerFlywayIT {

    private static final String LATEST_VERSION = "46";
    private static final String UPGRADE_BASELINE_VERSION = "40";
    private static final String OVERLORD_EMAIL = "filip.djekic@slu.admin.rs";
    private static final String ACTIVE_CHANGED_EMAIL = "ana.nikolic@adriatrans.company-admin.rs";
    private static final String BLOCKED_CHANGED_EMAIL = "milan.jovanovic@adriatrans.hr-manager.rs";
    private static final String OUTSIDE_EMAIL = "migration-it.outside@example.test";
    private static final String CHANGED_PASSWORD_MARKER = "changed-password-hash";
    private static final Instant UNCHANGED_MARKER = Instant.parse("2001-01-01T00:00:00Z");
    private static final String MORAVA_ADMIN_EMAIL = "mihajlo.radosavljevic@morava-cold-chain-d-o-o.company-admin.rs";
    private static final String MORAVA_MANAGER_EMAIL = "veljko.mitrovic@morava-cold-chain-d-o-o.warehouse-manager.rs";
    private static final String MORAVA_DRIVER_EMAIL = "vladimir.mladenovic@morava-cold-chain-d-o-o.driver.rs";
    private static final String MORAVA_WORKER_EMAIL = "vladimir.stevanovic@morava-cold-chain-d-o-o.worker.rs";

    private static final List<String> TARGET_EMAILS = List.of(
            OVERLORD_EMAIL,
            ACTIVE_CHANGED_EMAIL,
            BLOCKED_CHANGED_EMAIL,
            "petar.markovic@adriatrans.warehouse-manager.rs",
            "jelena.stojanovic@adriatrans.dispatcher.rs",
            "nikola.petrovic@adriatrans.driver.rs",
            "marko.savic@adriatrans.driver.rs",
            "ivana.jovanovic@adriatrans.worker.rs",
            "stefan.nikolic@adriatrans.worker.rs",
            "sara.milenkovic@adriatrans.worker.rs",
            "dejan.ilic@adriatrans.driver.rs",
            "marija.pavlovic@adriatrans.worker.rs",
            "vladimir.kostic@adriatrans.warehouse-manager.rs",
            "tamara.ristic@adriatrans.dispatcher.rs",
            "ognjen.lazic@adriatrans.worker.rs"
    );
    private static final List<String> DUNAV_TRANSIT_EMAILS = List.of(
            "company.admin@dunavtransit.rs", "hr.manager@dunavtransit.rs",
            "warehouse.bg@dunavtransit.rs", "warehouse.ns@dunavtransit.rs",
            "dispatcher.bg@dunavtransit.rs", "dispatcher.ns@dunavtransit.rs",
            "driver.luka@dunavtransit.rs", "driver.mina@dunavtransit.rs",
            "driver.vuk@dunavtransit.rs", "driver.tamara@dunavtransit.rs",
            "worker.filip@dunavtransit.rs", "worker.sara@dunavtransit.rs",
            "worker.nemanja@dunavtransit.rs", "worker.ivana@dunavtransit.rs",
            "worker.ognjen@dunavtransit.rs", "worker.marija@dunavtransit.rs",
            "worker.andrej@dunavtransit.rs", "worker.katarina@dunavtransit.rs"
    );

    @Container
    private static final MSSQLServerContainer<?> SQL_SERVER =
            new MSSQLServerContainer<>(
                    DockerImageName.parse("mcr.microsoft.com/mssql/server:2022-CU17-ubuntu-22.04")
            ).acceptLicense();

    @BeforeEach
    void cleanDatabase() {
        flyway(LATEST_VERSION, false).clean();
    }

    @Test
    void freshDatabaseMigratesValidatesAndHasNoPendingMigrations() throws SQLException {
        assertEquals(0, applicationTableCount());

        Flyway flyway = flyway(LATEST_VERSION, false);
        MigrateResult firstMigrate = flyway.migrate();

        assertEquals(46, firstMigrate.migrationsExecuted);
        assertEquals(LATEST_VERSION, flyway.info().current().getVersion().getVersion());
        assertTrue(flyway.validateWithResult().validationSuccessful);
        assertEquals(46, successfulVersionedMigrationCount());
        assertEquals(46, latestSuccessfulVersion());
        assertFalse(flyway.info().pending().length != 0);
        assertDunavTransitPasswords();
        assertMoravaColdChainSeed();

        MigrateResult secondMigrate = flyway.migrate();

        assertEquals(0, secondMigrate.migrationsExecuted);
        assertTrue(flyway.validateWithResult().validationSuccessful);
        assertEquals(46, successfulVersionedMigrationCount());
    }

    @Test
    void upgradesRealV40SchemaAndAppliesV41V42OnlyToUnchangedSeedCredentials() throws SQLException {
        Flyway toV40 = flyway(UPGRADE_BASELINE_VERSION, false);
        assertEquals(40, toV40.migrate().migrationsExecuted);
        assertEquals(UPGRADE_BASELINE_VERSION, toV40.info().current().getVersion().getVersion());
        assertEquals(15, countExistingTargetUsers());

        String preservedCompanyName = queryString("SELECT name FROM companies WHERE id = 1");
        String overlordSeedHash = passwordFor(OVERLORD_EMAIL);
        String demoSeedHash = passwordFor(ACTIVE_CHANGED_EMAIL);

        markChangedUser(ACTIVE_CHANGED_EMAIL, "ACTIVE", true);
        markChangedUser(BLOCKED_CHANGED_EMAIL, "BLOCKED", false);
        insertOutsideUser();

        Flyway toV41 = flyway("41", false);
        assertEquals(1, toV41.migrate().migrationsExecuted);
        assertEquals(13, countTargetUsersWithState("BLOCKED", false));
        assertUserState(ACTIVE_CHANGED_EMAIL, "ACTIVE", true, CHANGED_PASSWORD_MARKER, UNCHANGED_MARKER);
        assertUserState(BLOCKED_CHANGED_EMAIL, "BLOCKED", false, CHANGED_PASSWORD_MARKER, UNCHANGED_MARKER);
        assertUserState(OUTSIDE_EMAIL, "ACTIVE", true, CHANGED_PASSWORD_MARKER, UNCHANGED_MARKER);

        Flyway toLatest = flyway(LATEST_VERSION, false);
        assertEquals(6, toLatest.migrate().migrationsExecuted);
        assertTrue(toLatest.validateWithResult().validationSuccessful);
        assertEquals(LATEST_VERSION, toLatest.info().current().getVersion().getVersion());

        assertEquals(13, countTargetUsersWithState("ACTIVE", true));
        assertUserState(ACTIVE_CHANGED_EMAIL, "ACTIVE", true, CHANGED_PASSWORD_MARKER, UNCHANGED_MARKER);
        assertUserState(BLOCKED_CHANGED_EMAIL, "BLOCKED", false, CHANGED_PASSWORD_MARKER, UNCHANGED_MARKER);
        assertUserState(OUTSIDE_EMAIL, "ACTIVE", true, CHANGED_PASSWORD_MARKER, UNCHANGED_MARKER);
        assertEquals(overlordSeedHash, passwordFor(OVERLORD_EMAIL));
        assertEquals(demoSeedHash, passwordFor("petar.markovic@adriatrans.warehouse-manager.rs"));
        assertEquals(preservedCompanyName, queryString("SELECT name FROM companies WHERE id = 1"));
        assertDunavTransitPasswords();
        assertMoravaColdChainSeed();

        assertEquals(0, toLatest.migrate().migrationsExecuted);
        assertTrue(toLatest.validateWithResult().validationSuccessful);
    }

    @Test
    void upgradesAppliedMoravaV45DataWithV46WithoutChangingPasswordsOrOtherCompanies() throws SQLException {
        Flyway toV45 = flyway("45", false);
        assertEquals(45, toV45.migrate().migrationsExecuted);

        String moravaPassword = passwordFor("mcc.01@moravacold.rs");
        String preservedCompanyName = queryString("SELECT name FROM companies WHERE id=1");

        Flyway toV46 = flyway(LATEST_VERSION, false);
        assertEquals(1, toV46.migrate().migrationsExecuted);
        assertTrue(toV46.validateWithResult().validationSuccessful);
        assertEquals(LATEST_VERSION, toV46.info().current().getVersion().getVersion());
        assertEquals(preservedCompanyName, queryString("SELECT name FROM companies WHERE id=1"));
        assertEquals(moravaPassword, passwordFor(MORAVA_ADMIN_EMAIL));
        assertMoravaColdChainSeed();
    }

    private Flyway flyway(String targetVersion, boolean cleanDisabled) {
        return Flyway.configure()
                .dataSource(SQL_SERVER.getJdbcUrl(), SQL_SERVER.getUsername(), SQL_SERVER.getPassword())
                .locations("classpath:db/migration")
                .schemas("dbo")
                .defaultSchema("dbo")
                .createSchemas(true)
                .baselineOnMigrate(false)
                .validateOnMigrate(true)
                .cleanDisabled(cleanDisabled)
                .target(MigrationVersion.fromVersion(targetVersion))
                .load();
    }

    private int applicationTableCount() throws SQLException {
        return queryInt("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = 'dbo'
                  AND TABLE_TYPE = 'BASE TABLE'
                """);
    }

    private int successfulVersionedMigrationCount() throws SQLException {
        return queryInt("""
                SELECT COUNT(*)
                FROM dbo.flyway_schema_history
                WHERE success = 1
                  AND version IS NOT NULL
                """);
    }

    private int latestSuccessfulVersion() throws SQLException {
        return queryInt("""
                SELECT MAX(CAST(version AS INT))
                FROM dbo.flyway_schema_history
                WHERE success = 1
                  AND version IS NOT NULL
                """);
    }

    private int countExistingTargetUsers() throws SQLException {
        return countTargetUsers(null, null);
    }

    private int countTargetUsersWithState(String status, boolean enabled) throws SQLException {
        return countTargetUsers(status, enabled);
    }

    private int countTargetUsers(String status, Boolean enabled) throws SQLException {
        String placeholders = String.join(",", TARGET_EMAILS.stream().map(ignored -> "?").toList());
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM users WHERE email IN (" + placeholders + ")");
        if (status != null) {
            sql.append(" AND status = ? AND enabled = ?");
        }

        try (Connection connection = connection();
             PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            int index = 1;
            for (String email : TARGET_EMAILS) {
                statement.setString(index++, email);
            }
            if (status != null) {
                statement.setString(index++, status);
                statement.setBoolean(index, enabled);
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1);
            }
        }
    }

    private void markChangedUser(String email, String status, boolean enabled) throws SQLException {
        try (Connection connection = connection();
             PreparedStatement statement = connection.prepareStatement("""
                     UPDATE users
                     SET password = ?, status = ?, enabled = ?, updated_at = ?
                     WHERE email = ?
                     """)) {
            statement.setString(1, CHANGED_PASSWORD_MARKER);
            statement.setString(2, status);
            statement.setBoolean(3, enabled);
            statement.setTimestamp(4, Timestamp.from(UNCHANGED_MARKER));
            statement.setString(5, email);
            assertEquals(1, statement.executeUpdate());
        }
    }

    private void insertOutsideUser() throws SQLException {
        try (Connection connection = connection();
             PreparedStatement statement = connection.prepareStatement("""
                     INSERT INTO users (
                         password, first_name, last_name, email, status, enabled,
                         created_at, updated_at, role_id, company_id
                     )
                     SELECT ?, 'Migration', 'Outsider', ?, 'ACTIVE', 1, ?, ?, id, NULL
                     FROM roles
                     WHERE name = 'OVERLORD'
                     """)) {
            statement.setString(1, CHANGED_PASSWORD_MARKER);
            statement.setString(2, OUTSIDE_EMAIL);
            statement.setTimestamp(3, Timestamp.from(UNCHANGED_MARKER));
            statement.setTimestamp(4, Timestamp.from(UNCHANGED_MARKER));
            assertEquals(1, statement.executeUpdate());
        }
    }

    private void assertUserState(
            String email,
            String status,
            boolean enabled,
            String password,
            Instant updatedAt
    ) throws SQLException {
        try (Connection connection = connection();
             PreparedStatement statement = connection.prepareStatement("""
                     SELECT status, enabled, password, updated_at
                     FROM users
                     WHERE email = ?
                     """)) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                assertTrue(resultSet.next());
                assertEquals(status, resultSet.getString("status"));
                assertEquals(enabled, resultSet.getBoolean("enabled"));
                assertEquals(password, resultSet.getString("password"));
                assertEquals(Timestamp.from(updatedAt), resultSet.getTimestamp("updated_at"));
            }
        }
    }

    private String passwordFor(String email) throws SQLException {
        try (Connection connection = connection();
             PreparedStatement statement = connection.prepareStatement("SELECT password FROM users WHERE email = ?")) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                assertTrue(resultSet.next());
                return resultSet.getString(1);
            }
        }
    }

    private void assertDunavTransitPasswords() throws SQLException {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        for (String email : DUNAV_TRANSIT_EMAILS) {
            assertTrue(encoder.matches("Admin123!", passwordFor(email)), "Invalid seed password for " + email);
        }
    }

    private void assertMoravaColdChainSeed() throws SQLException {
        String companyPredicate = "c.name = N'Morava Cold Chain d.o.o.'";
        assertEquals(48, queryInt("SELECT COUNT(*) FROM users u JOIN companies c ON c.id=u.company_id WHERE " + companyPredicate));
        assertEquals(48, queryInt("SELECT COUNT(*) FROM employees e JOIN companies c ON c.id=e.company_id WHERE " + companyPredicate));
        assertEquals(4, queryInt("SELECT COUNT(*) FROM warehouses w JOIN companies c ON c.id=w.company_id WHERE " + companyPredicate));
        assertEquals(60, queryInt("SELECT COUNT(*) FROM products p JOIN companies c ON c.id=p.company_id WHERE " + companyPredicate));
        assertEquals(18, queryInt("SELECT COUNT(*) FROM vehicles v JOIN companies c ON c.id=v.company_id WHERE " + companyPredicate));
        assertEquals(120, queryInt("""
                SELECT COUNT(*) FROM transport_orders t
                JOIN warehouses w ON w.id=t.source_warehouse_id
                JOIN companies c ON c.id=w.company_id
                WHERE c.name=N'Morava Cold Chain d.o.o.'
                """));
        assertEquals(30, queryInt("""
                SELECT COUNT(*) FROM inventory_count_sessions s
                JOIN warehouses w ON w.id=s.warehouse_id
                JOIN companies c ON c.id=w.company_id
                WHERE c.name=N'Morava Cold Chain d.o.o.'
                """));
        assertEquals(0, queryInt("""
                SELECT COUNT(*) FROM transport_orders t
                JOIN warehouses sw ON sw.id=t.source_warehouse_id
                JOIN warehouses dw ON dw.id=t.destination_warehouse_id
                JOIN vehicles v ON v.id=t.vehicle_id
                JOIN employees e ON e.id=t.assigned_employee_id
                WHERE t.order_number LIKE N'MCC-TO-%'
                  AND (sw.company_id<>(SELECT id FROM companies WHERE name=N'Morava Cold Chain d.o.o.')
                       OR dw.company_id<>sw.company_id OR v.company_id<>sw.company_id OR e.company_id<>sw.company_id)
                """));

        assertEquals(0, queryInt("""
                SELECT COUNT(*) FROM products p
                JOIN companies c ON c.id=p.company_id
                WHERE c.tax_number=N'118462730' AND c.registration_number=N'22916485'
                  AND p.unit NOT IN(N'PIECE',N'KG',N'LITER',N'PALLET',N'BOX')
                """));
        assertEquals(10, queryInt("""
                SELECT COUNT(*) FROM products p
                JOIN companies c ON c.id=p.company_id
                WHERE c.tax_number=N'118462730' AND c.registration_number=N'22916485'
                  AND p.sku LIKE N'MCC-FRE-%' AND p.unit=N'BOX'
                """));
        assertEquals(0, queryInt("""
                SELECT COUNT(*) FROM employees e
                JOIN users u ON u.id=e.user_id
                JOIN companies c ON c.id=e.company_id
                WHERE c.tax_number=N'118462730' AND c.registration_number=N'22916485'
                  AND (u.company_id<>e.company_id OR LOWER(u.email)<>LOWER(e.email))
                """));
        assertEquals("contact@morava-cold-chain-d-o-o.rs", queryString("""
                SELECT email FROM companies
                WHERE tax_number=N'118462730' AND registration_number=N'22916485'
                """));

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        assertTrue(encoder.matches("Admin123!", passwordFor(MORAVA_ADMIN_EMAIL)));
        assertTrue(encoder.matches("Admin123!", passwordFor(MORAVA_MANAGER_EMAIL)));
        assertTrue(encoder.matches("Admin123!", passwordFor(MORAVA_DRIVER_EMAIL)));
        assertTrue(encoder.matches("Admin123!", passwordFor(MORAVA_WORKER_EMAIL)));
    }

    private int queryInt(String sql) throws SQLException {
        try (Connection connection = connection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            resultSet.next();
            return resultSet.getInt(1);
        }
    }

    private String queryString(String sql) throws SQLException {
        try (Connection connection = connection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            assertTrue(resultSet.next());
            return resultSet.getString(1);
        }
    }

    private Connection connection() throws SQLException {
        return SQL_SERVER.createConnection("");
    }
}
