import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { getBloggerById } from "@/api/endpoints/blogger";
import { logError } from "@/utils/logger";
import type { Screenshot } from "@/types/profile";
import type { PublicGetBloggerByIdOutputDto } from "@/api/types";

/**
 * Хук для загрузки скриншотов, использующий кэш из useBloggerByIdQuery
 */
export const useScreenshotLoader = (
    profileId?: string,
    platform: string = "instagram",
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchScreenshots = useCallback(
      async (forceFetch = false) => {
        if (!profileId) return;

        try {
          setLoading(true);
          setError("");

          const cacheKey = ["bloggerById", Number(profileId)]; // тот же ключ, что и в useBloggerByIdQuery
          let bloggerData = queryClient.getQueryData<PublicGetBloggerByIdOutputDto>(cacheKey);

          // Если данных нет или forceFetch = true — запрашиваем и обновляем кэш
          if (!bloggerData || forceFetch) {
            bloggerData = await queryClient.fetchQuery({
              queryKey: cacheKey,
              queryFn: () => getBloggerById(Number(profileId)),
            });
          }

          if (!bloggerData) {
            setError("Не удалось загрузить данные профиля");
            return;
          }

          // Собираем скриншоты для нужной платформы
          const allScreenshots: Screenshot[] = [];

          const collectScreenshots = (socialList: any[], isDraft = false) => {
            for (const social of socialList || []) {
              if (social.type.toLowerCase() === platform.toLowerCase() && social.statsFiles) {
                const mapped = social.statsFiles.map((file) => ({
                  id: file.id,
                  influencer_id: Number(profileId),
                  platform: social.type.toLowerCase(),
                  file_name: file.name,
                  file_url: file.publicUrl,
                  file_size: file.size * 1024,
                  width: file.width,
                  height: file.height,
                  created_at: file.createdAt,
                  is_draft: isDraft,
                }));
                allScreenshots.push(...mapped);
              }
            }
          };

          collectScreenshots(bloggerData.social);
          collectScreenshots(bloggerData.socialMediaDrafts, true);

          setScreenshots(allScreenshots);
        } catch (err: unknown) {
          logError("Error fetching screenshots:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch screenshots");
        } finally {
          setLoading(false);
        }
      },
      [profileId, platform, queryClient],
  );

  useEffect(() => {
    if (user && profileId) {
      fetchScreenshots();
    }
  }, [profileId, platform, user, fetchScreenshots]);

  return {
    screenshots,
    loading,
    error,
    fetchScreenshots,
    setScreenshots,
  };
};
