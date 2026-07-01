package rs.logistics.logistics_system.observability;

public final class RequestCorrelation {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String TRACE_ID_ATTRIBUTE = "traceId";
    public static final String MDC_TRACE_ID = "traceId";

    private RequestCorrelation() {
    }
}
