param(
    [string]$Architectures = 'arm64-v8a',
    [string]$BuildDirectory = (Join-Path $env:USERPROFILE 'kakehashi-tr-android-build'),
    [string]$GradleCache = (Join-Path $env:USERPROFILE 'kakehashi-tr-gradle-cache')
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$taskPaths = Get-Content .local-tools/paths.json | ConvertFrom-Json
$env:JAVA_HOME = $taskPaths.jdk
$env:ANDROID_HOME = $taskPaths.sdk
$env:GRADLE_USER_HOME = $GradleCache
$env:__UNSAFE_EXPO_HOME_DIRECTORY = Join-Path $PSScriptRoot '.local-tools/expo-home'
$env:EXPO_NO_TELEMETRY = '1'
$env:NODE_ENV = 'production'
$env:NODE_OPTIONS = '--max-old-space-size=4096'
$taskTemp = Join-Path $PSScriptRoot '.local-tools/tmp'
New-Item -ItemType Directory -Force $taskTemp | Out-Null
$env:TEMP = $taskTemp
$env:TMP = $taskTemp
$env:PATH = "$env:JAVA_HOME/bin;$env:PATH"
if ([IO.Path]::GetFullPath($BuildDirectory).TrimEnd('\') -eq $PSScriptRoot.TrimEnd('\')) {
    throw 'Use a separate short build directory on Windows.'
}
New-Item -ItemType Directory -Force $BuildDirectory | Out-Null
& robocopy.exe $PSScriptRoot $BuildDirectory /E /R:1 /W:1 /NFL /NDL /NJH /NJS /XD .git .local-tools .test-cache .turkish-checks .gradle .cxx "$PSScriptRoot\android\app\build" "$PSScriptRoot\android\build" /XF '.turkish-*'
if ($LASTEXITCODE -ge 8) { throw 'Build staging copy failed.' }
Set-Location $BuildDirectory
Set-Content -LiteralPath android/local.properties -Value ('sdk.dir=' + $env:ANDROID_HOME.Replace('\','/')) -Encoding utf8
& ./android/gradlew.bat -p android assembleRelease "-PreactNativeArchitectures=$Architectures" --no-daemon --console=plain --max-workers=4
if ($LASTEXITCODE -ne 0) { throw 'Android build failed; see Gradle output.' }
$taskApk = Join-Path $BuildDirectory 'android/app/build/outputs/apk/release/app-release.apk'
if (-not (Test-Path -LiteralPath $taskApk)) { throw 'APK not found after build.' }
$taskOutput = Join-Path $PSScriptRoot 'android/app/build/outputs/apk/release/app-release.apk'
New-Item -ItemType Directory -Force (Split-Path $taskOutput) | Out-Null
Copy-Item -LiteralPath $taskApk -Destination $taskOutput -Force
Write-Output $taskOutput
