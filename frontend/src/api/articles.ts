import { apiRequest } from './client'

export type ArticleAuthor = {
	id: string
	name: string
}

export type ArticleItem = {
	id: string
	title: string
	preview: string | null
	category: string | null
	author: ArticleAuthor | null
	created_at: string
}

export type ArticleDetail = ArticleItem & {
	content: string
	updated_at: string
}

export type ArticleCreatePayload = {
	title: string
	content: string
	preview?: string
	category?: string
}

export type ArticleUpdatePayload = {
	title?: string
	content?: string
	preview?: string
	category?: string
}

export function fetchArticles(limit = 10, offset = 0, search?: string): Promise<ArticleItem[]> {
	const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
	if (search) params.set('search', search)
	return apiRequest<ArticleItem[]>(`/articles/?${params}`)
}

export function fetchArticleById(id: string): Promise<ArticleDetail> {
	return apiRequest<ArticleDetail>(`/articles/${id}`)
}

export function createArticle(payload: ArticleCreatePayload): Promise<ArticleDetail> {
	return apiRequest<ArticleDetail>('/articles/', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export function updateArticle(id: string, payload: ArticleUpdatePayload): Promise<ArticleDetail> {
	return apiRequest<ArticleDetail>(`/articles/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

export function deleteArticle(id: string): Promise<void> {
	return apiRequest<void>(`/articles/${id}`, {
		method: 'DELETE',
	})
}
