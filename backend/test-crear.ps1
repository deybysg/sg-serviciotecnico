# Prueba: Crear un producto en Render
$body = '{"nombre":"Producto Prueba","categoria":"Test","precio":99.99,"stock":10,"descripcion":"Probando Render","imagen":"https://via.placeholder.com/150"}' | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/productos" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
