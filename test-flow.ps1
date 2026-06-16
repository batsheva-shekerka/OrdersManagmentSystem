# End-to-end smoke test for Goldie's API.
# Prerequisites: server running (npm run dev) and database seeded (npm run seed).
# Run from the project root:  powershell -ExecutionPolicy Bypass -File .\test-flow.ps1

$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api"

function Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }

Step 1 "Health check"
$health = Invoke-RestMethod "$base/health"
Write-Host "    status = $($health.status)"

Step 2 "Admin login (admin@goldis.com)"
$adminBody = @{ email = "admin@goldis.com"; password = "admin123" } | ConvertTo-Json
$admin = Invoke-RestMethod "$base/auth/login" -Method Post -Body $adminBody -ContentType "application/json"
$adminHeaders = @{ Authorization = "Bearer $($admin.token)" }
Write-Host "    role = $($admin.user.role)"

Step 3 "List products (public)"
$products = Invoke-RestMethod "$base/products"
$product = $products.data[0]
Write-Host "    first product = $($product.name)  price = $($product.price)  stock = $($product.stock)"

Step 4 "Register / login a customer"
$custReg = @{ name = "Test Customer"; email = "customer@test.com"; password = "123456" } | ConvertTo-Json
try {
  $cust = Invoke-RestMethod "$base/auth/register" -Method Post -Body $custReg -ContentType "application/json"
} catch {
  $custLogin = @{ email = "customer@test.com"; password = "123456" } | ConvertTo-Json
  $cust = Invoke-RestMethod "$base/auth/login" -Method Post -Body $custLogin -ContentType "application/json"
}
$custHeaders = @{ Authorization = "Bearer $($cust.token)" }
Write-Host "    customer points (before) = $($cust.user.loyaltyBalance)"

Step 5 "Place an order as the customer (qty 8 -> subtotal 360 -> Tier 3 = 10%)"
$orderJson = @"
{ "items": [ { "product": "$($product._id)", "quantity": 8 } ], "fulfillment": { "type": "pickup" } }
"@
$placed = Invoke-RestMethod "$base/orders" -Method Post -Headers $custHeaders -Body $orderJson -ContentType "application/json"
Write-Host "    order = $($placed.data.orderNumber)  subtotal = $($placed.data.subtotal)  total = $($placed.data.total)  pointsEarned = $($placed.data.pointsEarned)"

Step 6 "Admin lists all orders"
$allOrders = Invoke-RestMethod "$base/orders" -Headers $adminHeaders
Write-Host "    total orders in system = $($allOrders.data.Count)"

Step 7 "Admin advances order status to 'ready'"
$statusBody = @{ status = "ready" } | ConvertTo-Json
$updated = Invoke-RestMethod "$base/orders/$($placed.data._id)/status" -Method Patch -Headers $adminHeaders -Body $statusBody -ContentType "application/json"
Write-Host "    new status = $($updated.data.status)"

Step 8 "Customer profile shows earned points"
$me = Invoke-RestMethod "$base/auth/me" -Headers $custHeaders
Write-Host "    customer points (after) = $($me.user.loyaltyBalance)"

Step 9 "Negative test: validation should reject a bad order (expect 400)"
try {
  $badJson = '{ "items": [], "fulfillment": { "type": "pickup" } }'
  Invoke-RestMethod "$base/orders" -Method Post -Headers $custHeaders -Body $badJson -ContentType "application/json" | Out-Null
  Write-Host "    UNEXPECTED: empty order was accepted!" -ForegroundColor Red
} catch {
  Write-Host "    correctly rejected empty order (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green
}

Step 10 "Negative test: customer cannot access admin route (expect 403)"
try {
  Invoke-RestMethod "$base/orders" -Headers $custHeaders | Out-Null
  Write-Host "    UNEXPECTED: customer accessed admin order list!" -ForegroundColor Red
} catch {
  Write-Host "    correctly blocked (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green
}

Write-Host "`nALL CHECKS DONE" -ForegroundColor Green
