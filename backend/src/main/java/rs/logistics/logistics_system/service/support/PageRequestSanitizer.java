package rs.logistics.logistics_system.service.support;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PageRequestSanitizer {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private PageRequestSanitizer() {
    }

    public static Pageable sanitize(int page, int size, Sort sort) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        return PageRequest.of(safePage, safeSize, sort == null ? Sort.unsorted() : sort);
    }

    public static Pageable sanitize(Pageable pageable, Sort fallbackSort) {
        if (pageable == null) {
            return sanitize(0, DEFAULT_SIZE, fallbackSort);
        }
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : fallbackSort;
        return sanitize(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }
}
