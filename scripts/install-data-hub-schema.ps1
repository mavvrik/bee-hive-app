$ErrorActionPreference = "Stop"

$schemaPath = Join-Path (Get-Location) "prisma\schema.prisma"

if (-not (Test-Path $schemaPath)) {
    throw "Run this script from the HIVE project root. prisma\schema.prisma was not found."
}

$schema = [System.IO.File]::ReadAllText($schemaPath)

if ($schema -match 'model\s+IntelligenceDataSource\s*\{') {
    throw "IntelligenceDataSource already exists. No changes were made."
}

$enumMarker = "// ======================================================`r`n// ENUMS`r`n// ======================================================"
if (-not $schema.Contains($enumMarker)) {
    $enumMarker = "// ======================================================`n// ENUMS`n// ======================================================"
}

if (-not $schema.Contains($enumMarker)) {
    throw "Could not find the HIVE ENUMS marker. No changes were made."
}

$backupPath = "$schemaPath.before-data-hub.bak"
Copy-Item $schemaPath $backupPath -Force

$modelBlock = @'
// ======================================================
// INTELLIGENCE DATA HUB
// ======================================================

model IntelligenceDataSource {
  id Int @id @default(autoincrement())

  key         String @unique
  name        String
  description String?

  category    IntelligenceDataCategory
  granularity String
  fileFormat  String @default("XLSX")

  intelligenceEligible Boolean @default(true)
  active               Boolean @default(true)
  sourceDefinition     Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  imports IntelligenceDataImport[]

  @@index([category])
  @@index([active])
  @@index([intelligenceEligible])
}

model IntelligenceDataImport {
  id Int @id @default(autoincrement())

  dataSourceId Int

  fileName String
  fileUrl  String?
  fileHash String?

  periodStart  DateTime? @db.Date
  periodEnd    DateTime? @db.Date
  centerNumber String?

  status IntelligenceImportStatus @default(PENDING)

  sourceRowCount   Int @default(0)
  importedRowCount Int @default(0)
  rejectedRowCount Int @default(0)
  warningCount     Int @default(0)
  warnings         Json?

  importedAt DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  dataSource          IntelligenceDataSource      @relation(fields: [dataSourceId], references: [id], onDelete: Cascade)
  coverage            IntelligenceDataCoverage[]
  operationalPatterns OperationalPatternEntry[]

  @@index([dataSourceId])
  @@index([status])
  @@index([periodStart, periodEnd])
  @@index([centerNumber])
  @@index([fileHash])
}

model IntelligenceDataCoverage {
  id Int @id @default(autoincrement())

  dataImportId Int

  coverageStart DateTime @db.Date
  coverageEnd   DateTime @db.Date
  centerNumber  String?
  granularity   String

  createdAt DateTime @default(now())

  dataImport IntelligenceDataImport @relation(fields: [dataImportId], references: [id], onDelete: Cascade)

  @@unique([dataImportId, coverageStart, coverageEnd])
  @@index([coverageStart, coverageEnd])
  @@index([centerNumber])
  @@index([dataImportId])
}

model OperationalPatternEntry {
  id Int @id @default(autoincrement())

  dataImportId Int
  centerNumber String?

  dayOfWeek     Int
  time          String
  minuteOfDay   Int
  intervalMinutes Int @default(30)

  visits Int @default(0)
  units  Int @default(0)

  createdAt DateTime @default(now())

  dataImport IntelligenceDataImport @relation(fields: [dataImportId], references: [id], onDelete: Cascade)

  @@unique([dataImportId, dayOfWeek, minuteOfDay])
  @@index([dayOfWeek, minuteOfDay])
  @@index([centerNumber, dayOfWeek, minuteOfDay])
  @@index([dataImportId])
}

'@

$schema = $schema.Replace($enumMarker, $modelBlock + $enumMarker)

$enumBlock = @'

enum IntelligenceDataCategory {
  DONOR_DEMAND
  PRODUCTION
  WORKFORCE
  QUALITY
  OPERATIONS
  SCHEDULE
  OTHER
}

enum IntelligenceImportStatus {
  PENDING
  PROCESSING
  SUCCESS
  PARTIAL
  FAILED
}
'@

$schema = $schema.TrimEnd() + "`r`n" + $enumBlock.TrimStart() + "`r`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($schemaPath, $schema, $utf8NoBom)

Write-Host "Data Hub schema models added." -ForegroundColor Green
Write-Host "Backup created: $backupPath" -ForegroundColor Yellow
Write-Host "NEXT: npx.cmd prisma validate" -ForegroundColor Cyan
Write-Host "Only after validation succeeds: npx.cmd prisma db push" -ForegroundColor Cyan
Write-Host "Then: npx.cmd prisma generate" -ForegroundColor Cyan
