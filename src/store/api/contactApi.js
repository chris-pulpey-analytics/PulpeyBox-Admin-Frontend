import { baseApi } from './baseApi'

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContact: builder.query({
      query: (params = {}) => ({ url: '/contact', params }),
      providesTags: ['Contact'],
    }),
  }),
})

export const { useGetContactQuery } = contactApi

export const exportContact = (params = {}, format = 'xlsx') => {
  const query = new URLSearchParams({ ...params, format })
  const token = localStorage.getItem('admin_token')
  return fetch(`/api/contact/export?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

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
