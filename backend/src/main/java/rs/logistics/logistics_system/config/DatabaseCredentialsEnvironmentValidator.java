package rs.logistics.logistics_system.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.PlaceholderResolutionException;

/**
 * Fails before Flyway, JPA and repository beans are created when runtime
 * database credentials were not supplied. Test profiles provide their own H2
 * datasource and intentionally do not require these environment properties.
 */
@Component
public class DatabaseCredentialsEnvironmentValidator
        implements BeanFactoryPostProcessor, EnvironmentAware {

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        if (environment == null || environment.matchesProfiles("test")) {
            return;
        }

        requireCredential("DB_USERNAME");
        requireCredential("DB_PASSWORD");
    }

    private void requireCredential(String propertyName) {
        String value;
        try {
            value = environment.getProperty(propertyName);
        } catch (PlaceholderResolutionException ex) {
            throw missingCredential(propertyName, ex);
        }
        if (value == null || value.isBlank() || value.contains("${")) {
            throw missingCredential(propertyName, null);
        }
    }

    private IllegalStateException missingCredential(String propertyName, Throwable cause) {
        return new IllegalStateException(
                "Required database environment variable " + propertyName
                        + " is missing. Define it in the process environment or backend/.env.",
                cause
        );
    }
}
