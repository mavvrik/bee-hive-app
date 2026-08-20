-- CreateEnum
CREATE TYPE "WorkforceRole" AS ENUM ('MANAGEMENT', 'PHLEBOTOMIST', 'GROUP_LEAD', 'PROCESSOR', 'RECEPTION_TECH', 'MSA', 'DST', 'OTHER');

-- CreateEnum
CREATE TYPE "PerformanceMetricType" AS ENUM ('STICKS', 'DISCONNECTS', 'SETUPS', 'PHYSICALS', 'INTERVIEWS', 'PROCESSED', 'OTHER');

-- CreateEnum
CREATE TYPE "AttendanceEventType" AS ENUM ('LATE', 'ABSENT', 'LATE_FROM_LUNCH', 'LEFT_EARLY');

-- CreateTable
CREATE TABLE "WorkerRoleAssignment" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "role" "WorkforceRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerPerformanceEntry" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "role" "WorkforceRole" NOT NULL,
    "metric" "PerformanceMetricType" NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successfulCount" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerPerformanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePerformanceTarget" (
    "id" SERIAL NOT NULL,
    "role" "WorkforceRole" NOT NULL,
    "metric" "PerformanceMetricType" NOT NULL,
    "targetPerDay" DOUBLE PRECISION NOT NULL,
    "accuracyApplicable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePerformanceTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceEntry" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "eventType" "AttendanceEventType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyRecognitionScore" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyRecognitionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeOfMonthSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "productivityWeight" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "accuracyWeight" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "qualityWeight" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "attendanceWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "recognitionWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "emfPenaltyPoints" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "emfDisqualifyThreshold" INTEGER,
    "latePenalty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "absentPenalty" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "lateFromLunchPenalty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "leftEarlyPenalty" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeOfMonthSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeOfMonthScore" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "productivityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "attendanceScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "recognitionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eligible" BOOLEAN NOT NULL DEFAULT true,
    "ineligibleReason" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeOfMonthScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerRoleAssignment_collectorId_idx" ON "WorkerRoleAssignment"("collectorId");

-- CreateIndex
CREATE INDEX "WorkerRoleAssignment_role_idx" ON "WorkerRoleAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerRoleAssignment_collectorId_role_key" ON "WorkerRoleAssignment"("collectorId", "role");

-- CreateIndex
CREATE INDEX "WorkerPerformanceEntry_collectorId_idx" ON "WorkerPerformanceEntry"("collectorId");

-- CreateIndex
CREATE INDEX "WorkerPerformanceEntry_entryDate_idx" ON "WorkerPerformanceEntry"("entryDate");

-- CreateIndex
CREATE INDEX "WorkerPerformanceEntry_role_metric_idx" ON "WorkerPerformanceEntry"("role", "metric");

-- CreateIndex
CREATE INDEX "WorkerPerformanceEntry_collectorId_entryDate_idx" ON "WorkerPerformanceEntry"("collectorId", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerPerformanceEntry_collectorId_entryDate_role_metric_key" ON "WorkerPerformanceEntry"("collectorId", "entryDate", "role", "metric");

-- CreateIndex
CREATE INDEX "RolePerformanceTarget_role_idx" ON "RolePerformanceTarget"("role");

-- CreateIndex
CREATE INDEX "RolePerformanceTarget_active_idx" ON "RolePerformanceTarget"("active");

-- CreateIndex
CREATE UNIQUE INDEX "RolePerformanceTarget_role_metric_key" ON "RolePerformanceTarget"("role", "metric");

-- CreateIndex
CREATE INDEX "AttendanceEntry_collectorId_idx" ON "AttendanceEntry"("collectorId");

-- CreateIndex
CREATE INDEX "AttendanceEntry_entryDate_idx" ON "AttendanceEntry"("entryDate");

-- CreateIndex
CREATE INDEX "AttendanceEntry_eventType_idx" ON "AttendanceEntry"("eventType");

-- CreateIndex
CREATE INDEX "AttendanceEntry_collectorId_entryDate_idx" ON "AttendanceEntry"("collectorId", "entryDate");

-- CreateIndex
CREATE INDEX "MonthlyRecognitionScore_year_month_idx" ON "MonthlyRecognitionScore"("year", "month");

-- CreateIndex
CREATE INDEX "MonthlyRecognitionScore_collectorId_idx" ON "MonthlyRecognitionScore"("collectorId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRecognitionScore_collectorId_year_month_key" ON "MonthlyRecognitionScore"("collectorId", "year", "month");

-- CreateIndex
CREATE INDEX "EmployeeOfMonthScore_year_month_idx" ON "EmployeeOfMonthScore"("year", "month");

-- CreateIndex
CREATE INDEX "EmployeeOfMonthScore_collectorId_idx" ON "EmployeeOfMonthScore"("collectorId");

-- CreateIndex
CREATE INDEX "EmployeeOfMonthScore_year_month_weightedScore_idx" ON "EmployeeOfMonthScore"("year", "month", "weightedScore");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeOfMonthScore_collectorId_year_month_key" ON "EmployeeOfMonthScore"("collectorId", "year", "month");

-- AddForeignKey
ALTER TABLE "WorkerRoleAssignment" ADD CONSTRAINT "WorkerRoleAssignment_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPerformanceEntry" ADD CONSTRAINT "WorkerPerformanceEntry_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEntry" ADD CONSTRAINT "AttendanceEntry_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyRecognitionScore" ADD CONSTRAINT "MonthlyRecognitionScore_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOfMonthScore" ADD CONSTRAINT "EmployeeOfMonthScore_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

