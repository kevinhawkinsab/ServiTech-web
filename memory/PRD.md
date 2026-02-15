# Servicio Técnico - PRD (Product Requirements Document)

## Problema Original
Sistema web "Servicio Técnico" para la gestión de mantenimiento y visitas en terreno.

## Stack Técnico Implementado
- **Frontend**: Vue 3 (Composition API con `<script setup>`)
- **Build Tool**: Vite
- **State Management**: Pinia + pinia-plugin-persistedstate
- **Routing**: Vue Router 4
- **Styling**: Tailwind CSS 3.4 (color primario: #f35027)
- **Calendar**: FullCalendar (drag & drop funcional)
- **Drag & Drop**: vuedraggable
- **Icons**: lucide-vue-next
- **Charts**: Apache ECharts + vue-echarts
- **Signatures**: signature_pad (Canvas API)
- **PDF**: html2pdf.js

## Arquitectura Implementada
```
src/
├── router/
│   ├── index.js          # Router principal con guards
│   ├── routes.base.js    # Rutas base (login)
│   └── routes.modules.js # Rutas de módulos
├── stores/
│   ├── auth.js           # Autenticación mock (Keycloak simulado)
│   ├── citas.js          # Gestión de citas
│   └── visitas.js        # Gestión de visitas técnicas
├── components/
│   ├── layout/           # MainLayout, Sidebar, Navbar
│   └── ui/               # Button, Input, Card, Modal, Badge, NavTabs
└── modules/
    ├── auth/pages/       # LoginPage
    ├── dashboard/pages/  # DashboardPage
    ├── citas/
    │   ├── pages/        # CitasPage, CalendarioPage
    │   └── components/   # CitaModal
    └── visitas/pages/    # RegistroVisitaPage, HistorialPage
```

## User Personas / Roles
1. **Administrador** (`admin@servicio.com` / `admin123`)
   - Acceso total al sistema
   - Dashboard, Citas, Calendario, Nueva Visita, Historial

2. **Técnico** (`tecnico@servicio.com` / `tecnico123`)
   - Dashboard, Citas, Calendario, Nueva Visita
   - Sin acceso a Historial

3. **Supervisor** (`supervisor@servicio.com` / `super123`)
   - Dashboard, Citas, Calendario, Historial
   - Sin acceso a Nueva Visita

## Funcionalidades Implementadas

### ✅ Dashboard
- 4 KPI Cards (grid tipo bento)
- Gráfico Doughnut (estado de citas)
- Gráfico Line (tendencia semanal)
- Filtros por período (7D, 30D, 90D)
- Lista de próximas citas con badges de estado

### ✅ Gestión de Citas
- Vista Tabla con filtros (fecha, técnico, tipo, estado)
- Búsqueda por ID, asunto, cliente
- Acciones: Editar, Eliminar
- Modal para crear/editar citas

### ✅ Calendario (FullCalendar)
- Vistas: Mes, Semana, Día
- Drag & Drop de eventos existentes
- Panel lateral con Tareas Pendientes
- Click en día vacío → Modal Nueva Cita
- Click en evento → Modal con datos cargados

### ✅ Registro de Visita Técnica
- Sección Datos de Orden (ID automático)
- Sección Información Cliente
- Sección Diagnóstico (hora entrada/salida)
- Inventario dinámico (agregar/eliminar filas)
- Cálculo automático de totales (Subtotal, IVA 19%, Total)
- Firma cliente y técnico (canvas)
- Impresión en consola de formularios

### ✅ Historial de Visitas
- Tabla con filtros
- Vista previa de reporte
- Descarga PDF con html2pdf.js

### ✅ Layout Responsive
- Sidebar colapsable (desktop)
- Drawer mobile
- Navbar con menú de usuario

## Testing Results (Iteration 1)
- **Frontend**: 95% tests passed
- Issues menores corregidos:
  - PDF preview modal mejorado
  - User menu con animaciones y click-outside handler

## Data (Mock/Dummy)
- Todos los datos están simulados usando Pinia stores
- Formularios imprimen en consola
- Sin backend real

## Fecha de Implementación
2026-02-15

## Próximos Pasos (Backlog)
### P0 (Crítico)
- Ninguno - MVP funcional completado

### P1 (Alta Prioridad)
- Integración con backend real (FastAPI + MongoDB)
- Autenticación real con Keycloak
- Notificaciones push para citas

### P2 (Media Prioridad)
- Drag & Drop de tareas pendientes al calendario
- Exportar historial a Excel
- Dashboard con filtros por técnico
- Módulo de reportes avanzados

### P3 (Baja Prioridad)
- Dark mode
- PWA para uso offline
- Geolocalización de técnicos
- Integración con calendario Google
