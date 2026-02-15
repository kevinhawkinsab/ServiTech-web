<script setup>
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useCitasStore } from '../../../stores/citas'
import { useVisitasStore } from '../../../stores/visitas'
import Card from '../../../components/ui/Card.vue'
import Badge from '../../../components/ui/Badge.vue'
import Button from '../../../components/ui/Button.vue'
import {
  Calendar,
  ClipboardCheck,
  Clock,
  Users,
  TrendingUp,
  ChevronRight
} from 'lucide-vue-next'

use([
  CanvasRenderer,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const citasStore = useCitasStore()
const visitasStore = useVisitasStore()

const selectedPeriod = ref('7D')
const periods = ['7D', '30D', '90D']

// KPIs
const kpis = computed(() => [
  {
    title: 'Total Citas',
    value: citasStore.citas.length,
    change: '+12%',
    icon: Calendar,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    title: 'Pendientes',
    value: citasStore.citasPendientes.length,
    change: '-5%',
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50'
  },
  {
    title: 'Completadas Hoy',
    value: citasStore.citasCompletadas.length,
    change: '+8%',
    icon: ClipboardCheck,
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  {
    title: 'Técnicos Activos',
    value: visitasStore.tecnicos.length,
    change: '0%',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/10'
  }
])

// Doughnut Chart - Estado de Citas
const doughnutOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    textStyle: {
      fontSize: 12
    }
  },
  series: [
    {
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      data: [
        { value: citasStore.citasPendientes.length, name: 'Pendientes', itemStyle: { color: '#fbbf24' } },
        { value: citasStore.citasConfirmadas.length, name: 'Confirmadas', itemStyle: { color: '#3b82f6' } },
        { value: citasStore.citasCompletadas.length, name: 'Completadas', itemStyle: { color: '#22c55e' } },
        { value: citasStore.citasCanceladas.length, name: 'Canceladas', itemStyle: { color: '#ef4444' } }
      ]
    }
  ]
}))

// Line Chart - Tendencia Semanal
const lineOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    axisLine: { lineStyle: { color: '#e4e4e7' } },
    axisLabel: { color: '#71717a', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f4f4f5' } },
    axisLabel: { color: '#71717a', fontSize: 11 }
  },
  series: [
    {
      name: 'Visitas',
      type: 'line',
      smooth: true,
      lineStyle: { color: '#f35027', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(243, 80, 39, 0.2)' },
            { offset: 1, color: 'rgba(243, 80, 39, 0)' }
          ]
        }
      },
      itemStyle: { color: '#f35027' },
      data: [3, 5, 4, 7, 6, 2, 1]
    }
  ]
}))

// Próximas citas
const proximasCitas = computed(() => {
  return citasStore.citas
    .filter(c => c.estado === 'pendiente' || c.estado === 'confirmada')
    .slice(0, 5)
})

const getEstadoBadge = (estado) => {
  const variants = {
    pendiente: 'warning',
    confirmada: 'default',
    completada: 'success',
    cancelada: 'destructive'
  }
  return variants[estado] || 'secondary'
}
</script>

<template>
  <div class="space-y-6" data-testid="dashboard-page">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p class="text-sm text-zinc-500">Resumen de actividades y métricas</p>
      </div>
      <div class="flex gap-1 bg-zinc-100 rounded-md p-1">
        <button
          v-for="period in periods"
          :key="period"
          :class="[
            'px-3 py-1 text-sm font-medium rounded transition-colors',
            selectedPeriod === period
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900'
          ]"
          @click="selectedPeriod = period"
          :data-testid="`period-${period}`"
        >
          {{ period }}
        </button>
      </div>
    </div>

    <!-- KPI Cards - Bento Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        v-for="kpi in kpis"
        :key="kpi.title"
        class="hover:shadow-md transition-shadow"
        :data-testid="`kpi-${kpi.title.toLowerCase().replace(' ', '-')}`"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-zinc-500">{{ kpi.title }}</p>
            <p class="font-heading text-2xl font-bold text-zinc-900 mt-1">{{ kpi.value }}</p>
            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp class="w-3 h-3" />
              {{ kpi.change }} vs período anterior
            </p>
          </div>
          <div :class="['p-2 rounded-lg', kpi.bg]">
            <component :is="kpi.icon" :class="['w-5 h-5', kpi.color]" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Doughnut Chart -->
      <Card title="Estado de Citas" data-testid="chart-doughnut">
        <v-chart :option="doughnutOption" style="height: 280px" autoresize />
      </Card>

      <!-- Line Chart -->
      <Card title="Tendencia Semanal" data-testid="chart-line">
        <v-chart :option="lineOption" style="height: 280px" autoresize />
      </Card>
    </div>

    <!-- Próximas Citas -->
    <Card title="Próximas Citas" data-testid="upcoming-appointments">
      <template #header-actions>
        <Button variant="ghost" size="sm" class="text-primary">
          Ver todas
          <ChevronRight class="w-4 h-4 ml-1" />
        </Button>
      </template>
      
      <div class="space-y-3">
        <div
          v-for="cita in proximasCitas"
          :key="cita.id"
          class="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
          :data-testid="`cita-${cita.id}`"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-900">{{ cita.asunto }}</p>
              <p class="text-xs text-zinc-500">{{ cita.clienteNombre }} • {{ cita.tecnicoNombre }}</p>
            </div>
          </div>
          <div class="text-right">
            <Badge :variant="getEstadoBadge(cita.estado)">{{ cita.estado }}</Badge>
            <p class="text-xs text-zinc-500 mt-1">{{ cita.fecha }} {{ cita.hora }}</p>
          </div>
        </div>

        <div v-if="proximasCitas.length === 0" class="text-center py-8 text-zinc-500">
          No hay citas próximas
        </div>
      </div>
    </Card>
  </div>
</template>
