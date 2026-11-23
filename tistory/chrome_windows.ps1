# 크롬 자동화가 연 창 정리 (11/23 사용자: 작업 끝나면 연 창을 다 닫을 것)
# 사용(권장): snapshot → 창 열기 → mark → (작업) → closemark. 동시 세션이 있어도 우리 창만 닫는다.
# 그 밖: powershell -File chrome_windows.ps1 snapshot <파일>   : 지금 열린 크롬 창 핸들 저장
#       powershell -File chrome_windows.ps1 closenew <파일>   : 저장 뒤 새로 생긴 크롬 창을 모두 닫기(자동화가 연 창)
#       powershell -File chrome_windows.ps1 closeblank         : 지금 열린 빈 크롬 창 전부 닫기(수동 정리용)
param([string]$mode, [string]$file)
Add-Type @"
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public class W {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern IntPtr PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  public static List<string> List() { var r = new List<string>();
    EnumWindows((h, l) => { if (!IsWindowVisible(h)) return true; var c = new StringBuilder(256); GetClassName(h, c, 256);
      if (c.ToString() != "Chrome_WidgetWin_1") return true; var t = new StringBuilder(512); GetWindowText(h, t, 512);
      if (t.Length == 0) return true; r.Add(h.ToInt64() + "`t" + t.ToString()); return true; }, IntPtr.Zero); return r; }
}
"@
$wins = [W]::List() | ForEach-Object { $p = $_ -split "`t", 2; [pscustomobject]@{ h = [int64]$p[0]; t = $p[1] } }
$chrome = $wins | Where-Object { $_.t -like '*Chrome*' }
$isBlank = { param($t) $t -like 'about:blank*' -or $t -like '새 탭*' -or $t -like 'New Tab*' }
if ($mode -eq 'list') { $chrome | ForEach-Object { "$($_.h)`t$($_.t)" }; exit }
if ($mode -eq 'snapshot') { $chrome | ForEach-Object { $_.h } | Set-Content -Encoding ascii $file; "snapshot " + $chrome.Count; exit }
$closed = 0
if ($mode -eq 'mark') {  # snapshot 이후 새로 생긴 창(= 방금 우리가 연 창) 핸들을 mark 파일에 저장
  $before = @(); if (Test-Path $file) { $before = Get-Content $file | ForEach-Object { [int64]$_ } }
  $mine = $chrome | Where-Object { $before -notcontains $_.h }; $mine | ForEach-Object { $_.h } | Set-Content -Encoding ascii ($file + '.mark'); "mark " + @($mine).Count; exit }
if ($mode -eq 'closemark') {  # mark 해 둔 우리 창만 닫기(다른 세션 창은 건드리지 않음)
  $mine = @(); if (Test-Path ($file + '.mark')) { $mine = Get-Content ($file + '.mark') | ForEach-Object { [int64]$_ } }
  $chrome | Where-Object { $mine -contains $_.h } | ForEach-Object { [W]::PostMessage([IntPtr]$_.h, 0x10, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null; $closed++ }
  "closed " + $closed; exit }
if ($mode -eq 'closenew') {
  $before = @(); if (Test-Path $file) { $before = Get-Content $file | ForEach-Object { [int64]$_ } }
  $chrome | Where-Object { $before -notcontains $_.h } | ForEach-Object { [W]::PostMessage([IntPtr]$_.h, 0x10, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null; $closed++ }
}
if ($mode -eq 'closeblank') {
  $chrome | Where-Object { & $isBlank $_.t } | ForEach-Object { [W]::PostMessage([IntPtr]$_.h, 0x10, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null; $closed++ }
}
"closed " + $closed
