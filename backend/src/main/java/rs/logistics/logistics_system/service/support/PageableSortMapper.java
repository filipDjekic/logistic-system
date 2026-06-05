package rs.logistics.logistics_system.service.support;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;
import java.util.Set;

public final class PageableSortMapper {

    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    public static final int MAX_LOOKUP_PAGE_SIZE = 50;

    private PageableSortMapper() {
    }

    public static Pageable map(Pageable pageable, Map<String, String> aliases, Set<String> allowedProperties, Sort fallbackSort) {
        if (pageable == null) {
            return PageRequest.of(0, DEFAULT_PAGE_SIZE, fallbackSort);
        }

        Sort mappedSort = Sort.unsorted();
        for (Sort.Order order : pageable.getSort()) {
            String mappedProperty = aliases.getOrDefault(order.getProperty(), order.getProperty());
            if (!allowedProperties.contains(mappedProperty)) {
                continue;
            }

            Sort.Order mappedOrder = new Sort.Order(order.getDirection(), mappedProperty);
            if (order.isIgnoreCase()) {
                mappedOrder = mappedOrder.ignoreCase();
            }
            mappedOrder = switch (order.getNullHandling()) {
                case NULLS_FIRST -> mappedOrder.nullsFirst();
                case NULLS_LAST -> mappedOrder.nullsLast();
                case NATIVE -> mappedOrder.nullsNative();
            };
            mappedSort = mappedSort.and(Sort.by(mappedOrder));
        }

        if (mappedSort.isUnsorted()) {
            mappedSort = fallbackSort;
        }

        return PageRequest.of(safePage(pageable), safeSize(pageable, MAX_PAGE_SIZE), mappedSort);
    }

    public static Pageable clamp(Pageable pageable, int defaultSize, int maxSize, Sort fallbackSort) {
        if (pageable == null) {
            return PageRequest.of(0, defaultSize, fallbackSort == null ? Sort.unsorted() : fallbackSort);
        }
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : (fallbackSort == null ? Sort.unsorted() : fallbackSort);
        return PageRequest.of(safePage(pageable), safeSize(pageable, maxSize), sort);
    }

    public static Pageable lookup(Pageable pageable, Sort fallbackSort) {
        return clamp(pageable, DEFAULT_PAGE_SIZE, MAX_LOOKUP_PAGE_SIZE, fallbackSort);
    }

    private static int safePage(Pageable pageable) {
        return Math.max(0, pageable.getPageNumber());
    }

    private static int safeSize(Pageable pageable, int maxSize) {
        int requested = pageable.getPageSize() <= 0 ? DEFAULT_PAGE_SIZE : pageable.getPageSize();
        return Math.min(requested, maxSize);
    }
}
