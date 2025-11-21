import { useMemo } from "react";
import { mapApiDetailBloggerToLocal } from "@/utils/api/mappers";
import { useErrorHandler } from "@/utils/errorHandler";
import type { Blogger } from "@/types/blogger";
import {useBloggerByIdQuery} from "@/hooks/profile/getBloggerByIdQuery.ts";

interface UseBloggerProfileProps {
  username?: string;
  id?: number;
}

export const useBloggerProfile = ({ username, id }: UseBloggerProfileProps) => {
  const { handleError } = useErrorHandler({ showNotifications: true });

  const {
    data,
    isLoading,
    isError,
    error,
  } = useBloggerByIdQuery({
    bloggerId: id,
    options: { enabled: !!id },
  });

  if (isError && error) handleError(error);

  const blogger = useMemo(() => (
      data ? (mapApiDetailBloggerToLocal(data) as Blogger) : null
      ), [data]);

  return {
    blogger,
    loading: isLoading,
    error: isError ? (error as Error).message : null,
  };
};


// import { useState, useEffect } from "react";
// import { Blogger } from "@/types/blogger";
// import { getAllBloggers, getBloggerById } from "@/api/endpoints/blogger";
// import { mapApiDetailBloggerToLocal } from "@/utils/api/mappers";
// import { useErrorHandler } from "@/utils/errorHandler";
// import { normalizeUsername } from "@/utils/username";
//
// export const useBloggerProfile = ({username,id}:{username?: string, id?:number}) => {
//   const { handleError } = useErrorHandler({ showNotifications: true });
//   const [blogger, setBlogger] = useState<Blogger | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//
//   useEffect(() => {
//     const normalizedUsername = normalizeUsername(username);
//     if (!normalizedUsername) {
//       setError("Username не указан");
//       setBlogger(null);
//       return;
//     }
//
//     const fetchProfile = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const searchResponse = await getAllBloggers({
//           username: normalizedUsername,
//           page: 1,
//           size: 1,
//         });
//
//         const bloggerData = searchResponse.items?.[0];
//         if (!bloggerData) {
//           setError("Блогер не найден");
//           return;
//         }
//
//         const detailedResponse = await getBloggerById(bloggerData.id);
//         setBlogger(mapApiDetailBloggerToLocal(detailedResponse));
//       } catch (err: unknown) {
//         setError(handleError(err).message);
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     fetchProfile();
//   }, [username, handleError]);
//
//   return { blogger, loading, error };
// };
