import { baseApi } from './baseApi'

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettingsGrouped: builder.query({
      query: (params = {}) => ({ url: '/settings/grouped', params }),
      providesTags: ['Settings', 'Groups'],
    }),
    getGroups: builder.query({
      query: () => '/settings/groups',
      providesTags: ['Groups'],
    }),
    createGroup: builder.mutation({
      query: (body) => ({ url: '/settings/groups', method: 'POST', body }),
      invalidatesTags: ['Groups', 'Settings'],
    }),
    updateGroup: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/settings/groups/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Groups', 'Settings'],
    }),
    deleteGroup: builder.mutation({
      query: (id) => ({ url: `/settings/groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Groups', 'Settings'],
    }),
    getSettings: builder.query({
      query: (params = {}) => ({ url: '/settings', params }),
      providesTags: ['Settings'],
    }),
    createSetting: builder.mutation({
      query: (body) => ({ url: '/settings', method: 'POST', body }),
      invalidatesTags: ['Settings'],
    }),
    updateSetting: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/settings/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
    deleteSetting: builder.mutation({
      query: (id) => ({ url: `/settings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Settings'],
    }),
  }),
})

export const {
  useGetSettingsGroupedQuery,
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetSettingsQuery,
  useCreateSettingMutation,
  useUpdateSettingMutation,
  useDeleteSettingMutation,
} = settingsApi
