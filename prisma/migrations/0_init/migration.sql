-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MetricSource" AS ENUM ('CSL', 'HIVE', 'MANUAL');

-- CreateTable
CREATE TABLE "Collector" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "groupType" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bio" TEXT,
    "funFact" TEXT,
    "isEmployeeOfMonth" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "preferredName" TEXT,
    "profileTitle" TEXT,
    "recognitionMessage" TEXT,
    "showOnMeetTheBees" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Collector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerStickEntry" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "totalSticks" INTEGER NOT NULL DEFAULT 0,
    "successfulSticks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerStickEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityEmfEntry" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "emfCount" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityEmfEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadForagerReign" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "collectorId" INTEGER,
    "benchmarkSuccessfulSticks" INTEGER NOT NULL DEFAULT 0,
    "crownedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadForagerReign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyLeadForager" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "successfulSticks" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyLeadForager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCenterProduction" (
    "id" SERIAL NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "donors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCenterProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyOperationalEntry" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "operationalHour" INTEGER NOT NULL,
    "successfulSticks" INTEGER NOT NULL DEFAULT 0,
    "unsuccessfulSticks" INTEGER NOT NULL DEFAULT 0,
    "lostVolumeMl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourlyOperationalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiveSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "centerName" TEXT NOT NULL DEFAULT 'Riviera Beach 115',
    "monthlyGoal" DOUBLE PRECISION NOT NULL DEFAULT 3500,
    "weeksInPeriod" DOUBLE PRECISION NOT NULL DEFAULT 4.33,
    "currentMonth" INTEGER NOT NULL,
    "currentYear" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dashboardRotationSeconds" INTEGER NOT NULL DEFAULT 45,
    "closingHour" INTEGER NOT NULL DEFAULT 19,
    "openingHour" INTEGER NOT NULL DEFAULT 6,
    "centerOperatingDaysPerWeek" INTEGER NOT NULL DEFAULT 7,
    "workerDaysPerWeek" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "HiveSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyBudget" (
    "id" SERIAL NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "budgetLiters" DOUBLE PRECISION NOT NULL,
    "originalBudgetLiters" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "budgetDonors" INTEGER NOT NULL DEFAULT 0,
    "originalBudgetDonors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MonthlyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardMetric" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "publicSource" "MetricSource" NOT NULL DEFAULT 'CSL',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricReading" (
    "id" SERIAL NOT NULL,
    "metricId" INTEGER NOT NULL,
    "source" "MetricSource" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Collector_active_idx" ON "Collector"("active");

-- CreateIndex
CREATE INDEX "Collector_position_idx" ON "Collector"("position");

-- CreateIndex
CREATE INDEX "Collector_showOnMeetTheBees_idx" ON "Collector"("showOnMeetTheBees");

-- CreateIndex
CREATE INDEX "Collector_isEmployeeOfMonth_idx" ON "Collector"("isEmployeeOfMonth");

-- CreateIndex
CREATE INDEX "WorkerStickEntry_entryDate_idx" ON "WorkerStickEntry"("entryDate");

-- CreateIndex
CREATE INDEX "WorkerStickEntry_collectorId_idx" ON "WorkerStickEntry"("collectorId");

-- CreateIndex
CREATE INDEX "WorkerStickEntry_collectorId_entryDate_idx" ON "WorkerStickEntry"("collectorId", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerStickEntry_collectorId_entryDate_key" ON "WorkerStickEntry"("collectorId", "entryDate");

-- CreateIndex
CREATE INDEX "QualityEmfEntry_collectorId_idx" ON "QualityEmfEntry"("collectorId");

-- CreateIndex
CREATE INDEX "QualityEmfEntry_entryDate_idx" ON "QualityEmfEntry"("entryDate");

-- CreateIndex
CREATE INDEX "QualityEmfEntry_collectorId_entryDate_idx" ON "QualityEmfEntry"("collectorId", "entryDate");

-- CreateIndex
CREATE INDEX "LeadForagerReign_collectorId_idx" ON "LeadForagerReign"("collectorId");

-- CreateIndex
CREATE INDEX "MonthlyLeadForager_collectorId_idx" ON "MonthlyLeadForager"("collectorId");

-- CreateIndex
CREATE INDEX "MonthlyLeadForager_year_month_idx" ON "MonthlyLeadForager"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyLeadForager_year_month_key" ON "MonthlyLeadForager"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCenterProduction_entryDate_key" ON "DailyCenterProduction"("entryDate");

-- CreateIndex
CREATE INDEX "DailyCenterProduction_entryDate_idx" ON "DailyCenterProduction"("entryDate");

-- CreateIndex
CREATE INDEX "HourlyOperationalEntry_entryDate_idx" ON "HourlyOperationalEntry"("entryDate");

-- CreateIndex
CREATE INDEX "HourlyOperationalEntry_entryDate_operationalHour_idx" ON "HourlyOperationalEntry"("entryDate", "operationalHour");

-- CreateIndex
CREATE INDEX "HourlyOperationalEntry_collectorId_idx" ON "HourlyOperationalEntry"("collectorId");

-- CreateIndex
CREATE UNIQUE INDEX "HourlyOperationalEntry_collectorId_entryDate_operationalHou_key" ON "HourlyOperationalEntry"("collectorId", "entryDate", "operationalHour");

-- CreateIndex
CREATE INDEX "MonthlyBudget_fiscalYear_idx" ON "MonthlyBudget"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBudget_fiscalYear_month_key" ON "MonthlyBudget"("fiscalYear", "month");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardMetric_key_key" ON "DashboardMetric"("key");

-- CreateIndex
CREATE INDEX "DashboardMetric_isVisible_displayOrder_idx" ON "DashboardMetric"("isVisible", "displayOrder");

-- CreateIndex
CREATE INDEX "MetricReading_metricId_source_recordedAt_idx" ON "MetricReading"("metricId", "source", "recordedAt");

-- CreateIndex
CREATE INDEX "MetricReading_recordedAt_idx" ON "MetricReading"("recordedAt");

-- AddForeignKey
ALTER TABLE "WorkerStickEntry" ADD CONSTRAINT "WorkerStickEntry_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityEmfEntry" ADD CONSTRAINT "QualityEmfEntry_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadForagerReign" ADD CONSTRAINT "LeadForagerReign_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyLeadForager" ADD CONSTRAINT "MonthlyLeadForager_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourlyOperationalEntry" ADD CONSTRAINT "HourlyOperationalEntry_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricReading" ADD CONSTRAINT "MetricReading_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "DashboardMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

