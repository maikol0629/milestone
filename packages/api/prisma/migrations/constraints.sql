-- Restricciones adicionales que Prisma schema no soporta directamente.
-- Ejecutar después de `prisma migrate deploy`.

-- 1. Partial unique indexes para entidades con soft delete
--    Evitan duplicados activos (deleted_at IS NULL) por usuario/recurso

CREATE UNIQUE INDEX IF NOT EXISTS "idx_life_area_user_name_active"
  ON "LifeArea" ("user_id", "name")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_goal_user_title_active"
  ON "Goal" ("user_id", "title")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_project_user_name_active"
  ON "Project" ("user_id", "name")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_activity_project_title_active"
  ON "Activity" ("project_id", "title")
  WHERE "deleted_at" IS NULL;

-- 2. CHECK constraints a nivel de base de datos

-- Los eventos deben terminar después de empezar
ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "ck_event_end_after_start";
ALTER TABLE "Event" ADD CONSTRAINT "ck_event_end_after_start"
  CHECK ("end_at" > "start_at");

-- Las sesiones de tiempo deben terminar después de empezar (si tienen end_at)
ALTER TABLE "TimeSession" DROP CONSTRAINT IF EXISTS "ck_time_session_end_after_start";
ALTER TABLE "TimeSession" ADD CONSTRAINT "ck_time_session_end_after_start"
  CHECK ("end_at" IS NULL OR "end_at" > "start_at");
