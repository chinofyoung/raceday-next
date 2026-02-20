import { useState, useCallback, useEffect, useRef } from "react";
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

    // useRef holds the latest fetchFn without triggering re-renders or effect loops
    const fetchFnRef = useRef(fetchFn);
    useEffect(() => {
        fetchFnRef.current = fetchFn;
    });

    const lastDocRef = useRef(lastDoc);
    useEffect(() => {
        lastDocRef.current = lastDoc;
    });

    const loadMore = useCallback(async (isInitial = false) => {
        if (loading) return;
        if (!isInitial && !hasMore) return;

        setLoading(true);
        setError(null);
        try {
            const result = await fetchFnRef.current({
                lastDoc: isInitial ? undefined : lastDocRef.current,
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
    }, [loading, hasMore, pageSize]); // ← fetchFn and lastDoc removed from deps

    // Stable initial load — runs once
    useEffect(() => {
        loadMore(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refresh = useCallback(() => {
        setLastDoc(undefined);
        setHasMore(true);
        loadMore(true);
    }, [loadMore]);



    return { data, loading, error, hasMore, loadMore, refresh };
}
