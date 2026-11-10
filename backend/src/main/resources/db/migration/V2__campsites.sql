CREATE TABLE campsites (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name               VARCHAR(200)     NOT NULL,
    description        TEXT             NOT NULL,
    latitude           DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude          DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    -- Derived from lat/lng so the app never writes it; used for radius search.
    location_point     GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS
                           (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
    region             VARCHAR(100)     NOT NULL,
    road_condition     VARCHAR(30)      NOT NULL,
    vehicle_required   VARCHAR(30)      NOT NULL,
    camping_type       VARCHAR(50),
    toilet_available   BOOLEAN,
    water_available    BOOLEAN,
    cell_signal        VARCHAR(50),
    fire_allowed       BOOLEAN,
    parking_available  BOOLEAN,
    legal_status       VARCHAR(30)      NOT NULL,
    status             VARCHAR(30)      NOT NULL,
    created_by         BIGINT           NOT NULL REFERENCES users (id),
    last_verified_at   TIMESTAMPTZ,
    created_at         TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX campsites_location_point_idx ON campsites USING GIST (location_point);
CREATE INDEX campsites_created_by_idx ON campsites (created_by);
