# Eventos Recurrentes y Hitos

Esta guía describe cómo crear y manejar eventos recurrentes y hitos en el sistema.

## Conceptos

### Tipos de Eventos

El sistema soporta tres tipos principales:

1. **Eventos regulares** (`event`): Eventos de calendario normales
2. **Recordatorios** (`reminder`): Notificaciones
3. **Bloques de trabajo** (`work_block`): Sesiones de trabajo enfocado

### Tipos de Recurrencia

#### 1. Eventos Diarios

Repiten cada N días a la misma hora.

```json
{
  "title": "Ejercicio matutino",
  "start_at": "2026-07-14T06:00:00Z",
  "end_at": "2026-07-14T06:30:00Z",
  "type": "work_block",
  "recurrence_rule": "daily",
  "recurrence_interval": 1,
  "recurrence_end_date": "2026-12-31T23:59:59Z"
}
```

#### 2. Eventos Semanales

Repiten cada N semanas en días específicos.

```json
{
  "title": "Reunión de equipo",
  "start_at": "2026-07-14T10:00:00Z",
  "end_at": "2026-07-14T11:00:00Z",
  "type": "event",
  "recurrence_rule": "weekly",
  "recurrence_interval": 1,
  "recurrence_days_of_week": "1,3,5",
  "recurrence_end_date": "2026-12-31T23:59:59Z"
}
```

**Mapeo de días:**

- `0` = Domingo
- `1` = Lunes
- `2` = Martes
- `3` = Miércoles
- `4` = Jueves
- `5` = Viernes
- `6` = Sábado

### 3. Hitos (Milestones)

Eventos que ocurren una sola vez en una fecha específica.

```json
{
  "title": "Lanzamiento del producto",
  "start_at": "2026-09-01T00:00:00Z",
  "end_at": "2026-09-01T23:59:59Z",
  "type": "event",
  "is_milestone": true,
  "milestone_date": "2026-09-01T00:00:00Z"
}
```

## Ejemplos de Uso

### Crear Evento Diario

```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meditación",
    "description": "10 minutos de meditación",
    "start_at": "2026-07-14T07:00:00Z",
    "end_at": "2026-07-14T07:10:00Z",
    "type": "work_block",
    "recurrence_rule": "daily",
    "recurrence_interval": 1,
    "recurrence_end_date": "2026-12-31T23:59:59Z"
  }'
```

### Crear Evento Semanal

```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Planificación semanal",
    "start_at": "2026-07-14T09:00:00Z",
    "end_at": "2026-07-14T10:00:00Z",
    "type": "event",
    "recurrence_rule": "weekly",
    "recurrence_interval": 1,
    "recurrence_days_of_week": "1",
    "recurrence_end_date": "2026-12-31T23:59:59Z"
  }'
```

### Crear Hito

```bash
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Entrega de proyecto",
    "start_at": "2026-08-30T00:00:00Z",
    "end_at": "2026-08-30T23:59:59Z",
    "type": "event",
    "is_milestone": true,
    "milestone_date": "2026-08-30T00:00:00Z"
  }'
```

### Obtener Eventos Expandidos por Recurrencia

```bash
curl -X GET "http://localhost:3000/events/expanded?start=2026-07-01T00:00:00Z&end=2026-07-31T23:59:59Z" \
  -H "Authorization: Bearer {token}"
```

Respuesta:

```json
{
  "items": [
    {
      "id": "event-1",
      "title": "Meditación",
      "start_at": "2026-07-14T07:00:00Z",
      "end_at": "2026-07-14T07:10:00Z",
      "recurrence_rule": "daily",
      "occurrence_date": "2026-07-14T07:00:00Z",
      "is_recurring_instance": true
    },
    {
      "id": "event-1",
      "title": "Meditación",
      "start_at": "2026-07-15T07:00:00Z",
      "end_at": "2026-07-15T07:10:00Z",
      "recurrence_rule": "daily",
      "occurrence_date": "2026-07-15T07:00:00Z",
      "is_recurring_instance": true
    }
    // ... más ocurrencias
  ],
  "meta": { "total": 48 }
}
```

### Obtener Próximas Ocurrencias

```bash
curl -X GET "http://localhost:3000/events/{eventId}/occurrences?count=10" \
  -H "Authorization: Bearer {token}"
```

## Actualizar Eventos Recurrentes

Para actualizar un evento recurrente, puedes cambiar cualquiera de sus propiedades:

```bash
curl -X PATCH http://localhost:3000/events/{eventId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "recurrence_interval": 2,
    "recurrence_end_date": "2027-12-31T23:59:59Z"
  }'
```

**Nota:** Actualmente, las actualizaciones afectan la recurrencia futura, no los eventos ya pasados.

## Validación

El sistema valida:

1. **Recurrencia válida**:
   - `recurrence_interval` debe ser > 0
   - Para semanal: `recurrence_days_of_week` debe contener días válidos (0-6)

2. **Hitos válidos**:
   - Si `is_milestone` es true, `milestone_date` es requerido

3. **Fechas válidas**:
   - `start_at` debe ser < `end_at`
   - `start_at` debe ser < `recurrence_end_date` (si aplica)

## Consideraciones de Rendimiento

- Los eventos se almacenan como registros únicos en la BD con campos de recurrencia
- La expansión ocurre en el cliente o en una petición separada (`/events/expanded`)
- No se crean instancias individuales en la BD para ahorrar espacio
- Los índices en `recurrence_rule` facilitan búsquedas de eventos recurrentes
