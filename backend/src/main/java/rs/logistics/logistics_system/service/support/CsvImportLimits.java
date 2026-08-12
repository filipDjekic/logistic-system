package rs.logistics.logistics_system.service.support;

public final class CsvImportLimits {
    public static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    public static final int MAX_DATA_ROWS = 5000;
    public static final int MAX_COLUMNS = 80;

    private CsvImportLimits() {
    }
}
