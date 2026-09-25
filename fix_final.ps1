$ErrorActionPreference = "Stop"
$root = "C:\Users\aliou\SunuHotelOpenCode\frontend"
$ui = Join-Path $root "src\components\ui.tsx"

# 1) Append real usePlatform to the ui barrel (same accepted move as PageHeader).
#    typed against the green api + PlatformSummary contract so plans/subscriptions bodies compile.
$u = [System.IO.File]::ReadAllText($ui)
if ($u -notmatch "\bexport function usePlatform\b") {
  $block = @"

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PlatformSummary } from "@/types/dto";

export function usePlatform(): { user: PlatformSummary; platformAdminToken: string } {
  const { data } = useQuery<PlatformSummary>({
    queryKey: ["platform", "summary"],
    queryFn: () => api<PlatformSummary>("/platform/summary"),
    staleTime: 60_000,
  });
  return {
    user: (data ?? {}) as PlatformSummary,
    platformAdminToken: ((data ?? {}) as { platform_admin_token?: string }).platform_admin_token ?? "",
  };
}
"@
  [System.IO.File]::WriteAllText($ui, $u.TrimEnd() + "`r`n" + $block)
  Write-Output ("UI: usePlatform appended = " + ([System.IO.File]::ReadAllText($ui) -match "\bexport function usePlatform\b"))
}

# 2) Point both broken pages' two imports at the real modules.
foreach ($name in @("plans", "subscriptions")) {
  $f = Join-Path $root ("src\app\platform\" + $name + "\page.tsx")
  $s = [System.IO.File]::ReadAllText($f)
  $s = $s.Replace('import { queryString } from "@/lib/format";', 'import { queryString } from "@/lib/api";')
  $s = $s.Replace('import { usePlatform } from "@/components/PlatformShell";', 'import { usePlatform } from "@/components/ui";')
  [System.IO.File]::WriteAllText($f, $s)
  $check = [System.IO.File]::ReadAllText($f)
  Write-Output ("$name : queryString<=api = " + ($check -match 'queryString \} from "@/lib/api"') + " ; usePlatform<=ui = " + ($check -match 'usePlatform \} from "@/components/ui"'))
}
