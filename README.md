# Paquetes App

MVP web para mostrar paquetes de viaje sin login y convertir consultas por WhatsApp, con panel admin con login para crear/editar/publicar paquetes.

## Stack
- Next.js 16 + TypeScript + Tailwind
- Auth: NextAuth (credentials)
- DB access: Prisma Client
- DB local de desarrollo: SQLite

## Configuracion
1. Instalar dependencias:
```bash
npm install
```

2. Crear variables de entorno:
```bash
cp .env.example .env
```

3. Crear esquema local y sembrar datos:
```bash
npm run db:bootstrap
npm run db:seed
```

4. Correr app:
```bash
npm run dev
```

## Credenciales admin (seed)
- Email: `admin@agencia.com`
- Password: `Admin12345`

## Rutas
- `/` catalogo publico
- `/paquetes/[slug]` detalle del paquete + CTA WhatsApp
- `/admin/login` login admin
- `/admin` dashboard admin (protegido)
- `/admin/cotizador` generador de cotizaciones y PDF
- `/admin/paquetes/nuevo` crear paquete (wizard)
- `/admin/paquetes/[id]/editar` editar paquete
- `/api/upload` carga de imagenes (cover y galeria)

## Variables importantes
- `DATABASE_URL`: por defecto `file:/tmp/paquetes-app-dev.db`
- `NEXTAUTH_URL`: URL base local o productiva
- `NEXTAUTH_SECRET`: secreto de sesiones
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: numero destino para `wa.me`
- `NEXT_PUBLIC_SITE_URL`: URL publica para incluir en mensaje de WhatsApp
- `NEXT_PUBLIC_AGENCY_NAME`: nombre visible de agencia
- `NEXT_PUBLIC_AGENCY_LOGO_URL`: ruta o URL del logo

## Notas
- Moneda del catalogo: Quetzal guatemalteco (GTQ).
- Se puede marcar un paquete como oferta y destacar precio promocional.
- Solo paquetes `PUBLISHED` aparecen en el sitio publico.
- Planeacion de producto y backlog: `PRODUCT_PLAN.md`.
