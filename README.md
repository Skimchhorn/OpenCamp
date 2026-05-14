# OpenCamp — Free Campsite Discovery Platform

## 1. Project Summary

**OpenCamp** is a cross-platform camping platform that helps users discover, submit, verify, and review free or unpaid camping spots.

The goal is to solve a real camping problem: many good free campsites are hard to find because information is scattered across Google Maps reviews, Reddit, government pages, blogs, and word of mouth. Many listings are outdated, unclear, or missing important details such as road condition, legality, fire rules, cell signal, safety, and recent verification.

OpenCamp is not an Airbnb-style booking app. It does not handle payments or paid campsite reservations. Instead, it works more like a combination of Google Maps, Waze, AllTrails, and Reddit for free camping.

Users can search for free campsites on a map, add new spots, upload photos, review locations, report unsafe or illegal spots, and verify whether a campsite is still open and usable.

---

## 2. Problem Statement

Campers often struggle to find free campsites that are reliable, legal, safe, and recently verified. Existing information is often incomplete, outdated, or spread across many platforms.

Common problems include:

- Free campsites are not listed on major booking platforms.
- Good spots are shared mostly by word of mouth.
- Google Maps may show locations but not camping-specific details.
- Some spots may be closed, unsafe, private property, or not legal for camping.
- Road conditions are often unclear.
- Campers do not know if a normal car can reach the site.
- Campers do not know if there is water, toilet access, cell signal, parking, or fire restrictions.
- Information becomes outdated quickly.
- Users need backup camping spots in case one location is full or inaccessible.

OpenCamp solves this by using community-submitted data, map-based discovery, and recent verification reports.

---

## 3. Core Value Proposition

OpenCamp helps campers answer these questions before they go:

- Where can I camp for free?
- Is this campsite still open?
- Is camping allowed here?
- Can my car reach the spot?
- Is the road paved, gravel, rough, or 4x4 only?
- Is there water nearby?
- Is there a toilet?
- Is there cell signal?
- Is it quiet or crowded?
- Is it safe?
- Has someone verified this spot recently?
- Are there fire restrictions?
- What backup spots are nearby?

The main value is not just showing locations. The main value is showing **trusted, recent, camping-specific information**.

---

## 4. Product Type

OpenCamp will be built as:

1. A native mobile app for iOS and Android.
2. A separate web app for desktop and browser users.
3. A shared backend API used by both the mobile app and web app.

This is Option 2 architecture:

```txt
Mobile App: React Native + Expo + TypeScript
Web App: React + Vite + TypeScript
Backend: Java Spring Boot
Database: PostgreSQL + PostGIS
```

Both frontend clients communicate with the same Spring Boot backend.

```txt
React Native Mobile App  ─┐
                          ├── Spring Boot REST API ── PostgreSQL/PostGIS
React Web App             ─┘
```

---

## 5. Target Users

### 5.1 Campers

Campers are users who want to find free camping spots.

They can:

- Search for campsites.
- View campsites on a map.
- Filter campsites by amenities and road conditions.
- Save campsites.
- Review campsites.
- Verify campsite status.
- Report unsafe or incorrect listings.
- Upload campsite photos.

### 5.2 Contributors

Contributors are users who add new campsites or improve existing listings.

They can:

- Submit new campsite locations.
- Add photos.
- Add access notes.
- Add road condition details.
- Update campsite information.
- Submit recent verification reports.

### 5.3 Admins / Moderators

Admins manage trust and safety.

They can:

- Review reported campsites.
- Hide unsafe or illegal listings.
- Remove spam.
- Approve or reject flagged campsite submissions.
- Moderate photos and comments.
- Update campsite status.

---

## 6. Main Platform Concept

OpenCamp is inspired by:

| Platform    | Inspiration                             |
| ----------- | --------------------------------------- |
| Google Maps | Map-based location discovery            |
| Waze        | Community verification and reports      |
| AllTrails   | Outdoor filters and user reviews        |
| Reddit      | Community-shared local knowledge        |
| iOverlander | User-submitted travel/camping locations |

OpenCamp should not copy these platforms directly. The unique focus is **free campsite discovery with verification and safety information**.

---

## 7. MVP Scope

The MVP should focus on the most important features only.

### 7.1 MVP Features

The first version should include:

1. User registration and login.
2. Campsite map view.
3. Campsite search and filters.
4. Campsite detail page.
5. Add new campsite form.
6. Upload campsite photos.
7. Save favorite campsites.
8. Review campsites.
9. Verify campsite status.
10. Report campsite problems.
11. Admin moderation dashboard.

### 7.2 Features to Delay

Do not build these first:

- Payment system.
- Booking system.
- Chat system.
- Social feed.
- Push notifications.
- Full offline maps.
- AI trip planner.
- Advanced route planning.
- App Store publishing.
- Google Play publishing.

These can be added after the MVP works.

---

## 8. Main Features in Detail

## 8.1 Authentication

Users should be able to:

- Register with email and password.
- Login with email and password.
- Logout.
- Stay logged in securely.
- View and edit their profile.

Recommended auth approach:

- Spring Security on the backend.
- JWT access tokens.
- Refresh token support later.
- Secure token storage on mobile.

Mobile token storage:

- Use Expo SecureStore for sensitive tokens.
- Use AsyncStorage only for non-sensitive cached data.

Web token storage:

- Prefer secure HTTP-only cookies if possible.
- If using local storage, understand the security tradeoff.

---

## 8.2 Campsite Map

The map is the main screen.

Users should see campsite markers on the map.

Each marker should show:

- Campsite name.
- Short status.
- Rating.
- Last verified date.
- Basic amenity icons.

Example marker statuses:

```txt
Verified recently
Needs update
Reported closed
Reported unsafe
Unknown status
```

Map interactions:

- Tap marker to preview campsite.
- Tap preview to open detail page.
- Search near current location.
- Search by region or city.
- Filter by campsite attributes.

---

## 8.3 Campsite Detail Page

Each campsite should have a detail page with:

- Name.
- Photos.
- Location.
- Description.
- Road condition.
- Vehicle requirement.
- Camping type.
- Amenities.
- Safety notes.
- Fire information.
- Legal status.
- Last verified date.
- Reviews.
- Community reports.
- Save button.
- Verify button.
- Report button.

Example fields:

```txt
Name: Tamihi Creek Free Spot
Road condition: Gravel road
Vehicle required: Normal car okay in dry weather
Toilet: No
Water nearby: Yes
Cell signal: Weak
Fire allowed: Unknown / check current rules
Legal status: Needs verification
Last verified: 5 days ago
```

---

## 8.4 Add Campsite

Users can submit a new free campsite.

Required fields:

- Name.
- Coordinates.
- Description.
- Region.
- Road condition.
- Vehicle required.
- Legal status.
- At least one access note.

Optional fields:

- Photos.
- Toilet availability.
- Water availability.
- Parking information.
- Cell signal.
- Noise level.
- Crowdedness.
- Fire information.
- Maximum tent/car space.
- Safety notes.

Important: users should not be encouraged to list illegal camping spots. The form should include a warning:

> Only submit locations where camping is allowed or reasonably believed to be allowed. Do not submit private property, restricted areas, or unsafe locations.

---

## 8.5 Community Verification

This is one of the most important features.

Users can submit a verification after visiting a campsite.

Verification questions:

- Is the spot still open?
- Is it still free?
- Did camping seem allowed?
- Was the road accessible?
- Was the spot clean?
- Was it crowded?
- Did you feel safe?
- Was there cell signal?
- Were there fire ban signs?
- When did you visit?

This creates a verification history.

Example statuses:

```txt
Verified 3 days ago
Verified 2 weeks ago
Needs update: not verified for 8 months
Reported closed
Reported unsafe
Reported private property
```

This feature makes the app more useful than a normal map.

---

## 8.6 Reports and Moderation

Users can report bad listings.

Report reasons:

- Not free.
- Private property.
- Camping not allowed.
- Closed.
- Unsafe.
- Wrong location.
- Fake listing.
- Spam.
- Duplicate campsite.
- Inappropriate photo.

Admin actions:

- Keep listing visible.
- Mark as needs verification.
- Hide listing.
- Delete listing.
- Merge duplicate listing.
- Update legal status.
- Ban abusive user later.

Moderation is important because user-generated map apps can become inaccurate or unsafe.

---

## 8.7 Reviews

Users can leave reviews after visiting a campsite.

Review fields:

- Rating from 1 to 5.
- Written review.
- Visit date.
- Road condition rating.
- Cleanliness rating.
- Safety rating.
- Crowdedness rating.

Example review:

```txt
Visited in May. Road was okay for a small SUV. Quiet at night. No toilet. Weak cell signal. Please pack out garbage.
```

---

## 8.8 Saved Campsites

Users can save campsites for future trips.

Saved campsite features:

- Save campsite.
- Remove from saved list.
- Organize saved campsites into trip lists later.
- View saved campsites offline later.

For MVP, keep it simple:

```txt
User saves campsite → campsite appears in saved list
```

---

## 8.9 Basic Trip Planning

This can be a version 2 feature.

Users can create a trip and add multiple campsite options.

Example:

```txt
Trip: May Long Weekend Camping
Primary spot: Spot A
Backup spot 1: Spot B
Backup spot 2: Spot C
```

Future trip features:

- Packing checklist.
- Shared trip with friends.
- Assign items to people.
- Weather reminder.
- Offline saved trip details.

---

## 9. Tech Stack

## 9.1 Mobile App

```txt
React Native
Expo
TypeScript
Expo Router
React Query / TanStack Query
React Hook Form
Zod
Expo SecureStore
AsyncStorage
Mapbox / rnmapbox
Expo ImagePicker
Expo Location
```

### Why React Native + Expo?

React Native is a strong choice because the product is mobile-first. Campers will likely use the app while traveling, driving, hiking, or checking nearby spots.

Expo helps simplify development, builds, permissions, and device APIs.

Mobile app features:

- GPS location.
- Camera upload.
- Map screen.
- Saved spots.
- Offline cached data later.
- iOS and Android support.

---

## 9.2 Web App

```txt
React
Vite
TypeScript
React Router
TanStack Query
React Hook Form
Zod
Tailwind CSS
shadcn/ui or Material UI
Mapbox GL JS
```

### Why separate React web app?

A separate web app gives desktop users a better experience.

The web app can be useful for:

- Searching campsites on a larger screen.
- Reading reviews.
- Adding campsite details.
- Admin moderation.
- Managing reports.
- Viewing photos.

The web app and mobile app use the same backend API.

---

## 9.3 Backend

```txt
Java
Spring Boot
Spring Web
Spring Security
JWT Authentication
Spring Data JPA
Hibernate
Bean Validation
Maven or Gradle
```

### Why Spring Boot?

Spring Boot is a strong backend framework for resume value. It is common in enterprise software jobs and works well for REST APIs, authentication, database access, and structured backend development.

Backend responsibilities:

- User authentication.
- Campsite APIs.
- Review APIs.
- Verification APIs.
- Report APIs.
- Admin APIs.
- Photo upload API.
- Geospatial search API.

---

## 9.4 Database

```txt
PostgreSQL
PostGIS
```

### Why PostgreSQL + PostGIS?

PostgreSQL is a strong relational database.

PostGIS adds geospatial features, which are perfect for map-based search.

PostGIS can support:

- Find campsites near a user.
- Sort campsites by distance.
- Search within a map boundary.
- Store latitude/longitude as geographic points.
- Filter campsites within a radius.

Example features:

```txt
Find campsites within 50 km of Vancouver
Find campsites near my current GPS location
Show all campsites inside the current map view
Sort by nearest campsite
```

---

## 9.5 Storage

Recommended first choice:

```txt
Cloudinary
```

Reason:

- Easier setup.
- Image upload is simple.
- Image resizing and optimization are built in.
- Good for MVP.

Advanced resume choice later:

```txt
AWS S3
```

Reason:

- More enterprise-friendly.
- Good resume keyword.
- Common in real production systems.

Recommended plan:

```txt
MVP: Cloudinary
Later: AWS S3 with pre-signed URLs
```

---

## 9.6 Maps

Mobile:

```txt
@rnmapbox/maps
```

Web:

```txt
Mapbox GL JS
```

Map features:

- Display campsite markers.
- Show user location.
- Search by map bounds.
- Cluster campsite markers later.
- Show campsite details from marker.
- Filter markers by amenities and status.

---

## 9.7 Testing

Backend testing:

```txt
JUnit
Mockito
Spring Boot Test
Testcontainers later
```

Mobile testing:

```txt
Jest
React Native Testing Library
```

Web testing:

```txt
Jest or Vitest
React Testing Library
Playwright
```

End-to-end testing:

```txt
Playwright for web app
Manual device testing for mobile first
Detox later if needed
```

CI/CD:

```txt
GitHub Actions
```

Recommended CI checks:

- Backend tests.
- Web tests.
- TypeScript check.
- Lint.
- Build check.

---

## 9.8 Deployment

Backend deployment options:

```txt
Render
Fly.io
Railway
AWS Elastic Beanstalk
AWS ECS later
```

Database options:

```txt
Supabase Postgres with PostGIS
Neon Postgres with PostGIS if supported
Railway PostgreSQL
Render PostgreSQL
AWS RDS PostgreSQL later
```

Web app deployment:

```txt
Vercel
Netlify
Cloudflare Pages
```

Mobile build:

```txt
EAS Build
```

Containerization:

```txt
Docker
Docker Compose for local development
```

---

## 10. Recommended Final Stack

```txt
Mobile App: React Native + Expo + TypeScript
Web App: React + Vite + TypeScript
Backend: Java Spring Boot
Security: Spring Security + JWT
Database: PostgreSQL + PostGIS
ORM: Spring Data JPA / Hibernate
Maps: Mapbox for mobile and web
Storage: Cloudinary first, AWS S3 later
Testing: JUnit, Mockito, Jest, React Native Testing Library, Playwright
DevOps: Docker + GitHub Actions
Deployment: Render/Fly.io for backend, Vercel/Netlify for web
Mobile Build: EAS Build
```

---

## 11. System Architecture

```txt
                 ┌──────────────────────────┐
                 │   React Native Mobile    │
                 │   Expo + TypeScript      │
                 └────────────┬─────────────┘
                              │
                              │ REST API / JSON
                              │
                 ┌────────────▼─────────────┐
                 │   Java Spring Boot API   │
                 │   Spring Security + JWT  │
                 └────────────┬─────────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
     ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
     │ PostgreSQL     │ │ Cloudinary   │ │ Mapbox APIs  │
     │ + PostGIS      │ │ or AWS S3    │ │              │
     └────────────────┘ └──────────────┘ └──────────────┘
                              ▲
                              │ REST API / JSON
                              │
                 ┌────────────┴─────────────┐
                 │      React Web App       │
                 │   Vite + TypeScript      │
                 └──────────────────────────┘
```

---

## 12. Suggested Folder Structure

Use a monorepo:

```txt
opencamp/
  apps/
    mobile/
      src/
        app/
        components/
        screens/
        api/
        hooks/
        types/
        utils/
    web/
      src/
        pages/
        components/
        api/
        hooks/
        types/
        utils/
  backend/
    src/main/java/com/opencamp/
      auth/
      user/
      campsite/
      review/
      verification/
      report/
      upload/
      admin/
      common/
    src/main/resources/
      application.yml
  docker-compose.yml
  README.md
```

Alternative: use separate repositories.

For resume and GitHub, a monorepo may look cleaner because the whole system is in one place.

---

## 13. Backend API Design

## 13.1 Authentication APIs

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## 13.2 Campsite APIs

```txt
GET    /api/campsites
GET    /api/campsites/{id}
POST   /api/campsites
PUT    /api/campsites/{id}
DELETE /api/campsites/{id}
```

Query examples:

```txt
GET /api/campsites?lat=49.2827&lng=-123.1207&radiusKm=50
GET /api/campsites?region=Vancouver&toilet=true&water=true
GET /api/campsites?status=VERIFIED_RECENTLY
```

## 13.3 Photo APIs

```txt
POST   /api/campsites/{id}/photos
GET    /api/campsites/{id}/photos
DELETE /api/photos/{photoId}
```

## 13.4 Review APIs

```txt
POST /api/campsites/{id}/reviews
GET  /api/campsites/{id}/reviews
PUT  /api/reviews/{reviewId}
DELETE /api/reviews/{reviewId}
```

## 13.5 Verification APIs

```txt
POST /api/campsites/{id}/verifications
GET  /api/campsites/{id}/verifications
```

## 13.6 Report APIs

```txt
POST /api/campsites/{id}/reports
GET  /api/admin/reports
PUT  /api/admin/reports/{reportId}/resolve
```

## 13.7 Saved Campsite APIs

```txt
POST   /api/me/saved-campsites/{campsiteId}
GET    /api/me/saved-campsites
DELETE /api/me/saved-campsites/{campsiteId}
```

---

## 14. Database Schema Draft

## 14.1 users

```txt
id
email
password_hash
role
created_at
updated_at
```

Roles:

```txt
USER
ADMIN
```

## 14.2 profiles

```txt
id
user_id
username
display_name
avatar_url
bio
created_at
updated_at
```

## 14.3 campsites

```txt
id
name
description
latitude
longitude
location_point
region
road_condition
vehicle_required
camping_type
toilet_available
water_available
cell_signal
fire_allowed
parking_available
legal_status
status
created_by
last_verified_at
created_at
updated_at
```

Possible `road_condition` values:

```txt
PAVED
GRAVEL
ROUGH_GRAVEL
DIRT
MUDDY
FOUR_BY_FOUR_ONLY
UNKNOWN
```

Possible `vehicle_required` values:

```txt
ANY_CAR
SUV_RECOMMENDED
FOUR_BY_FOUR_REQUIRED
WALK_IN_ONLY
UNKNOWN
```

Possible `legal_status` values:

```txt
OFFICIAL_FREE_SITE
PUBLIC_LAND_DISPERSED
NEEDS_VERIFICATION
UNKNOWN
NOT_ALLOWED
PRIVATE_PROPERTY
CLOSED
```

Possible `status` values:

```txt
VERIFIED_RECENTLY
NEEDS_UPDATE
REPORTED_CLOSED
REPORTED_UNSAFE
REPORTED_ILLEGAL
HIDDEN
```

## 14.4 campsite\_photos

```txt
id
campsite_id
uploaded_by
image_url
public_id
caption
created_at
```

## 14.5 campsite\_reviews

```txt
id
campsite_id
user_id
rating
review_text
visited_at
road_rating
cleanliness_rating
safety_rating
crowdedness_rating
created_at
updated_at
```

## 14.6 campsite\_verifications

```txt
id
campsite_id
user_id
is_open
is_free
camping_allowed
road_accessible
felt_safe
was_clean
was_crowded
cell_signal
fire_ban_sign_seen
visited_at
notes
created_at
```

## 14.7 campsite\_reports

```txt
id
campsite_id
reported_by
reason
description
status
resolved_by
resolved_at
created_at
```

Report reasons:

```txt
NOT_FREE
PRIVATE_PROPERTY
CAMPING_NOT_ALLOWED
CLOSED
UNSAFE
WRONG_LOCATION
FAKE_LISTING
SPAM
DUPLICATE
INAPPROPRIATE_PHOTO
OTHER
```

Report statuses:

```txt
OPEN
REVIEWING
RESOLVED
REJECTED
```

## 14.8 saved\_campsites

```txt
id
user_id
campsite_id
created_at
```

## 14.9 trips

Version 2 table.

```txt
id
user_id
name
start_date
end_date
notes
created_at
updated_at
```

## 14.10 trip\_campsites

Version 2 table.

```txt
id
trip_id
campsite_id
priority
notes
created_at
```

---

## 15. Key User Flows

## 15.1 Find a Campsite

```txt
User opens app
App asks for location permission
User sees nearby campsite markers
User filters by road condition and amenities
User taps campsite marker
User opens campsite detail page
User saves campsite
```

## 15.2 Add a Campsite

```txt
User logs in
User taps Add Campsite
User selects location on map
User enters campsite details
User uploads photos
User submits listing
Backend saves listing as NEEDS_VERIFICATION
Other users can verify it later
```

## 15.3 Verify a Campsite

```txt
User visits campsite
User opens campsite detail page
User taps Verify
User answers verification questions
Backend updates verification history
Campsite last_verified_at is updated
Campsite status may become VERIFIED_RECENTLY
```

## 15.4 Report a Campsite

```txt
User notices bad listing
User taps Report
User selects reason
User adds notes
Admin sees report in dashboard
Admin resolves report
Campsite status is updated if needed
```

---

## 16. Security Considerations

Important security features:

- Hash passwords using a secure password encoder.
- Use JWT authentication.
- Protect admin routes.
- Validate all request bodies.
- Validate file upload types.
- Limit photo upload size.
- Prevent users from editing other users' content.
- Rate limit reports and campsite submissions later.
- Sanitize user-generated text if rendering HTML.
- Store sensitive mobile tokens in SecureStore.
- Do not expose storage secrets to the frontend.

---

## 17. Trust and Safety Design

Because the app contains user-submitted outdoor locations, trust and safety are important.

The app should include:

- Report button on every campsite.
- Legal status field.
- Last verified date.
- Warning if not verified recently.
- Admin moderation tools.
- Disclaimer to check local rules.
- Leave No Trace reminder.
- No encouragement of trespassing.
- No listing of private property without permission.

Suggested disclaimer:

> OpenCamp relies on community-submitted information. Always check local laws, fire restrictions, road conditions, and land access rules before camping. Pack out all garbage and respect the environment.

---

## 18. MVP Development Plan

## Phase 1: Backend Foundation

Build:

- Spring Boot project setup.
- PostgreSQL connection.
- User entity.
- Campsite entity.
- Authentication endpoints.
- JWT security.
- Campsite CRUD APIs.
- Basic PostGIS radius search.

Goal:

```txt
User can register, login, and create/search campsites through the API.
```

## Phase 2: Mobile App MVP

Build:

- Expo setup.
- Login screen.
- Register screen.
- Map screen.
- Campsite detail screen.
- Add campsite screen.
- Save campsite screen.

Goal:

```txt
User can use the mobile app to find and add campsites.
```

## Phase 3: Web App MVP

Build:

- Vite React setup.
- Login page.
- Campsite map page.
- Campsite detail page.
- Add campsite page.
- Saved campsites page.

Goal:

```txt
Desktop users can search and contribute campsites.
```

## Phase 4: Photos and Reviews

Build:

- Cloudinary upload flow.
- Campsite photos.
- Reviews.
- Ratings.
- Verification reports.

Goal:

```txt
Campsites become more useful through photos, reviews, and recent verification.
```

## Phase 5: Reports and Admin Moderation

Build:

- Report campsite flow.
- Admin reports dashboard.
- Admin update campsite status.
- Hide unsafe listings.

Goal:

```txt
The platform has basic trust and safety workflows.
```

## Phase 6: Testing and Deployment

Build:

- Backend unit tests.
- Backend integration tests.
- Web E2E tests with Playwright.
- GitHub Actions CI.
- Docker setup.
- Deploy backend.
- Deploy web app.
- Build mobile app with EAS.

Goal:

```txt
Project is demo-ready and resume-ready.
```

---

## 19. Stretch Features

After MVP, add:

### 19.1 Offline Saved Campsites

Users can save campsite details for offline access.

Useful for camping areas with weak signal.

### 19.2 Trip Planner

Users can group campsites into a trip.

Example:

```txt
Primary campsite
Backup campsite 1
Backup campsite 2
```

### 19.3 Packing Checklist

Users can create or generate packing checklists.

### 19.4 Weather Integration

Show weather near the campsite.

### 19.5 Fire Restriction Links

Show links or reminders to check local fire restrictions.

### 19.6 AI Camping Assistant

AI can help with:

- Packing list.
- Meal plan.
- Beginner advice.
- Weather-based reminders.
- Backup campsite planning.

### 19.7 Reputation System

Users earn trust points for useful contributions.

Example:

```txt
+1 for review
+2 for verified visit
+3 for approved campsite submission
-5 for false report
```

### 19.8 Duplicate Detection

Prevent users from adding the same campsite twice.

### 19.9 Clustering Map Markers

Group markers when zoomed out.

### 19.10 Push Notifications

Notify users when:

- A saved campsite is reported closed.
- A saved campsite is recently verified.
- Fire warning information is added.

---

## 20. Resume Positioning

## 20.1 Project Title

```txt
OpenCamp — Cross-Platform Free Campsite Discovery App
```

## 20.2 Short Resume Description

```txt
Built a cross-platform campsite discovery platform using React Native, Expo, React, Java Spring Boot, PostgreSQL/PostGIS, and Mapbox to help users discover, submit, verify, and report free camping locations.
```

## 20.3 Resume Bullets

```txt
Built a cross-platform free campsite discovery app using React Native, Expo, React, TypeScript, Java Spring Boot, PostgreSQL/PostGIS, and Mapbox, supporting both mobile and web users through a shared REST API.
```

```txt
Implemented geospatial search APIs with Spring Boot and PostGIS, enabling users to find nearby campsites and filter by distance, road condition, amenities, and recent verification status.
```

```txt
Designed relational database models for campsites, reviews, photos, saved spots, user reports, and verification history using PostgreSQL and Spring Data JPA.
```

```txt
Integrated native mobile features including GPS-based search, camera photo uploads, secure token storage, and map-based campsite discovery with React Native and Expo.
```

```txt
Built moderation workflows for user-generated campsite reports, allowing admins to review unsafe, closed, duplicate, or illegal campsite listings.
```

```txt
Added automated backend and frontend tests using JUnit, Mockito, Jest, and Playwright, with CI checks running through GitHub Actions.
```

## 20.4 Interview Explanation

A strong explanation:

> I built OpenCamp because I noticed that free camping spots are hard to find and often not listed on major platforms. The app lets users discover, submit, verify, and report free campsite locations. I chose React Native and Expo because the product is mobile-first and needs GPS and camera features. I used Spring Boot for the backend to build a structured REST API, and PostgreSQL with PostGIS for location-based search. The most important feature is community verification, because campsite information becomes unreliable if it is outdated.

---

## 21. Why This Project Is Strong

This project is strong because it is not just a basic CRUD app.

It includes:

- Cross-platform mobile development.
- Separate web app development.
- Backend API design.
- Authentication.
- Geospatial search.
- User-generated content.
- Map-based UI.
- Photo upload.
- Community verification.
- Moderation workflow.
- Testing.
- Deployment.

It also matches a real-world problem that you personally experienced while camping.

That makes it easier to explain in interviews.

---

## 22. Final Recommended Build Order

Build in this exact order:

1. Backend project setup.
2. PostgreSQL + PostGIS setup.
3. User auth.
4. Campsite table and API.
5. Radius search API.
6. React Native Expo app setup.
7. Mobile login/register.
8. Mobile map screen.
9. Add campsite from mobile.
10. Campsite detail page.
11. Save campsite.
12. React Vite web app setup.
13. Web map page.
14. Web campsite detail page.
15. Photo upload.
16. Reviews.
17. Verification system.
18. Reports.
19. Admin dashboard.
20. Testing.
21. Docker.
22. Deployment.
23. Resume polish.

---

## 23. Final Stack Summary

```txt
Mobile App:
- React Native
- Expo
- TypeScript
- Expo Router
- Expo Location
- Expo ImagePicker
- Expo SecureStore
- Mapbox / rnmapbox

Web App:
- React
- Vite
- TypeScript
- React Router
- TanStack Query
- Tailwind CSS
- Mapbox GL JS

Backend:
- Java
- Spring Boot
- Spring Web
- Spring Security
- JWT
- Spring Data JPA
- Hibernate

Database:
- PostgreSQL
- PostGIS

Storage:
- Cloudinary for MVP
- AWS S3 later

Testing:
- JUnit
- Mockito
- Jest
- React Native Testing Library
- Playwright

DevOps:
- Docker
- Docker Compose
- GitHub Actions

Deployment:
- Backend: Render / Fly.io / AWS
- Web: Vercel / Netlify
- Mobile: EAS Build
```

---

## 24. One-Sentence Project Pitch

**OpenCamp is a cross-platform mobile and web app that helps campers discover, submit, verify, and report free campsite locations using map-based search, community verification, and geospatial data.**

