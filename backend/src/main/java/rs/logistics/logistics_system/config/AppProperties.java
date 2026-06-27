package rs.logistics.logistics_system.config;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.InventoryCountSessionStatus;
import rs.logistics.logistics_system.enums.StockMovementStatus;
import rs.logistics.logistics_system.enums.ShiftStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.enums.VehicleStatus;

@Component
@ConfigurationProperties(prefix = "logistics")
public class AppProperties {

    private final Pagination pagination = new Pagination();
    private final Shift shift = new Shift();
    private final Warehouse warehouse = new Warehouse();
    private final StockMovement stockMovement = new StockMovement();
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

    public StockMovement getStockMovement() {
        return stockMovement;
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


    public boolean isStockMovementStatusTransitionAllowed(StockMovementStatus current, StockMovementStatus next) {
        if (current == null || next == null) {
            return false;
        }

        return getAllowed(statusTransitions.stockMovement, current.name()).contains(next.name());
    }


    public boolean isVehicleStatusTransitionAllowed(VehicleStatus current, VehicleStatus next) {
        if (current == null || next == null) {
            return false;
        }

        return getAllowed(statusTransitions.vehicle, current.name()).contains(next.name());
    }

    public boolean isShiftStatusTransitionAllowed(ShiftStatus current, ShiftStatus next) {
        if (current == null || next == null) {
            return false;
        }

        return getAllowed(statusTransitions.shift, current.name()).contains(next.name());
    }

    public List<String> allowedTaskStatusTransitions(TaskStatus current) {
        return current == null ? List.of() : getAllowed(statusTransitions.task, current.name());
    }

    public List<String> allowedTransportOrderStatusTransitions(TransportOrderStatus current) {
        return current == null ? List.of() : getAllowed(statusTransitions.transportOrder, current.name());
    }

    public List<String> allowedVehicleStatusTransitions(VehicleStatus current) {
        return current == null ? List.of() : getAllowed(statusTransitions.vehicle, current.name());
    }

    public List<String> allowedStockMovementStatusTransitions(StockMovementStatus current) {
        return current == null ? List.of() : getAllowed(statusTransitions.stockMovement, current.name());
    }

    public List<String> allowedInventoryCountStatusTransitions(InventoryCountSessionStatus current) {
        return current == null ? List.of() : getAllowed(statusTransitions.inventoryCount, current.name());
    }

    public List<String> allowedShiftStatusTransitions(ShiftStatus current) {
        return current == null ? List.of() : getAllowed(statusTransitions.shift, current.name());
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


    public static class StockMovement {
        private BigDecimal adjustmentApprovalThreshold = new BigDecimal("100");

        public BigDecimal getAdjustmentApprovalThreshold() {
            return adjustmentApprovalThreshold;
        }

        public void setAdjustmentApprovalThreshold(BigDecimal adjustmentApprovalThreshold) {
            if (adjustmentApprovalThreshold == null || adjustmentApprovalThreshold.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("logistics.stock-movement.adjustment-approval-threshold must be zero or greater");
            }
            this.adjustmentApprovalThreshold = adjustmentApprovalThreshold;
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
        private Map<String, List<String>> vehicle = defaultVehicleTransitions();
        private Map<String, List<String>> stockMovement = defaultStockMovementTransitions();
        private Map<String, List<String>> inventoryCount = defaultInventoryCountTransitions();
        private Map<String, List<String>> shift = defaultShiftTransitions();

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

        public Map<String, List<String>> getVehicle() {
            return vehicle;
        }

        public void setVehicle(Map<String, List<String>> vehicle) {
            this.vehicle = normalize(vehicle);
        }

        public Map<String, List<String>> getStockMovement() {
            return stockMovement;
        }

        public void setStockMovement(Map<String, List<String>> stockMovement) {
            this.stockMovement = normalize(stockMovement);
        }

        public Map<String, List<String>> getInventoryCount() {
            return inventoryCount;
        }

        public void setInventoryCount(Map<String, List<String>> inventoryCount) {
            this.inventoryCount = normalize(inventoryCount);
        }

        public Map<String, List<String>> getShift() {
            return shift;
        }

        public void setShift(Map<String, List<String>> shift) {
            this.shift = normalize(shift);
        }

        private static Map<String, List<String>> defaultTaskTransitions() {
            Map<String, List<String>> transitions = new LinkedHashMap<>();
            transitions.put("NEW", List.of("ASSIGNED", "IN_PROGRESS", "CANCELLED"));
            transitions.put("OPEN", List.of("ASSIGNED", "IN_PROGRESS", "CANCELLED"));
            transitions.put("ASSIGNED", List.of("IN_PROGRESS", "BLOCKED", "CANCELLED"));
            transitions.put("IN_PROGRESS", List.of("BLOCKED", "COMPLETED", "CANCELLED"));
            transitions.put("BLOCKED", List.of("ASSIGNED", "IN_PROGRESS", "CANCELLED"));
            transitions.put("COMPLETED", List.of());
            transitions.put("CANCELLED", List.of());
            return transitions;
        }

        private static Map<String, List<String>> defaultTransportOrderTransitions() {
            Map<String, List<String>> transitions = new LinkedHashMap<>();
            transitions.put("DRAFT", List.of("ASSIGNED", "CANCELLED"));
            transitions.put("ASSIGNED", List.of("PICKING", "CANCELLED"));
            transitions.put("PICKING", List.of("PACKING", "CANCELLED"));
            transitions.put("PACKING", List.of("READY_FOR_LOADING", "CANCELLED"));
            transitions.put("READY_FOR_LOADING", List.of("LOADING", "CANCELLED"));
            transitions.put("LOADING", List.of("IN_TRANSIT", "CANCELLED"));
            transitions.put("IN_TRANSIT", List.of("DELIVERED", "RETURNING", "FAILED"));
            transitions.put("RETURNING", List.of("FAILED"));
            transitions.put("RESCHEDULED", List.of("ASSIGNED", "CANCELLED"));
            transitions.put("DELIVERED", List.of());
            transitions.put("FAILED", List.of());
            transitions.put("CANCELLED", List.of());
            return transitions;
        }


        private static Map<String, List<String>> defaultStockMovementTransitions() {
            Map<String, List<String>> transitions = new LinkedHashMap<>();
            transitions.put("DRAFT", List.of("PENDING_APPROVAL", "EXECUTED", "CANCELLED"));
            transitions.put("PENDING_APPROVAL", List.of("APPROVED", "REJECTED", "CANCELLED"));
            transitions.put("APPROVED", List.of("EXECUTED", "CANCELLED"));
            transitions.put("EXECUTED", List.of("REVERSED"));
            transitions.put("REJECTED", List.of());
            transitions.put("CANCELLED", List.of());
            transitions.put("REVERSED", List.of());
            return transitions;
        }


        private static Map<String, List<String>> defaultInventoryCountTransitions() {
            Map<String, List<String>> transitions = new LinkedHashMap<>();
            transitions.put("DRAFT", List.of("OPEN", "CANCELLED"));
            transitions.put("OPEN", List.of("COUNTING", "CANCELLED"));
            transitions.put("COUNTING", List.of("REVIEW", "CANCELLED"));
            transitions.put("REVIEW", List.of("APPROVED", "REJECTED", "COUNTING", "CANCELLED"));
            transitions.put("APPROVED", List.of("ADJUSTMENTS_CREATED", "CANCELLED"));
            transitions.put("ADJUSTMENTS_CREATED", List.of("CLOSED"));
            transitions.put("CLOSED", List.of());
            transitions.put("REJECTED", List.of());
            transitions.put("CANCELLED", List.of());
            return transitions;
        }

        private static Map<String, List<String>> defaultShiftTransitions() {
            Map<String, List<String>> transitions = new LinkedHashMap<>();
            transitions.put("PLANNED", List.of("ACTIVE", "CANCELLED"));
            transitions.put("ACTIVE", List.of("FINISHED"));
            transitions.put("FINISHED", List.of());
            transitions.put("CANCELLED", List.of());
            return transitions;
        }

        private static Map<String, List<String>> defaultVehicleTransitions() {
            Map<String, List<String>> transitions = new LinkedHashMap<>();
            transitions.put("AVAILABLE", List.of("RESERVED", "MAINTENANCE", "OUT_OF_SERVICE"));
            transitions.put("RESERVED", List.of("IN_USE", "AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"));
            transitions.put("IN_USE", List.of("AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"));
            transitions.put("MAINTENANCE", List.of("AVAILABLE", "OUT_OF_SERVICE"));
            transitions.put("OUT_OF_SERVICE", List.of("MAINTENANCE", "AVAILABLE"));
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
