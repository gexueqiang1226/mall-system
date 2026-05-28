# Mall System - Docker Compose Deploy Script (Windows PowerShell)
# Run: .\scripts\deploy.ps1 <command>

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "health", "reset", "help")]
    [string]$Command = "help"
)

$ProjectDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$EnvFile = Join-Path $ProjectDir ".env"

function Write-Info($msg)  { Write-Host "[INFO] $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)   { Write-Host "[ERROR] $msg" -ForegroundColor Red }

function Check-Requirements {
    Write-Info "Checking requirements..."

    $dockerOk = $false
    try {
        $null = docker --version 2>&1
        $dockerOk = $true
    } catch {}

    if (-not $dockerOk) {
        Write-Err "Docker is not installed or not in PATH."
        Write-Info "  Download: https://docs.docker.com/desktop/install/windows-install/"
        exit 1
    }

    $composeOk = $false
    try {
        $null = docker compose version 2>&1
        $composeOk = $true
    } catch {}

    if (-not $composeOk) {
        try {
            $null = docker-compose --version 2>&1
            $composeOk = $true
        } catch {}
    }

    if (-not $composeOk) {
        Write-Err "Docker Compose is not available."
        exit 1
    }

    Write-Info "All requirements satisfied."
}

function Create-EnvFile {
    if (Test-Path $EnvFile) {
        Write-Info ".env file already exists, skipping."
        return
    }

    Write-Info "Creating .env file..."
    $envContent = @"
# Mall System Environment Configuration

# MySQL
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=mall_system

# Redis
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=mall-system-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256
JWT_EXPIRATION=86400000

# Admin Frontend API Base URL
VITE_API_BASE_URL=http://localhost:8080
"@
    Set-Content -Path $EnvFile -Value $envContent
    Write-Info ".env file created at: $EnvFile"
}

function Get-DockerComposeCmd {
    try {
        $null = docker compose version 2>&1
        return "docker compose"
    } catch {
        return "docker-compose"
    }
}

function Do-Start {
    Check-Requirements
    Create-EnvFile

    Write-Info "Starting Mall System..."
    Push-Location $ProjectDir

    $composeCmd = Get-DockerComposeCmd
    Invoke-Expression "$composeCmd up -d --build"

    Write-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 10

    Do-Status

    Write-Host ""
    Write-Info "Mall System is running!"
    Write-Info "  Backend API:   http://localhost:8080"
    Write-Info "  API Docs:      http://localhost:8080/swagger-ui.html"
    Write-Info "  Admin Panel:   http://localhost:5173"
    Write-Info "  Default Login: admin / admin123"

    Pop-Location
}

function Do-Stop {
    Write-Info "Stopping Mall System..."
    Push-Location $ProjectDir
    $composeCmd = Get-DockerComposeCmd
    Invoke-Expression "$composeCmd down"
    Pop-Location
    Write-Info "Mall System stopped."
}

function Do-Restart {
    Do-Stop
    Do-Start
}

function Do-Status {
    Push-Location $ProjectDir
    $composeCmd = Get-DockerComposeCmd
    Invoke-Expression "$composeCmd ps"
    Pop-Location
}

function Do-Logs {
    param([string]$Service = "")
    Push-Location $ProjectDir
    $composeCmd = Get-DockerComposeCmd
    if ($Service) {
        Invoke-Expression "$composeCmd logs -f $Service"
    } else {
        Invoke-Expression "$composeCmd logs -f"
    }
    Pop-Location
}

function Do-Health {
    Write-Info "Checking service health..."

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/swagger-ui.html" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Info "Backend:   OK (http://localhost:8080)"
    } catch {
        Write-Err "Backend:   NOT responding"
    }

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Info "Admin:     OK (http://localhost:5173)"
    } catch {
        Write-Err "Admin:     NOT responding"
    }

    $mysqlPort = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
    if ($mysqlPort) {
        Write-Info "MySQL:     OK (localhost:3306)"
    } else {
        Write-Warn "MySQL:     Port 3306 not listening"
    }

    $redisPort = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
    if ($redisPort) {
        Write-Info "Redis:     OK (localhost:6379)"
    } else {
        Write-Warn "Redis:     Port 6379 not listening"
    }
}

function Do-Reset {
    $confirm = Read-Host "This will DELETE all data. Are you sure? [y/N]"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Info "Reset cancelled."
        return
    }

    Push-Location $ProjectDir
    $composeCmd = Get-DockerComposeCmd
    Invoke-Expression "$composeCmd down -v"
    Pop-Location
    Write-Info "All data volumes removed. Run '.\scripts\deploy.ps1 start' to reinitialize."
}

function Show-Help {
    Write-Host @"
Mall System Deploy Script (Windows)

Usage: .\scripts\deploy.ps1 <command>

Commands:
  start     Start all services (build + run)
  stop      Stop all services
  restart   Restart all services
  status    Show service status
  logs      Show all logs
  health    Check service health
  reset     Remove all data and stop services
  help      Show this help message

Examples:
  .\scripts\deploy.ps1 start
  .\scripts\deploy.ps1 health
"@
}

switch ($Command) {
    "start"   { Do-Start }
    "stop"    { Do-Stop }
    "restart" { Do-Restart }
    "status"  { Do-Status }
    "logs"    { Do-Logs }
    "health"  { Do-Health }
    "reset"   { Do-Reset }
    "help"    { Show-Help }
}
