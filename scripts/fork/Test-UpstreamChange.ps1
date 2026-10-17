param(
    [Parameter(Mandatory = $true)][string]$Branch,
    [string]$Base = 'upstream/main',
    [string]$Workspace,
    [string[]]$AllowedPaths,
    [switch]$AllowNativeChanges
)
$ErrorActionPreference = 'Stop'
function Invoke-Git([string[]]$Arguments) {
    $result = & git -C $repo @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Git failed: $($Arguments -join ' ')" }
    return $result
}
$repo = (& git -C $PSScriptRoot rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot locate the fork repository.' }
if ($Branch -notmatch '^(fix|feature|docs|test)/[a-z0-9][a-z0-9-]*$') { throw 'Check a focused PR branch, not the personal release branch.' }
if (-not $Workspace) { $Workspace = Join-Path (Split-Path $repo) 'kakehashi-translation-pr' }
$workspaceBranch = & git -C $Workspace branch --show-current
if ($LASTEXITCODE -ne 0 -or "$workspaceBranch".Trim() -ne $Branch) { throw 'Check out the topic branch in the PR workspace first.' }
$workspaceStatus = & git -C $Workspace status --porcelain
if ($LASTEXITCODE -ne 0 -or $workspaceStatus) { throw 'The PR workspace must be clean; commit or preserve pending work.' }
if ((Invoke-Git @('remote', 'get-url', 'upstream')).Trim() -ne 'https://github.com/Portego-00/Kakehashi.git') { throw 'Unexpected upstream remote.' }
if ((Invoke-Git @('remote', 'get-url', 'origin')).Trim() -ne 'https://github.com/doganaydn/Kakehashi.git') { throw 'Unexpected fork remote.' }
$baseCommit = (Invoke-Git @('rev-parse', "$Base^{commit}")).Trim()
$mergeBase = (Invoke-Git @('merge-base', $Base, $Branch)).Trim()
if ($mergeBase -ne $baseCommit) { throw 'The PR branch is not based on the current upstream/main. Update it and rerun tests.' }
$files = @(Invoke-Git @('diff', '--name-only', "$Base...$Branch"))
if ($files.Count -eq 0) { throw 'No changes to propose.' }
$personal = @('AGENTS.md', 'BUILD-ANDROID.ps1', 'TURKCE-DEVAM.md', 'docs/fork-maintenance.md', 'translation-packages/wanikani-tr-v3.json', 'translation-packages/wanikani-tr-v3.json.manifest.json', 'translation-packages/README.md')
foreach ($file in $files) {
    if ($personal -contains $file -or $file -match '^(scripts/fork/|paylasim/|localization/|\.local-tools/)' -or $file -match '\.(apk|aab|keystore|jks)$') {
        throw "Personal release or local tooling file in PR: $file"
    }
    if (-not $AllowNativeChanges -and ($file -eq 'app.json' -or $file -eq 'app.config.js' -or $file -match '^(android|ios)/' -or $file -match '^modules/.*/(android|ios)/')) {
        throw "Native/app configuration requires explicit review (-AllowNativeChanges): $file"
    }
    if ($AllowedPaths -and $AllowedPaths -notcontains $file) { throw "File outside this PR's approved scope: $file" }
}
# Compare committed changes only. This is not a test runner or an approval to publish.
Invoke-Git @('diff', '--check', "$Base...$Branch") | Out-Host
Invoke-Git @('log', '--oneline', "$Base..$Branch") | Out-Host
Invoke-Git @('diff', '--stat', "$Base...$Branch") | Out-Host
Write-Output "Structural check and clean PR workspace passed against $baseCommit. Tests and source review still required."
if ($AllowNativeChanges) { Write-Warning 'Review application identity, signing, schemes and OTA separately; native files were explicitly allowed.' }
Write-Output 'No fetch, push, account operation or pull request was performed.'
