$ErrorActionPreference = "Stop"

$schemaPath = Join-Path (Get-Location) "prisma\schema.prisma"

if (-not (Test-Path $schemaPath)) {
    throw "Could not find prisma\schema.prisma. Run this script from the HIVE project root."
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$schema = [System.IO.File]::ReadAllText($schemaPath)

if ($schema.Contains("model TimeOffImport")) {
    Write-Host "Time Off S2 schema already exists. No schema text was changed."
    exit 0
}

$backup = "$schemaPath.timeoff-s2-backup"
[System.IO.File]::WriteAllText($backup, $schema, $utf8NoBom)

$addition = @'

model TimeOffImport {
  id                  Int       @id @default(autoincrement())
  fileName            String
  fileHash            String    @unique
  reportPeriodStart   DateTime? @db.Date
  reportPeriodEnd     DateTime? @db.Date
  actualCoverageStart DateTime? @db.Date
  actualCoverageEnd   DateTime? @db.Date
  sourceRowCount      Int       @default(0)
  importedRowCount    Int       @default(0)
  warningCount        Int       @default(0)
  warnings            Json?
  executedAtText      String?
  printedFor          String?
  status              String    @default("PENDING")
  importedAt          DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  requests TimeOffRequest[]

  @@index([reportPeriodStart, reportPeriodEnd])
  @@index([actualCoverageStart, actualCoverageEnd])
  @@index([status])
}

model TimeOffRequest {
  id                    Int      @id @default(autoincrement())
  timeOffImportId       Int
  collectorId           Int
  employeeExternalId    String?
  sourceEmployeeName    String
  collectorNameSnapshot String
  matchMethod           String
  subtype               String?
  duration              Float?
  startDate             DateTime @db.Date
  endDate               DateTime @db.Date
  comments              String?
  createdAt             DateTime @default(now())

  timeOffImport TimeOffImport @relation(
    fields: [timeOffImportId],
    references: [id],
    onDelete: Cascade
  )

  @@index([collectorId])
  @@index([startDate, endDate])
  @@index([collectorId, startDate, endDate])
  @@index([employeeExternalId])
  @@index([timeOffImportId])
}

'@

[System.IO.File]::WriteAllText(
    $schemaPath,
    $schema.TrimEnd() + "`r`n`r`n" + $addition.Trim() + "`r`n",
    $utf8NoBom
)

Write-Host "Time Off S2 schema added."
Write-Host "Backup: $backup"
Write-Host ""
Write-Host "Next:"
Write-Host "  npx.cmd prisma validate"
Write-Host "  npx.cmd prisma db push"
Write-Host "  npx.cmd prisma generate"
