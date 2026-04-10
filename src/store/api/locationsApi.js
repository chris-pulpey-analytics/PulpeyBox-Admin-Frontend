import { baseApi } from './baseApi'

export const locationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: () => '/locations/departments',
      providesTags: ['Locations'],
    }),
    createDepartment: builder.mutation({
      query: (body) => ({ url: '/locations/departments', method: 'POST', body }),
      invalidatesTags: ['Locations'],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/locations/departments/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Locations'],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({ url: `/locations/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Locations'],
    }),
    getCities: builder.query({
      query: (params = {}) => ({ url: '/locations/cities', params }),
      providesTags: ['Locations'],
    }),
    createCity: builder.mutation({
      query: (body) => ({ url: '/locations/cities', method: 'POST', body }),
      invalidatesTags: ['Locations'],
    }),
    updateCity: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/locations/cities/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Locations'],
    }),
    deleteCity: builder.mutation({
      query: (id) => ({ url: `/locations/cities/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Locations'],
    }),
  }),
})

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetCitiesQuery,
  useCreateCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
} = locationsApi
