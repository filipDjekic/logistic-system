package rs.logistics.logistics_system.config;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

@Component
@ConfigurationProperties(prefix = "logistics")
public class AppProperties {

    private final Pagination pagination = new Pagination();
    private final Shift shift = new Shift();
    private final Warehouse warehouse = new Warehouse();
    private final StatusTransitions statusTransitions = new StatusTransitions();
    private final FailProtection failProtection = new FailProtection();

    public Pagination getPagination() {
        return pagination;
    }

    public Shift getShift() {
        return shift;
    }

    public Warehouse getWarehouse() {
        return warehouse;
    }

    public StatusTransitions getStatusTransitions() {
        return statusTransitions;
    }

    public FailProtection getFailProtection() {
        return failProtection;
    }

    public int getDefaultPageSize() {
        return pagination.defaultPageSize;
    }

    public long getMaxShiftDurationHours() {
        return shift.maxDurationHours;
    }

    public boolean isWarehouseCapacityValidationEnabled() {
        return warehouse.capacityValidationEnabled;
    }

    public boolean isTaskStatusTransitionAllowed(TaskStatus current, TaskStatus next) {
        if (current == null || next == null) {
            return false;
        }

        return getAllowed(statusTransitions.task, current.name()).contains(next.name());
    }

    public boolean isTransportOrderStatusTransitionAllowed(TransportOrderStatus current, TransportOrderStatus next) {
        if (current == null || next == null) {
            return false;
        }

        return getAllowed(statusTransitions.transportOrder, current.name()).contains(next.name());
    }

    private List<String> getAllowed(Map<String, List<String>> transitions, String current) {
        return transitions.getOrDefault(current, List.of());
    }

    public static class Pagination {
        private int defaultPageSize = 20;
        private int maxPageSize = 100;

        public int getDefaultPageSize() {
            return defaultPageSize;
        }

        public void setDefaultPageSize(int defaultPageSize) {
            if (defaultPageSize <= 0) {
                throw new IllegalArgumentException("logistics.pagination.default-page-size must be greater than zero");
            }
            this.defaultPageSize = defaultPageSize;
        }

        public int getMaxPageSize() {
            return maxPageSize;
        }

        public void setMaxPageSize(int maxPageSize) {
            if (maxPageSize <= 0) {
                throw new IllegalArgumentException("logistics.pagination.max-page-size must be greater than zero");
            }
            this.maxPageSize = maxPageSize;
        }
    }

    public static class Shift {
        private long maxDurationHours = 8;

        public long getMaxDurationHours() {
            return maxDurationHours;
        }

        public void setMaxDurationHours(long maxDurationHours) {
            if (maxDurationHours <= 0) {
                throw new IllegalArgumentException("logistics.shift.max-duration-hours must be greater than zero");
            }
            this.maxDurationHours = maxDurationHours;
        }
    }

    public static class Warehouse {
        private boolean capacityValidationEnabled = true;

        public boolean isCapacityValidationEnabled() {
            return capacityValidationEnabled;
        }

        public void setCapacityValidationEnabled(boolean capacityValidationEnabled) {
            this.capacityValidationEnabled = capacityValidationEnabled;
        }
    }

    public static class FailProtection {
        private boolean enabled = true;
        private long idempotencyTtlSeconds = 30;
        private int writeRequestsPerMinute = 120;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }

        public long getIdempotencyTtlSeconds() { return idempotencyTtlSeconds; }
        public void setIdempotencyTtlSeconds(long idempotencyTtlSeconds) {
            if (idempotencyTtlSeconds <= 0) {
                throw new IllegalArgumentException("logistics.fail-protection.idempotency-ttl-seconds must be greater than zero");
            }
            this.idempotencyTtlSeconds = idempotencyTtlSeconds;
        }

        public int getWriteRequestsPerMinute() { return writeRequestsPerMinute; }
        public void setWriteRequestsPerMinute(int writeRequestsPerMinute) {
            if (writeRequestsPerMinute <= 0) {
                throw new IllegalArgumentException("logistics.fail-protection.write-requests-per-minute must be greater than zero");
            }
            this.writeRequestsPerMinute = writeRequestsPerMinute;
        }
    }

    public static class StatusTransitions {
        private Map<String, List<String>> task = defaultTaskTransitions();
        private Map<String, List<String>> transportOrder = defaultTransportOrderTransitions();

        public Map<String, List<String>> getTask() {
            return task;
        }

        public void setTask(Map<String, List<String>> task) {
            this.task = normalize(task);
        }

        public Map<String, List<String>> getTransportOrder() {
            return transportOrder;
        }

        public void setTransportOrder(Map<String, List<String>> transportOrder) {
            this.transportOrder = normalize(transportOrder);
        }

        private static Map<String, List<String>> defaultTaskTransitions() {
            Map<String, List<String>> transitions = new LinkedHashMap<>();
            transitions.put("NEW", List.of("IN_PROGRESS", "CANCELLED"));
            transitions.put("IN_PROGRESS", List.of("COMPLETED", "CANCELLED"));
            transitions.put("COMPLETED", List.of());
            transitions.put("CANCELLED", List.of());
            return transitions;
        }

        private static Map<String, List<String>> defaultTransportOrderTransitions() {
            Map<String, List<String>> transitions = new LinkedHashMap<>();
            transitions.put("CREATED", List.of("ASSIGNED", "CANCELLED"));
            transitions.put("ASSIGNED", List.of("IN_TRANSIT", "CANCELLED"));
            transitions.put("IN_TRANSIT", List.of("DELIVERED", "FAILED"));
            transitions.put("DELIVERED", List.of());
            transitions.put("FAILED", List.of());
            transitions.put("CANCELLED", List.of());
            return transitions;
        }

        private static Map<String, List<String>> normalize(Map<String, List<String>> source) {
            Map<String, List<String>> normalized = new LinkedHashMap<>();
            if (source == null) {
                return normalized;
            }

            source.forEach((key, values) -> {
                if (key != null) {
                    normalized.put(key.trim().toUpperCase(), normalizeValues(values));
                }
            });
            return normalized;
        }

        private static List<String> normalizeValues(List<String> values) {
            if (values == null) {
                return List.of();
            }

            List<String> normalized = new ArrayList<>();
            for (String value : values) {
                if (value != null && !value.trim().isEmpty()) {
                    normalized.add(value.trim().toUpperCase());
                }
            }
            return normalized;
        }
    }
}
