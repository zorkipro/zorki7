import { apiRequest } from "../client";
import type {
  AdminLoginInputDto,
  AdminLoginOutputDto,
  AdminSignUpInputDto,
  AdminAuthMeOutputDto,
  AdminLogin2faFakeInputDto,
  AdminGetLinkBloggerClientRequestOutputDto,
  LinkRequestStatus,
  PaginationUtil,
  GetLinkRequestsParams,
  AdminGetBloggersQuery,
  AdminGetBloggersResponse,
  AdminGetBloggersStatsOutputDto,
  AdminCreateBloggerInputDto,
  BloggerUpdateProfileInputDto,
  BloggerUpdateSocialPriceInputDto,
  ApiSocialType,
  ApiGender,
  AdminBloggerWithGender,
  PublicGetBloggerByIdOutputDto,
  // Parser Accounts types
  IgClientSessionsOutputDto,
  IgClientLoginInputDto,
  IgClientLoginOutputDto,
  TgClientLoginInputDto,
  TgClientLoginOutputDto,
  TgClientConfirmInputDto,
  TgClientConfirmOutputDto,
  GetIgSessionsParams,
  IgSessionsResponse,
  BloggerLinkMediaTgRequestInputDto,
  BloggerLinkMediaYtRequestInputDto, AdminGetBloggerOutputDto,
} from "../types";

export async function adminLogin(data: AdminLoginInputDto): Promise<AdminLoginOutputDto> {
  return apiRequest<AdminLoginOutputDto>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminSignUp(data: AdminSignUpInputDto): Promise<void> {
  return apiRequest<void>("/auth/admin/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAdminMe(): Promise<AdminAuthMeOutputDto> {
  return apiRequest<AdminAuthMeOutputDto>("/auth/admin/me", {
    method: "GET",
  });
}

export async function adminConfirm2FA(code: number): Promise<AdminLoginOutputDto> {
  const tempToken = sessionStorage.getItem("adminTempToken");
  if (!tempToken) {
    throw new Error("Временный токен для 2FA не найден. Пожалуйста, войдите заново.");
  }

  return apiRequest<AdminLoginOutputDto>("/auth/admin/2fa/confirm", {
    method: "POST",
    body: JSON.stringify({ code } as AdminLogin2faFakeInputDto),
    skipAuthErrorHandling: true,
    headers: {
      "Authorization": `Bearer ${tempToken}`,
      "Content-Type": "application/json"
    }
  });
}

function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, String(v)));
      } else {
        query.append(key, String(value));
      }
    }
  });
  return query.toString();
}

export async function adminGetBloggers(params: AdminGetBloggersQuery = {}): Promise<AdminGetBloggersResponse> {
  return apiRequest<AdminGetBloggersResponse>(`/admin/blogger?${buildQueryString(params)}`);
}

export async function adminGetBloggersStats(): Promise<AdminGetBloggersStatsOutputDto> {
  return apiRequest<AdminGetBloggersStatsOutputDto>("/admin/blogger/stats", {
    method: "GET",
  });
}

export async function adminCreateBlogger(username: string): Promise<void> {
  return apiRequest<void>("/admin/blogger", {
    method: "POST",
    body: JSON.stringify({ username } as AdminCreateBloggerInputDto),
  });
}

export async function adminToggleBloggerVisibility(bloggerId: number): Promise<void> {
  return apiRequest<void>(`/admin/blogger/visibility/${bloggerId}`, {
    method: "PATCH",
  });
}

export async function getAdminLinkRequests(
  params: GetLinkRequestsParams = {},
): Promise<PaginationUtil<AdminGetLinkBloggerClientRequestOutputDto[]>> {
  return apiRequest<PaginationUtil<AdminGetLinkBloggerClientRequestOutputDto[]>>(
    `/admin/link/blogger-client?${buildQueryString(params)}`
  );
}

export async function approveLinkRequest(requestId: number): Promise<void> {
  return apiRequest<void>(`/admin/link/blogger-client/approve/${requestId}`, {
    method: "POST",
  });
}

export async function rejectLinkRequest(requestId: number): Promise<void> {
  return apiRequest<void>(`/admin/link/blogger-client/reject/${requestId}`, {
    method: "POST",
  });
}

export async function adminDeleteBloggerStatsFile(bloggerId: number, fileId: number): Promise<void> {
  return apiRequest<void>(`/admin/blogger/${bloggerId}/${fileId}`, {
    method: "DELETE",
  });
}

export async function adminUpdateBlogger(
  bloggerId: number,
  data: BloggerUpdateProfileInputDto,
): Promise<void> {
  return apiRequest<void>(`/admin/blogger/${bloggerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateBloggerSocialPrice(
  bloggerId: number,
  data: BloggerUpdateSocialPriceInputDto,
): Promise<void> {
  return apiRequest<void>(`/admin/blogger/social-price/${bloggerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminUploadBloggerStats(
  bloggerId: number,
  type: ApiSocialType,
  files: File[],
): Promise<void> {
  const formData = new FormData();
  formData.append("type", type);
  files.forEach((file) => formData.append("files", file));

  return apiRequest<void>(`/admin/blogger/stats-upload/${bloggerId}`, {
    method: "PUT",
    body: formData,
    headers: {},
  });
}

export async function adminGetBloggerGenderInfo(
  bloggerId: number,
): Promise<Pick<PublicGetBloggerByIdOutputDto, 'id' | 'genderType'>> {
  return apiRequest<Pick<PublicGetBloggerByIdOutputDto, 'id' | 'genderType'>>(
    `/blogger/public/${bloggerId}`,
    { method: "GET" },
  );
}

const genderTypeCache = new Map<number, ApiGender | null>();
const CACHE_TTL = 5 * 60 * 1000;
const cacheTimestamps = new Map<number, number>();

function getCachedGenderType(bloggerId: number): ApiGender | null | undefined {
  const timestamp = cacheTimestamps.get(bloggerId);
  if (timestamp && Date.now() - timestamp < CACHE_TTL) {
    return genderTypeCache.get(bloggerId);
  }
  genderTypeCache.delete(bloggerId);
  cacheTimestamps.delete(bloggerId);
  return undefined;
}

function setCachedGenderType(bloggerId: number, genderType: ApiGender | null): void {
  genderTypeCache.set(bloggerId, genderType);
  cacheTimestamps.set(bloggerId, Date.now());
}

export async function adminEnrichBloggersWithGender(
  bloggers: AdminGetBloggersResponse['items']
): Promise<AdminBloggerWithGender[]> {
  const cachedBloggers: AdminBloggerWithGender[] = [];
  const bloggersToFetch: typeof bloggers = [];
  
  for (const blogger of bloggers) {
    const cachedGenderType = getCachedGenderType(blogger.id);
    if (cachedGenderType !== undefined) {
      cachedBloggers.push({
        ...blogger,
        genderType: cachedGenderType,
      } as AdminBloggerWithGender);
    } else {
      bloggersToFetch.push(blogger);
    }
  }
  
  if (bloggersToFetch.length === 0) {
    return [...cachedBloggers];
  }
  
  const batchSize = 5;
  const enrichedBloggers: AdminBloggerWithGender[] = [];
  
  for (let i = 0; i < bloggersToFetch.length; i += batchSize) {
    const batch = bloggersToFetch.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (blogger) => {
        try {
          const genderInfo = await adminGetBloggerGenderInfo(blogger.id);
          setCachedGenderType(blogger.id, genderInfo.genderType);
          return { ...blogger, genderType: genderInfo.genderType } as AdminBloggerWithGender;
        } catch {
          setCachedGenderType(blogger.id, null);
          return { ...blogger, genderType: null } as AdminBloggerWithGender;
        }
      })
    );
    enrichedBloggers.push(...batchResults);
  }
  
  const resultMap = new Map<number, AdminBloggerWithGender>();
  [...cachedBloggers, ...enrichedBloggers].forEach(blogger => {
    resultMap.set(blogger.id, blogger);
  });
  
  return bloggers.map(blogger => resultMap.get(blogger.id)!);
}

export async function adminLinkTgChannelToBlogger(
  bloggerId: number,
  data: BloggerLinkMediaTgRequestInputDto,
): Promise<void> {
  return apiRequest<void>(`/admin/blogger/link/TG/${bloggerId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminLinkYtChannelToBlogger(
  bloggerId: number,
  data: BloggerLinkMediaYtRequestInputDto,
): Promise<void> {
  return apiRequest<void>(`/admin/blogger/link/YT/${bloggerId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminGetBloggersWithoutGender(
  page: number = 1,
  size: number = 50,
  cachedPages: Map<number, AdminGetBloggerOutputDto[]> = new Map()
): Promise<{
  bloggers: AdminGetBloggerOutputDto[];
  hasMore: boolean;
  totalCount: number;
  cachedPages: Map<number, AdminGetBloggerOutputDto[]>;
}> {
  const bloggersWithoutGender: AdminGetBloggerOutputDto[] = [];
  let currentPage = page;
  let hasMore = true;
  const maxPages = 20;
  
  // Проверяем кэш для предыдущих страниц
  for (let i = 1; i < page; i++) {
    const cachedBloggers = cachedPages.get(i);
    if (cachedBloggers) {
      const filtered = cachedBloggers.filter(blogger => !blogger.genderType);
      bloggersWithoutGender.push(...filtered);
    }
  }
  
  // Загружаем новые страницы
  while (hasMore && currentPage <= maxPages) {
    // Если страница есть в кэше, используем её
    if (cachedPages.has(currentPage)) {
      const cachedBloggers = cachedPages.get(currentPage)!;
      const filtered = cachedBloggers.filter(blogger => !blogger.genderType);
      bloggersWithoutGender.push(...filtered);
      currentPage++;
      continue;
    }
    
    // Запрашиваем блогеров с бэкенда (теперь genderType приходит в ответе)
    const bloggersResponse = await adminGetBloggers({
      page: currentPage,
      size,
      sortDirection: "desc",
      sortField: "createdAt",
    });
    
    if (bloggersResponse.items.length === 0) {
      hasMore = false;
      break;
    }
    
    // Фильтруем блогеров без пола (genderType уже приходит в ответе)
    const bloggersWithoutGenderInBatch = bloggersResponse.items.filter(blogger => !blogger.genderType);
    
    // Сохраняем все блогеры (не только без пола) в кэш для возможного повторного использования
    cachedPages.set(currentPage, bloggersResponse.items);
    bloggersWithoutGender.push(...bloggersWithoutGenderInBatch);
    
    // Проверяем условия для продолжения загрузки
    if (bloggersResponse.items.length < size || bloggersWithoutGender.length >= size) {
      hasMore = false;
    }
    
    currentPage++;
  }
  
  return {
    bloggers: bloggersWithoutGender.slice(0, size),
    hasMore: hasMore && currentPage <= maxPages,
    totalCount: bloggersWithoutGender.length,
    cachedPages,
  };
}

export async function getIgSessions(params: GetIgSessionsParams = {}): Promise<IgSessionsResponse> {
  return apiRequest<IgSessionsResponse>(`/ig-client?${buildQueryString(params)}`);
}

export async function loginIgAccount(username: string, password: string): Promise<IgClientLoginOutputDto> {
  return apiRequest<IgClientLoginOutputDto>("/ig-client/login", {
    method: "POST",
    body: JSON.stringify({ username, password } as IgClientLoginInputDto),
    skipAuthErrorHandling: true
  });
}

export async function deleteIgSession(sessionId: number): Promise<void> {
  return apiRequest<void>(`/ig-client/${sessionId}`, {
    method: "DELETE",
  });
}

export async function logoutIgSession(sessionId: number): Promise<void> {
  return apiRequest<void>(`/ig-client/logout/${sessionId}`, {
    method: "POST",
  });
}

export async function loginTgAccount(phone: string, apiHash: string, apiId: number): Promise<TgClientLoginOutputDto> {
  return apiRequest<TgClientLoginOutputDto>("/tg-client/login", {
    method: "POST",
    body: JSON.stringify({ phone, apiHash, apiId } as TgClientLoginInputDto),
  });
}

export async function confirmTgLogin(phone: string, code: string): Promise<TgClientConfirmOutputDto> {
  return apiRequest<TgClientConfirmOutputDto>("/tg-client/confirm", {
    method: "POST",
    body: JSON.stringify({ phone, code } as TgClientConfirmInputDto),
  });
}
