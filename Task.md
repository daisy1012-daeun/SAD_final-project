# Task.md: 대학교 분리배출 도우미 앱

> PRD v1.0.0 기반 · 작성일: 2026-05-27  
> 스택: Next.js (App Router) + TypeScript · Supabase · Vercel

---

## 진행 상태 범례

- [ ] 미시작
- [~] 진행 중
- [x] 완료

---

## Phase 0. 프로젝트 초기 설정

- [ ] **T-001** Next.js 14 (App Router) + TypeScript 프로젝트 생성 (`pnpm create next-app`)
- [ ] **T-002** Supabase 프로젝트 생성 및 로컬 CLI 설정 (`supabase init`)
- [ ] **T-003** 환경변수 파일 설정 (`.env.local`, `.env.example`) 및 `.gitignore` 등록
  - `ENCRYPTION_KEY`, `SEARCH_HASH_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **T-004** ESLint · Prettier · Husky pre-commit 훅 설정
- [ ] **T-005** Vitest · Playwright 테스트 환경 구성
- [ ] **T-006** GitHub Actions CI 파이프라인 작성 (`lint → type-check → test:unit → Vercel Preview`)
- [ ] **T-007** Vercel 프로젝트 연결 및 환경변수 등록

---

## Phase 1. DB 스키마 & 마이그레이션

- [ ] **T-011** `schools / colleges / departments` 계층 테이블 마이그레이션 작성
- [ ] **T-012** `users` 테이블 마이그레이션 작성 (암호화 컬럼 포함)
- [ ] **T-013** `point_events / scan_logs / daily_point_caps` 테이블 + 인덱스 마이그레이션 작성
- [ ] **T-014** `missions / user_missions` 테이블 마이그레이션 작성
- [ ] **T-015** `invites` 테이블 마이그레이션 작성
- [ ] **T-016** `contacts` 테이블 마이그레이션 작성 (암호화 컬럼 + 인덱스)
- [ ] **T-017** RLS 정책 적용 (`users`, `point_events`, `scan_logs`, `contacts`)
- [ ] **T-018** 학교·단과대·학과 시드 데이터 삽입 스크립트 작성

---

## Phase 2. 공통 유틸리티

- [ ] **T-021** `lib/crypto.ts` 구현
  - `encrypt()` · `decrypt()` (AES-256-GCM)
  - `hashForSearch()` (HMAC-SHA256)
  - 서버 시작 시 환경변수 early validation
- [ ] **T-022** `lib/crypto.ts` 단위 테스트
  - encrypt → decrypt 왕복 정확성
  - 동일 입력 + 다른 IV → 다른 암호문
- [ ] **T-023** `lib/supabase.ts` 클라이언트 / 서버 클라이언트 팩토리 작성
- [ ] **T-024** `lib/points.ts` 구현
  - 일일 한도(100pt) 계산 로직
  - 랜덤 포인트 생성 (1·3·5·10)
- [ ] **T-025** `lib/points.ts` 단위 테스트

---

## Phase 3. 인증 (US-01 · US-02 · US-03)

### API
- [ ] **T-031** `POST /api/auth/signup` — 학번·이메일·비밀번호·소속 회원가입
  - 학번 정규식 검증 (`^[0-9]{7,10}$`) 서버 이중 검증
  - `student_id_enc`, `email_enc`, `name_enc` 암호화 저장
  - `student_id_hash`, `email_hash` 해시 저장 (중복 확인용)
- [ ] **T-032** `POST /api/auth/login` — 이메일·비밀번호 로그인 → JWT 발급
- [ ] **T-033** `POST /api/auth/logout` — 세션 만료
- [ ] **T-034** `PATCH /api/auth/profile` — 소속(단과대/학과) 수정

### 화면
- [ ] **T-035** `/` 랜딩 / 스플래시 페이지
- [ ] **T-036** `/auth/signup` 회원가입 폼
  - 학번 형식 클라이언트 이중 검증
  - 학교 > 단과대 > 학과 계층 선택 UI
- [ ] **T-037** `/auth/login` 로그인 폼
- [ ] **T-038** `/onboarding` 학교 > 단과대 > 학과 선택 (최초 1회)
- [ ] **T-039** `/profile` 내 정보 (학번 마스킹, 소속, 포인트 합계)
- [ ] **T-040** `/profile/settings` 소속 변경 · 알림 설정 · 로그아웃

---

## Phase 4. 바코드 스캔 & 포인트 (US-04 · US-05)

### API
- [ ] **T-041** `POST /api/scan/barcode` 구현
  - 바코드 수신 → 제품 조회 → 체크리스트 반환
  - `daily_point_caps` 체크 → 100pt 초과 시 429 응답
  - 당일 동일 바코드 재스캔 방지 (포인트 미지급 + 안내 메시지)
  - `scan_logs` · `point_events` · `daily_point_caps` 트랜잭션 저장
- [ ] **T-042** `GET /api/points` — 포인트 내역 조회 (cursor 기반 페이지네이션)
- [ ] **T-043** `GET /api/points/summary` — 오늘 적립량 · 총합

### 화면
- [ ] **T-044** `/scan` 카메라 바코드/QR 스캔 화면
  - 카메라 권한 거부 시 수동 바코드 입력 fallback UI
- [ ] **T-045** `/points` 포인트 내역 (무한 스크롤)
- [ ] **T-046** `/home` 메인 대시보드 (오늘 포인트 · 미션 요약 · 스캔 버튼)

---

## Phase 5. 체크리스트 & 음성 안내 (US-07 · US-08 · US-09 · US-10)

### API
- [ ] **T-051** `GET /api/voice/tts` — 텍스트 → TTS 오디오 스트림 반환

### 훅 & 유틸
- [ ] **T-052** `hooks/useVoicePlayer.ts` 구현
  - 상태: `idle | playing | paused`
  - `play()` · `pause()` · `resume()` · `restart()` (currentTime=0)
  - `visibilitychange` / `pagehide` 이벤트 → 자동 일시정지
- [ ] **T-053** `hooks/useVoicePlayer.ts` 단위 테스트 (상태 전환 정확성)

### 화면
- [ ] **T-054** `/scan/checklist` 재질별 전처리 체크리스트 화면
- [ ] **T-055** `/scan/voice` 음성 안내 페이지
  - 재생(▶) / 일시정지(⏸) / 처음부터(⏮) / 음소거(🔇) 버튼
  - 오디오 로딩 실패 시 텍스트 스크립트 fallback

---

## Phase 6. LLM 이미지 분류 (US-06)

- [ ] **T-061** `POST /api/scan/image` — 이미지 업로드 → LLM 분류 결과 반환
  - 5초 타임아웃 처리
  - LLM 오류 시 재시도 버튼 노출
- [ ] **T-062** `/scan/llm` 바코드 없는 품목 이미지 촬영 & 질의 화면

---

## Phase 7. 미션 (US-12)

### API
- [ ] **T-071** `GET /api/missions/today` — 오늘 미션 목록
- [ ] **T-072** `POST /api/missions/:id/complete` — 미션 완료 → 랜덤 포인트(1·3·5·10) 지급
  - `user_missions` UNIQUE 제약으로 중복 완료 방지

### 화면
- [ ] **T-073** `/missions` 오늘의 미션 목록 & 달성 현황 화면

---

## Phase 8. 소셜 — 친구 초대 (US-11)

### API
- [ ] **T-081** `POST /api/invite/generate` — 초대 링크 생성
- [ ] **T-082** `POST /api/invite/accept` — 초대 코드 수락 → 양쪽 500pt 지급
  - 이미 사용된 코드 → 400
  - 자기 자신 코드 사용 → 차단

### 화면
- [ ] **T-083** `/invite` 친구 초대 링크 생성 & 공유 화면

---

## Phase 9. 리더보드 (US-13)

### API
- [ ] **T-091** `GET /api/leaderboard` — 단과대별 이번 달 포인트 상위 10
- [ ] **T-092** `GET /api/leaderboard/my-college` — 내 단과대 순위

### 화면
- [ ] **T-093** `/leaderboard` 단과대별 리더보드 화면

---

## Phase 10. 관리자

- [ ] **T-101** `/admin` 관리자 전용 미션 관리 · 통계 화면 (접근 권한 미들웨어 포함)

---

## Phase 11. 테스트

### 통합 테스트 (Supabase 로컬)
- [ ] **T-111** 회원가입 → 로그인 → 바코드 스캔 → 포인트 적립 플로우
- [ ] **T-112** 100pt 한도 도달 후 거절 확인
- [ ] **T-113** 친구 초대 코드 발급 → 수락 → 양쪽 포인트 확인

### E2E 테스트 (Playwright)
- [ ] **T-121** 주요 화면 스냅샷 (랜딩 · 스캔 · 리더보드)
- [ ] **T-122** 음성 안내 시나리오: 재생 → 일시정지 → 재개 → 처음부터
- [ ] **T-123** 모바일 뷰포트(375px) 레이아웃 확인
- [ ] **T-124** 카메라 권한 거부 → fallback UI 노출 확인

### 보안 테스트
- [ ] **T-131** DB 직접 조회 시 `student_id` · `phone` · `name` 평문 없음 확인
- [ ] **T-132** RLS: 타인 `contacts` 조회 → 0건 반환 확인
- [ ] **T-133** 만료 JWT로 API 호출 → 401 확인

---

## Phase 12. 배포

- [ ] **T-141** `supabase/migrations/` 마이그레이션 파일 최종 정리
- [ ] **T-142** Vercel Production 환경변수 등록 (암호화 키, Supabase 키)
- [ ] **T-143** Supabase Production DB 마이그레이션 적용 (트래픽 낮은 시간대)
- [ ] **T-144** Production 배포 후 smoke test (주요 API 엔드포인트 정상 응답 확인)

---

## 의존 관계 요약

```
Phase 0 (초기 설정)
  └─ Phase 1 (DB 스키마)
       └─ Phase 2 (공통 유틸)
            ├─ Phase 3 (인증)
            │    └─ Phase 4 (스캔/포인트) ──┐
            │    └─ Phase 7 (미션)          │
            │    └─ Phase 8 (소셜)          ├─ Phase 11 (테스트)
            │    └─ Phase 9 (리더보드)      │
            ├─ Phase 5 (체크리스트/음성) ───┘
            └─ Phase 6 (LLM)
  Phase 11 (테스트) → Phase 12 (배포)
```
