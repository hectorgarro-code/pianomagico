param([string]$Username)
if (-not $Username) { $Username = Read-Host 'Usuario ADMIN' }
$password = Read-Host 'Contrasena ADMIN (minimo 12 caracteres)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $plain | & 'C:\xampp\php\php.exe' "$PSScriptRoot\..\backend\content\create-admin.php" $Username
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la cuenta ADMIN' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $plain = $null
}
