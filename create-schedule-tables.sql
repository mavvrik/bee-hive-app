CREATE TABLE "ScheduleImport" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduledShift" (
    "id" SERIAL NOT NULL,
    "scheduleImportId" INTEGER NOT NULL,
    "collectorId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "primaryJob" TEXT,
    "shiftDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledShift_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduleImport_periodStart_idx"
ON "ScheduleImport"("periodStart");

CREATE INDEX "ScheduleImport_periodEnd_idx"
ON "ScheduleImport"("periodEnd");

CREATE INDEX "ScheduledShift_shiftDate_idx"
ON "ScheduledShift"("shiftDate");

CREATE INDEX "ScheduledShift_collectorId_idx"
ON "ScheduledShift"("collectorId");

CREATE INDEX "ScheduledShift_scheduleImportId_idx"
ON "ScheduledShift"("scheduleImportId");

CREATE UNIQUE INDEX "ScheduledShift_scheduleImportId_employeeName_shiftDate_startTime_endTime_key"
ON "ScheduledShift"(
  "scheduleImportId",
  "employeeName",
  "shiftDate",
  "startTime",
  "endTime"
);

ALTER TABLE "ScheduledShift"
ADD CONSTRAINT "ScheduledShift_scheduleImportId_fkey"
FOREIGN KEY ("scheduleImportId")
REFERENCES "ScheduleImport"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ScheduledShift"
ADD CONSTRAINT "ScheduledShift_collectorId_fkey"
FOREIGN KEY ("collectorId")
REFERENCES "Collector"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
