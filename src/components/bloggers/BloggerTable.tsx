import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Blogger } from "@/types/blogger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui-kit";
import { InfiniteScrollList } from "@/ui-kit";
import { SafeAvatar } from "@/components/ui/SafeAvatar";
import { truncateName, formatNumber, formatReach, formatPriceWithCurrency } from "@/utils/formatters";
import { normalizeUsername } from "@/utils/username";

interface BloggerTableProps {
  bloggers: Blogger[];
  loading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-muted-foreground">Загрузка блогеров...</span>
  </div>
);

export const BloggerTable = ({
  bloggers,
  loading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  totalCount = 0,
}: BloggerTableProps) => {
  const navigate = useNavigate();
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore || !observerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Дополнительная проверка внутри callback для предотвращения параллельных вызовов
        if (entry?.isIntersecting && !isLoadingMore && hasMore) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "500px",
      }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  const handleRowClick = ({handle,bloggerId}:{handle: string, bloggerId?:string }) => {
    console.log('handleRowClick',bloggerId)
    navigate(`/${normalizeUsername(handle)}`,{ state: { bloggerId } });
  };

  const renderMobileCard = (blogger: Blogger) => (
      <div
        key={blogger.id}
        className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-sm transition-shadow duration-200 cursor-pointer mb-3 sm:mb-4 w-full max-w-full overflow-hidden"
        onClick={() => handleRowClick({handle:blogger.handle, bloggerId: blogger.id})}
      >
        {/* Аватарка/имя/никнейм - главная информация */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full max-w-full overflow-hidden">
          <SafeAvatar
            src={blogger.avatar}
            alt={`Аватар ${blogger.name}`}
            className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 aspect-square"
            username={normalizeUsername(blogger.handle)}
            gender={blogger.gender}
            id={blogger.id}
          />
          <div className="flex-1 min-w-0 overflow-hidden">
            <h3
              className="font-semibold text-gray-900 text-sm sm:text-base truncate leading-tight"
              title={blogger.name}
            >
              {truncateName(blogger.name, 20)}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5 break-words">
              {blogger.handle}
            </p>
          </div>
        </div>

        {/* Статистика - вторичная информация */}
        <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
          {/* Подписчики и ER */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0 text-center overflow-hidden">
              <div className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1 truncate">
                Подписчиков
              </div>
              <div className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                {formatNumber(blogger.followers)}
              </div>
            </div>
            <div className="w-px h-10 sm:h-12 bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1 min-w-0 text-center overflow-hidden">
              <div className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1 truncate">
                ER
              </div>
              <div className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                {blogger.engagementRate}%
              </div>
            </div>
          </div>

          {/* Охваты */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0 text-center overflow-hidden">
              <div className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1 truncate">
                Охваты поста
              </div>
              <div className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                {formatReach(blogger.postReach)}
              </div>
            </div>
            <div className="w-px h-10 sm:h-12 bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1 min-w-0 text-center overflow-hidden">
              <div className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1 truncate">
                Охваты сториз
              </div>
              <div className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                {formatReach(blogger.storyReach)}
              </div>
            </div>
          </div>

          {/* Цены */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0 text-center overflow-hidden">
              <div className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1 truncate">
                Цена поста от
              </div>
              <div className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                {blogger.postPrice && !isNaN(blogger.postPrice)
                  ? `от ${formatPriceWithCurrency(blogger.postPrice)}`
                  : formatPriceWithCurrency(blogger.postPrice)}
              </div>
            </div>
            <div className="w-px h-10 sm:h-12 bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1 min-w-0 text-center overflow-hidden">
              <div className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1 truncate">
                Цена сториз от
              </div>
              <div className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                {blogger.storyPrice && !isNaN(blogger.storyPrice)
                  ? `от ${formatPriceWithCurrency(blogger.storyPrice)}`
                  : formatPriceWithCurrency(blogger.storyPrice)}
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  const isEmpty = bloggers.length === 0;

  return (
    <>
      <div className="hidden md:block border rounded-lg w-full max-w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] caption-bottom text-sm relative">
          <TableHeader>
            <TableRow className="[&:first-child_th:first-child]:rounded-tl-lg [&:first-child_th:last-child]:rounded-tr-lg hover:bg-transparent">
              <TableHead className="text-center min-w-[60px] w-[60px] sticky left-0 z-50 bg-white" style={{ willChange: "transform" }}>Место</TableHead>
              <TableHead className="min-w-[200px] max-w-[300px]">Блогер</TableHead>
              <TableHead className="text-center min-w-[100px]">Подписчиков</TableHead>
              <TableHead className="text-center min-w-[100px]">Охваты поста</TableHead>
              <TableHead className="text-center min-w-[100px]">Охваты сториз</TableHead>
              <TableHead className="text-center min-w-[100px]">Цена поста от</TableHead>
              <TableHead className="text-center min-w-[100px]">Цена сториз от</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : !isEmpty ? (
              bloggers.map((blogger, index) => {
                const isLastRow = index === bloggers.length - 1;
                return (
                <TableRow
                  key={blogger.id}
                  className={`group cursor-pointer hover:bg-muted/50 transition-colors ${isLastRow ? '[&:first-child_td:first-child]:rounded-bl-lg [&:first-child_td:last-child]:rounded-br-lg' : ''}`}
                  onClick={() => handleRowClick({handle: blogger.handle, bloggerId: blogger.id})}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleRowClick({handle: blogger.handle,bloggerId:blogger.id})}
                >
                  <TableCell className="text-center font-medium sticky left-0 z-50 bg-white group-hover:bg-muted transition-colors" style={{ willChange: "transform", ...(isLastRow ? { borderBottomLeftRadius: "0.5rem" } : {}) }}>{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <SafeAvatar
                        src={blogger.avatar}
                        alt={`Аватар ${blogger.name}`}
                        className="w-10 h-10 aspect-square"
                        username={normalizeUsername(blogger.handle)}
                        gender={blogger.gender}
                        id={blogger.id}
                      />
                      <div>
                        <div className="font-medium text-foreground" title={blogger.name}>
                          {truncateName(blogger.name, 25)}
                        </div>
                        <div className="text-sm text-muted-foreground">{blogger.handle}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">{formatNumber(blogger.followers)}</div>
                    <div className="text-xs text-muted-foreground">{blogger.engagementRate}% ER</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">{formatReach(blogger.postReach)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">{formatReach(blogger.storyReach)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">
                      {blogger.postPrice && !isNaN(blogger.postPrice)
                        ? `от ${formatPriceWithCurrency(blogger.postPrice)}`
                        : formatPriceWithCurrency(blogger.postPrice)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center" style={isLastRow ? { borderBottomRightRadius: "0.5rem" } : undefined}>
                    <div className="font-medium">
                      {blogger.storyPrice && !isNaN(blogger.storyPrice)
                        ? `от ${formatPriceWithCurrency(blogger.storyPrice)}`
                        : formatPriceWithCurrency(blogger.storyPrice)}
                    </div>
                  </TableCell>
                </TableRow>
              );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Блогеры не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </table>

        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner />
          </div>
        )}

        {hasMore && <div ref={observerRef} className="h-4" />}

        <div className="text-center text-sm text-muted-foreground mt-2">
          Показано {bloggers.length} из {totalCount} блогеров
          {hasMore && <span className="ml-2 text-blue-600">(автозагрузка при прокрутке)</span>}
        </div>
        </div>
      </div>

      <div className="md:hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-8 text-muted-foreground">Блогеры не найдены</div>
        ) : (
          <InfiniteScrollList
            data={bloggers}
            renderItem={renderMobileCard}
            itemsPerPage={50}
            threshold={200}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={onLoadMore}
          />
        )}
      </div>
    </>
  );
};
