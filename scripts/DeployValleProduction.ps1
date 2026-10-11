param([string]$Username = 'valle-admin')
$ErrorActionPreference = 'Stop'
$password = Read-Host 'Contrasena ADMIN de produccion' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    @{ username = $Username; password = $plain } | ConvertTo-Json -Compress | node "$PSScriptRoot\deployProduction.mjs"
    if ($LASTEXITCODE -ne 0) { throw 'El despliegue no se completo; revisar el respaldo y el error informado' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $plain = $null
}
