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
