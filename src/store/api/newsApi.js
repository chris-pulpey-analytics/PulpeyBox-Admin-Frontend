import { baseApi } from './baseApi'

export const newsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNews: builder.query({
      query: (params = {}) => ({ url: '/news', params }),
      providesTags: ['News'],
    }),
    getNewsItem: builder.query({
      query: (id) => `/news/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'News', id }],
    }),
    createNews: builder.mutation({
      query: (body) => ({ url: '/news', method: 'POST', body }),
      invalidatesTags: ['News'],
    }),
    updateNews: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/news/${id}`, method: 'PUT', body }),
      invalidatesTags: ['News'],
    }),
    deleteNews: builder.mutation({
      query: (id) => ({ url: `/news/${id}`, method: 'DELETE' }),
      invalidatesTags: ['News'],
    }),
    previewUsersForNews: builder.query({
      query: ({ newsId, ...params }) => ({ url: `/news/${newsId}/preview-users`, params }),
    }),
    assignNewsUsers: builder.mutation({
      query: ({ newsId, ...body }) => ({
        url: `/news/${newsId}/assign-users`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['News'],
    }),
  }),
})

export const {
  useGetNewsQuery,
  useGetNewsItemQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
  usePreviewUsersForNewsQuery,
  useAssignNewsUsersMutation,
} = newsApi

export const assignUsersToNews = (newsId, userIds, status = 0) => {
  const token = localStorage.getItem('admin_token')
  return fetch(`/api/news/${newsId}/assign-users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_ids: userIds, status }),
  })
}

export const assignUsersExcelToNews = (newsId, file) => {
  const token = localStorage.getItem('admin_token')
  const form = new FormData()
  form.append('file', file)
  return fetch(`/api/news/${newsId}/assign-users-excel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
}

export const downloadNewsAssignTemplate = () => {
  const token = localStorage.getItem('admin_token')
  return fetch('/api/news/assign-template', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const exportNews = (params = {}, format = 'xlsx') => {
  const query = new URLSearchParams({ ...params, format })
  const token = localStorage.getItem('admin_token')
  return fetch(`/api/news/export?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// Asegúrate de que tenga la palabra 'export'
export const downloadBlob = async (response, fileName) => {
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}