import {useState, useCallback} from "react";
import {useToast} from "@/hooks/use-toast";
import {logError} from "@/utils/logger";
import {useDebounce} from "@/hooks/useDebounce";
import {
    adminGetBloggers,
    adminGetBloggersStats,
    adminGetBloggersWithoutGender,
    adminEnrichBloggersWithGender,
    getAdminLinkRequests,
    approveLinkRequest,
    rejectLinkRequest,
} from "@/api/endpoints/admin";
import type {
    AdminGetBloggerOutputDto,
    AdminGetBloggersStatsOutputDto,
    AdminBloggerWithGender,
    ApiGender,
    AdminGetLinkBloggerClientRequestOutputDto,
} from "@/api/types";
import {useInfiniteQuery, useQuery, useQueryClient} from "@tanstack/react-query";
import {PAGINATION} from "@/config/pagination.ts";

export const useAdminBloggers = (activeTab: string) => {
    const {toast} = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [showHidden, setShowHidden] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const queryClient = useQueryClient();

    // === Загружаем статистику блогеров (только один раз) ===
    const {
        data: stats = {
            totalBloggersCount: 0,
            totalApprovedBloggersCount: 0,
            totalVisibleBloggersCount: 0,
            totalModerationLinkRequestsCount: 0
        }
    } = useQuery({
            queryKey: ["adminBloggersStats"],
            queryFn: adminGetBloggersStats,
        }
    );

    // === Запросы на связывание ===
    const {data: linkRequests = [], refetch: refetchLinkRequests} = useQuery({
            queryKey: ["adminLinkRequests"],
            queryFn: async () => {
                const res = await getAdminLinkRequests({status: "MODERATION", page: 1, size: 50});
                return res.items;
            }
        }
    );

    // === useInfiniteQuery для всех блогеров ===
    const bloggersQuery = useInfiniteQuery({
            queryKey: ["adminBloggers", debouncedSearchTerm],
            queryFn: async ({pageParam = 1}) => {
                const res = await adminGetBloggers({
                    page: pageParam,
                    size: PAGINATION.DEFAULT_PAGE_SIZE,
                    sortDirection: "desc",
                    sortField: "createdAt",
                    username: debouncedSearchTerm || undefined
                });
                return {bloggers: res.items, currentPage: pageParam, totalCount: res.totalCount};
            },
            initialPageParam: 1,
            getNextPageParam: (lastPage) => {
                return lastPage.currentPage < (lastPage.totalCount / PAGINATION.DEFAULT_PAGE_SIZE) ? lastPage.currentPage + 1 : undefined
            },
        }
    );

    // === useInfiniteQuery для блогеров без пола ===
    const bloggersWithoutGenderQuery = useInfiniteQuery({
            queryKey: ["adminBloggersWithoutGender"],
            queryFn: async ({pageParam = 1}) => {
                const res = await adminGetBloggersWithoutGender(pageParam, PAGINATION.DEFAULT_PAGE_SIZE);
                const filtered = res.bloggers.filter((b) => !b.genderType || b.genderType === null);
                return {bloggers: filtered, currentPage: pageParam, totalCount: res.totalCount, hasMore: res.hasMore};
            },
            enabled: activeTab === 'gender-selection',
            initialPageParam: 1,
            getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
        }
    );

    // === Методы для пагинации ===
    const loadMoreBloggers = useCallback(() => {
        if (bloggersQuery.hasNextPage && !bloggersQuery.isFetchingNextPage) {
            bloggersQuery.fetchNextPage();
        }
    }, [bloggersQuery]);

    const loadMoreGenderBloggers = useCallback(() => {
        if (bloggersWithoutGenderQuery.hasNextPage && !bloggersWithoutGenderQuery.isFetchingNextPage) {
            bloggersWithoutGenderQuery.fetchNextPage();
        }
    }, [bloggersWithoutGenderQuery]);

    // === Методы для локальных обновлений ===
    const updateBloggerVisibility = useCallback((bloggerId: number, isHidden: boolean) => {
        queryClient.setQueryData<any>(["adminBloggers", debouncedSearchTerm], (oldData) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page: any) => ({
                ...page,
                bloggers: page.bloggers.map((b: AdminBloggerWithGender) =>
                    b.id === bloggerId ? {...b, isHidden} : b
                ),
            }));
            return {...oldData, pages: newPages};
        });
    }, [queryClient, debouncedSearchTerm]);

    const updateBloggerGenderLocally = useCallback((bloggerId: number, genderType: ApiGender) => {
        queryClient.setQueryData<any>(["adminBloggers", debouncedSearchTerm], (oldData) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page: any) => ({
                ...page,
                bloggers: page.bloggers.map((b: AdminBloggerWithGender) =>
                    b.id === bloggerId ? {...b, genderType} : b
                ),
            }));
            return {...oldData, pages: newPages};
        });

        queryClient.setQueryData<any>(["adminBloggersWithoutGender"], (oldData) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page: any) => ({
                ...page,
                bloggers: page.bloggers.filter((b: AdminBloggerWithGender) => b.id !== bloggerId),
            }));
            return {...oldData, pages: newPages};
        });
    }, [queryClient]);

    const clearGenderCache = useCallback(() => {
        queryClient.invalidateQueries({queryKey: ["adminBloggersWithoutGender"]});
    }, [queryClient]);

    // === approve/reject запросы ===
    const approveRequest = useCallback(async (requestId: number) => {
        try {
            setIsProcessing(true);
            await approveLinkRequest(requestId);
            refetchLinkRequests();
        } catch (err) {
            logError("Error approving request:", err);
            toast({title: "Ошибка", description: "Не удалось одобрить запрос", variant: "destructive"});
        } finally {
            setIsProcessing(false);
        }
    }, [refetchLinkRequests, toast]);

    const rejectRequest = useCallback(async (requestId: number) => {
        try {
            setIsProcessing(true);
            await rejectLinkRequest(requestId);
            refetchLinkRequests();
        } catch (err) {
            logError("Error rejecting request:", err);
            toast({title: "Ошибка", description: "Не удалось отклонить запрос", variant: "destructive"});
        } finally {
            setIsProcessing(false);
        }
    }, [refetchLinkRequests, toast]);

    // Фильтруем блогеров в зависимости от настройки показа скрытых
    const filteredBloggers = showHidden
        ? bloggersQuery.data?.pages.flatMap(p => p.bloggers)
        : bloggersQuery.data?.pages.flatMap(p => p.bloggers).filter(blogger => !blogger.isHidden);

    // === Вычисленные значения ===
    const allBloggers = filteredBloggers || [];
    const bloggersWithoutGender = bloggersWithoutGenderQuery.data?.pages.flatMap(p => p.bloggers) || [];
    const loading = bloggersQuery.isLoading && !debouncedSearchTerm;
    const searchLoading = bloggersQuery.isLoading && !!debouncedSearchTerm;
    const isLoadingMore = bloggersQuery.isFetchingNextPage;
    const loadingGenderBloggers = bloggersWithoutGenderQuery.isFetching || bloggersQuery.isFetchingNextPage;
    const hasMoreBloggers = !!bloggersQuery.hasNextPage;
    const hasMoreGenderBloggers = !!bloggersWithoutGenderQuery.hasNextPage;
    const totalBloggersCount = bloggersQuery.data?.pages[0]?.totalCount || 0;
    const totalGenderBloggersCount = bloggersWithoutGenderQuery.data?.pages[0]?.totalCount || 0;
    const error = bloggersQuery.error;
    return {

        allBloggers,
        refetchBloggers: bloggersQuery.refetch,
        fetchBloggersWithoutGender: bloggersWithoutGenderQuery.fetchNextPage,
        bloggersWithoutGender,
        linkRequests,
        loading,
        searchLoading,
        isLoadingMore,
        hasMoreBloggers,
        totalBloggersCount,
        stats,
        searchTerm,
        setSearchTerm,
        showHidden,
        setShowHidden,
        loadMoreBloggers,
        loadMoreGenderBloggers,
        approveRequest,
        rejectRequest,
        updateBloggerVisibility,
        updateBloggerGenderLocally,
        clearGenderCache,
        loadingGenderBloggers,
        hasMoreGenderBloggers,
        totalGenderBloggersCount,
        isProcessing,
        error,
    };
};


//main
//import { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { APIError } from "@/api/client";
// import { useToast } from "@/hooks/use-toast";
// import { logError } from "@/utils/logger";
// import { useDebounce } from "@/hooks/useDebounce";
// import {
//   getAdminLinkRequests,
//   approveLinkRequest,
//   rejectLinkRequest,
//   adminGetBloggers,
//   adminGetBloggersStats,
//   adminGetBloggersWithoutGender,
// } from "../../api/endpoints/admin";
// import { mapLinkRequestToTableFormat } from "@/utils/admin/mappers";
// import type {
//   AdminGetLinkBloggerClientRequestOutputDto,
//   AdminGetBloggersStatsOutputDto,
//   AdminGetBloggerOutputDto,
//   ApiGender,
// } from "../../api/types";
//
// export const useAdminBloggers = () => {
//   const { toast } = useToast();
//   const [allBloggers, setAllBloggers] = useState<AdminGetBloggerOutputDto[]>([]);
//   const [bloggersWithoutGender, setBloggersWithoutGender] = useState<AdminGetBloggerOutputDto[]>([]);
//   const [loadingGenderBloggers, setLoadingGenderBloggers] = useState(false);
//   const [genderBloggersPage, setGenderBloggersPage] = useState(1);
//   const [hasMoreGenderBloggers, setHasMoreGenderBloggers] = useState(true);
//   const [totalGenderBloggersCount, setTotalGenderBloggersCount] = useState(0);
//   const [genderPagesCache, setGenderPagesCache] = useState<Map<number, AdminGetBloggerOutputDto[]>>(new Map());
//   const [linkRequests, setLinkRequests] = useState<AdminGetLinkBloggerClientRequestOutputDto[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [hasMoreBloggers, setHasMoreBloggers] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalBloggersCount, setTotalBloggersCount] = useState(0);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showHidden, setShowHidden] = useState(false);
//   const debouncedSearchTerm = useDebounce(searchTerm, 500);
//   const isFetchingRef = useRef(false);
//   const [stats, setStats] = useState<AdminGetBloggersStatsOutputDto>({
//     totalBloggersCount: 0,
//     totalApprovedBloggersCount: 0,
//     totalVisibleBloggersCount: 0,
//     totalModerationLinkRequestsCount: 0,
//   });
//
//   const fetchBloggers = useCallback(
//     async (page: number = 1, append: boolean = false, isSearch: boolean = false) => {
//       if (isFetchingRef.current) return;
//
//       const isFirstPage = page === 1;
//       isFetchingRef.current = true;
//
//       try {
//         if (isFirstPage) {
//           isSearch ? setSearchLoading(true) : setLoading(true);
//         } else {
//           setIsLoadingMore(true);
//         }
//         setError(null);
//
//         const bloggersResponse = await adminGetBloggers({
//           page,
//           size: 50,
//           sortDirection: "desc",
//           sortField: "createdAt",
//           username: debouncedSearchTerm || undefined,
//         });
//
//         setAllBloggers((prev) => (isFirstPage ? bloggersResponse.items : [...prev, ...bloggersResponse.items]));
//         setTotalBloggersCount(bloggersResponse.totalCount);
//         setHasMoreBloggers(bloggersResponse.items.length === 50 && page * 50 < bloggersResponse.totalCount);
//         setCurrentPage(page);
//
//         if (isFirstPage) {
//           const [statsResponse, linkRequestsResponse] = await Promise.allSettled([
//             adminGetBloggersStats(),
//             getAdminLinkRequests({
//               status: "MODERATION",
//               page: 1,
//               size: 50,
//               sortDirection: "desc",
//               sortField: "createdAt",
//             }),
//           ]);
//
//           if (statsResponse.status === "fulfilled") {
//             setStats(statsResponse.value);
//           } else {
//             logError("Error fetching stats:", statsResponse.reason);
//           }
//
//           if (linkRequestsResponse.status === "fulfilled") {
//             setLinkRequests(linkRequestsResponse.value.items);
//           } else {
//             logError("Error fetching link requests:", linkRequestsResponse.reason);
//           }
//         }
//       } catch (err) {
//         const message = err instanceof Error ? err.message : "Не удалось загрузить данные";
//         setError(message);
//         toast({
//           title: "Ошибка",
//           description: message,
//           variant: "destructive",
//         });
//         logError("Error fetching data:", err);
//       } finally {
//         if (isFirstPage) {
//           isSearch ? setSearchLoading(false) : setLoading(false);
//         } else {
//           setIsLoadingMore(false);
//         }
//         isFetchingRef.current = false;
//       }
//     },
//     [debouncedSearchTerm, toast],
//   );
//
//   useEffect(() => {
//     fetchBloggers(1, false, !!debouncedSearchTerm);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [debouncedSearchTerm]);
//
//   const loadMoreBloggers = useCallback(() => {
//     if (hasMoreBloggers && !isLoadingMore) {
//       fetchBloggers(currentPage + 1, true);
//     }
//   }, [hasMoreBloggers, isLoadingMore, currentPage, fetchBloggers]);
//
//   const approveRequest = useCallback(async (requestId: number) => {
//     setIsProcessing(true);
//     setError(null);
//     try {
//       await approveLinkRequest(requestId);
//       setLinkRequests((prev) => prev.filter((req) => Number(req.id) !== Number(requestId)));
//       setStats((prev) => ({
//         ...prev,
//         totalModerationLinkRequestsCount: prev.totalModerationLinkRequestsCount - 1,
//         totalApprovedBloggersCount: prev.totalApprovedBloggersCount + 1,
//       }));
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : "Ошибка при одобрении запроса";
//       setError(errorMessage);
//       logError("Ошибка при одобрении запроса:", err);
//       throw err instanceof APIError ? err : new Error(errorMessage);
//     } finally {
//       setIsProcessing(false);
//     }
//   }, []);
//
//   const rejectRequest = useCallback(async (requestId: number) => {
//     setIsProcessing(true);
//     setError(null);
//     try {
//       await rejectLinkRequest(requestId);
//       setLinkRequests((prev) => prev.filter((req) => Number(req.id) !== Number(requestId)));
//       setStats((prev) => ({
//         ...prev,
//         totalModerationLinkRequestsCount: prev.totalModerationLinkRequestsCount - 1,
//       }));
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : "Ошибка при отклонении запроса";
//       setError(errorMessage);
//       logError("Ошибка при отклонении запроса:", err);
//       throw err instanceof APIError ? err : new Error(errorMessage);
//     } finally {
//       setIsProcessing(false);
//     }
//   }, []);
//
//   const updateBloggerVisibility = (bloggerId: number, isHidden: boolean) => {
//     setAllBloggers((prev) =>
//       prev.map((blogger) => (blogger.id === bloggerId ? { ...blogger, isHidden } : blogger))
//     );
//     setStats((prev) => ({
//       ...prev,
//       totalVisibleBloggersCount: isHidden ? prev.totalVisibleBloggersCount - 1 : prev.totalVisibleBloggersCount + 1,
//     }));
//   };
//
//   const updateBloggerGenderLocally = (bloggerId: number, genderType: ApiGender) => {
//     setBloggersWithoutGender((prev) => prev.filter((blogger) => blogger.id !== bloggerId));
//     setGenderPagesCache((prevCache) => {
//       const newCache = new Map(prevCache);
//       newCache.forEach((bloggers, pageNumber) => {
//         newCache.set(pageNumber, bloggers.filter((blogger) => blogger.id !== bloggerId));
//       });
//       return newCache;
//     });
//     setTotalGenderBloggersCount((prev) => Math.max(0, prev - 1));
//   };
//
//   const fetchBloggersWithoutGender = useCallback(
//     async (page: number = 1, append: boolean = false) => {
//       try {
//         setLoadingGenderBloggers(true);
//         const result = await adminGetBloggersWithoutGender(page, 50, genderPagesCache);
//         if (append) {
//           setBloggersWithoutGender((prev) => [...prev, ...result.bloggers]);
//         } else {
//           setBloggersWithoutGender(result.bloggers);
//         }
//         setHasMoreGenderBloggers(result.hasMore);
//         setTotalGenderBloggersCount(result.totalCount);
//         setGenderBloggersPage(page);
//         setGenderPagesCache(result.cachedPages);
//       } catch (err) {
//         toast({
//           title: "Ошибка",
//           description: "Не удалось загрузить блогеров без пола",
//           variant: "destructive",
//         });
//       } finally {
//         setLoadingGenderBloggers(false);
//       }
//     },
//     [genderPagesCache, toast],
//   );
//
//   const loadMoreGenderBloggers = useCallback(() => {
//     if (!loadingGenderBloggers && hasMoreGenderBloggers) {
//       fetchBloggersWithoutGender(genderBloggersPage + 1, true);
//     }
//   }, [loadingGenderBloggers, hasMoreGenderBloggers, genderBloggersPage, fetchBloggersWithoutGender]);
//
//   const clearGenderCache = () => {
//     setGenderPagesCache(new Map());
//     setBloggersWithoutGender([]);
//     setGenderBloggersPage(1);
//     setHasMoreGenderBloggers(true);
//     setTotalGenderBloggersCount(0);
//   };
//
//   const filteredBloggers = showHidden ? allBloggers : allBloggers.filter((blogger) => !blogger.isHidden);
//
//   const filteredLinkRequests = useMemo(() => {
//     return linkRequests
//       .map(mapLinkRequestToTableFormat)
//       .filter((mapped) => {
//         if (!searchTerm) return true;
//         const search = searchTerm.toLowerCase();
//         const name = `${mapped.name} ${mapped.lastName}`.trim().toLowerCase();
//         const username = (mapped.username || "").toLowerCase();
//         const email = (mapped.user_email || "").toLowerCase();
//         return name.includes(search) || username.includes(search) || email.includes(search);
//       });
//   }, [linkRequests, searchTerm]);
//
//   return {
//     allBloggers: filteredBloggers,
//     bloggersWithoutGender,
//     linkRequests: filteredLinkRequests,
//     loading,
//     searchLoading,
//     isLoadingMore,
//     hasMoreBloggers,
//     totalBloggersCount,
//     stats,
//     searchTerm,
//     setSearchTerm,
//     showHidden,
//     setShowHidden,
//     fetchBloggers,
//     loadMoreBloggers,
//     approveRequest,
//     rejectRequest,
//     updateBloggerVisibility,
//     updateBloggerGenderLocally,
//     fetchBloggersWithoutGender,
//     loadMoreGenderBloggers,
//     loadingGenderBloggers,
//     hasMoreGenderBloggers,
//     totalGenderBloggersCount,
//     clearGenderCache,
//     isProcessing,
//     error,
//   };
// };
