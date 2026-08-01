package rs.logistics.logistics_system.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.mock.env.MockEnvironment;

class DatabaseCredentialsEnvironmentValidatorTest {

    private final ConfigurableListableBeanFactory beanFactory =
            mock(ConfigurableListableBeanFactory.class);

    @Test
    void acceptsDefinedDatabaseCredentials() {
        DatabaseCredentialsEnvironmentValidator validator = validator(
                new MockEnvironment()
                        .withProperty("DB_USERNAME", "test-user")
                        .withProperty("DB_PASSWORD", "test-password")
        );

        assertDoesNotThrow(() -> validator.postProcessBeanFactory(beanFactory));
    }

    @Test
    void missingUsernameFailsWithClearMessage() {
        DatabaseCredentialsEnvironmentValidator validator = validator(
                new MockEnvironment().withProperty("DB_PASSWORD", "test-password")
        );

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> validator.postProcessBeanFactory(beanFactory)
        );

        assertEquals(
                "Required database environment variable DB_USERNAME is missing. "
                        + "Define it in the process environment or backend/.env.",
                error.getMessage()
        );
    }

    @Test
    void missingPasswordFailsWithoutExposingAnyValue() {
        DatabaseCredentialsEnvironmentValidator validator = validator(
                new MockEnvironment().withProperty("DB_USERNAME", "test-user")
        );

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> validator.postProcessBeanFactory(beanFactory)
        );

        assertEquals(
                "Required database environment variable DB_PASSWORD is missing. "
                        + "Define it in the process environment or backend/.env.",
                error.getMessage()
        );
    }

    @Test
    void unresolvedLiteralPlaceholderIsRejected() {
        DatabaseCredentialsEnvironmentValidator validator = validator(
                new MockEnvironment()
                        .withProperty("DB_USERNAME", "${DB_USERNAME}")
                        .withProperty("DB_PASSWORD", "test-password")
        );

        assertThrows(
                IllegalStateException.class,
                () -> validator.postProcessBeanFactory(beanFactory)
        );
    }

    @Test
    void testProfileUsesItsOwnDatasourceWithoutRuntimeCredentials() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("test");

        assertDoesNotThrow(() -> validator(environment).postProcessBeanFactory(beanFactory));
    }

    private DatabaseCredentialsEnvironmentValidator validator(MockEnvironment environment) {
        DatabaseCredentialsEnvironmentValidator validator =
                new DatabaseCredentialsEnvironmentValidator();
        validator.setEnvironment(environment);
        return validator;
    }
}
