import { useState } from 'react'
import {
  useGetSurveyQuestionsQuery,
  useCreateSurveyQuestionMutation,
  useUpdateSurveyQuestionMutation,
  useDeleteSurveyQuestionMutation,
  useGetSurveyAnswersQuery,
  useCreateSurveyAnswerMutation,
  useUpdateSurveyAnswerMutation,
  useDeleteSurveyAnswerMutation,
} from '../../store/api/surveysApi'
import { Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SurveyConfig({ surveyId }) {
  const { data: questions = [], isLoading: isLoadingQ } = useGetSurveyQuestionsQuery(surveyId)
  const { data: answers = [], isLoading: isLoadingA } = useGetSurveyAnswersQuery(surveyId)

  const [createQ, { isLoading: isCreatingQ }] = useCreateSurveyQuestionMutation()
  const [updateQ] = useUpdateSurveyQuestionMutation()
  const [deleteQ] = useDeleteSurveyQuestionMutation()

  const [createA, { isLoading: isCreatingA }] = useCreateSurveyAnswerMutation()
  const [updateA] = useUpdateSurveyAnswerMutation()
  const [deleteA] = useDeleteSurveyAnswerMutation()

  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')

  const [editingQ, setEditingQ] = useState(null)
  const [editQValue, setEditQValue] = useState('')

  const [editingA, setEditingA] = useState(null)
  const [editAValue, setEditAValue] = useState('')

  const handleAddQ = async (e) => {
    e.preventDefault()
    if (!newQ.trim()) return
    try {
      await createQ({ surveyId, product_name: newQ }).unwrap()
      setNewQ('')
      toast.success('Pregunta agregada')
    } catch (err) {
      toast.error('Error al agregar pregunta')
    }
  }

  const handleAddA = async (e) => {
    e.preventDefault()
    if (!newA.trim()) return
    try {
      await createA({ surveyId, answer: newA }).unwrap()
      setNewA('')
      toast.success('Respuesta agregada')
    } catch (err) {
      toast.error('Error al agregar respuesta')
    }
  }

  const handleSaveQ = async (id) => {
    if (!editQValue.trim()) return
    try {
      await updateQ({ surveyId, qId: id, product_name: editQValue }).unwrap()
      setEditingQ(null)
      toast.success('Pregunta actualizada')
    } catch (err) {
      toast.error('Error al actualizar pregunta')
    }
  }

  const handleSaveA = async (id) => {
    if (!editAValue.trim()) return
    try {
      await updateA({ surveyId, aId: id, answer: editAValue }).unwrap()
      setEditingA(null)
      toast.success('Respuesta actualizada')
    } catch (err) {
      toast.error('Error al actualizar respuesta')
    }
  }

  const handleDeleteQ = async (id) => {
    if (!window.confirm('¿Eliminar pregunta?')) return
    try {
      await deleteQ({ surveyId, qId: id }).unwrap()
      toast.success('Pregunta eliminada')
    } catch (err) {
      toast.error('Error al eliminar')
    }
  }

  const handleDeleteA = async (id) => {
    if (!window.confirm('¿Eliminar respuesta?')) return
    try {
      await deleteA({ surveyId, aId: id }).unwrap()
      toast.success('Respuesta eliminada')
    } catch (err) {
      toast.error('Error al eliminar')
    }
  }

  if (isLoadingQ || isLoadingA) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-violet-500" size={32} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Preguntas / Productos */}
      <div className="card">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Preguntas / Productos</h3>
        <form onSubmit={handleAddQ} className="flex gap-2 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Nueva pregunta..."
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={isCreatingQ}>
            {isCreatingQ ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {questions.map((q) => (
            <div key={q.Id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              {editingQ === q.Id ? (
                <>
                  <input
                    type="text"
                    className="input flex-1 py-1 px-2 text-sm"
                    value={editQValue}
                    onChange={(e) => setEditQValue(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => handleSaveQ(q.Id)} className="text-emerald-500 hover:text-emerald-600 p-1">
                    <Save size={16} />
                  </button>
                  <button onClick={() => setEditingQ(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700">{q.ProductName}</span>
                  <button
                    onClick={() => {
                      setEditingQ(q.Id)
                      setEditQValue(q.ProductName)
                    }}
                    className="text-blue-500 hover:text-blue-600 p-1"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteQ(q.Id)} className="text-red-500 hover:text-red-600 p-1">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
          {questions.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No hay preguntas registradas.</p>}
        </div>
      </div>

      {/* Respuestas */}
      <div className="card">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Respuestas Permitidas</h3>
        <form onSubmit={handleAddA} className="flex gap-2 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Nueva respuesta..."
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={isCreatingA}>
            {isCreatingA ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </form>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {answers.map((a) => (
            <div key={a.Id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              {editingA === a.Id ? (
                <>
                  <input
                    type="text"
                    className="input flex-1 py-1 px-2 text-sm"
                    value={editAValue}
                    onChange={(e) => setEditAValue(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => handleSaveA(a.Id)} className="text-emerald-500 hover:text-emerald-600 p-1">
                    <Save size={16} />
                  </button>
                  <button onClick={() => setEditingA(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700">{a.Answer}</span>
                  <button
                    onClick={() => {
                      setEditingA(a.Id)
                      setEditAValue(a.Answer)
                    }}
                    className="text-blue-500 hover:text-blue-600 p-1"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteA(a.Id)} className="text-red-500 hover:text-red-600 p-1">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
          {answers.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No hay respuestas registradas.</p>}
        </div>
      </div>
    </div>
  )
}
