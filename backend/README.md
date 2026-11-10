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

## API

JSON in and out; send `Authorization: Bearer <token>` where auth is needed. Errors use Spring's default error body with the HTTP status.

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` `{email,password}` → `{token}` | public |
| GET | `/api/auth/me` → `{id,email,role}` | bearer |
| GET | `/api/campsites?lat=&lng=&radiusKm=&region=&toilet=&water=&fire=&status=` (all optional; radius default 50, max 500 km; nearest first with lat/lng, else newest; max 100) | public |
| GET | `/api/campsites/{id}` (hidden sites: admin only) | public |
| POST | `/api/campsites` | bearer |
| PUT / DELETE | `/api/campsites/{id}` | creator or admin |
| GET / POST | `/api/campsites/{id}/reviews` (one per user) | public / bearer |
| PUT / DELETE | `/api/reviews/{reviewId}` | author or admin |
| GET / POST | `/api/campsites/{id}/verifications` | public / bearer |
| GET / POST | `/api/campsites/{id}/photos` (multipart `file` ≤ 5 MB JPEG/PNG/WebP, optional `caption`) | public / bearer |
| DELETE | `/api/photos/{photoId}` | uploader or admin |
| POST | `/api/campsites/{id}/reports` `{reason,description}` | bearer |
| GET / POST / DELETE | `/api/me/saved-campsites[/{campsiteId}]` | bearer |
| GET | `/api/admin/reports?status=OPEN` | admin |
| PUT | `/api/admin/reports/{reportId}/resolve` `{status}` | admin |
| PATCH | `/api/admin/campsites/{id}` `{status?, legalStatus?}` (e.g. `HIDDEN`) | admin |

Photo `imageUrl` values are paths on the API origin (`/uploads/…`).

### Campsite status

New submissions start as `NEEDS_UPDATE` with no `lastVerifiedAt`. The newest verification sets it: closed → `REPORTED_CLOSED`, camping not allowed → `REPORTED_ILLEGAL`, felt unsafe → `REPORTED_UNSAFE`, not free → `NEEDS_UPDATE`, otherwise `VERIFIED_RECENTLY`. `VERIFIED_RECENTLY` reads as `NEEDS_UPDATE` once the last verification is over 90 days old. Only admins set or clear `HIDDEN`.

### Making an admin

There is no sign-up path for admins. Promote an existing user, then log in again to get a token with the new role:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```
