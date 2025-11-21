import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { mapApiDetailBloggerToLocal } from "@/utils/api/mappers";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/utils/errorHandler";
import type { PublicGetBloggerByIdOutputDto } from "@/api/types";
import {useBloggerByIdQuery} from "@/hooks/profile/getBloggerByIdQuery.ts";

function convertYouTubeIdToUrl(externalId: string, username?: string): string {
  const id = externalId || "";
  if (id.startsWith("http")) return id;
  if (username?.trim()) {
    return `https://www.youtube.com/@${username.replace(/^@/, "")}`;
  }
  if (!id.trim()) return "";
  if (id.startsWith("UC")) return `https://www.youtube.com/channel/${id}`;
  return id.startsWith("@") ? `https://www.youtube.com/${id}` : `https://www.youtube.com/@${id}`;
}

function convertTelegramToUrl(username?: string): string {
  if (!username?.trim()) return "";
  const cleanUsername = username.replace(/^@/, "").trim();
  return `https://t.me/${cleanUsername}`;
}

function convertTikTokToUrl(username?: string): string {
  if (!username?.trim()) return "";
  const cleanUsername = username.replace(/^@/, "").trim();
  return `https://www.tiktok.com/@${cleanUsername}`;
}

export const useProfileData = () => {
  const { user, bloggerInfo, lastLinkRequest, bloggerInfoLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { handleError } = useErrorHandler({
    showToast: (message, type) =>
        toast({
          title:
              type === "error"
                  ? "Ошибка"
                  : type === "warning"
                      ? "Предупреждение"
                      : "Информация",
          description: message,
          variant: type === "error" ? "destructive" : "default",
        }),
    showNotifications: true,
  });

  const [profile, setProfile] = useState<any>(null);
  const [rawApiResponse, setRawApiResponse] = useState<PublicGetBloggerByIdOutputDto | null>(null);
  const [availablePlatforms, setAvailablePlatforms] = useState<Record<string, any>>({});
  const [error, setError] = useState("");

  const bloggerId = useMemo(
      () => bloggerInfo?.id || lastLinkRequest?.bloggerId,
      [bloggerInfo?.id, lastLinkRequest?.bloggerId]
  );

  const {
    data: detailedBlogger,
    isLoading,
    error: queryError,
    refetch,
  } = useBloggerByIdQuery({
    bloggerId,
    options: {
      enabled: !!user && !!bloggerId && !bloggerInfoLoading,
    },
  });

  useEffect(() => {
    if (!detailedBlogger) return;

    try {
      setRawApiResponse(detailedBlogger);

      const isVerified = detailedBlogger.verificationStatus === "APPROVED";
      const draft = detailedBlogger.profileDraft;
      const useDraft = !isVerified && draft;

      const mergedBloggerData = {
        ...detailedBlogger,
        name: useDraft && draft.name !== null ? draft.name : detailedBlogger.name,
        lastName: useDraft && draft.lastName !== null ? draft.lastName : detailedBlogger.lastName,
        description: useDraft && draft.description !== null ? draft.description : detailedBlogger.description,
        contactLink: useDraft && draft.contactLink !== null ? draft.contactLink : detailedBlogger.contactLink,
        workFormat: useDraft && draft.workFormat !== null ? draft.workFormat : detailedBlogger.workFormat,
        genderType: useDraft && draft.genderType !== null ? draft.genderType : detailedBlogger.genderType,
        isBarterAvailable:
            useDraft && draft.isBarterAvailable !== null ? draft.isBarterAvailable : detailedBlogger.isBarterAvailable,
        isMartRegistry:
            useDraft && draft.isMartRegistry !== null ? draft.isMartRegistry : detailedBlogger.isMartRegistry,
        topics: useDraft && draft.topics ? draft.topics : detailedBlogger.topics,
        restrictedTopics:
            useDraft && draft.restrictedTopics ? draft.restrictedTopics : detailedBlogger.restrictedTopics,
      };

      setProfile(mapApiDetailBloggerToLocal(mergedBloggerData));

      const getPrice = (draft: string | null | undefined, fallback: string | undefined) =>
          parseFloat(draft ?? fallback ?? "0");

      const createPlatformData = (social: any, isPending = false) => {
        const platformName = social.type.toLowerCase();
        const priceDraft = detailedBlogger.priceDraft?.find((p) => p.type === social.type);
        const mainPrice = detailedBlogger.price.find((p) => p.type === social.type);
        const isYouTube = social.type === "YOUTUBE";
        const isTelegram = social.type === "TELEGRAM";
        const isTikTok = social.type === "TIKTOK";

        let profileUrl = social.externalId || "";
        if (isYouTube) {
          profileUrl = convertYouTubeIdToUrl(social.externalId || "", social.username);
        } else if (isTelegram && social.username) {
          profileUrl = convertTelegramToUrl(social.username);
        } else if (isTikTok && social.username) {
          profileUrl = convertTikTokToUrl(social.username);
        }

        return {
          username: social.username || "",
          profile_url: profileUrl,
          subscribers: parseInt(social.subscribers || "0"),
          er: social.er || 0,
          reach: parseInt(social.postCoverage || "0"),
          price: getPrice(priceDraft?.postPrice, isYouTube ? mainPrice?.integrationPrice : mainPrice?.postPrice),
          storyReach: parseInt(social.coverage || "0"),
          storyPrice: getPrice(priceDraft?.storiesPrice, mainPrice?.storiesPrice),
          integrationPrice: getPrice(priceDraft?.integrationPrice, mainPrice?.integrationPrice),
          screenshots:
              social.statsFiles?.map((file: any) => ({
                id: file.id,
                influencer_id: detailedBlogger.id,
                platform: platformName,
                file_name: file.name,
                file_url: file.publicUrl,
                file_size: file.size * 1024,
                width: file.width,
                height: file.height,
                created_at: file.createdAt,
                is_draft: false,
              })) || [],
          ...(isPending && { isPending: true }),
          ...(platformName === "youtube" && { views: parseInt(social.postCoverage || "0") }),
        };
      };

      const platformsData: Record<string, any> = {};
      detailedBlogger.social?.forEach((social) => {
        platformsData[social.type.toLowerCase()] = createPlatformData(social);
      });
      detailedBlogger.socialMediaDrafts?.forEach((socialDraft) => {
        const platformName = socialDraft.type.toLowerCase();
        if (!platformsData[platformName]) {
          platformsData[platformName] = createPlatformData(socialDraft, true);
        }
      });

      setAvailablePlatforms(platformsData);
      setError("");
    } catch (err) {
      const processed = handleError(err, { showNotification: true, logError: true });
      setError(processed.message);
    }
  }, [detailedBlogger, handleError]);

  useEffect(() => {
    if (queryError) {
      const processed = handleError(queryError, { showNotification: true, logError: true });
      setError(processed.message);
    }
  }, [queryError, handleError]);

  const fetchProfile = useCallback(
      async (options?: { bypassCache?: boolean }) => {
        try {
          if (options?.bypassCache) {
            await queryClient.invalidateQueries({ queryKey: ["bloggerById", bloggerId] });
          }
          await refetch();
        } catch (err) {
          const processed = handleError(err, { showNotification: true, logError: true });
          setError(processed.message);
        }
      },
      [refetch, bloggerId, handleError, queryClient]
  );

  return {
    profile,
    rawApiResponse,
    loading: isLoading,
    error,
    availablePlatforms,
    setProfile,
    setAvailablePlatforms,
    fetchProfile,
  };
};

//import { useState, useCallback, useEffect, useMemo } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { getBloggerById } from "@/api/endpoints/blogger";
// import { mapApiDetailBloggerToLocal } from "@/utils/api/mappers";
// import { APIError } from "@/api/client";
// import { useToast } from "@/hooks/use-toast";
// import { useErrorHandler } from "@/utils/errorHandler";
// import type { PublicGetBloggerByIdOutputDto } from "@/api/types";
//
// function convertYouTubeIdToUrl(externalId: string, username?: string): string {
//   const id = externalId || "";
//   if (id.startsWith('http')) return id;
//   if (username?.trim()) {
//     return `https://www.youtube.com/@${username.replace(/^@/, '')}`;
//   }
//   if (!id.trim()) return "";
//   if (id.startsWith('UC')) return `https://www.youtube.com/channel/${id}`;
//   return id.startsWith('@') ? `https://www.youtube.com/${id}` : `https://www.youtube.com/@${id}`;
// }
//
// function convertTelegramToUrl(username?: string): string {
//   if (!username?.trim()) return "";
//   const cleanUsername = username.replace(/^@/, '').trim();
//   return cleanUsername ? `https://t.me/${cleanUsername}` : "";
// }
//
// function convertTikTokToUrl(username?: string): string {
//   if (!username?.trim()) return "";
//   const cleanUsername = username.replace(/^@/, '').trim();
//   return cleanUsername ? `https://www.tiktok.com/@${cleanUsername}` : "";
// }
//
// /**
//  * Hook for loading blogger profile data
//  */
// export const useProfileData = () => {
//   const { user, bloggerInfo, lastLinkRequest, bloggerInfoLoading } = useAuth();
//   const { toast } = useToast();
//   const { handleError } = useErrorHandler({
//     showToast: (message: string, type?: "error" | "warning" | "info") => {
//       toast({
//         title:
//           type === "error"
//             ? "Ошибка"
//             : type === "warning"
//               ? "Предупреждение"
//               : "Информация",
//         description: message,
//         variant: type === "error" ? "destructive" : "default",
//       });
//     },
//     showNotifications: true,
//   });
//   const [profile, setProfile] = useState<any>(null);
//   const [rawApiResponse, setRawApiResponse] = useState<PublicGetBloggerByIdOutputDto | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [availablePlatforms, setAvailablePlatforms] = useState<
//     Record<string, any>
//   >({});
//
//   const bloggerId = useMemo(() => bloggerInfo?.id || lastLinkRequest?.bloggerId, [bloggerInfo?.id, lastLinkRequest?.bloggerId]);
//
//   const fetchProfile = useCallback(async (options?: { bypassCache?: boolean }) => {
//     if (!user) return;
//
//     try {
//       setLoading(true);
//       setError("");
//
//       if (bloggerId) {
//         const detailedBlogger = await getBloggerById(bloggerId, { bypassCache: options?.bypassCache });
//
//         setRawApiResponse(detailedBlogger);
//
//         const isVerified = detailedBlogger.verificationStatus === 'APPROVED';
//         const draft = detailedBlogger.profileDraft;
//         const useDraft = !isVerified && draft;
//
//         const mergedBloggerData = {
//           ...detailedBlogger,
//           name: useDraft && draft.name !== null ? draft.name : detailedBlogger.name,
//           lastName: useDraft && draft.lastName !== null ? draft.lastName : detailedBlogger.lastName,
//           description: useDraft && draft.description !== null ? draft.description : detailedBlogger.description,
//           contactLink: useDraft && draft.contactLink !== null ? draft.contactLink : detailedBlogger.contactLink,
//           workFormat: useDraft && draft.workFormat !== null ? draft.workFormat : detailedBlogger.workFormat,
//           genderType: useDraft && draft.genderType !== null ? draft.genderType : detailedBlogger.genderType,
//           isBarterAvailable: useDraft && draft.isBarterAvailable !== null ? draft.isBarterAvailable : detailedBlogger.isBarterAvailable,
//           isMartRegistry: useDraft && draft.isMartRegistry !== null ? draft.isMartRegistry : detailedBlogger.isMartRegistry,
//           topics: useDraft && draft.topics ? draft.topics : detailedBlogger.topics,
//           restrictedTopics: useDraft && draft.restrictedTopics ? draft.restrictedTopics : detailedBlogger.restrictedTopics,
//         };
//
//         setProfile(mapApiDetailBloggerToLocal(mergedBloggerData));
//
//         const getPrice = (draft: string | null | undefined, fallback: string | undefined) =>
//           parseFloat(draft ?? fallback ?? "0");
//
//         const createPlatformData = (social: any, isPending = false) => {
//           const platformName = social.type.toLowerCase();
//           const priceDraft = detailedBlogger.priceDraft?.find((p) => p.type === social.type);
//           const mainPrice = detailedBlogger.price.find((p) => p.type === social.type);
//           const isYouTube = social.type === 'YOUTUBE';
//           const isTelegram = social.type === 'TELEGRAM';
//           const isTikTok = social.type === 'TIKTOK';
//
//           let profileUrl = social.externalId || "";
//           if (isYouTube) {
//             profileUrl = convertYouTubeIdToUrl(social.externalId || "", social.username);
//           } else if (isTelegram && social.username) {
//             profileUrl = convertTelegramToUrl(social.username);
//           } else if (isTikTok && social.username) {
//             profileUrl = convertTikTokToUrl(social.username);
//           }
//
//           return {
//             username: social.username || "",
//             profile_url: profileUrl,
//             subscribers: parseInt(social.subscribers || "0"),
//             er: social.er || 0,
//             reach: parseInt(social.postCoverage || "0"),
//             price: getPrice(priceDraft?.postPrice, isYouTube ? mainPrice?.integrationPrice : mainPrice?.postPrice),
//             storyReach: parseInt(social.coverage || "0"),
//             storyPrice: getPrice(priceDraft?.storiesPrice, mainPrice?.storiesPrice),
//             integrationPrice: getPrice(priceDraft?.integrationPrice, mainPrice?.integrationPrice),
//             screenshots: social.statsFiles?.map((file: any) => ({
//               id: file.id,
//               influencer_id: detailedBlogger.id,
//               platform: platformName,
//               file_name: file.name,
//               file_url: file.publicUrl,
//               file_size: file.size * 1024,
//               width: file.width,
//               height: file.height,
//               created_at: file.createdAt,
//               is_draft: false,
//             })) || [],
//             ...(isPending && { isPending: true }),
//             ...(platformName === "youtube" && { views: parseInt(social.postCoverage || "0") }),
//           };
//         };
//
//         const platformsData: Record<string, any> = {};
//         detailedBlogger.social?.forEach((social) => {
//           platformsData[social.type.toLowerCase()] = createPlatformData(social);
//         });
//         detailedBlogger.socialMediaDrafts?.forEach((socialDraft) => {
//           const platformName = socialDraft.type.toLowerCase();
//           if (!platformsData[platformName]) {
//             platformsData[platformName] = createPlatformData(socialDraft, true);
//           }
//         });
//
//         setAvailablePlatforms(platformsData);
//       } else {
//         setError("Профиль не найден. Используйте страницу настройки профиля для создания.");
//       }
//     } catch (err: unknown) {
//       const processedError = handleError(err, { showNotification: true, logError: true });
//       setError(processedError.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [user, bloggerId, handleError]);
//
//   useEffect(() => {
//     if (user && bloggerId && !bloggerInfoLoading) {
//       fetchProfile();
//     }
//   }, [user, bloggerId, bloggerInfoLoading, fetchProfile]);
//
//   return {
//     profile,
//     rawApiResponse,
//     loading,
//     error,
//     availablePlatforms,
//     setProfile,
//     setAvailablePlatforms,
//     fetchProfile,
//   };
// };

