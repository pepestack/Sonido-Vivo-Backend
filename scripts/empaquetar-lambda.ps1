# Genera lambda.zip listo para subir a AWS Lambda (reemplaza el anterior).
#
# Uso (desde la raiz del proyecto):
#   npm run lambda:zip                 -> solo genera lambda.zip
#   npm run lambda:subir               -> genera y sube con AWS CLI
#
# Arma el paquete en una carpeta temporal con solo las dependencias de
# produccion, asi no modifica tu node_modules local. Incluye lambda.js,
# package.json y src/; deja fuera .env, .git, scripts/ y graphify-out/.

param(
  [switch]$Subir,
  [string]$Funcion = "sonido-vivo-backend"
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$zip = Join-Path $raiz "lambda.zip"
$temp = Join-Path $env:TEMP "sonido-vivo-lambda"
# tar de Windows (bsdtar): crea .zip con rutas "/", que Lambda (Linux) entiende.
# Compress-Archive de PowerShell 5.1 puede usar "\" y romper los require.
$tar = Join-Path $env:SystemRoot "System32\tar.exe"

Write-Host "1/4 Preparando carpeta temporal..."
if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp | Out-Null
Copy-Item (Join-Path $raiz "lambda.js"), (Join-Path $raiz "package.json"), (Join-Path $raiz "package-lock.json") $temp
Copy-Item (Join-Path $raiz "src") $temp -Recurse

Write-Host "2/4 Instalando dependencias de produccion..."
Push-Location $temp
try {
  npm ci --omit=dev --no-audit --no-fund --loglevel=error
  if ($LASTEXITCODE -ne 0) { throw "npm ci fallo (codigo $LASTEXITCODE)" }
} finally {
  Pop-Location
}

Write-Host "3/4 Creando lambda.zip..."
if (Test-Path $zip) { Remove-Item $zip -Force }
& $tar -a -c -f $zip -C $temp lambda.js package.json src node_modules
if ($LASTEXITCODE -ne 0) { throw "tar fallo (codigo $LASTEXITCODE)" }
Remove-Item $temp -Recurse -Force

$mb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "    lambda.zip listo ($mb MB)"
if ($mb -ge 50) { Write-Warning "Supera 50 MB: subelo mediante S3 en vez de directo." }

if ($Subir) {
  Write-Host "4/4 Subiendo a la funcion '$Funcion'..."
  aws lambda update-function-code --function-name $Funcion --zip-file "fileb://$zip" --query "{Funcion:FunctionName,Estado:LastUpdateStatus,Modificado:LastModified}" --output table
  if ($LASTEXITCODE -ne 0) { throw "La subida fallo; revisa 'aws configure' y el nombre de la funcion." }
} else {
  Write-Host "4/4 Listo. Subelo en Lambda > Codigo > Cargar desde > archivo .zip (o usa npm run lambda:subir)."
}
