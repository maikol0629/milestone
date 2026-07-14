-- AlterEnum: migrate old types to new ones, rename enum
ALTER TYPE "EventType" RENAME TO "EventType_old";
CREATE TYPE "EventType" AS ENUM ('event', 'reminder', 'work_block');
ALTER TABLE "Event" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "type" SET DATA TYPE "EventType" USING (
  CASE "type"::text
    WHEN 'meeting' THEN 'event'
    WHEN 'task' THEN 'work_block'
    WHEN 'reminder' THEN 'reminder'
    WHEN 'focus' THEN 'work_block'
    ELSE 'event'
  END
)::text::"EventType";
ALTER TABLE "Event" ALTER COLUMN "type" SET DEFAULT 'event';
DROP TYPE "EventType_old";

-- AlterTable: add recurrence and milestone columns
ALTER TABLE "Event"
  ADD COLUMN "recurrence_rule" TEXT,
  ADD COLUMN "recurrence_interval" INTEGER,
  ADD COLUMN "recurrence_days_of_week" TEXT,
  ADD COLUMN "recurrence_end_date" TIMESTAMP(3),
  ADD COLUMN "is_milestone" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "milestone_date" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Event_recurrence_rule_idx" ON "Event"("recurrence_rule");
