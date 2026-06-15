# PowerShell Test Script for User Auth Flow

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "TESTING: User Registration API..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# 1. POST Request payload for Registration
$regBody = @{
    username = "student_dev"
    email = "student@test.com"
    password = "SecurePassword123"
    profilePicUrl = "http://example.com/pic.png"
} | ConvertTo-Json

# Execute POST request to /api/auth/register (Port 8081)
$regResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"

Write-Host "Registration Successful! Response:" -ForegroundColor Green
$regResponse | Format-List

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "TESTING: User Login API..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# 2. POST Request payload for Login
$loginBody = @{
    username = "student_dev"
    password = "SecurePassword123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"

$jwtToken = $loginResponse.token
Write-Host "Login Successful! Token received:" -ForegroundColor Green
Write-Host $jwtToken -ForegroundColor Yellow

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "TESTING: Protected Endpoint Access..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# 3. Try accessing a protected route WITH JWT Token
Write-Host "Calling protected route /api/chats WITH token..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $jwtToken" }
    $protectedResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/chats" -Method Get -Headers $headers -UseBasicParsing
    Write-Host "Success! Status Code: $($protectedResponse.StatusCode) (Authorized)" -ForegroundColor Green
    Write-Host "Content: $($protectedResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "Error received! Status Code: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
}

# 4. Try accessing a protected route WITHOUT Token
Write-Host "`nCalling protected route /api/chats WITHOUT token..." -ForegroundColor Yellow
try {
    $badResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/chats" -Method Get -UseBasicParsing
} catch {
    Write-Host "Blocked! Status Code: $($_.Exception.Response.StatusCode.Value__) (403 Forbidden - Unauthorized)" -ForegroundColor Red
}
