param([switch]$ResetPasswords)
$ErrorActionPreference = 'Stop'
$users = @()
foreach ($role in @('propietario', 'ayudante')) {
    Write-Host "Cuenta del $role"
    $username = Read-Host 'Nombre de usuario (3-40 letras, números, punto, guion)'
    $email = Read-Host 'Correo electrónico'
    $displayName = Read-Host 'Nombre para mostrar'
    $secret = Read-Host 'Contraseña (mínimo 12 caracteres)' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    $users += @{ username=$username; email=$email; displayName=$displayName; password=$password }
}
$payload = @{ users=$users; resetPasswords=[bool]$ResetPasswords } | ConvertTo-Json -Depth 4 -Compress
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$payload | docker compose exec -T backend node scripts/init-admins.cjs
$result = $LASTEXITCODE
$payload = $null
$password = $null
$users = $null
if ($result -ne 0) { throw 'No se inicializaron las cuentas. Verifica los datos ingresados.' }
