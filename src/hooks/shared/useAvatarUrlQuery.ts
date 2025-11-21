import { useQuery } from "@tanstack/react-query";
import {
    loadAvatarWithCorsBypass,
    createAvatarProxyUrlAlternative,
    createAvatarProxyUrlData,
    createPlaceholderAvatarUrl,
} from "@/utils/avatarProxy";


type ProxyInputType = {
    src: string
    userName?: string
    gender?: string
}
const proxyLoaders: Array<(args: ProxyInputType) => Promise<string>> = [
    async ({ src, userName, gender }) =>
        loadAvatarWithCorsBypass(src, userName, gender),

    async ({ src }) => createAvatarProxyUrlAlternative(src),

    async ({ src }) => createAvatarProxyUrlData(src),

    async ({ src }) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`,
];

async function testImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
    });
}

export function useAvatarUrl({src, userId, userName, gender}: {
    src?: string | null;
    userId: string;
    userName?: string;
    gender?: string;
}) {
    return useQuery({
        enabled: Boolean(userId),
        queryKey: ["avatar-url", userId],
        queryFn: async () => {
            if (!src) return createPlaceholderAvatarUrl(userName, gender);

            for (const loader of proxyLoaders) {
                try {
                    const url = await loader({ src, userName, gender });
                    if (await testImage(url)) return url;
                } catch {}
            }

            return createPlaceholderAvatarUrl(userName, gender);
        },

        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}


// export function useAvatarUrl({src, userName, gender}: ProxyInputType) {
//     return useQuery({
//         enabled: !!src,
//         queryKey: ["avatar-url", src],
//         queryFn: async () => {
//             if (!src) return null;
//
//             for (const loader of proxyLoaders) {
//                 try {
//                     const url = await loader({src, userName, gender});
//                     const ok = await testImage(url);
//
//                     if (ok) return url;
//                 } catch (_) {
//                     // пробуем следующий прокси
//                     continue;
//                 }
//             }
//
//             // все прокси упали → делаем placeholder
//             return createPlaceholderAvatarUrl(userName || "User", gender);
//         },
//
//         staleTime: 1000 * 60 * 60,
//         gcTime: 1000 * 60 * 60,
//         retry: false,
//         refetchOnMount: false,
//         refetchOnWindowFocus: false
//     });
// }
