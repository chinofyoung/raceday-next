import { useState, useCallback, useEffect } from "react";
import { DocumentSnapshot } from "firebase/firestore";

interface UsePaginatedQueryOptions<T> {
    fetchFn: (options: { lastDoc?: DocumentSnapshot; limitCount: number }) => Promise<{
        items: T[];
        lastDoc: DocumentSnapshot | undefined;
    }>;
    pageSize?: number;
}

export function usePaginatedQuery<T>({ fetchFn, pageSize = 20 }: UsePaginatedQueryOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);

    const loadMore = useCallback(async (isInitial = false) => {
        if (loading || (!hasMore && !isInitial)) return;

        setLoading(true);
        setError(null);
        try {
            const result = await fetchFn({
                lastDoc: isInitial ? undefined : lastDoc,
                limitCount: pageSize
            });

            if (isInitial) {
                setData(result.items);
            } else {
                setData(prev => [...prev, ...result.items]);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.items.length === pageSize);
        } catch (err) {
            console.error("Pagination error:", err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [fetchFn, lastDoc, loading, hasMore, pageSize]);

    const refresh = useCallback(() => loadMore(true), [loadMore]);

    // Initial load
    useEffect(() => {
        refresh();
    }, []);

    return { data, loading, error, hasMore, loadMore, refresh };
}
