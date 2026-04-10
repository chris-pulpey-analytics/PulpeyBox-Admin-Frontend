import { baseApi } from './baseApi'

export const surveysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSurveys: builder.query({
      query: (params = {}) => ({ url: '/surveys', params }),
      providesTags: ['Surveys'],
    }),
    getSurvey: builder.query({
      query: (id) => `/surveys/${id}`,
      providesTags: (r, e, id) => [{ type: 'Surveys', id }],
    }),
    createSurvey: builder.mutation({
      query: (body) => ({ url: '/surveys', method: 'POST', body }),
      invalidatesTags: ['Surveys'],
    }),
    updateSurvey: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/surveys/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Surveys'],
    }),
    deleteSurvey: builder.mutation({
      query: (id) => ({ url: `/surveys/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Surveys'],
    }),
    linkSurveyToNews: builder.mutation({
      query: ({ surveyId, newsId }) => ({
        url: `/surveys/${surveyId}/link-news`,
        method: 'POST',
        body: { news_id: newsId },
      }),
      invalidatesTags: ['News'],
    }),
  }),
})

export const {
  useGetSurveysQuery,
  useGetSurveyQuery,
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  useDeleteSurveyMutation,
  useLinkSurveyToNewsMutation,
} = surveysApi

export const exportSurveyUsers = (surveyId, format = 'xlsx') => {
  const token = localStorage.getItem('admin_token')
  return fetch(`/api/surveys/${surveyId}/users/export?format=${format}`, {
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
