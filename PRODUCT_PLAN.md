# Paquetes App - PRD + Arquitectura + Backlog MVP

## 1. Objetivo del producto
Construir una plataforma web de paquetes de viaje con dos módulos:

- Sitio público sin login para explorar paquetes de forma visual e interactiva y generar leads por WhatsApp.
- Panel administrativo con login para crear, editar y publicar paquetes.

Meta de negocio del MVP (primeras 6 semanas):

- Publicar paquetes de viaje en menos de 10 minutos por paquete.
- Lograr trazabilidad por paquete en consultas de WhatsApp.
- Medir conversión: vista de paquete -> clic a WhatsApp.

## 2. Alcance MVP

### 2.1 Sitio público (sin login)
- Home con listado de paquetes en tarjetas visuales.
- Filtros básicos: destino, rango de precio, duración.
- Página detalle del paquete con:
  - Hero visual (foto principal + logo de agencia).
  - Galería de fotos.
  - Qué incluye / no incluye.
  - Itinerario día por día.
  - Políticas principales (cancelación, vigencia, disponibilidad).
  - CTA principal: "Pedir información por WhatsApp".
- CTA secundario: "Solicitar información" (formulario corto opcional).
- Sitio responsive (mobile first).

### 2.2 Panel admin (con login)
- Login para administradores.
- CRUD de paquetes:
  - Crear, editar, duplicar, publicar/despublicar.
  - Gestión de fotos.
  - Gestión de secciones (itinerario, incluye/no incluye).
- Gestión de catálogo:
  - Destinos.
  - Etiquetas (aventura, familia, playa, etc.).

### 2.3 Seguimiento de leads
- Cada paquete tendrá un `package_code` único, por ejemplo `PKG-007`.
- Botón WhatsApp con mensaje prellenado incluyendo:
  - Código del paquete.
  - Nombre del paquete.
  - URL de referencia.
- Eventos mínimos:
  - `package_view`
  - `whatsapp_click`
  - `info_request_submitted` (si hay formulario)

## 3. Fuera de alcance (fase posterior)
- Pago en línea.
- Reservas con disponibilidad en tiempo real.
- Integración CRM bidireccional.
- Multiidioma completo.

## 4. Usuarios y roles

### 4.1 Cliente final (público)
- Navega paquetes, compara visualmente y pide información.

### 4.2 Admin (interno)
- Publica y administra paquetes y medios.

## 5. Requisitos funcionales

### 5.1 Públicos
1. Listar paquetes activos con foto, precio desde, duración y destino.
2. Filtrar paquetes por criterios básicos.
3. Ver detalle de paquete con contenido estructurado.
4. Enviar consulta por WhatsApp con paquete identificado.

### 5.2 Admin
1. Autenticarse con email y contraseña.
2. Crear paquete con contenido mínimo obligatorio.
3. Subir imágenes y definir portada.
4. Publicar/despublicar paquete.
5. Previsualizar mensaje de WhatsApp.

## 6. Requisitos no funcionales
- Rendimiento: LCP < 2.5s en mobile para páginas públicas clave.
- SEO básico: metadatos por paquete y URLs limpias (`/paquetes/<slug>`).
- Seguridad:
  - Sesiones seguras para admin.
  - Validación de entrada y sanitización de HTML (si aplica).
- Accesibilidad: contraste adecuado y navegación con teclado para CTAs.

## 7. Experiencia visual (dirección de diseño)
- Interfaz moderna, clara y altamente visual.
- Fotografía protagonista en cards y detalle.
- Jerarquía simple: información clave arriba (precio, duración, CTA).
- Microinteracciones ligeras en hover/scroll sin afectar rendimiento.

## 8. Propuesta técnica

## 8.1 Stack recomendado
- Frontend/SSR: Next.js (App Router, TypeScript).
- UI: Tailwind CSS + componentes reutilizables.
- Backend: API routes en Next.js.
- Base de datos: PostgreSQL.
- ORM: Prisma.
- Auth admin: Auth.js (Credentials) o Clerk.
- Almacenamiento imágenes: Cloudinary.
- Analytics: PostHog o GA4 + eventos custom.
- Deploy: Vercel.

## 8.2 Arquitectura de alto nivel
- Cliente público consume páginas SSR/ISR para SEO y performance.
- Panel admin protegido por middleware de autenticación.
- API interna para CRUD de paquetes.
- Imágenes guardadas en Cloudinary; en BD sólo URLs/metadatos.
- Eventos de analítica enviados desde frontend y/o API.

## 9. Modelo de datos inicial

## 9.1 Tabla `users`
- `id`
- `email` (unique)
- `password_hash`
- `role` (`admin` | `editor`)
- `created_at`

## 9.2 Tabla `packages`
- `id`
- `package_code` (unique, ej. `PKG-007`)
- `name`
- `slug` (unique)
- `summary`
- `description`
- `destination`
- `duration_days`
- `base_price`
- `currency` (ej. `MXN`)
- `status` (`draft` | `published` | `archived`)
- `cover_image_url`
- `includes` (JSON/text)
- `excludes` (JSON/text)
- `itinerary` (JSON)
- `policies` (JSON/text)
- `whatsapp_prefill_template`
- `created_by`
- `created_at`
- `updated_at`

## 9.3 Tabla `package_media`
- `id`
- `package_id`
- `url`
- `alt_text`
- `sort_order`
- `created_at`

## 9.4 Tabla `events` (opcional MVP+)
- `id`
- `event_name`
- `package_id` (nullable)
- `session_id`
- `metadata` (JSON)
- `created_at`

## 10. Integración WhatsApp (MVP)

Formato recomendado:

```text
https://wa.me/<numero>?text=<mensaje_url_encoded>
```

Mensaje ejemplo:

```text
Hola, quiero información del paquete PKG-007 - Cancun 5D4N. Lo vi aquí: https://dominio.com/paquetes/cancun-5d4n
```

Reglas:
- Siempre incluir `package_code`.
- Siempre incluir `name`.
- Siempre incluir URL del paquete.

## 11. Backlog priorizado

## Epic A - Catálogo público
- A1. Estructura base frontend + layout.
- A2. Listado de paquetes con tarjetas.
- A3. Filtros básicos.
- A4. Página detalle de paquete.
- A5. Botón WhatsApp por paquete.

## Epic B - Panel admin
- B1. Setup auth + rutas protegidas.
- B2. CRUD de paquetes.
- B3. Subida y ordenamiento de imágenes.
- B4. Publicar/despublicar + validaciones.

## Epic C - Medición
- C1. Tracking de vista de paquete.
- C2. Tracking de clic WhatsApp.
- C3. Tablero simple por paquete.

## 12. Plan de sprints

## Sprint 1 (semana 1)
- Inicializar proyecto Next.js + TypeScript + Tailwind + Prisma.
- Definir esquema de BD y migración inicial.
- Construir páginas públicas base (home + detalle con datos mock).
- Implementar CTA WhatsApp con `package_code`.

## Sprint 2 (semana 2)
- Implementar autenticación admin.
- CRUD de paquetes en panel.
- Integrar almacenamiento de imágenes.
- Publicación/despublicación.

## Sprint 3 (semana 3)
- Filtros públicos reales conectados a BD.
- Eventos analíticos.
- Hardening: SEO básico, performance, QA responsive.

## 13. Criterios de aceptación MVP
- Se puede crear un paquete en panel y publicarlo.
- El paquete aparece en el sitio público.
- El detalle muestra información completa y galería.
- El botón WhatsApp abre chat con mensaje prellenado correcto e identificable por `package_code`.
- Se registran eventos de clic a WhatsApp.

## 14. Riesgos y mitigaciones
- Riesgo: carga lenta por imágenes pesadas.
  - Mitigación: transformación y compresión automática en CDN.
- Riesgo: datos incompletos en paquetes.
  - Mitigación: validaciones de campos obligatorios antes de publicar.
- Riesgo: baja trazabilidad de leads.
  - Mitigación: formato rígido del mensaje WhatsApp + eventos.

## 15. Próximo paso inmediato
Construir el esqueleto técnico del Sprint 1 con:
- Next.js + Tailwind + Prisma.
- Modelo `packages`.
- Home + detalle con datos de prueba.
- Botón de WhatsApp funcional con `package_code`.
