-- Denormalized so map markers can show ratings without aggregating per request.
ALTER TABLE campsites
    ADD COLUMN rating_avg   DOUBLE PRECISION,
    ADD COLUMN review_count INT NOT NULL DEFAULT 0;

ALTER TABLE campsites DROP CONSTRAINT campsites_created_by_fkey,
    ADD CONSTRAINT campsites_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE;

CREATE TABLE saved_campsites (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    campsite_id BIGINT      NOT NULL REFERENCES campsites (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, campsite_id)
);

CREATE TABLE campsite_reviews (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campsite_id        BIGINT      NOT NULL REFERENCES campsites (id) ON DELETE CASCADE,
    user_id            BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rating             INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text        TEXT,
    visited_at         DATE,
    road_rating        INT CHECK (road_rating BETWEEN 1 AND 5),
    cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    safety_rating      INT CHECK (safety_rating BETWEEN 1 AND 5),
    crowdedness_rating INT CHECK (crowdedness_rating BETWEEN 1 AND 5),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (campsite_id, user_id)
);

CREATE TABLE campsite_verifications (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campsite_id        BIGINT      NOT NULL REFERENCES campsites (id) ON DELETE CASCADE,
    user_id            BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    is_open            BOOLEAN     NOT NULL,
    is_free            BOOLEAN     NOT NULL,
    camping_allowed    BOOLEAN     NOT NULL,
    road_accessible    BOOLEAN,
    felt_safe          BOOLEAN     NOT NULL,
    was_clean          BOOLEAN,
    was_crowded        BOOLEAN,
    cell_signal        VARCHAR(50),
    fire_ban_sign_seen BOOLEAN,
    visited_at         DATE        NOT NULL,
    notes              TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX campsite_verifications_campsite_idx ON campsite_verifications (campsite_id, visited_at DESC);

CREATE TABLE campsite_reports (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campsite_id BIGINT      NOT NULL REFERENCES campsites (id) ON DELETE CASCADE,
    reported_by BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reason      VARCHAR(30) NOT NULL,
    description TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolved_by BIGINT REFERENCES users (id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX campsite_reports_status_idx ON campsite_reports (status, created_at);

CREATE TABLE campsite_photos (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campsite_id BIGINT       NOT NULL REFERENCES campsites (id) ON DELETE CASCADE,
    uploaded_by BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    image_url   VARCHAR(500) NOT NULL,
    public_id   VARCHAR(200) NOT NULL,
    caption     VARCHAR(300),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX campsite_photos_campsite_idx ON campsite_photos (campsite_id);
