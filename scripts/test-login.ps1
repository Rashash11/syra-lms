$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "admin-a@test.local"
    password = "TestPass123!"
} | ConvertTo-Json

Write-Host "Testing login at http://localhost:3000/api/auth/login"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response:"
    $response.Content
    Write-Host ""
    Write-Host "Cookies:"
    $response.Headers['Set-Cookie']
} catch {
    Write-Host "Error: $_"
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
}
