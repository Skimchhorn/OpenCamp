# OpenCamp backend

Spring Boot 4 (Java 21, Maven) API backed by PostgreSQL + PostGIS. Flyway migrations in `src/main/resources/db/migration` run on startup.

## Run locally

Needs a PostgreSQL database with the PostGIS extension (`CREATE EXTENSION postgis;`).

| Variable | Default |
|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/opencamp` |
| `DB_USER` | current OS user |
| `DB_PASSWORD` | empty |
| `JWT_SECRET` | required, at least 32 bytes |

```sh
JWT_SECRET=$(openssl rand -base64 48) ./mvnw spring-boot:run
```

## Test

Tests use a separate `opencamp_test` database (also with PostGIS):

```sh
createdb opencamp_test && psql -d opencamp_test -c "CREATE EXTENSION postgis"
./mvnw test
```

## API (Phase 1)

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` → `{token}` | public |
| GET | `/api/auth/me` | bearer |
| GET | `/api/campsites?lat=&lng=&radiusKm=` (default 50, max 500; nearest first) | public |
| GET | `/api/campsites/{id}` | public |
| POST | `/api/campsites` | bearer |
| PUT / DELETE | `/api/campsites/{id}` | creator or admin |
