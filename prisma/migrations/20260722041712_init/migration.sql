-- CreateTable
CREATE TABLE "Collector" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "groupType" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectorId" INTEGER NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "liters" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyEntry_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HiveSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "centerName" TEXT NOT NULL DEFAULT 'Riviera Beach 115',
    "monthlyGoal" REAL NOT NULL DEFAULT 3500,
    "weeksInPeriod" REAL NOT NULL DEFAULT 4.33,
    "currentMonth" INTEGER NOT NULL,
    "currentYear" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Collector_active_idx" ON "Collector"("active");

-- CreateIndex
CREATE INDEX "Collector_position_idx" ON "Collector"("position");

-- CreateIndex
CREATE INDEX "DailyEntry_entryDate_idx" ON "DailyEntry"("entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEntry_collectorId_entryDate_key" ON "DailyEntry"("collectorId", "entryDate");
