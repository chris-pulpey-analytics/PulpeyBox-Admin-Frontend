import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useGetSurveyResponsesQuery, useGetSurveyQuery } from '../../store/api/surveysApi'
import { ArrowLeft, Users, BarChart2, PieChart as PieIcon, Settings, List } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import SurveyConfig from './SurveyConfig'

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316']

export default function SurveyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useGetSurveyResponsesQuery(id)
  const { data: surveyData } = useGetSurveyQuery(id)
  const [activeTab, setActiveTab] = useState('stats')

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return <div className="text-center py-20 text-slate-400">No hay datos para esta encuesta</div>

  const { survey, total_responses, questions, demographics } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{survey.Name}</h1>
          <p className="text-slate-500 text-sm">Código: {survey.Code || '—'} · {total_responses} respuestas analizadas</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'stats' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List size={14} /> Usuarios
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'config' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Settings size={14} /> Configuración
          </button>
        </div>
      </div>

      {activeTab === 'config' ? (
        <SurveyConfig surveyId={id} />
      ) : activeTab === 'users' ? (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Usuarios asignados
              {surveyData?.users?.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">({surveyData.users.length})</span>
              )}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID', 'Nombre', 'Email', 'Estado', 'Edad', 'Género', 'Ciudad', 'Departamento', 'Respondida'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!surveyData ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : surveyData.users?.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400">Sin usuarios asignados</td></tr>
                ) : (
                  surveyData.users?.map((u) => (
                    <tr key={u.Id} className="table-row">
                      <td className="px-4 py-3 font-mono text-slate-500 text-xs">{u.Id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{u.Name} {u.LastName}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{u.Email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.status_name?.toLowerCase().includes('complet') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {u.status_name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-center">{u.edad !== '-' ? u.edad : '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.genero !== '-' ? u.genero : '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{u.ciudad !== '-' ? u.ciudad : '—'}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{u.departamento !== '-' ? u.departamento : '—'}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {u.AnsweredDate ? new Date(u.AnsweredDate).toLocaleDateString('es-GT') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <Users size={20} className="mx-auto text-violet-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">{total_responses}</p>
              <p className="text-xs text-slate-400">Total respuestas</p>
            </div>
            <div className="card text-center">
              <BarChart2 size={20} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">{questions.length}</p>
              <p className="text-xs text-slate-400">Preguntas detectadas</p>
            </div>
            <div className="card text-center">
              <PieIcon size={20} className="mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">
                {demographics.gender.find((g) => g.name !== 'Sin dato')
                  ? demographics.gender[0]?.name
                  : '—'}
              </p>
              <p className="text-xs text-slate-400">Género predominante</p>
            </div>
          </div>

          {/* Demografía */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Género */}
            <div className="card">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Distribución por Género</h3>
              {demographics.gender.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={demographics.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {demographics.gender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm text-center py-8">Sin datos</p>}
            </div>

            {/* Edad */}
            <div className="card">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Distribución por Edad</h3>
              {demographics.age.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={demographics.age} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm text-center py-8">Sin datos</p>}
            </div>

            {/* Departamento */}
            <div className="card">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Top Departamentos</h3>
              {demographics.department.length > 0 ? (
                <div className="space-y-2">
                  {demographics.department.slice(0, 8).map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-28 truncate">{d.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-violet-500 h-2 rounded-full"
                          style={{ width: `${(d.value / demographics.department[0].value) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 w-8 text-right">{d.value}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-sm text-center py-8">Sin datos</p>}
            </div>
          </div>

          {/* Respuestas por pregunta */}
          {questions.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-700">Respuestas por pregunta</h2>
              {questions.map((q, qi) => (
                <div key={qi} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700 truncate max-w-lg">{q.question}</h3>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{q.total} respuestas</span>
                  </div>
                  {q.answers.length <= 8 ? (
                    <ResponsiveContainer width="100%" height={Math.max(120, q.answers.length * 36)}>
                      <BarChart data={q.answers} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={160} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                      {q.answers.slice(0, 20).map((a, ai) => (
                        <div key={ai} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 flex-1 truncate">{a.label}</span>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-violet-500 h-1.5 rounded-full"
                              style={{ width: `${(a.count / q.answers[0].count) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 w-8 text-right">{a.count}</span>
                        </div>
                      ))}
                      {q.answers.length > 20 && (
                        <p className="text-xs text-slate-400 text-center pt-1">+{q.answers.length - 20} respuestas más</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <BarChart2 size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm">No se encontraron respuestas con datos JSON analizables</p>
              <p className="text-slate-300 text-xs mt-1">Las respuestas pueden estar en un formato diferente</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
