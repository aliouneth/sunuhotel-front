$ErrorActionPreference = "Stop"
$root = "C:\Users\aliou\SunuHotelOpenCode\frontend"
$ui = Join-Path $root "src\components\ui.tsx"

# 1) Append a PageHeader component to the real ui barrel (CardHeader-style contract: title/subtitle/action)
$u = [System.IO.File]::ReadAllText($ui)
if ($u -notmatch "\bPageHeader\b") {
  $added = @"

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
"@
  [System.IO.File]::WriteAllText($ui, $u.TrimEnd() + "`r`n" + $added)
}

# 2) Strip every broken single-file @/components/* import (keeps ui/PlatformShell) and insert the ui barrel line
$barrel = 'import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, Select, Spinner, Table, PageHeader } from "@/components/ui";'
$pat = '(?m)^import \{ [^}]* \} from "@/components/(?!ui|PlatformShell)[^"\r\n]+";\r?\n'

foreach ($name in @("plans", "subscriptions")) {
  $f = Join-Path $root ("src\app\platform\" + $name + "\page.tsx")
  if (-not (Test-Path -LiteralPath $f)) { Write-Output ("MISS " + $name); continue }
  $s = [System.IO.File]::ReadAllText($f)
  $stripped = [regex]::Replace($s, $pat, "")
  $needle = 'import { usePlatform } from "@/components/PlatformShell";'
  if ($stripped.Contains($needle)) {
    $out = $stripped.Replace($needle, $barrel + "`r`n" + $needle)
    [System.IO.File]::WriteAllText($f, $out)
    Write-Output ("PATCHED " + $name)
  } else {
    Write-Output ("ANCHOR-MISS " + $name + " (needle not found)")
  }
}
