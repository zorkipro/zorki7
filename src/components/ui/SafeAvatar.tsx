import React from "react";
import { Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import {useAvatarUrl} from "@/hooks/shared/useAvatarUrlQuery.ts";

interface SafeAvatarProps {
  id:string;
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
  username?: string;
  gender?: string;
}

export const SafeAvatar: React.FC<SafeAvatarProps> = (
    {id, src, alt, className = "w-10 h-10", fallbackIcon, fallbackText, username, gender}) => {
  const {
    data: avatarUrl,
    isLoading,
    isError,
  } = useAvatarUrl({ userId: id, src, userName: username, gender });

  const showFallback = isLoading || isError || !avatarUrl;

  return (
      <div
          className={cn(
              "rounded-full bg-muted flex items-center justify-center overflow-hidden aspect-square",
              className,
          )}
      >
        {!showFallback && (
            <img
                src={avatarUrl}
                alt={alt}
                className="w-full h-full object-cover aspect-square"
                loading="lazy"
            />
        )}

        {showFallback && (
            <div className="w-full h-full flex items-center justify-center">
              {isLoading ? (
                  <div className="w-1/2 h-1/2 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                  <>
                    {fallbackIcon || (
                        <Instagram className="w-1/2 h-1/2 text-muted-foreground" />
                    )}
                    {fallbackText && (
                        <span className="text-xs text-muted-foreground text-center px-1">
                  {fallbackText}
                </span>
                    )}
                  </>
              )}
            </div>
        )}
      </div>
  );
};

export default SafeAvatar;

//
// /**
//  * Безопасный компонент аватарки с обработкой CORS ошибок
//  * Автоматически переключается на fallback при ошибке загрузки
//  */
// export const SafeAvatar: React.FC<SafeAvatarProps> = ({
//   src,
//   alt,
//   className = "w-10 h-10",
//   fallbackIcon,
//   fallbackText,
//   username,
//   gender,
// }) => {
//   const [imageError, setImageError] = useState(false);
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [proxyAttempt, setProxyAttempt] = useState(0);
//   const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
//
//   // Если нет src или произошла ошибка, показываем fallback
//   const showFallback = !src || imageError;
//
//   // Загружаем аватарку с обходом CORS
//   React.useEffect(() => {
//     if (!src) return;
//
//     // Очищаем предыдущий таймаут
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
//
//     const loadAvatar = async () => {
//       setIsLoading(true);
//       try {
//         // Используем переданный username или извлекаем из alt
//         const finalUsername =
//           username ||
//           alt.replace("Аватар ", "").replace("Avatar ", "") ||
//           "User";
//
//         // Пробуем разные прокси в зависимости от попытки
//         let url: string | null = null;
//
//         if (proxyAttempt === 0) {
//           // Первая попытка - основной прокси
//           url = await loadAvatarWithCorsBypass(src, finalUsername, gender);
//         } else if (proxyAttempt === 1) {
//           // Вторая попытка - альтернативный прокси
//           const { createAvatarProxyUrlAlternative } = await import(
//             "@/utils/avatarProxy"
//           );
//           url = createAvatarProxyUrlAlternative(src);
//         } else if (proxyAttempt === 2) {
//           // Третья попытка - третий прокси
//           const { createAvatarProxyUrlData } = await import(
//             "@/utils/avatarProxy"
//           );
//           url = createAvatarProxyUrlData(src);
//         } else if (proxyAttempt === 3) {
//           // Четвертая попытка - резервный прокси
//           url = `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`;
//         } else {
//           // Все попытки исчерпаны - используем placeholder
//           const { createPlaceholderAvatarUrl } = await import(
//             "@/utils/avatarProxy"
//           );
//           url = createPlaceholderAvatarUrl(finalUsername, gender);
//         }
//
//         if (url) {
//           setAvatarUrl(url);
//           setImageError(false);
//
//           // Устанавливаем таймаут только если изображение еще не загружено
//           if (!imageLoaded) {
//             const timeout = setTimeout(() => {
//               if (proxyAttempt < 4 && !imageLoaded) {
//                 setProxyAttempt((prev) => prev + 1);
//               }
//             }, 2000);
//             setTimeoutId(timeout);
//           }
//         } else {
//           setImageError(true);
//         }
//       } catch (error) {
//         setImageError(true);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//
//     loadAvatar();
//
//     // Cleanup функция для очистки таймаута
//     return () => {
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
//     };
//   }, [src, alt, proxyAttempt]);
//
//   const handleImageError = () => {
//     // Очищаем таймаут
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
//
//     // Если изображение уже загружено, не переключаемся на следующий прокси
//     if (imageLoaded) {
//       return;
//     }
//
//     // Если у нас есть еще попытки, пробуем следующий прокси
//     if (proxyAttempt < 4) {
//       setProxyAttempt((prev) => prev + 1);
//       setImageError(false); // Сбрасываем ошибку для новой попытки
//     } else {
//       setImageError(true);
//     }
//   };
//
//   const handleImageLoad = () => {
//     setImageLoaded(true);
//
//     // Очищаем таймаут, так как изображение загрузилось успешно
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//       setTimeoutId(null);
//     }
//   };
//
//   return (
//     <div
//       className={cn(
//         "rounded-full bg-muted flex items-center justify-center overflow-hidden aspect-square",
//         className,
//       )}
//     >
//       {!showFallback && avatarUrl && (
//         <img
//           src={avatarUrl}
//           alt={alt}
//           className="w-full h-full object-cover aspect-square"
//           onError={handleImageError}
//           onLoad={handleImageLoad}
//           loading="lazy"
//         />
//       )}
//
//       {(showFallback || isLoading) && (
//         <div className="w-full h-full flex items-center justify-center">
//           {isLoading ? (
//             <div className="w-1/2 h-1/2 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
//           ) : (
//             <>
//               {fallbackIcon || (
//                 <Instagram className="w-1/2 h-1/2 text-muted-foreground" />
//               )}
//               {fallbackText && (
//                 <span className="text-xs text-muted-foreground text-center px-1">
//                   {fallbackText}
//                 </span>
//               )}
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };
//
// export default SafeAvatar;
