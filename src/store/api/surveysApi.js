import { baseApi } from './baseApi'

export const surveysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSurveys: builder.query({
      query: (params = {}) => ({ url: '/surveys', params }),
      providesTags: ['Surveys'],
    }),
    getSurvey: builder.query({
      query: (id) => `/surveys/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Surveys', id }],
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
    getSurveyResponses: builder.query({
      query: (id) => `/surveys/${id}/responses`,
    }),
    // Questions (ProductsSurvey)
    getSurveyQuestions: builder.query({
      query: (id) => `/surveys/${id}/questions`,
      providesTags: (_r, _e, id) => [{ type: 'SurveyQuestions', id }],
    }),
    createSurveyQuestion: builder.mutation({
      query: ({ surveyId, product_name }) => ({
        url: `/surveys/${surveyId}/questions`,
        method: 'POST',
        body: { product_name },
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [{ type: 'SurveyQuestions', id: surveyId }],
    }),
    updateSurveyQuestion: builder.mutation({
      query: ({ surveyId, qId, product_name }) => ({
        url: `/surveys/${surveyId}/questions/${qId}`,
        method: 'PUT',
        body: { product_name },
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [{ type: 'SurveyQuestions', id: surveyId }],
    }),
    deleteSurveyQuestion: builder.mutation({
      query: ({ surveyId, qId }) => ({
        url: `/surveys/${surveyId}/questions/${qId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [{ type: 'SurveyQuestions', id: surveyId }],
    }),
    // Answers (AnswersSurveys)
    getSurveyAnswers: builder.query({
      query: (id) => `/surveys/${id}/answers`,
      providesTags: (_r, _e, id) => [{ type: 'SurveyAnswers', id }],
    }),
    createSurveyAnswer: builder.mutation({
      query: ({ surveyId, answer }) => ({
        url: `/surveys/${surveyId}/answers`,
        method: 'POST',
        body: { answer },
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [{ type: 'SurveyAnswers', id: surveyId }],
    }),
    updateSurveyAnswer: builder.mutation({
      query: ({ surveyId, aId, answer }) => ({
        url: `/surveys/${surveyId}/answers/${aId}`,
        method: 'PUT',
        body: { answer },
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [{ type: 'SurveyAnswers', id: surveyId }],
    }),
    deleteSurveyAnswer: builder.mutation({
      query: ({ surveyId, aId }) => ({
        url: `/surveys/${surveyId}/answers/${aId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [{ type: 'SurveyAnswers', id: surveyId }],
    }),
    // User assignment
    previewUsersForSurvey: builder.query({
      query: ({ surveyId, ...params }) => ({ url: `/surveys/${surveyId}/preview-users`, params }),
    }),
    assignUsersToSurvey: builder.mutation({
      query: ({ surveyId, ...body }) => ({
        url: `/surveys/${surveyId}/assign-users`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Surveys'],
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
  useGetSurveyResponsesQuery,
  useGetSurveyQuestionsQuery,
  useCreateSurveyQuestionMutation,
  useUpdateSurveyQuestionMutation,
  useDeleteSurveyQuestionMutation,
  useGetSurveyAnswersQuery,
  useCreateSurveyAnswerMutation,
  useUpdateSurveyAnswerMutation,
  useDeleteSurveyAnswerMutation,
  usePreviewUsersForSurveyQuery,
  useAssignUsersToSurveyMutation,
} = surveysApi

export const exportSurveyUsers = (surveyId, format = 'xlsx') => {
  const token = localStorage.getItem('admin_token')
  return fetch(`/api/surveys/${surveyId}/users/export?format=${format}`, {
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

export const exportSurveys = (params = {}, format = 'xlsx') => {
  const query = new URLSearchParams({ ...params, format })
  const token = localStorage.getItem('admin_token')
  return fetch(`/api/surveys/export?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const downloadSurveyAssignTemplate = () => {
  const token = localStorage.getItem('admin_token')
  return fetch('/api/surveys/assign-template', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const assignUsersExcelToSurvey = (surveyId, file, statusId = 146) => {
  const token = localStorage.getItem('admin_token')
  const form = new FormData()
  form.append('file', file)
  form.append('status_id', String(statusId))
  return fetch(`/api/surveys/${surveyId}/assign-users-excel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
}

export const generateInternalReport = (surveyIds, statusId) => {
  const token = localStorage.getItem('admin_token')
  return fetch('/api/surveys/internal-report', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ survey_ids: surveyIds, status_id: statusId || null }),
  })
}
