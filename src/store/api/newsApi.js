import { baseApi } from './baseApi'

export const newsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNews: builder.query({
      query: (params = {}) => ({ url: '/news', params }),
      providesTags: ['News'],
    }),
    getNewsItem: builder.query({
      query: (id) => `/news/${id}`,
      providesTags: (r, e, id) => [{ type: 'News', id }],
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
  }),
})

export const {
  useGetNewsQuery,
  useGetNewsItemQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} = newsApi

export const exportNews = (params = {}, format = 'xlsx') => {
  const query = new URLSearchParams({ ...params, format })
  const token = localStorage.getItem('admin_token')
  return fetch(`/api/news/export?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// Asegúrate de que tenga la palabra 'export'
export const downloadBlob = (data, fileName) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};