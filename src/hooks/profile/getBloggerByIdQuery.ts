import { useQuery } from "@tanstack/react-query";
import { getBloggerById } from "@/api/endpoints/blogger";
import type { PublicGetBloggerByIdOutputDto } from "@/api/types";

type BloggerByIdQueryProps = {
    bloggerId?: number,
    options?: BloggerByIdOptions
}
type BloggerByIdOptions = {
    enabled?: boolean
    bypassCache?: boolean
}
export const useBloggerByIdQuery = ({bloggerId, options}: BloggerByIdQueryProps) => {
    return useQuery<PublicGetBloggerByIdOutputDto>({
        queryKey: ["bloggerById", bloggerId],
        queryFn: () => {
            if (!bloggerId) throw new Error("Missing bloggerId");
            return getBloggerById(bloggerId, { bypassCache: options?.bypassCache });
        },
        enabled: !!bloggerId && (options?.enabled ?? true),
        staleTime: Infinity,
    });
};
