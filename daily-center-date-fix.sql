ALTER TABLE "DailyCenterProduction"
ALTER COLUMN "entryDate"
TYPE DATE
USING "entryDate"::date;
