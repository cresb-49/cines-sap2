import type { Entity } from "../utils/entity";

const CURRENT_REVIEWS_URI = "/v1/reviews";

export interface Review extends Entity {
    cinemaId: string,
    clientId: string,
    roomId: string,
    movieId: string,
    comment: string,
    roomRating: number,
    movieRating: number
}

export interface PromotionType {
    code: string,
    name: string
}

export interface CreateReviewRequest {
    clientId: string,
    cinemaId: string,
    roomId: string,
    movieId: string,
    roomRating: number,
    movieRating: number,
    comment?: string | null
}

/**
 * Manda a traer todos los hoteles disponibles en el sistema.
 * @param params
 * @returns
 */
export async function getReviews(params?: {}) {
  return await $api<Review[]>(`${CURRENT_REVIEWS_URI}`, {
    params
  })
}

export async function createReview(body: CreateReviewRequest) {
  return await $api<Review>(`${CURRENT_REVIEWS_URI}`, {
    method: "POST",
    body
  })
}
