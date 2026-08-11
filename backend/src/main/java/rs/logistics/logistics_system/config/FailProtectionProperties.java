package rs.logistics.logistics_system.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "logistics.fail-protection")
public class FailProtectionProperties {

    private boolean enabled = true;
    private long idempotencyTtlSeconds = 30;
    private int writeRequestsPerMinute = 120;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public long getIdempotencyTtlSeconds() {
        return idempotencyTtlSeconds;
    }

    public void setIdempotencyTtlSeconds(long idempotencyTtlSeconds) {
        if (idempotencyTtlSeconds <= 0) {
            throw new IllegalArgumentException("logistics.fail-protection.idempotency-ttl-seconds must be greater than zero");
        }
        this.idempotencyTtlSeconds = idempotencyTtlSeconds;
    }

    public int getWriteRequestsPerMinute() {
        return writeRequestsPerMinute;
    }

    public void setWriteRequestsPerMinute(int writeRequestsPerMinute) {
        if (writeRequestsPerMinute <= 0) {
            throw new IllegalArgumentException("logistics.fail-protection.write-requests-per-minute must be greater than zero");
        }
        this.writeRequestsPerMinute = writeRequestsPerMinute;
    }
}
