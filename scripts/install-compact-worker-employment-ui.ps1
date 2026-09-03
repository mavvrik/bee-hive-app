$ErrorActionPreference = "Stop"

$projectRoot = Get-Location
$pagePath = Join-Path $projectRoot "app\settings\workers\page.tsx"

if (-not (Test-Path $pagePath)) {
    throw "Could not find app\settings\workers\page.tsx. Run this script from C:\Users\mycha\Bee-Hive-app."
}

$backupPath = "$pagePath.before-compact-employment-ui.bak"
Copy-Item $pagePath $backupPath -Force

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText($pagePath)

# -------------------------------------------------------
# 1. Import CompactEmploymentProfile
# -------------------------------------------------------

if (-not $content.Contains('import CompactEmploymentProfile from "./CompactEmploymentProfile";')) {
    $anchor = 'import WorkerPhotoUpload from "./WorkerPhotoUpload";'

    if (-not $content.Contains($anchor)) {
        throw "Could not find WorkerPhotoUpload import anchor. No changes applied."
    }

    $content = $content.Replace(
        $anchor,
        $anchor + "`r`n" + 'import CompactEmploymentProfile from "./CompactEmploymentProfile";'
    )
}

# -------------------------------------------------------
# 2. Add employmentProfile to Collector query
# -------------------------------------------------------

if (-not $content.Contains("employmentProfile: true,")) {
    $anchor = @'
      include: {
        roleAssignments: true,
      },
'@

    if (-not $content.Contains($anchor)) {
        # Try LF shape.
        $anchorLf = "      include: {`n        roleAssignments: true,`n      },"

        if (-not $content.Contains($anchorLf)) {
            throw "Could not find Collector include block. Backup created; no file write performed."
        }

        $replacementLf = "      include: {`n        roleAssignments: true,`n        employmentProfile: true,`n      },"
        $content = $content.Replace($anchorLf, $replacementLf)
    }
    else {
        $replacement = @'
      include: {
        roleAssignments: true,
        employmentProfile: true,
      },
'@
        $content = $content.Replace($anchor, $replacement)
    }
}

# -------------------------------------------------------
# 3. Insert compact profile after Eligible Roles section
#    and immediately before Meet the Bees Profile.
# -------------------------------------------------------

if (-not $content.Contains("<CompactEmploymentProfile")) {
    $meetAnchor = @'
                      <div className="profile-section-label profile-gap">
                        Meet the Bees Profile
                      </div>
'@

    if (-not $content.Contains($meetAnchor)) {
        $meetAnchorLf = "                      <div className=`"profile-section-label profile-gap`">`n                        Meet the Bees Profile`n                      </div>"

        if (-not $content.Contains($meetAnchorLf)) {
            throw "Could not find Meet the Bees Profile anchor. Backup created; no file write performed."
        }

        $insertLf = @'
                      <CompactEmploymentProfile
                        collectorId={collector.id}
                        workerName={
                          collector.preferredName ||
                          collector.name
                        }
                        profile={
                          collector.employmentProfile
                            ? {
                                employmentType:
                                  collector.employmentProfile
                                    .employmentType,
                                schedulePattern:
                                  collector.employmentProfile
                                    .schedulePattern,
                                minPaidWeeklyHours:
                                  collector.employmentProfile
                                    .minPaidWeeklyHours,
                                maxPaidWeeklyHours:
                                  collector.employmentProfile
                                    .maxPaidWeeklyHours,
                                targetPaidWeeklyHours:
                                  collector.employmentProfile
                                    .targetPaidWeeklyHours,
                                scheduledShiftHours:
                                  collector.employmentProfile
                                    .scheduledShiftHours,
                                unpaidLunchMinutes:
                                  collector.employmentProfile
                                    .unpaidLunchMinutes,
                              }
                            : null
                        }
                      />

'@
        $content = $content.Replace($meetAnchorLf, $insertLf + $meetAnchorLf)
    }
    else {
        $insert = @'
                      <CompactEmploymentProfile
                        collectorId={collector.id}
                        workerName={
                          collector.preferredName ||
                          collector.name
                        }
                        profile={
                          collector.employmentProfile
                            ? {
                                employmentType:
                                  collector.employmentProfile
                                    .employmentType,
                                schedulePattern:
                                  collector.employmentProfile
                                    .schedulePattern,
                                minPaidWeeklyHours:
                                  collector.employmentProfile
                                    .minPaidWeeklyHours,
                                maxPaidWeeklyHours:
                                  collector.employmentProfile
                                    .maxPaidWeeklyHours,
                                targetPaidWeeklyHours:
                                  collector.employmentProfile
                                    .targetPaidWeeklyHours,
                                scheduledShiftHours:
                                  collector.employmentProfile
                                    .scheduledShiftHours,
                                unpaidLunchMinutes:
                                  collector.employmentProfile
                                    .unpaidLunchMinutes,
                              }
                            : null
                        }
                      />

'@
        $content = $content.Replace($meetAnchor, $insert + $meetAnchor)
    }
}

[System.IO.File]::WriteAllText(
    $pagePath,
    $content,
    $utf8NoBom
)

Write-Host "Compact Employment & Scheduling UI installed."
Write-Host "Backup created:"
Write-Host "  $backupPath"
Write-Host ""
Write-Host "Next:"
Write-Host "  npx.cmd prisma generate"
Write-Host "  npm.cmd run build"
