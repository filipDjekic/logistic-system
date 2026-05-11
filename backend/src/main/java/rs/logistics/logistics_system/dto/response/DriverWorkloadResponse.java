package rs.logistics.logistics_system.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriverWorkloadResponse {
    private Long employeeId;
    private String driverName;
    private BigDecimal dailyDrivingHours;
    private BigDecimal weeklyDrivingHours;
    private BigDecimal maxDailyDrivingHours;
    private BigDecimal maxWeeklyDrivingHours;
    private boolean dailyLimitExceeded;
    private boolean weeklyLimitExceeded;
    private boolean assignable;
}
