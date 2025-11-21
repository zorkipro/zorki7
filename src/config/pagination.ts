/**
 * Константы для пагинации и загрузки данных
 */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  INFINITE_SCROLL_THRESHOLD: 200,
  PRELOAD_MARGIN: 500,
  LOAD_DELAY_MS: 500,
} as const;

export const SORT_DIRECTION = {
  DESC: 'desc',
  ASC: 'asc'
}