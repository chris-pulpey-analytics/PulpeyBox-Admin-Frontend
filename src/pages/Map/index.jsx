import { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useGetMapPointsQuery, useQueryMapAreaMutation } from '../../store/api/metricsApi'
import { Camera, Layers, Square, Trash2, Download, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import L from 'leaflet'

const DEMO_COLORS = {
  gender: { Masculino: '#7c3aed', Femenino: '#e879f9', 'Sin dato': '#94a3b8' },
  age_range: { '18-27': '#06b6d4', '28-37': '#7c3aed', '38-47': '#f59e0b', '47+': '#ef4444', 'Sin dato': '#94a3b8' },
  department: {},
  profession: {},
}
const PALETTE = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
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

// Hook para draw con Geoman
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

// Carga Geoman dinámicamente
function GeomanLoader() {
  const map = useMap()
  useEffect(() => {
    import('@geoman-io/leaflet-geoman-free').then(() => {
      import('@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css').catch(() => {})
      if (map && !map.pm) {
        map.pm?.addControls?.({ position: 'topleft', drawCircle: false, drawMarker: false, drawPolyline: false, drawCircleMarker: false, drawText: false, rotateMode: false, cutPolygon: false })
      }
    }).catch(() => {})
  }, [map])
  return null
}

export default function MapPage() {
  const [colorBy, setColorBy] = useState('gender')
  const [drawMode, setDrawMode] = useState(false)
  const [areaStats, setAreaStats] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [mapFilters, setMapFilters] = useState({})
  const mapRef = useRef(null)
  const statsRef = useRef(null)

  const { data: mapData, isLoading } = useGetMapPointsQuery(mapFilters)
  const [queryArea, { isLoading: querying }] = useQueryMapAreaMutation()

  const points = mapData?.points || []
  const dynamicMap = buildDynamicMap(points, colorBy)

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
        a.href = url
        a.download = `mapa_${colorBy}_${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
      toast.dismiss()
      toast.success('Captura descargada')
    } catch {
      toast.dismiss()
      toast.error('Error al capturar')
    }
  }

  const handleExportArea = () => {
    if (!areaStats?.users?.length) return
    const rows = areaStats.users.map((u) =>
      `${u.Id},${u.full_name},${u.gender},${u.age_range},${u.department},${u.city},${u.lat},${u.lng}`
    )
    const csv = ['ID,Nombre,Género,Rango Edad,Departamento,Municipio,Latitud,Longitud', ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'area_usuarios.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const colorOptions = [
    { value: 'gender', label: 'Género' },
    { value: 'age_range', label: 'Rango de edad' },
    { value: 'department', label: 'Departamento' },
    { value: 'profession', label: 'Profesión' },
  ]

  // Leyenda dinámica
  const legendEntries = colorBy === 'gender' || colorBy === 'age_range'
    ? Object.entries(DEMO_COLORS[colorBy] || {})
    : Object.entries(dynamicMap).slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mapa de Usuarios</h1>
          <p className="text-slate-500 text-sm">{isLoading ? 'Cargando...' : `${points.length.toLocaleString()} usuarios con ubicación`}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={colorBy} onChange={(e) => setColorBy(e.target.value)} className="input w-auto text-sm">
            {colorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setDrawMode((v) => !v)}
            className={drawMode ? 'btn-primary' : 'btn-secondary'}
            title="Seleccionar área"
          >
            <Square size={15} />
            {drawMode ? 'Dibujando...' : 'Seleccionar área'}
          </button>
          {areaStats && (
            <button onClick={() => setAreaStats(null)} className="btn-ghost btn-sm" title="Limpiar selección">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={handleScreenshot} className="btn-secondary" title="Captura">
            <Camera size={15} />
            Captura
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-start" id="map-capture-area">
        {/* Mapa */}
        <div className="flex-1 relative">
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100" style={{ height: '600px' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : (
              <MapContainer
                center={[14.6349, -90.5069]}
                zoom={8}
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
                        color: 'white',
                        weight: 1.5,
                        fillColor: getColor(p, colorBy, dynamicMap),
                        fillOpacity: 0.85,
                      }}
                      eventHandlers={{ click: () => setSelectedUser(p) }}
                    >
                      <Popup>
                        <div className="text-xs space-y-0.5 min-w-[160px]">
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-slate-500">{p.gender} · {p.age_range}</p>
                          <p className="text-slate-500">{p.city}, {p.department}</p>
                          <p className="text-slate-400">Registro: {p.registration_date}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            )}
          </div>

          {/* Leyenda */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-3 z-10 max-w-[180px]">
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">{colorOptions.find(o => o.value === colorBy)?.label}</p>
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

        {/* Panel de stats del área */}
        {areaStats && (
          <div className="w-72 shrink-0 space-y-4" ref={statsRef}>
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
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={areaStats.stats.gender} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                        {areaStats.stats.gender.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
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
                  <p className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">Rango de edad</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={areaStats.stats.age_range} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={40} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7c3aed" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card-sm">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Departamentos</p>
                  <div className="space-y-1.5">
                    {areaStats.stats.department.slice(0, 6).map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 truncate flex-1">{d.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="h-1.5 rounded-full bg-violet-200" style={{ width: `${Math.max(20, (d.value / (areaStats.stats.department[0]?.value || 1)) * 60)}px` }}>
                            <div className="h-full rounded-full bg-violet-500" style={{ width: '100%' }} />
                          </div>
                          <span className="font-semibold text-slate-700 w-6 text-right">{d.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Usuarios en el área */}
                <div className="card-sm">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Muestra de usuarios</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {areaStats.users.slice(0, 20).map((u) => (
                      <div key={u.Id} className="flex items-center gap-2 py-1 border-b border-slate-50 last:border-0">
                        <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                          {u.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{u.full_name}</p>
                          <p className="text-xs text-slate-400 truncate">{u.gender} · {u.city}</p>
                        </div>
                      </div>
                    ))}
                    {areaStats.users.length > 20 && (
                      <p className="text-xs text-slate-400 text-center py-1">+{areaStats.users.length - 20} más</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
