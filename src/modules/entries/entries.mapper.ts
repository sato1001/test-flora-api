export interface HistoricalWordResponse {
  word: string;
  added: Date;
}

export interface FavoriteWordResponse {
  word: string;
  added: Date;
}

export function mapHistoryToResponse(item: { word: string; accessedAt: Date }): HistoricalWordResponse {
  return {
    word: item.word,
    added: item.accessedAt,
  };
}

export function mapFavoriteToResponse(item: { word: string; createdAt: Date }): FavoriteWordResponse {
  return {
    word: item.word,
    added: item.createdAt,
  };
}
