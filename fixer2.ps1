$ErrorActionPreference = "Stop"
$root = "C:\Users\aliou\SunuHotelOpenCode\frontend"

# --- Fix 1: queryString import source -> "@/lib/api" (api.ts:103 GREEN) ---
# --- Fix 2: usePlatform import source -> "@/components/ui" (we append it) ---
foreach ($name in @("plans", "subscriptions")) {
  $f = Join-Path $root ("src\app\platform\" + $name + "\page.tsx")
  $s = [System.IO.File]::ReadAllText($f)
  $s = $s.Replace(
    'import { queryString } from "@/lib/format";',
    'import { queryString } from "@/lib/api";'
  )
  $s = $s.Replace(
    'import { usePlatform } from "@/components/PlatformShell";',
    'import { usePlatform } from "@/components/ui";'
  )
  [System.IO.File]::WriteAllText($f, $s)
  $ck = [System.IO.File]::ReadAllText($f)
  $ok1 = $ck -match 'import \{ queryString \} from "@/lib/api"'
  $ok2 = $ck -match 'import \{ usePlatform \} from "@/components/ui"'
  Write-Output ("{0}: queryString->api={1} usePlatform->ui={2}" -f $name, $ok1, $ok2)
}

# --- Fix 3: append usePlatform export to the ui barrel so both imports resolve ---
$uiFile = Join-Path $root "src\components\ui.tsx"
$u = [System.IO.File]::ReadAllText($uiFile)
if ($u -notmatch "\bexport function usePlatform\b") {
  $sep = "`r`n"
  $lines = @(
    "",
    'import { useQuery } from "@tanstack/react-query";',
    'import { api } from "@/lib/api";',
    'import type { PlatformSummary } from "@/types/dto";',
    "",
    "export function usePlatform() {",
    '  const { data } = useQuery({',
    '    queryKey: ["platform", "summary"],',
    '    queryFn: () => api<PlatformSummary>("/platform/summary"),',
    "  });",
    "  return {",
    "    user: (data ?? {}) as PlatformSummary,",
    '    platformAdminToken: ((data ?? {}) as { platform_admin_token?: string }).platform_admin_token ?? "",',
    "  };",
    "}"
  )
  $block = [string]::Join($sep, $lines)
  [System.IO.File]::WriteAllText($uiFile, $u.TrimEnd() + $sep + $block)
  Write-Output ("ui.tsx usePlatform now present: " + ([System.IO.File]::ReadAllText($uiFile) -match "\bexport function usePlatform\b"))
} else {
  Write-Output "ui.tsx usePlatform already present"
}
