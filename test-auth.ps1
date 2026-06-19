# Test Auth Registration and Login
Write-Host "Starting Auth Tests..." -ForegroundColor Green

# Test 1: Register with valid data
Write-Host "`n=== Test 1: Register with valid data ===" -ForegroundColor Yellow
$registerData = @{
    name = "John Smith"
    email = "john@techcorp.com"
    password = "SecurePass123"
    role = "recruiter"
    company_name = "Tech Corp"
    industry_id = 1
} | ConvertTo-Json

Write-Host "Request Body: $registerData"

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "Status: Success" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)"
    $token = $response.token
} catch {
    Write-Host "Status: Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Response.StatusCode) - $($_.Exception.Message)" 
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}

# Test 2: Try to register with same email (should fail)
Write-Host "`n=== Test 2: Register duplicate email (should fail) ===" -ForegroundColor Yellow
$duplicateData = @{
    name = "Jane Doe"
    email = "john@techcorp.com"
    password = "SecurePass123"
    role = "recruiter"
    company_name = "Another Corp"
    industry_id = 1
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/register" `
        -Method Post `
        -Body $duplicateData `
        -ContentType "application/json" `
        -ErrorAction Stop
    Write-Host "Unexpected Success" -ForegroundColor Red
} catch {
    Write-Host "Status: Correctly Failed (Expected)" -ForegroundColor Green
    $errorContent = $_.Exception.Response.Content.ReadAsStream()
    $streamReader = [System.IO.StreamReader]::new($errorContent)
    $errorBody = $streamReader.ReadToEnd()
    Write-Host "Error: $errorBody"
}

# Test 3: Login with correct credentials
Write-Host "`n=== Test 3: Login with correct credentials ===" -ForegroundColor Yellow
$loginData = @{
    email = "john@techcorp.com"
    password = "SecurePass123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "Status: Success" -ForegroundColor Green
    Write-Host "User: $($response.user.name) ($($response.user.email))"
    Write-Host "Role: $($response.user.role)"
    Write-Host "Token: $($response.token.Substring(0, 20))..." 
} catch {
    Write-Host "Status: Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

# Test 4: Login with incorrect password
Write-Host "`n=== Test 4: Login with wrong password (should fail) ===" -ForegroundColor Yellow
$wrongPassData = @{
    email = "john@techcorp.com"
    password = "WrongPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/login" `
        -Method Post `
        -Body $wrongPassData `
        -ContentType "application/json" `
        -ErrorAction Stop
    Write-Host "Unexpected Success" -ForegroundColor Red
} catch {
    Write-Host "Status: Correctly Failed (Expected)" -ForegroundColor Green
    $errorContent = $_.Exception.Response.Content.ReadAsStream()
    $streamReader = [System.IO.StreamReader]::new($errorContent)
    $errorBody = $streamReader.ReadToEnd()
    $errorJson = $errorBody | ConvertFrom-Json
    Write-Host "Message: $($errorJson.message)"
}

# Test 5: Register with weak password
Write-Host "`n=== Test 5: Register with weak password (should fail) ===" -ForegroundColor Yellow
$weakPassData = @{
    name = "Weak User"
    email = "weak@example.com"
    password = "weak123"
    role = "recruiter"
    company_name = "Weak Corp"
    industry_id = 1
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/register" `
        -Method Post `
        -Body $weakPassData `
        -ContentType "application/json" `
        -ErrorAction Stop
    Write-Host "Unexpected Success" -ForegroundColor Red
} catch {
    Write-Host "Status: Correctly Failed (Expected)" -ForegroundColor Green
    $errorContent = $_.Exception.Response.Content.ReadAsStream()
    $streamReader = [System.IO.StreamReader]::new($errorContent)
    $errorBody = $streamReader.ReadToEnd()
    $errorJson = $errorBody | ConvertFrom-Json
    Write-Host "Error Message: $($errorJson.message)"
}

Write-Host "`n=== All tests completed ===" -ForegroundColor Green
