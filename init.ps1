# Initialize Convex and Keycloak for the project
Write-Host "Initializing project..." -ForegroundColor Cyan

# Check if Docker services are running
Write-Host "Checking if Docker services are running..." -ForegroundColor Cyan
$services = docker compose ps --format json | ConvertFrom-Json
if ($services.Count -lt 5) {
    Write-Host "Error: Not all services are running. Please run 'docker compose up -d' first." -ForegroundColor Red
    exit 1
}

# Generate admin key for Convex
Write-Host "Generating admin key for Convex..." -ForegroundColor Cyan
docker compose exec backend bash -c "cd /convex && ./generate_admin_key.sh"
Write-Host "⚠️ Please copy the admin key above and add it to backend/.env.local" -ForegroundColor Yellow


# Deploy Convex schema
Write-Host "Deploying Convex schema..." -ForegroundColor Cyan
Push-Location -Path "backend"
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
bun install

Write-Host "Important: Before deploying to Convex, make sure you've:" -ForegroundColor Yellow
Write-Host "1. Created backend/.env.local with your admin key" -ForegroundColor Yellow
Write-Host "2. Added the following content to the file:" -ForegroundColor Yellow
Write-Host "CONVEX_SELF_HOSTED_URL=http://localhost:3210" -ForegroundColor Cyan
Write-Host "CONVEX_SELF_HOSTED_ADMIN_KEY=your_admin_key_here" -ForegroundColor Cyan
Write-Host "Press Enter to continue after you've done this..." -ForegroundColor Yellow
Read-Host

Write-Host "Deploying to Convex..." -ForegroundColor Cyan
bunx convex deploy

# Go back to root
Pop-Location

# Setup frontend
Write-Host "Setting up frontend..." -ForegroundColor Cyan
Push-Location -Path "frontend"
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
bun install
Write-Host "Deploying to Convex..." -ForegroundColor Cyan
bun run dev
Pop-Location

Write-Host "✅ Project initialization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now access:" -ForegroundColor Cyan
Write-Host "- Main application: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Convex dashboard: http://localhost:6791" -ForegroundColor Cyan
Write-Host "- Keycloak admin: http://localhost:8080/admin (admin/admin)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Enjoy building with Vite, React, Bun, Convex, and Keycloak!" -ForegroundColor Green