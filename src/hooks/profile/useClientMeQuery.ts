import { useQuery } from "@tanstack/react-query";
import { getClientMe } from "@/api/endpoints/client";

export const clientMeQueryKey = ["clientMe"];


export const useClientMe = (enabled: boolean = true) => {
    return useQuery({
        queryKey: clientMeQueryKey,
        queryFn: getClientMe,
        enabled,
        staleTime: Infinity,
        retry: false,
    });
};
