import { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useGetMapPointsQuery, useQueryMapAreaMutation } from '../../store/api/metricsApi'
import { useGetSettingsGroupedQuery } from '../../store/api/settingsApi'
import { useGetDepartmentsQuery, useGetCitiesQuery } from '../../store/api/locationsApi'
import { useGetSurveysQuery } from '../../store/api/surveysApi'
import {
  Camera, Square, Trash2, Download, Loader2, Filter,
  ChevronDown, ChevronUp, BarChart2,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'


/* ─── color palettes ─────────────────────────────────────────── */
const DEMO_COLORS = {
  gender:       { Masculino: '#7c3aed', Femenino: '#e879f9', 'Sin dato': '#94a3b8' },
  age_range:    { '18-27': '#06b6d4', '28-37': '#7c3aed', '38-47': '#f59e0b', '47+': '#ef4444', 'Sin dato': '#94a3b8' },
  department:   {},
  profession:   {},
  marital_status: {},
  income_range: {},
}
const PALETTE      = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
const CHART_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function getColor(point, colorBy, dynamicMap) {
  const val = point[colorBy] || 'Sin dato'
  return DEMO_COLORS[colorBy]?.[val] || dynamicMap[val] || '#7c3aed'
}

function buildDynamicMap(points, colorBy) {
  const unique = [...new Set(points.map((p) => p[colorBy] || 'Sin dato'))]
  const map = {}
  unique.forEach((v, i) => { map[v] = PALETTE[i % PALETTE.length] })
  return map
}

/* ─── aggregate helper for live metrics ─────────────────────── */
function aggregateBy(points, field, limit = 10) {
  const counts = {}
  points.forEach((p) => {
    const val = p[field] || 'Sin dato'
    counts[val] = (counts[val] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

/* ─── Geoman components ──────────────────────────────────────── */
function DrawControl({ onAreaSelected, drawMode, setDrawMode }) {
  const map = useMap()
  const drawnRef = useRef(null)

  useEffect(() => {
    if (typeof map.pm === 'undefined') return
    if (drawMode) {
      if (drawnRef.current) { drawnRef.current.remove(); drawnRef.current = null }
      map.pm.enableDraw('Rectangle', { snappable: false })
    } else {
      map.pm.disableDraw()
    }
  }, [drawMode, map])

  useEffect(() => {
    if (typeof map.pm === 'undefined') return
    const onCreate = (e) => {
      if (drawnRef.current) drawnRef.current.remove()
      drawnRef.current = e.layer
      setDrawMode(false)
      const coords = e.layer.getLatLngs()[0].map((ll) => [ll.lng, ll.lat])
      coords.push(coords[0])
      onAreaSelected(coords)
    }
    map.on('pm:create', onCreate)
    return () => map.off('pm:create', onCreate)
  }, [map, onAreaSelected, setDrawMode])

  return null
}

function GeomanLoader() {
  const map = useMap()
  useEffect(() => {
    import('@geoman-io/leaflet-geoman-free').then(() => {
      import('@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css').catch(() => {})
      if (map && !map.pm) {
        map.pm?.addControls?.({
          position: 'topleft', drawCircle: false, drawMarker: false,
          drawPolyline: false, drawCircleMarker: false, drawText: false,
          rotateMode: false, cutPolygon: false,
        })
      }
    }).catch(() => {})
  }, [map])
  return null
}

/* ─── filters init ───────────────────────────────────────────── */
const INIT_FILTERS = {
  gender_id: '', marital_status_id: '', income_range_id: '', profession_id: '',
  number_children_id: '', level_academic_id: '', frequency_activities_id: '',
  department_id: '', city_id: '', zone: '',
  age_min: '', age_max: '',
  is_buy_manager_home: '', is_pregnant: '', is_interested_technology: '',
  is_alcohol_consume: '', is_tobacco_consume: '',
  registered_from: '', registered_to: '',
  survey_id: '', survey_status_id: '', role_house_id: '',
}

/* ─── mini chart helpers ─────────────────────────────────────── */
function MiniPie({ data, colors }) {
  return (
    <ResponsiveContainer width="100%" height={130}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={55} dataKey="value" labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Pie>
        <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function MiniBar({ data, color = '#7c3aed', layout = 'vertical', yWidth = 70 }) {
  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={Math.max(100, data.length * 22)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={yWidth} />
          <Tooltip formatter={(v) => [v.toLocaleString(), 'Usuarios']} />
          <Bar dataKey="value" fill={color} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-12} textAnchor="end" height={40} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v) => [v.toLocaleString(), 'Usuarios']} />
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function MetricCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  )
}

function ColorDot({ color, label, value, total }) {
  const pct = total ? ((value / total) * 100).toFixed(0) : 0
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-slate-600 truncate max-w-[120px]">{label}</span>
      </div>
      <span className="font-semibold text-slate-700 ml-2">{value.toLocaleString()} <span className="text-slate-400 font-normal">({pct}%)</span></span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export default function MapPage() {
  const [colorBy, setColorBy]       = useState('gender')
  const [drawMode, setDrawMode]     = useState(false)
  const [areaStats, setAreaStats]   = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showMetrics, setShowMetrics] = useState(true)
  const [filters, setFilters]       = useState(INIT_FILTERS)
  const mapRef = useRef(null)

  const { data: settingsData }  = useGetSettingsGroupedQuery()
  const { data: departments }   = useGetDepartmentsQuery()
  const { data: citiesData }    = useGetCitiesQuery(
    { department_id: filters.department_id },
    { skip: !filters.department_id },
  )
  const { data: surveysData }   = useGetSurveysQuery({ page: 1, page_size: 200 })

  const grouped   = settingsData || []
  const getGroup  = (kw) =>
    grouped.find((g) => g.group_name?.toLowerCase().includes(kw.toLowerCase()))?.settings || []

  const genders         = getGroup('Gender')
  const maritalStatuses = getGroup('MaritalStatus')
  const roleHouses      = getGroup('RoleHouse')
  const incomeRanges    = getGroup('IncomeRange')
  const professions     = getGroup('Profession')
  const numberChildren  = getGroup('NumberChildren')
  const levelAcademic   = getGroup('LevelAcademic')
  const frequencies     = getGroup('FrequencyActivities')
  const surveyStatuses  = getGroup('SurveyStatus')
  const cities          = citiesData?.data || citiesData || []
  const surveyList      = surveysData?.data || []

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  )

  const { data: mapData, isLoading } = useGetMapPointsQuery(activeFilters)
  const [queryArea, { isLoading: querying }] = useQueryMapAreaMutation()

  const points     = mapData?.points || []
  const dynamicMap = buildDynamicMap(points, colorBy)

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const handleDeptChange = (v) => setFilters((f) => ({ ...f, department_id: v, city_id: '' }))

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length

  /* ── live metrics computed from visible points ── */
  const liveGender   = aggregateBy(points, 'gender')
  const liveAge      = aggregateBy(points, 'age_range')
  const liveDept     = aggregateBy(points, 'department', 10)
  const liveIncome   = aggregateBy(points, 'income_range')
  const liveMarital  = aggregateBy(points, 'marital_status')
  const liveProfession = aggregateBy(points, 'profession', 8)

  const handleAreaSelected = useCallback(async (coords) => {
    try {
      const res = await queryArea({ coordinates: coords, color_by: colorBy }).unwrap()
      setAreaStats(res)
      toast.success(`${res.total} usuarios en el área seleccionada`)
    } catch {
      toast.error('Error al consultar el área')
    }
  }, [queryArea, colorBy])

  const handleScreenshot = async () => {
    const el = document.getElementById('map-capture-area')
    if (!el) return
    toast.loading('Generando captura...')
    try {
      const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: '#f8fafc' })
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `mapa_${colorBy}_${Date.now()}.png`; a.click()
        URL.revokeObjectURL(url)
      })
      toast.dismiss(); toast.success('Captura descargada')
    } catch {
      toast.dismiss(); toast.error('Error al capturar')
    }
  }

  const handleExportArea = () => {
    if (!areaStats?.users?.length) return
    const rows = areaStats.users.map((u) =>
      `${u.Id},${u.full_name},${u.gender},${u.age_range},${u.department},${u.city},${u.lat},${u.lng}`,
    )
    const csv = ['ID,Nombre,Género,Rango Edad,Departamento,Municipio,Latitud,Longitud', ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'area_usuarios.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const colorOptions = [
    { value: 'gender',         label: 'Género' },
    { value: 'age_range',      label: 'Rango de edad' },
    { value: 'department',     label: 'Departamento' },
    { value: 'profession',     label: 'Profesión' },
    { value: 'marital_status', label: 'Estado Civil' },
    { value: 'income_range',   label: 'Rango de Ingreso' },
  ]

  const legendEntries = ['gender', 'age_range'].includes(colorBy)
    ? Object.entries(DEMO_COLORS[colorBy] || {})
    : Object.entries(dynamicMap).slice(0, 10)

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mapa de Usuarios</h1>
          <p className="text-slate-500 text-sm">
            {isLoading ? 'Cargando...' : `${points.length.toLocaleString()} usuarios con ubicación`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={colorBy}
            onChange={(e) => setColorBy(e.target.value)}
            className="input w-auto text-sm"
          >
            {colorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button onClick={() => setShowFilters((v) => !v)} className="btn-secondary">
            <Filter size={15} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-violet-600 text-white text-xs rounded-full w-4 h-4
                               flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            onClick={() => setDrawMode((v) => !v)}
            className={drawMode ? 'btn-primary' : 'btn-secondary'}
          >
            <Square size={15} />
            {drawMode ? 'Dibujando...' : 'Seleccionar área'}
          </button>

          {areaStats && (
            <button onClick={() => setAreaStats(null)} className="btn-ghost btn-sm" title="Limpiar selección">
              <Trash2 size={15} />
            </button>
          )}

          <button onClick={handleScreenshot} className="btn-secondary">
            <Camera size={15} /> Captura
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="card-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="label">Género</label>
              <select className="input" value={filters.gender_id} onChange={(e) => set('gender_id', e.target.value)}>
                <option value="">Todos</option>
                {genders.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado Civil</label>
              <select className="input" value={filters.marital_status_id} onChange={(e) => set('marital_status_id', e.target.value)}>
                <option value="">Todos</option>
                {maritalStatuses.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Rol en el Hogar</label>
              <select className="input" value={filters.role_house_id} onChange={(e) => set('role_house_id', e.target.value)}>
                <option value="">Todos</option>
                {roleHouses.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Rango Ingreso</label>
              <select className="input" value={filters.income_range_id} onChange={(e) => set('income_range_id', e.target.value)}>
                <option value="">Todos</option>
                {incomeRanges.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Profesión</label>
              <select className="input" value={filters.profession_id} onChange={(e) => set('profession_id', e.target.value)}>
                <option value="">Todos</option>
                {professions.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">N° Hijos</label>
              <select className="input" value={filters.number_children_id} onChange={(e) => set('number_children_id', e.target.value)}>
                <option value="">Todos</option>
                {numberChildren.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nivel Académico</label>
              <select className="input" value={filters.level_academic_id} onChange={(e) => set('level_academic_id', e.target.value)}>
                <option value="">Todos</option>
                {levelAcademic.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Frec. Actividad</label>
              <select className="input" value={filters.frequency_activities_id} onChange={(e) => set('frequency_activities_id', e.target.value)}>
                <option value="">Todos</option>
                {frequencies.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Departamento</label>
              <select className="input" value={filters.department_id} onChange={(e) => handleDeptChange(e.target.value)}>
                <option value="">Todos</option>
                {(departments?.data || departments || []).map((d) =>
                  <option key={d.Id} value={d.Id}>{d.DepartmentName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Municipio</label>
              <select
                className="input"
                value={filters.city_id}
                onChange={(e) => set('city_id', e.target.value)}
                disabled={!filters.department_id}
              >
                <option value="">Todos</option>
                {cities.map((c) => <option key={c.Id} value={c.Id}>{c.CityName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Zona</label>
              <input
                type="number" className="input" value={filters.zone}
                onChange={(e) => set('zone', e.target.value)} placeholder="1"
              />
            </div>
            <div>
              <label className="label">Edad mín.</label>
              <input
                type="number" className="input" value={filters.age_min}
                onChange={(e) => set('age_min', e.target.value)} placeholder="18"
              />
            </div>
            <div>
              <label className="label">Edad máx.</label>
              <input
                type="number" className="input" value={filters.age_max}
                onChange={(e) => set('age_max', e.target.value)} placeholder="65"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Encuesta</label>
              <select className="input" value={filters.survey_id} onChange={(e) => set('survey_id', e.target.value)}>
                <option value="">Cualquiera</option>
                {surveyList.map((s) => <option key={s.Id} value={s.Id}>{s.Name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado encuesta</label>
              <select
                className="input"
                value={filters.survey_status_id}
                onChange={(e) => set('survey_status_id', e.target.value)}
                disabled={!filters.survey_id}
              >
                <option value="">Cualquiera</option>
                {surveyStatuses.map((o) => <option key={o.Id} value={o.Id}>{o.Name}</option>)}
              </select>
            </div>
          </div>

          {/* Booleans */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-slate-100 pt-3">
            {[
              ['is_buy_manager_home',      'Compras Hogar'],
              ['is_pregnant',              'Embarazo'],
              ['is_interested_technology', 'Tecnología'],
              ['is_alcohol_consume',       'Alcohol'],
              ['is_tobacco_consume',       'Nicotina'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <select className="input" value={filters[key]} onChange={(e) => set(key, e.target.value)}>
                  <option value="">Cualquiera</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-100 pt-3">
            <div>
              <label className="label">Registro desde</label>
              <input
                type="date" className="input" value={filters.registered_from}
                onChange={(e) => set('registered_from', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Registro hasta</label>
              <input
                type="date" className="input" value={filters.registered_to}
                onChange={(e) => set('registered_to', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-2">
            <button onClick={() => setFilters(INIT_FILTERS)} className="btn-ghost text-sm">
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* ── Map + Area stats ── */}
      <div className="flex gap-4 items-start" id="map-capture-area">
        <div className="flex-1 relative">
          <div
            className="rounded-2xl overflow-hidden shadow-sm border border-slate-100"
            style={{ height: '580px' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : (
              <MapContainer
                center={[14.6349, -90.5069]} zoom={8}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                />
                <GeomanLoader />
                <DrawControl onAreaSelected={handleAreaSelected} drawMode={drawMode} setDrawMode={setDrawMode} />
                <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
                  {points.map((p) => (
                    <CircleMarker
                      key={p.id}
                      center={[p.lat, p.lng]}
                      radius={6}
                      pathOptions={{
                        color: 'white', weight: 1.5,
                        fillColor: getColor(p, colorBy, dynamicMap),
                        fillOpacity: 0.85,
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-0.5 min-w-[160px]">
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-slate-500">{p.gender} · {p.age_range}</p>
                          <p className="text-slate-500">{p.city}, {p.department}</p>
                          <p className="text-slate-400 text-xs">{p.income_range} · {p.marital_status}</p>
                          <p className="text-slate-400">Registro: {p.registration_date}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            )}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl
                          shadow-lg border border-slate-100 p-3 z-10 max-w-[180px]">
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              {colorOptions.find((o) => o.value === colorBy)?.label}
            </p>
            <div className="space-y-1.5">
              {legendEntries.map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-slate-600 truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area stats panel */}
        {areaStats && (
          <div className="w-72 shrink-0 space-y-4">
            <div className="card-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-700 text-sm">Área seleccionada</h3>
                <button onClick={handleExportArea} className="btn-ghost btn-sm text-xs gap-1">
                  <Download size={12} /> CSV
                </button>
              </div>
              <p className="text-3xl font-bold text-violet-600">{areaStats.total}</p>
              <p className="text-slate-500 text-xs">usuarios en esta área</p>
            </div>

            {querying ? (
              <div className="card-sm flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : (
              <>
                <div className="card-sm">
                  <p className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">Género</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={areaStats.stats.gender} cx="50%" cy="50%" outerRadius={45} dataKey="value">
                        {areaStats.stats.gender.map((_, i) =>
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {areaStats.stats.gender.map((g, i) => (
                      <div key={g.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-slate-600">{g.name}</span>
                        </div>
                        <span className="font-semibold text-slate-700">{g.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-sm">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Rango de edad</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={areaStats.stats.age_range} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={38} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7c3aed" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {areaStats.stats.income_range?.length > 0 && (
                  <div className="card-sm">
                    <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Ingreso</p>
                    <div className="space-y-1.5">
                      {areaStats.stats.income_range.slice(0, 5).map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 truncate flex-1">{d.name}</span>
                          <span className="font-semibold text-slate-700 ml-2">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card-sm">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Departamentos</p>
                  <div className="space-y-1.5">
                    {areaStats.stats.department.slice(0, 6).map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 truncate flex-1">{d.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="h-1.5 rounded-full bg-violet-200"
                               style={{ width: `${Math.max(20, (d.value / (areaStats.stats.department[0]?.value || 1)) * 60)}px` }}>
                            <div className="h-full rounded-full bg-violet-500" style={{ width: '100%' }} />
                          </div>
                          <span className="font-semibold text-slate-700 w-6 text-right">{d.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-sm">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Muestra de usuarios</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {areaStats.users.slice(0, 20).map((u) => (
                      <div key={u.Id} className="flex items-center gap-2 py-1 border-b border-slate-50 last:border-0">
                        <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center
                                        text-violet-600 text-xs font-bold shrink-0">
                          {u.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{u.full_name}</p>
                          <p className="text-xs text-slate-400 truncate">{u.gender} · {u.city}</p>
                        </div>
                      </div>
                    ))}
                    {areaStats.users.length > 20 && (
                      <p className="text-xs text-slate-400 text-center py-1">
                        +{areaStats.users.length - 20} más
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══ FASE 4 — Live metrics panel ══════════════════════════ */}
      {!isLoading && points.length > 0 && (
        <div className="card">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <BarChart2 size={16} className="text-violet-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-700 text-sm">
                  Métricas de usuarios visibles
                </h2>
                <p className="text-slate-400 text-xs">
                  {points.length.toLocaleString()} usuarios · actualización en tiempo real
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMetrics((v) => !v)}
              className="btn-ghost btn-sm text-xs gap-1.5"
            >
              {showMetrics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showMetrics ? 'Ocultar' : 'Ver métricas'}
            </button>
          </div>

          {showMetrics && (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total visibles',  value: points.length, color: 'text-violet-600' },
                  { label: 'Géneros',         value: liveGender.length,    color: 'text-cyan-600' },
                  { label: 'Departamentos',   value: liveDept.length,      color: 'text-emerald-600' },
                  { label: 'Profesiones',     value: liveProfession.length, color: 'text-amber-600' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${kpi.color}`}>
                      {kpi.value.toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Gender */}
                <MetricCard title="Género">
                  <MiniPie data={liveGender} colors={CHART_COLORS} />
                  <div className="space-y-1.5 mt-2">
                    {liveGender.map((g, i) => (
                      <ColorDot
                        key={g.name}
                        color={CHART_COLORS[i % CHART_COLORS.length]}
                        label={g.name}
                        value={g.value}
                        total={points.length}
                      />
                    ))}
                  </div>
                </MetricCard>

                {/* Age range */}
                <MetricCard title="Rango de edad">
                  <MiniBar data={liveAge} color="#7c3aed" yWidth={50} />
                  <div className="space-y-1.5 mt-2">
                    {liveAge.map((d, i) => (
                      <ColorDot
                        key={d.name}
                        color={PALETTE[i % PALETTE.length]}
                        label={d.name}
                        value={d.value}
                        total={points.length}
                      />
                    ))}
                  </div>
                </MetricCard>

                {/* Marital status */}
                <MetricCard title="Estado Civil">
                  <MiniPie data={liveMarital} colors={PALETTE} />
                  <div className="space-y-1.5 mt-2">
                    {liveMarital.map((d, i) => (
                      <ColorDot
                        key={d.name}
                        color={PALETTE[i % PALETTE.length]}
                        label={d.name}
                        value={d.value}
                        total={points.length}
                      />
                    ))}
                  </div>
                </MetricCard>

                {/* Department */}
                <MetricCard title="Top Departamentos">
                  <MiniBar data={liveDept.slice(0, 8)} color="#06b6d4" yWidth={100} />
                </MetricCard>

                {/* Income range */}
                <MetricCard title="Rango de Ingreso">
                  <MiniBar data={liveIncome} color="#f59e0b" yWidth={120} />
                </MetricCard>

                {/* Profession */}
                <MetricCard title="Top Profesiones">
                  <MiniBar data={liveProfession} color="#10b981" yWidth={110} />
                </MetricCard>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
