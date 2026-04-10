import { baseApi } from './baseApi'

const buildParams = (filters) => {
  const params = {}
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params[k] = v
  })
  return params
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (filters = {}) => ({ url: '/users', params: buildParams(filters) }),
      providesTags: ['Users'],
    }),
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (r, e, id) => [{ type: 'Users', id }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Users'],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi

export const exportUsers = (filters = {}, format = 'xlsx') => {
  const params = new URLSearchParams({ ...buildParams(filters), format })
  const token = localStorage.getItem('admin_token')
  return fetch(`/api/users/export?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
