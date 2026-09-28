-- Run once to initialize the database:
-- psql postgresql://dolbom:dolbom@localhost:5432/dolbom < schema.sql

CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     VARCHAR(20) NOT NULL,
  provider_id  VARCHAR(255) NOT NULL,
  email        VARCHAR(255),
  name         VARCHAR(100),
  profile_image TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_id)
);
