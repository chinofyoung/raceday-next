import { usePaginatedQuery as useConvexPaginatedQuery } from "convex/react";
import { useMemo } from "react";

interface UsePaginatedQueryOptions<T> {
    apiQuery: any;
    args?: Record<string, any>;
    pageSize?: number;
}

export function usePaginatedQuery<T>({ apiQuery, args = {}, pageSize = 20 }: UsePaginatedQueryOptions<T>) {
    const { results, status, loadMore: convexLoadMore } = useConvexPaginatedQuery(
        apiQuery,
        args,
        { initialNumItems: pageSize }
    );

    const loading = status === "LoadingFirstPage" || status === "LoadingMore";
    const hasMore = status !== "Exhausted";

    const loadMore = () => {
        if (status === "CanLoadMore") {
            convexLoadMore(pageSize);
        }
    };

    const refresh = () => {
        // Convex is real-time, refresh isn't usually needed, 
        // but we could implement it if we were using a non-convex query.
    };

    return {
        data: results as T[],
        loading,
        error: null, // Convex handles errors via its own mechanism
        hasMore,
        loadMore,
        refresh
    };
}
