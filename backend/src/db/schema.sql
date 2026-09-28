CREATE TYPE schedule_type AS ENUM ('child_school', 'parent_work', 'care');
CREATE TYPE care_provider_type AS ENUM ('school_care', 'community_care', 'child_care_service', 'academy', 'babysitter');

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE children (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  grade             INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 6),
  commute_minutes   INTEGER NOT NULL DEFAULT 20,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 아이/부모의 반복 주간 일정 패턴
CREATE TABLE schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id      UUID REFERENCES children(id) ON DELETE CASCADE, -- NULL이면 부모 일정
  type          schedule_type NOT NULL,
  days_of_week  INTEGER[] NOT NULL, -- 1=월 2=화 3=수 4=목 5=금 6=토 7=일
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 특정 날짜만 다른 경우
CREATE TABLE schedule_exceptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id     UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  exception_date  DATE NOT NULL,
  start_time      TIME,
  end_time        TIME,
  is_cancelled    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, exception_date)
);

CREATE TABLE care_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  type          care_provider_type NOT NULL,
  address       VARCHAR(500) NOT NULL,
  latitude      DECIMAL(10, 8),
  longitude     DECIMAL(11, 8),
  min_grade     INTEGER CHECK (min_grade BETWEEN 1 AND 6),
  max_grade     INTEGER CHECK (max_grade BETWEEN 1 AND 6),
  open_time     TIME NOT NULL,
  close_time    TIME NOT NULL,
  cost_per_hour INTEGER DEFAULT 0,
  phone         VARCHAR(20),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
