import { baseApi } from './baseApi'

export const metricsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMetrics: builder.query({
      query: (params = {}) => ({ url: '/metrics', params }),
      providesTags: ['Metrics'],
    }),
    getMapPoints: builder.query({
      query: (params = {}) => ({ url: '/map/points', params }),
    }),
    queryMapArea: builder.mutation({
      query: (body) => ({ url: '/map/area', method: 'POST', body }),
    }),
  }),
})

export const {
  useGetMetricsQuery,
  useGetMapPointsQuery,
  useQueryMapAreaMutation,
} = metricsApi
