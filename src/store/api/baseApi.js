import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout } from '../authSlice'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const base = fetchBaseQuery({
      baseUrl: '/api',
      prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.token
        if (token) headers.set('Authorization', `Bearer ${token}`)
        return headers
      },
    })
    const result = await base(args, api, extraOptions)
    if (result.error?.status === 401) {
      api.dispatch(logout())
    }
    return result
  },
  tagTypes: ['Users', 'Surveys', 'News', 'Settings', 'Groups', 'Locations', 'Contact', 'Metrics'],
  endpoints: () => ({}),
})
