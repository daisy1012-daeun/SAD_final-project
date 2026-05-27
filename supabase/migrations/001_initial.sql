-- ============================================================
-- 001_initial.sql  –  대학교 분리배출 도우미 초기 스키마
-- ============================================================

-- 학교/단과대/학과 계층
CREATE TABLE schools (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

CREATE TABLE colleges (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  name      text NOT NULL
);

CREATE TABLE departments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid REFERENCES colleges(id) ON DELETE CASCADE,
  name       text NOT NULL
);

-- 사용자 (Supabase Auth 연동)
CREATE TABLE users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id_hash text NOT NULL UNIQUE,   -- HMAC-SHA256(학번+salt)
  student_id_enc  text NOT NULL,          -- AES-256-GCM 암호화된 학번
  email_hash      text NOT NULL UNIQUE,
  email_enc       text NOT NULL,
  name_enc        text,                   -- AES-256-GCM 암호화된 이름
  department_id   uuid REFERENCES departments(id),
  total_points    int  NOT NULL DEFAULT 0,
  is_admin        bool NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 포인트 이벤트 로그
CREATE TABLE point_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source     text NOT NULL CHECK (source IN ('barcode','mission','invite','bonus')),
  points     int  NOT NULL,
  meta       jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON point_events (user_id, created_at DESC);

-- 바코드 스캔 이력
CREATE TABLE scan_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barcode        text NOT NULL,
  scanned_at     timestamptz NOT NULL DEFAULT now(),
  point_event_id uuid REFERENCES point_events(id)
);
CREATE INDEX ON scan_logs (user_id, scanned_at DESC);
CREATE INDEX ON scan_logs (user_id, barcode, scanned_at DESC);

-- 일일 포인트 집계 (하루 100포인트 한도 체크용)
CREATE TABLE daily_point_caps (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date    date NOT NULL,
  earned  int  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- 미션 정의
CREATE TABLE missions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  target_count int  NOT NULL DEFAULT 1,
  is_active    bool NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 사용자 미션 달성
CREATE TABLE user_missions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES missions(id),
  date       date NOT NULL,
  progress   int  NOT NULL DEFAULT 0,
  completed  bool NOT NULL DEFAULT false,
  reward_pts int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id, date)
);

-- 친구 초대
CREATE TABLE invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL REFERENCES users(id),
  invitee_id uuid REFERENCES users(id),
  code       text NOT NULL UNIQUE,
  used       bool NOT NULL DEFAULT false,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 연락처 (암호화 필드 포함)
CREATE TABLE contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name_enc   text NOT NULL,   -- AES-256-GCM
  phone_enc  text NOT NULL,   -- AES-256-GCM
  phone_hash text NOT NULL,   -- HMAC-SHA256, 검색용
  label      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON contacts (user_id);
CREATE INDEX ON contacts (phone_hash);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_point_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_self"             ON users             USING (id = auth.uid());
CREATE POLICY "point_events_self"      ON point_events      USING (user_id = auth.uid());
CREATE POLICY "scan_logs_self"         ON scan_logs         USING (user_id = auth.uid());
CREATE POLICY "daily_point_caps_self"  ON daily_point_caps  USING (user_id = auth.uid());
CREATE POLICY "user_missions_self"     ON user_missions     USING (user_id = auth.uid());
CREATE POLICY "invites_self"           ON invites           USING (inviter_id = auth.uid() OR invitee_id = auth.uid());
CREATE POLICY "contacts_self"          ON contacts          USING (user_id = auth.uid());

-- schools/colleges/departments는 공개 읽기
ALTER TABLE schools     ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_read"     ON schools     FOR SELECT USING (true);
CREATE POLICY "colleges_read"    ON colleges    FOR SELECT USING (true);
CREATE POLICY "departments_read" ON departments FOR SELECT USING (true);
CREATE POLICY "missions_read"    ON missions    FOR SELECT USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
