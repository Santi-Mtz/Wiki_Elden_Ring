# Backend AEGIS - PostgreSQL

## 1) Crear base de datos y usuario (psql)

Conecta como superusuario de PostgreSQL y ejecuta:

```sql
CREATE DATABASE aegis;
CREATE USER aegis_app WITH ENCRYPTED PASSWORD 'aegis123';
GRANT ALL PRIVILEGES ON DATABASE aegis TO aegis_app;
```

Luego entra a la base `aegis` y ejecuta:

```sql
GRANT USAGE, CREATE ON SCHEMA public TO aegis_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aegis_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aegis_app;
```

## 2) Configurar variables de entorno

Copia `.env.example` a `.env` y ajusta valores:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aegis
DB_USER=aegis_app
DB_PASSWORD=aegis123
PORT=3000
```

## 3) Inicializar esquema y datos base

```bash
npm run db:init
```

Esto ejecuta:
- `sql/schema.sql`: tablas base (usuarios, armas, armaduras, hechizos, etc.)
- `sql/seed.sql`: datos iniciales para comenzar

## 4) Arrancar backend

```bash
npm start
```

## Scripts disponibles

- `npm run dev`: backend con nodemon
- `npm run start`: backend normal
- `npm run db:init`: crea/actualiza esquema y carga seed
