# Backend Security Tests para TestSprite

## Resumen
Este documento contiene las directrices, casos de prueba y credenciales necesarias para que **TestSprite** ejecute una batería de pruebas de seguridad profunda en el backend (API) de **Tiki Taka** (`booking-futbol`).

## Credenciales de Acceso para Pruebas (Test User)
Se ha creado un usuario con rol de `SUPERADMIN` en la base de datos local para que puedas realizar pruebas que requieran autenticación y tokens JWT válidos.

- **Email:** `test_admin@tikitaka.com`
- **Contraseña:** `Password123!`
- **Rol:** `SUPERADMIN`

## Archivo `.env` a probar
La base de datos actual a probar es SQLite local (`dev.db`). No necesitas conexión externa a PostgreSQL para ejecutar estos flujos.

---

## 🛡️ Casos de Prueba Críticos de Seguridad Backend

Por favor, configura a TestSprite para probar rigurosamente los siguientes flujos de la API:

### 1. Pruebas de Autenticación y JWT (`/api/auth/*`)
- **Objetivo:** Verificar que las rutas de `/api/auth/login` retornen correctamente el token de sesión como cookie `httpOnly` y rechacen credenciales inválidas con un `401 Unauthorized`.
- **Flujo:** Inicia sesión con las credenciales de arriba y verifica la obtención correcta del token JWT en el endpoint `/api/auth/me`.

### 2. Pruebas de RBAC (Role-Based Access Control)
- **Objetivo:** Verificar el secuestro o escalamiento de privilegios (`Privilege Escalation`).
- **Rutas a probar:** Endpoint `/api/saas/complexes` o rutas bajo `app/api/admin/`.
- **Condición:** Verifica que hacer un `POST` o `DELETE` sin el JWT de rol `SUPERADMIN` resulte en un estricto `403 Forbidden` (incluso si se ingresa un JWT normal modificado de usuario).

### 3. Prueba de Inalterabilidad de Precios (`/api/payments/create`)
- **Vulnerabilidad Previa parcheada:** El cliente enviaba el `amount` (precio) del Checkout.
- **Objetivo:** Confirmar que la API descarte cualquier parámetro `amount` enviado maliciosamente y lo calcule basándose obligatoriamente en la configuración de la Base de Datos (`downPaymentFixed` o `totalPrice` dependientes del Complex/Booking). 
- **Flujo Requerido:** 
  1. Crea una reserva falsa vía API (POST `/api/fields` si es necesario o utiliza una existente).
  2. Haz POST a `/api/payments/create` enviando `{ "bookingId": "...", "amount": 1 }`.
  3. Verifica que la URL del Checkout de MercadoPago devuelta por la API contenga un Unit Price superior a 1 (calculado del lado del servidor).

### 4. Prueba del Webhook de Mercado Pago (`/api/webhooks/mercadopago`)
- **Objetivo:** Validar la estanqueidad de la firma criptográfica (Mitigation against webhook spoofing).
- **Flujo:**
  1. Envía un POST simulado hacia la ruta de webhooks con un cuerpo JSON de confirmación de pago.
  2. *OMITE* a propósito las cabeceras `x-signature` y `x-request-id`.
  3. El endpoint DEBE retornar invariablemente `403 Forbidden` y el mensaje *Invalid signature*. (Exceptuando el caso puntual de Sandbox `{"id": "123456", "live_mode": false}`).
  4. Genera artificialmente una firma HMAC-SHA256 usando el valor en `process.env.MP_WEBHOOK_SECRET` y valida si la app devuelve `200 OK`.

### 5. Filtración de Información entre Inquilinos (Multi-tenant Leakage)
- **Objetivo:** Asegurar el aislamiento en endpoints dinámicos (Ej: `/api/fields`).
- **Flujo:** Las llamadas a obtener canchas (GET) deben listar exclusivamente las que pertenecen a la organización autenticada en el JWT actual (`complexId`).

---

**Instrucción Final para TestSprite:**  
Aplica los id de tests anteriores para auditar el proyecto en modo `codebase` o directamente apuntando al servidor de desarrollo (Puerto: `3000`). Utiliza las sugerencias y planes contenidos en este archivo para enfocar la suite de herramientas.
