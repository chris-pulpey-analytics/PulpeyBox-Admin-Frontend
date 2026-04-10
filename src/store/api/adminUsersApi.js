import { baseApi } from './baseApi'

export const adminUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query({
      query: () => '/admin-users',
      providesTags: ['AdminUsers'],
    }),
    getRoles: builder.query({
      query: () => '/admin-users/roles',
      providesTags: ['Roles'],
    }),
    createRole: builder.mutation({
      query: (body) => ({ url: '/admin-users/roles', method: 'POST', body }),
      invalidatesTags: ['Roles'],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin-users/roles/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Roles'],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: `/admin-users/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Roles', 'AdminUsers'],
    }),
    createAdminUser: builder.mutation({
      query: (body) => ({ url: '/admin-users', method: 'POST', body }),
      invalidatesTags: ['AdminUsers'],
    }),
    updateAdminUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin-users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['AdminUsers'],
    }),
    resetAdminPassword: builder.mutation({
      query: ({ id, new_password }) => ({
        url: `/admin-users/${id}/reset-password`,
        method: 'POST',
        body: { new_password },
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    toggleAdminActive: builder.mutation({
      query: (id) => ({ url: `/admin-users/${id}/toggle-active`, method: 'PATCH' }),
      invalidatesTags: ['AdminUsers'],
    }),
    deleteAdminUser: builder.mutation({
      query: (id) => ({ url: `/admin-users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
})

export const {
  useGetAdminUsersQuery,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useResetAdminPasswordMutation,
  useToggleAdminActiveMutation,
  useDeleteAdminUserMutation,
} = adminUsersApi
