# PRD: 대학교 분리배출 도우미 앱

> **스택**: Next.js (App Router) + TypeScript · Supabase (Postgres) · Vercel  
> **버전**: 1.0.0 · **작성일**: 2026-05-27

---

## 목차

1. [문제 정의](#1-문제-정의)
2. [사용자 스토리](#2-사용자-스토리)
3. [화면 목록](#3-화면-목록)
4. [API 설계](#4-api-설계)
5. [DB 설계](#5-db-설계)
6. [암호화 설계](#6-암호화-설계)
7. [에러 및 엣지 케이스](#7-에러-및-엣지-케이스)
8. [테스트 전략](#8-테스트-전략)
9. [배포 전략](#9-배포-전략)
10. [스코프 및 제외 항목](#10-스코프-및-제외-항목)

---

## 1. 문제 정의

### 배경

대학교 캠퍼스 내 분리배출 오류율은 여전히 높다. 학생들은 계란 껍질, 치킨 뼈처럼 헷갈리는 품목의 분리 기준을 모르거나, 라벨 제거·내용물 세척 등 올바른 전처리 절차를 건너뛰는 경우가 많다.

### 핵심 문제

| # | 문제 | 영향 |
|---|------|------|
| P1 | 품목별 분리배출 기준 인지 부족 | 재활용 불가 처리 → 환경 비용 증가 |
| P2 | 올바른 전처리(세척·라벨 제거) 미흡 | 오염 재활용품 → 처리 비용 증가 |
| P3 | 동기 부여 수단 없음 | 인지해도 실천하지 않음 |
| P4 | 헷갈리는 품목 즉각 안내 수단 없음 | 분류 포기 또는 오분류 |

### 목표

바코드 스캔 + 체크리스트 + 포인트 게이미피케이션을 결합해 학생들이 **올바르게** 분리배출하도록 행동 변화를 유도한다. 단과대별 경쟁 리더보드를 통해 집단 참여를 이끈다.

---

## 2. 사용자 스토리

### 2.1 인증·지역 설정

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-01 | 신규 학생 | 학번으로 회원가입 | 학교 인증된 계정을 만들 수 있다 |
| US-02 | 학생 | 학교 > 단과대 > 학과를 설정 | 단과대별 리더보드에 참여할 수 있다 |
| US-03 | 학생 | 암호화된 로그인 | 내 정보가 안전하게 보호된다 |

### 2.2 바코드 스캔 & 포인트

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-04 | 학생 | 카메라로 바코드/QR 스캔 | 1포인트를 적립할 수 있다 |
| US-05 | 학생 | 하루 최대 100포인트 적립 | 과도한 적립을 방지하고 공정성이 유지된다 |
| US-06 | 학생 | 바코드 없는 품목을 LLM에 사진으로 질의 | 모든 품목의 분리 기준을 알 수 있다 |

### 2.3 체크리스트 & 음성 안내

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-07 | 학생 | 재질별 전처리 체크리스트 확인 | 올바른 전처리 후 배출할 수 있다 |
| US-08 | 학생 | 헷갈리는 품목의 음성 안내 청취 | 텍스트 없이도 분리 기준을 이해한다 |
| US-09 | 학생 | 음성 안내 재생 중 일시정지/재개 | 안내를 들으면서 직접 처리하다가 잠깐 멈출 수 있다 |
| US-10 | 학생 | 음성 안내 처음부터 다시 듣기 | 놓친 내용을 다시 확인할 수 있다 |

### 2.4 소셜 & 미션

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-11 | 학생 | 친구/룸메이트를 초대 | 양쪽 모두 500 보너스 포인트를 받는다 |
| US-12 | 학생 | 오늘의 분리배출 미션 달성 | 1·3·5·10 중 랜덤 포인트를 추가로 받는다 |
| US-13 | 학생 | 단과대별 리더보드 조회 | 우리 단과대의 순위를 확인하고 경쟁한다 |

---

## 3. 화면 목록

```
/                          → 랜딩 / 스플래시
/auth/signup               → 회원가입 (학번, 이메일, 비밀번호, 소속 설정)
/auth/login                → 로그인
/onboarding                → 학교 > 단과대 > 학과 선택 (최초 1회)

/home                      → 메인 대시보드 (오늘 포인트, 미션, 스캔 버튼)
/scan                      → 카메라 바코드/QR 스캔
/scan/checklist            → 재질별 체크리스트
/scan/voice                → 음성 안내 페이지 (재생/일시정지/재개/처음부터)
/scan/llm                  → 바코드 없는 품목 LLM 질의

/missions                  → 오늘의 미션 목록 & 달성 현황
/points                    → 포인트 내역 (무한 스크롤 선택)
/invite                    → 친구 초대 링크 생성 & 공유
/leaderboard               → 단과대별 리더보드

/profile                   → 내 정보 (학번 마스킹, 소속, 포인트 합계)
/profile/settings          → 소속 변경, 알림 설정, 로그아웃
/admin                     → (관리자 전용) 미션 관리, 통계
```

---

## 4. API 설계

모든 엔드포인트는 `app/api/` 하위 Next.js Route Handler. 인증은 Supabase JWT (`Authorization: Bearer <token>`).

### 4.1 인증

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/signup` | 학번·이메일·비밀번호·소속으로 회원가입 |
| POST | `/api/auth/login` | 이메일·비밀번호 로그인 → JWT 발급 |
| POST | `/api/auth/logout` | 세션 만료 |
| PATCH | `/api/auth/profile` | 소속(단과대/학과) 수정 |

### 4.2 스캔 & 포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/scan/barcode` | 바코드값 수신 → 포인트 적립, 체크리스트 반환 |
| POST | `/api/scan/image` | 이미지 업로드 → LLM 분류 결과 반환 |
| GET | `/api/points` | 내 포인트 내역 조회 (cursor 기반 페이지네이션) |
| GET | `/api/points/summary` | 오늘 적립량, 총합 |

**POST `/api/scan/barcode` 요청/응답 예시**

```jsonc
// Request
{ "barcode": "8801234567890" }

// Response 200
{
  "product": { "name": "페트병 500ml", "material": "PET" },
  "checklist": [
    { "id": "c1", "label": "라벨을 떼었나요?", "required": true },
    { "id": "c2", "label": "내용물을 씻었나요?", "required": true },
    { "id": "c3", "label": "뚜껑을 분리했나요?", "required": true }
  ],
  "voice": {
    "script": "페트병은 라벨을 제거하고, 내용물을 깨끗이 씻은 뒤 뚜껑을 분리해서 버려주세요.",
    "audioUrl": "/api/voice/tts?text=..."
  },
  "pointsAwarded": 1,
  "dailyTotal": 42,
  "dailyLimit": 100
}

// Response 429 – 일일 한도 초과
{ "error": "DAILY_LIMIT_REACHED", "dailyTotal": 100 }
```

### 4.3 음성 안내

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/voice/tts` | 텍스트 → TTS 오디오 스트림 반환 |

> 음성 재생/일시정지/재개/처음부터 제어는 **클라이언트 전용** (Web Audio API / `HTMLAudioElement`).  
> 서버에는 상태를 저장하지 않는다.

**프론트엔드 음성 컨트롤러 설계**

```typescript
// hooks/useVoicePlayer.ts
type VoiceState = "idle" | "playing" | "paused";

interface UseVoicePlayer {
  state: VoiceState;
  play: (audioUrl: string) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;       // 처음부터 다시 듣기
  currentTime: number;       // 현재 재생 위치 (초)
  duration: number;          // 전체 길이 (초)
}
```

**음성 안내 UI 컨트롤 버튼 구성**

| 버튼 | 동작 | 표시 조건 |
|------|------|----------|
| 재생(▶) | `audio.play()` | state === "idle" \| "paused" |
| 일시정지(⏸) | `audio.pause()` | state === "playing" |
| 처음부터(⏮) | `audio.currentTime = 0; play()` | 항상 표시 |
| 음소거(🔇) | `audio.muted = !audio.muted` | 항상 표시 |

### 4.4 미션

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/missions/today` | 오늘 미션 목록 |
| POST | `/api/missions/:id/complete` | 미션 완료 → 랜덤 포인트(1·3·5·10) 지급 |

### 4.5 소셜

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/invite/generate` | 초대 링크 생성 |
| POST | `/api/invite/accept` | 초대 코드 수락 → 양쪽 500포인트 지급 |

### 4.6 리더보드

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/leaderboard` | 단과대별 이번 달 포인트 합계 상위 10 |
| GET | `/api/leaderboard/my-college` | 내 단과대 순위 |

---

## 5. DB 설계

**사용자 범위 선택: 로그인 포함 멀티 사용자**  
이유: 학번 기반 소속 인증, 단과대별 경쟁, 친구 초대 등 모든 핵심 기능이 사용자 식별을 필요로 한다.

### 5.1 스키마

```sql
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
  student_id_hash text NOT NULL UNIQUE,   -- HMAC-SHA256(학번+salt), 검색용
  student_id_enc  text NOT NULL,          -- AES-256-GCM 암호화된 학번
  email_hash      text NOT NULL UNIQUE,
  email_enc       text NOT NULL,
  name_enc        text,                   -- AES-256-GCM 암호화된 이름
  department_id   uuid REFERENCES departments(id),
  total_points    int  NOT NULL DEFAULT 0,
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

-- contacts 테이블 (암호화 필드 포함)
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
```

### 5.2 RLS (Row Level Security)

```sql
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_self"        ON users        USING (id = auth.uid());
CREATE POLICY "point_events_self" ON point_events USING (user_id = auth.uid());
CREATE POLICY "contacts_self"     ON contacts     USING (user_id = auth.uid());
```

---

## 6. 암호화 설계

### 6.1 암호화 대상 필드

| 테이블 | 필드 | 방식 | 이유 |
|--------|------|------|------|
| `users` | `student_id_enc` | AES-256-GCM | 학번은 개인 식별자 |
| `users` | `email_enc` | AES-256-GCM | 개인정보보호법 |
| `users` | `name_enc` | AES-256-GCM | 성명 평문 저장 금지 |
| `contacts` | `name_enc` | AES-256-GCM | 연락처 이름 |
| `contacts` | `phone_enc` | AES-256-GCM | 전화번호 평문 저장 금지 |

### 6.2 검색용 보조 해시 컬럼

암호화 필드는 LIKE 검색 불가 → **HMAC-SHA256** 해시를 별도 컬럼에 저장

```
hash = HMAC-SHA256(normalize(value), SEARCH_HASH_SECRET)
```

- `users.student_id_hash` → 학번으로 사용자 조회
- `users.email_hash` → 이메일 중복 확인
- `contacts.phone_hash` → 전화번호 검색

**보안 주의점**
- `SEARCH_HASH_SECRET` 유출 시 레인보우 테이블 공격 가능 → 키 로테이션 계획 필요
- 정규화(공백 제거, E.164 포맷)를 저장 전에 반드시 수행
- 해시 컬럼은 API 응답에 포함하지 말 것

### 6.3 키 관리

```
환경변수:
  ENCRYPTION_KEY        # AES-256-GCM 32바이트 Base64
  SEARCH_HASH_SECRET    # HMAC 시크릿 32바이트 Base64

로컬: .env.local  (gitignore 필수)
운영: Vercel 프로젝트 환경변수
```

### 6.4 암호화 유틸리티 (TypeScript)

```typescript
// lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "crypto";

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
const HMAC_SECRET = process.env.SEARCH_HASH_SECRET!;

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, "base64");
  const iv  = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final("utf8");
}

export function hashForSearch(value: string): string {
  return createHmac("sha256", HMAC_SECRET).update(value).digest("hex");
}
```

### 6.5 트레이드오프

| 항목 | 내용 |
|------|------|
| 부분 검색 불가 | 암호화 필드는 정확한 일치 검색만 가능 (`LIKE '%홍%'` 불가) |
| 성능 오버헤드 | 암호화/복호화 연산이 매 요청에 추가됨 (캐싱으로 완화) |
| 키 분실 시 | 복호화 불가 → 백업 키 에스크로 정책 필요 |
| 키 로테이션 | 전체 행 재암호화 배치 작업 필요 |

---

## 7. 에러 및 엣지 케이스

| 케이스 | 처리 방법 |
|--------|-----------|
| 이미 스캔한 바코드 당일 재스캔 | 포인트 미지급 + "오늘 이미 적립된 바코드입니다" 안내 |
| 하루 100포인트 초과 스캔 | `daily_point_caps.earned >= 100` 체크 → 429 응답 |
| 미션 중복 완료 요청 | `user_missions` UNIQUE 제약으로 DB 레벨 방지 |
| 이미 사용된 초대 코드 | `invites.used = true` 체크 → 400 응답 |
| 초대한 본인이 코드 사용 | `inviter_id = auth.uid()` 차단 |
| 카메라 권한 거부 | 브라우저 퍼미션 API 분기 → 수동 바코드 입력 fallback |
| LLM 응답 지연/오류 | 5초 타임아웃 → 재시도 버튼 노출 |
| 음성 안내 재생 중 화면 이탈 | `audio.pause()` → 복귀 시 일시정지 상태로 유지 |
| 음성 파일 로딩 실패 | 텍스트 스크립트로 fallback 표시 |
| 음성 재생 중 전화 수신 | `visibilitychange` / `pagehide` 이벤트로 자동 일시정지 |
| 잘못된 학번 형식 | 정규식 `^[0-9]{7,10}$` 클라이언트+서버 이중 검증 |
| 암호화 키 환경변수 누락 | 서버 시작 시 early validation → 명확한 오류 메시지 |

---

## 8. 테스트 전략

### 8.1 단위 테스트 (Vitest)

- `lib/crypto.ts`: encrypt → decrypt 왕복 정확성, 동일 입력이 다른 IV로 다른 암호문 생성
- `lib/points.ts`: 일일 한도 계산, 랜덤 포인트 범위
- `hooks/useVoicePlayer.ts`: play/pause/resume/restart 상태 전환 정확성

### 8.2 통합 테스트 (Supabase 로컬)

```bash
supabase start
pnpm test:integration
```

- 회원가입 → 로그인 → 바코드 스캔 → 포인트 적립 플로우
- 100포인트 한도 도달 후 거절 확인
- 친구 초대 코드 발급 → 수락 → 양쪽 포인트 확인

### 8.3 E2E 테스트 (Playwright)

- 주요 화면 스냅샷 (랜딩, 스캔, 리더보드)
- 음성 안내: 재생 → 일시정지 → 재개 → 처음부터 시나리오
- 모바일 뷰포트(375px) 레이아웃 확인
- 카메라 퍼미션 거부 → fallback UI 노출 확인

### 8.4 보안 테스트

- DB 직접 조회 시 `student_id`, `phone`, `name` 평문 없음 확인
- RLS: 다른 `user_id`로 타인 contacts 조회 → 0건 반환 확인
- JWT 만료 토큰으로 API 호출 → 401 확인

---

## 9. 배포 전략

### 9.1 환경 구성

| 환경 | 브랜치 | Supabase |
|------|--------|---------|
| 로컬 | `feature/*` | Supabase Local |
| Preview | PR 브랜치 | Supabase Staging |
| Production | `main` | Supabase Production |

### 9.2 배포 파이프라인

```
git push → GitHub Actions CI
  ├─ pnpm lint
  ├─ pnpm type-check
  ├─ pnpm test:unit
  └─ Vercel 자동 Preview 배포
         ↓ PR 승인
main merge → Vercel Production 배포 (Zero-downtime)
```

### 9.3 환경변수 관리

```bash
vercel env add ENCRYPTION_KEY        production
vercel env add SEARCH_HASH_SECRET    production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

- Preview 환경에는 스테이징 전용 키 사용
- `.env.local`은 `.gitignore`에 반드시 포함

### 9.4 DB 마이그레이션

```bash
supabase db push   # Supabase CLI 마이그레이션 적용
```

- `supabase/migrations/` 하위에 버전 관리
- Production 마이그레이션은 트래픽 낮은 시간대(새벽 2–4시) 적용

---

## 10. 스코프 및 제외 항목

### 10.1 v1.0 포함 (In Scope)

- [x] 학교/단과대/학과 계층 설정
- [x] 학번 기반 암호화 회원가입 / 로그인
- [x] 바코드/QR 카메라 스캔 + 포인트 적립 (1pt/개, 일 100pt 한도)
- [x] 재질별 전처리 체크리스트
- [x] 헷갈리는 품목 음성 안내 — 재생 / 일시정지 / 재개 / 처음부터 컨트롤 포함
- [x] 친구 초대 보너스 (양쪽 500pt)
- [x] 오늘의 미션 + 랜덤 포인트 (일 100pt 한도 별개)
- [x] 단과대별 월간 리더보드
- [x] contacts 테이블 (암호화 설계 포함)
- [x] 바코드 없는 품목 LLM 이미지 분류
- [x] Vercel 배포 + Supabase Postgres

### 10.2 v1.0 제외 (Out of Scope)

- [ ] 학내 식당/카페 쿠폰 지급 시스템 (추후 파트너십 연계 시 v2)
- [ ] 포인트 환전 / 외부 결제 연동
- [ ] 네이티브 앱 (iOS / Android) — PWA로 카메라 접근
- [ ] 관리자 고급 분석 대시보드
- [ ] 다국어(영어 등) 지원
- [ ] 오프라인 모드 (Service Worker 캐싱)
- [ ] 단과대 내부 개인 랭킹 (학번 노출 위험 → 개인정보 정책 확인 후 결정)

---

*이 문서는 소프트웨어 아키텍처 설계 수업 최종 프로젝트의 PRD입니다.*
