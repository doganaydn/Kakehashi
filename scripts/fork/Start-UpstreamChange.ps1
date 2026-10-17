param(
    [Parameter(Mandatory = $true)][string]$Branch,
    [string]$Workspace,
    [switch]$Refresh
)
$ErrorActionPreference = 'Stop'

function Invoke-Git([string[]]$Arguments) {
    $result = & git @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Git failed: $($Arguments -join ' ')" }
    return $result
}

$repo = (Invoke-Git @('-C', $PSScriptRoot, 'rev-parse', '--show-toplevel')).Trim()
if (-not $Workspace) { $Workspace = Join-Path (Split-Path $repo) 'kakehashi-translation-pr' }
if ($Branch -notmatch '^(fix|feature|docs|test)/[a-z0-9][a-z0-9-]*$') {
    throw 'Use a focused branch name such as fix/lesson-similar-kanji-translations.'
}
if (-not (Test-Path -LiteralPath $Workspace -PathType Container)) {
    throw 'Choose an existing clean PR worktree. This script does not create or remove worktrees.'
}
$common = (Invoke-Git @('-C', $repo, 'rev-parse', '--path-format=absolute', '--git-common-dir')).Trim()
$otherCommon = (Invoke-Git @('-C', $Workspace, 'rev-parse', '--path-format=absolute', '--git-common-dir')).Trim()
if ($common -ne $otherCommon) { throw 'The PR workspace must belong to this repository.' }
$current = (Invoke-Git @('-C', $Workspace, 'branch', '--show-current')).Trim()
if ($current -eq 'turkish-content') { throw 'Use the separate PR workspace, not the personal app checkout.' }
if (Invoke-Git @('-C', $Workspace, 'status', '--porcelain')) { throw 'Commit or preserve current PR work before starting another change.' }
$upstream = (Invoke-Git @('-C', $repo, 'remote', 'get-url', 'upstream')).Trim()
if ($upstream -ne 'https://github.com/Portego-00/Kakehashi.git') { throw 'Unexpected upstream remote; review it first.' }
if ($Refresh) { Invoke-Git @('-C', $repo, 'fetch', 'upstream') | Out-Host }
Invoke-Git @('-C', $Workspace, 'switch', '--no-track', '-c', $Branch, 'upstream/main') | Out-Host
Invoke-Git @('-C', $Workspace, 'config', "branch.$Branch.pushRemote", 'origin') | Out-Null
Write-Output "Ready: $Workspace [$Branch]. No push or pull request was performed."
if (-not $Refresh) { Write-Warning 'Used the locally fetched upstream/main. Refresh before the final readiness check.' }
