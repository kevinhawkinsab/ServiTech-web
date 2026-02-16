<script setup>
import { ref, computed } from 'vue'

/* ECharts setup */
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart, BarChart, GaugeChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent
} from 'echarts/components'
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent
])
import VChart from 'vue-echarts'

/* Stores & UI */
import { useAuthStore } from '../../../stores/auth'
import { useCitasStore } from '../../../stores/citas'
import { useVisitasStore } from '../../../stores/visitas'

import Card from '../../../components/ui/Card.vue'
import Badge from '../../../components/ui/Badge.vue'
import Button from '../../../components/ui/Button.vue'
import Input from '../../../components/ui/Input.vue'
import Select from '../../../components/ui/Select.vue'

/* Icons (agregué AlertTriangle y Package) */
import {
  Calendar,
  ClipboardCheck,
  Clock,
  DollarSign,
  Users,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  FileText,
  AlertTriangle,
  Package
} from 'lucide-vue-next'

/* ---------- state ---------- */
const authStore = useAuthStore()
const citasStore = useCitasStore()
const visitasStore = useVisitasStore()

const period = ref('30D')
const periods = ['7D', '30D', '90D', '365D']
const selectedTecnico = ref('all')
const selectedTipo = ref('all')
const q = ref('')

/* ---------- data ---------- */
const allCitas = computed(() => citasStore.citas || [])
const tecnicos = computed(() => visitasStore.tecnicos || [])

const sampleCitas = [
  { id: 'S1', asunto: 'Revisión caldera', clienteNombre: 'ACME S.A.', tecnicoNombre: 'Juan P', tecnicoId: 't1', fecha: '2025-02-10', hora: '09:00', estado: 'pendiente', tipo: 'Inspección', precio: 150, duracionMinutos: 60 },
  { id: 'S2', asunto: 'Instalación medidor', clienteNombre: 'IndustriasQ', tecnicoNombre: 'María L', tecnicoId: 't2', fecha: '2025-02-09', hora: '11:00', estado: 'completada', tipo: 'Instalación', precio: 120, duracionMinutos: 40 },
  { id: 'S3', asunto: 'Mantenimiento', clienteNombre: 'Hogar S.A.', tecnicoNombre: 'Carlos T', tecnicoId: 't3', fecha: '2025-02-08', hora: '14:00', estado: 'confirmada', tipo: 'Mantenimiento', precio: 80, duracionMinutos: 30 },
  { id: 'S4', asunto: 'Reparación', clienteNombre: 'Comercio X', tecnicoNombre: 'Juan P', tecnicoId: 't1', fecha: '2025-02-07', hora: '10:30', estado: 'cancelada', tipo: 'Reparación', precio: 45, duracionMinutos: 20 }
]

/* ---------- filtering ---------- */
const filteredCitas = computed(() => {
  return allCitas.value.filter(c => {
    if (selectedTecnico.value !== 'all' && c.tecnicoId !== selectedTecnico.value) return false
    if (selectedTipo.value !== 'all' && (c.tipo || 'Otro') !== selectedTipo.value) return false
    if (q.value && q.value.trim() !== '') {
      const s = q.value.toLowerCase()
      return (c.asunto || '').toLowerCase().includes(s) || (c.clienteNombre || '').toLowerCase().includes(s) || (c.tecnicoNombre || '').toLowerCase().includes(s)
    }
    return true
  })
})

const dataSource = computed(() => filteredCitas.value.length > 0 ? filteredCitas.value : (allCitas.value.length > 0 ? allCitas.value : sampleCitas))

/* ---------- metrics ---------- */
const total = computed(() => dataSource.value.length)
const pendientes = computed(() => dataSource.value.filter(c => c.estado === 'pendiente').length)
const confirmadas = computed(() => dataSource.value.filter(c => c.estado === 'confirmada').length)
const completadas = computed(() => dataSource.value.filter(c => c.estado === 'completada').length)
const canceladas = computed(() => dataSource.value.filter(c => c.estado === 'cancelada').length)
const ingresos = computed(() => dataSource.value.reduce((s, c) => s + (Number(c.precio) || 0), 0))

const techProductivity = computed(() => {
  const map = {}
  dataSource.value.forEach(c => {
    const id = c.tecnicoId || c.tecnicoNombre || 'sin'
    map[id] = map[id] || { nombre: c.tecnicoNombre || 'Técnico', completadas: 0, avatar: '' }
    if (c.estado === 'completada') map[id].completadas++
  })
  return Object.values(map).sort((a, b) => b.completadas - a.completadas)
})

/* ---------- charts ---------- */
const visitasPorTipoOption = computed(() => {
  const map = {}
  dataSource.value.forEach(c => { map[c.tipo || 'Otro'] = (map[c.tipo || 'Otro'] || 0) + 1 })
  const labels = Object.keys(map)
  const values = Object.values(map)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', splitLine: { show: false } },
    yAxis: { type: 'category', data: labels },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color: '#f97316', borderRadius: [0, 6, 6, 0] },
      barWidth: '50%'
    }]
  }
})

const gaugeOption = computed(() => {
  const percent = total.value > 0 ? Math.round((completadas.value / total.value) * 100) : 0
  return {
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 5,
      radius: '90%',
      progress: { show: true, width: 18, itemStyle: { color: '#0ea5a9' } },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 18, color: [[1, '#f3f4f6']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: { valueAnimation: true, offsetCenter: [0, -10], fontSize: 24, fontWeight: 'bold', formatter: '{value}%', color: '#374151' },
      data: [{ value: percent }]
    }]
  }
})

/* small utility */
const pct = (n) => Math.round((n / Math.max(total.value, 1)) * 100)

/* actions */
const resetFilters = () => { selectedTecnico.value = 'all'; selectedTipo.value = 'all'; q.value = ''; period.value = '30D' }
</script>

<template>
  <div class="bg-zinc-50 min-h-screen p-4 md:p-6">
    <!-- header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
          <img src="https://ui-avatars.com/api/?name=Adrian+Admin&background=f97316&color=fff" alt="Avatar"
            class="w-full h-full object-cover" />
        </div>
        <div>
          <h1 class="text-lg md:text-2xl font-semibold text-zinc-900">Bienvenido, {{ authStore.user?.name || 'Admin' }}
          </h1>
          <p class="text-sm text-zinc-500">Tienes <span class="text-orange-600 font-medium">{{ pendientes }}</span>
            visitas pendientes</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 justify-start md:justify-end">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <div class="flex items-center rounded bg-white border px-2 py-1 shadow-sm w-full sm:w-auto">
            <Search class="w-4 h-4 text-zinc-400 mr-2" />
            <Input v-model="q" placeholder="Buscar..." class="w-full sm:w-48 !p-1 text-sm border-none shadow-none" />
          </div>
        </div>

        <Select v-model="selectedTecnico"
          :options="[{ value: 'all', label: 'Todos técnicos' }, ...tecnicos.map(t => ({ value: t.id, label: t.nombre }))]"
          class="w-full sm:w-44 text-sm" />
        <Select v-model="selectedTipo" :options="[{ value: 'all', label: 'Todos tipos' }]"
          class="w-full sm:w-36 text-sm" />
        <div class="flex gap-2 ml-auto">
          <Button variant="default" class="bg-slate-800 hover:bg-slate-900 text-white gap-2 text-sm">
            <Plus class="w-4 h-4" /> Nueva Visita
          </Button>
          <Button variant="outline" class="border-orange-500 text-orange-600 hover:bg-orange-50 gap-2 text-sm">
            <FileText class="w-4 h-4" /> Reportes
          </Button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <Card class="p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Calendar class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-zinc-500 uppercase tracking-wide">Total Visitas</p>
            <div class="flex items-baseline gap-2">
              <h3 class="text-2xl font-bold text-zinc-800">{{ total }}</h3>
              <span class="text-xs text-green-500">+2.5%</span>
            </div>
            <p class="text-xs text-zinc-400 mt-2">Ver detalles</p>
          </div>
        </div>
      </Card>

      <Card class="p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <Clock class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-zinc-500 uppercase tracking-wide">Pendientes</p>
            <div class="flex items-baseline gap-2">
              <h3 class="text-2xl font-bold text-zinc-800">{{ pendientes }}</h3>
              <span class="text-xs text-red-500">-1.2%</span>
            </div>
            <p class="text-xs text-zinc-400 mt-2">Gestionar</p>
          </div>
        </div>
      </Card>

      <Card class="p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-zinc-500 uppercase tracking-wide">Técnicos Activos</p>
            <div class="flex items-baseline gap-2">
              <h3 class="text-2xl font-bold text-zinc-800">{{ tecnicos.length || 8 }}</h3>
              <span class="text-xs text-green-500">+4%</span>
            </div>
            <p class="text-xs text-zinc-400 mt-2">Ver equipo</p>
          </div>
        </div>
      </Card>

      <Card class="p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
            <CheckCircle class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-zinc-500 uppercase tracking-wide">Completadas</p>
            <div class="flex items-baseline gap-2">
              <h3 class="text-2xl font-bold text-zinc-800">{{ completadas }}</h3>
              <span class="text-xs text-green-500">+11%</span>
            </div>
            <p class="text-xs text-zinc-400 mt-2">Historial</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- main grid -->
    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-12 lg:col-span-8 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card class="p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-bold text-zinc-800">Estado de Visitas</h4>
              <Select v-model="period" :options="periods.map(p => ({ value: p, label: p }))" class="w-28 text-sm" />
            </div>

            <div class="flex flex-col gap-4">
              <div class="w-full h-8 flex rounded-full overflow-hidden bg-zinc-100">
                <div :style="{ width: pct(completadas) + '%' }" class="bg-orange-500 h-full"></div>
                <div :style="{ width: pct(confirmadas) + '%' }" class="bg-blue-500 h-full"></div>
                <div :style="{ width: pct(pendientes) + '%' }" class="bg-red-500 h-full"></div>
                <div :style="{ width: pct(canceladas) + '%' }" class="bg-pink-500 h-full"></div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 border border-zinc-50 rounded-lg">
                  <p class="text-xs text-zinc-400 flex items-center gap-2"><span
                      class="w-2 h-2 rounded-full bg-orange-500"></span> Completadas</p>
                  <p class="text-xl font-bold">{{ completadas }}</p>
                </div>
                <div class="p-3 border border-zinc-50 rounded-lg">
                  <p class="text-xs text-zinc-400 flex items-center gap-2"><span
                      class="w-2 h-2 rounded-full bg-blue-500"></span> Confirmadas</p>
                  <p class="text-xl font-bold">{{ confirmadas }}</p>
                </div>
              </div>

              <div class="mt-4 p-3 bg-orange-50 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-500 shadow-sm">
                    <Users class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="text-xs text-orange-700 font-medium">Técnico Estrella</p>
                    <p class="text-sm font-bold text-zinc-800">{{ techProductivity[0]?.nombre || 'N/A' }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs text-orange-600 font-bold">99% Eficacia</p>
                </div>
              </div>
            </div>
          </Card>

          <Card class="p-5 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-zinc-800">Resumen de Asistencia</h4>
              <Badge variant="outline" class="text-[10px] uppercase">Hoy</Badge>
            </div>

            <div class="relative flex justify-center items-center">
              <VChart :option="gaugeOption" autoresize style="min-height:220px; width:100%" />
              <div class="absolute bottom-4 text-center">
                <p class="text-xs text-zinc-400 font-medium">Total Visitas Finalizadas</p>
                <p class="text-lg font-bold text-zinc-700">{{ completadas }}</p>
              </div>
            </div>

            <div class="space-y-2 mt-4">
              <div class="flex justify-between text-xs">
                <span class="text-zinc-500 flex items-center gap-2"><span
                    class="w-2 h-2 rounded-full bg-teal-500"></span> A tiempo</span>
                <span class="font-bold">85%</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-zinc-500 flex items-center gap-2"><span
                    class="w-2 h-2 rounded-full bg-orange-400"></span> Con retraso</span>
                <span class="font-bold">10%</span>
              </div>
            </div>
          </Card>
        </div>

        <Card class="p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-bold text-zinc-800">Visitas por Categoría</h4>
            <Badge variant="secondary" class="bg-zinc-100 text-zinc-500 border-none text-xs">Esta Semana</Badge>
          </div>

          <div class="min-h-[260px]">
            <VChart :option="visitasPorTipoOption" autoresize style="min-height:260px; width:100%" />
          </div>

          <div class="mt-4 pt-4 border-t border-zinc-50">
            <p class="text-xs text-zinc-500">
              Las visitas de <span class="text-orange-600 font-bold">Mantenimiento</span> han incrementado un <span
                class="text-green-500 font-bold">20%</span> vs la semana anterior.
            </p>
          </div>
        </Card>
      </div>

      <!-- right column -->
      <div class="col-span-12 lg:col-span-4 space-y-6">
        <Card class="p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-bold text-slate-800">Top Técnicos</h4>
            <FileText class="w-4 h-4 text-slate-300" />
          </div>

          <div class="space-y-4">
            <div v-for="(t, idx) in techProductivity.slice(0, 4)" :key="idx" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-[12px] font-semibold text-zinc-600">
                  {{ (t.nombre || 'T').charAt(0) }}
                </div>
                <div>
                  <p class="text-sm font-bold">{{ t.nombre }}</p>
                  <p class="text-[11px] text-slate-400">{{ t.completadas }} visitas</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs font-bold text-teal-600">{{ Math.max(0, 100 - (idx * 5)) }}%</div>
                <div class="w-20 bg-slate-100 h-1 rounded-full mt-1">
                  <div class="bg-teal-500 h-full rounded-full" :style="{ width: Math.max(0, 100 - (idx * 5)) + '%' }">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card class="p-5 shadow-sm bg-slate-800 text-white relative overflow-hidden">
          <div class="relative z-10">
            <h4 class="font-bold mb-1">Rendimiento Financiero</h4>
            <p class="text-xs text-slate-300 mb-4">Ingresos estimados del periodo</p>
            <div class="flex items-baseline gap-2 mb-4">
              <h3 class="text-2xl font-black">${{ ingresos.toLocaleString() }}</h3>
              <span class="text-xs text-emerald-400 font-bold">↑ 12%</span>
            </div>
            <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div class="bg-orange-500 h-full" :style="{ width: (Math.min(100, pct(completadas))) + '%' }"></div>
            </div>
            <p class="text-[11px] text-slate-300 mt-2">75% del objetivo mensual</p>
          </div>
          <DollarSign class="absolute -right-6 -bottom-6 w-28 h-28 text-slate-700/20 rotate-12" />
        </Card>

        <Card class="p-4 shadow-sm border-l-4 border-l-red-500">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-red-500" /> Stock Crítico
            </h4>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div class="flex items-center gap-3">
                <Package class="w-4 h-4 text-red-600" />
                <span class="text-xs font-bold text-red-800">Válvulas de Presión</span>
              </div>
              <span class="text-xs font-black bg-white px-2 py-0.5 rounded text-red-600 shadow-sm">2 und.</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div class="flex items-center gap-3">
                <Package class="w-4 h-4 text-slate-600" />
                <span class="text-xs font-bold text-slate-800">Filtros HEPA v4</span>
              </div>
              <span class="text-xs font-black bg-white px-2 py-0.5 rounded text-slate-600 shadow-sm">5 und.</span>
            </div>
          </div>

          <Button variant="outline" class="w-full mt-4 text-[11px] h-9 border-dashed">Gestionar Inventario</Button>
        </Card>
      </div>
    </div>

    <!-- recent visits table -->
    <Card class="p-5 mt-6 shadow-sm bg-white">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <h4 class="font-bold text-zinc-800">Visitas Recientes</h4>
        <div class="flex items-center gap-2">
          <div class="relative">
            <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <Input v-model="q" placeholder="Buscar..." class="pl-8 h-8 text-xs w-44" />
          </div>
          <Button variant="ghost" size="xs" class="text-orange-600">Ver todo</Button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px]">
          <thead>
            <tr class="text-left text-[11px] uppercase tracking-wider text-zinc-400 border-b">
              <th class="pb-3 font-medium">Asunto / Cliente</th>
              <th class="pb-3 font-medium">Técnico</th>
              <th class="pb-3 font-medium text-right">Hora</th>
              <th class="pb-3 font-medium text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-50">
            <tr v-for="c in dataSource.slice(0, 6)" :key="c.id" class="group">
              <td class="py-3">
                <p class="text-sm font-bold text-zinc-700 group-hover:text-orange-600 transition-colors">{{ c.asunto }}
                </p>
                <p class="text-xs text-zinc-400">{{ c.clienteNombre }}</p>
              </td>
              <td class="py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    {{ c.tecnicoNombre?.charAt(0) || '?' }}
                  </div>
                  <span class="text-xs text-zinc-600">{{ c.tecnicoNombre }}</span>
                </div>
              </td>
              <td class="py-3 text-right">
                <p class="text-xs font-medium text-zinc-700">{{ c.hora }}</p>
                <p class="text-[10px] text-zinc-400">{{ c.fecha }}</p>
              </td>
              <td class="py-3 text-right">
                <Badge
                  :variant="c.estado === 'completada' ? 'success' : (c.estado === 'pendiente' ? 'warning' : 'default')"
                  class="text-[10px] px-2 py-0">
                  {{ c.estado }}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.v-chart {
  width: 100%;
}

/* small helpers for responsive */
@media (max-width: 640px) {
  .min-w-\[720px\] {
    min-width: 720px;
  }

  /* keep table horizontally scrollable */
}
</style>
