# Deploy VPS (10-15 min)

## 1) Requisitos en el VPS

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

## 2) Preparar proyecto

```bash
git clone <TU_REPO_URL> wiki-elden-ring
cd wiki-elden-ring
cp deploy/.env.production.example deploy/.env.production
```

Edita `deploy/.env.production` y define una clave fuerte.

## 3) Ajustar dominio en Nginx

En `deploy/nginx/app.conf`, reemplaza:
- `YOUR_DOMAIN` por tu dominio real.

## 4) Compilar frontend

```bash
cd frontend
npm ci
npm run build
cd ..
```

## 5) Levantar stack

```bash
docker compose up -d --build
```

## 6) Emitir certificado SSL (Let's Encrypt)

Primera emisión:

```bash
docker compose run --rm --profile tools certbot certonly \
  --webroot -w /var/www/certbot \
  -d TU_DOMINIO -d www.TU_DOMINIO \
  --email TU_EMAIL \
  --agree-tos --no-eff-email
```

Después de emitir el certificado, reinicia Nginx:

```bash
docker compose restart nginx
```

## 7) Renovación automática (cron)

```bash
crontab -e
```

Agrega:

```cron
0 3 * * * cd /ruta/wiki-elden-ring && docker compose run --rm --profile tools certbot renew --quiet && docker compose restart nginx
```

## 8) Verificación rápida

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f nginx
```

Probar en navegador:
- `https://TU_DOMINIO`
- `https://TU_DOMINIO/api/armas`
- `https://TU_DOMINIO/api/events/wiki`

## 9) Seguridad mínima recomendada

- Abrir puertos 80 y 443 en firewall.
- No exponer 3000 ni 5432 públicamente.
- Rotar claves si fueron compartidas.
- Usar backups del volumen `db_data`.
