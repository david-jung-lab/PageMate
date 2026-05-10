# PageMate 요구사항정의서 (SRS)
### Software Requirements Specification v4.0 | 2026

---

| 항목 | 내용 |
|------|------|
| 프로젝트명 | PageMate (페이지메이트) |
| 버전 | v4.0 |
| 작성일 | 2026년 4월 |
| 기준 PRD | v3.5 |
| 기준 화면설계서 | v2.1 |

---

## 1. 시스템 개요

### 1.1 목적
교환독서를 하고 싶지만 파트너가 없었던 독자들을 연결하는 플랫폼.
수신자가 요청자의 도서 목록에서 원하는 책을 선택해 수락하는 구조로 도서 등록을 자연스럽게 활성화한다.

### 1.2 핵심 플로우
```
도서 등록
  → 교환독서 요청 발송 (줄 책 선택 없이)
  → 수신자가 요청자 도서 목록에서 책 선택 후 수락 or 거절
  → 약속문 동의 (양측 필수)
  → 채팅 (1차 교환 날짜/장소 확정)
  → 1차 교환 완료 + 2차 교환 기간 선택 (1~30일, 기본 7일)
  → 2차 교환 완료
  → 사용자 평가
```

---

## 2. 기능 요구사항

### 2.1 인증 (AUTH)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-AUTH-01 | 구글 OAuth 2.0 소셜 로그인 | Must |
| FR-AUTH-02 | 카카오 OAuth 2.0 소셜 로그인 | Must |
| FR-AUTH-03 | JWT Access Token 발급 (만료 1시간) | Must |
| FR-AUTH-04 | JWT Refresh Token 발급 (만료 30일) | Must |
| FR-AUTH-05 | 자동 토큰 갱신 | Must |
| FR-AUTH-06 | 로그아웃 | Must |

### 2.2 사용자 (USER)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-USER-01 | 닉네임 설정 (2~10자, 신규 가입 시만) | Must |
| FR-USER-02 | 독서 취향 장르 선택 (홈 첫 진입 시 바텀시트 유도) | Should |
| FR-USER-03 | 동네 설정 (카카오 주소 검색 API, 동 단위) | Must |
| FR-USER-04 | 한줄 소개 입력 (프로필에서 선택) | Should |
| FR-USER-05 | 내 프로필 조회 (평점 포함) | Must |
| FR-USER-06 | 프로필 수정 | Should |
| FR-USER-07 | 타 사용자 프로필 조회 (평점 포함) | Must |
| FR-USER-08 | 교환독서 이력 조회 | Must |

### 2.3 동네 탐색 (LOCATION)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-LOC-01 | 동네 근처 도서 탐색 (행정구역 인접 관계 기반) | Must |
| FR-LOC-02 | 탐색 범위 설정: 내 동네만 / 가까운 동네 / 조금 더 멀리 | Must |
| FR-LOC-03 | 최근 등록된 책 전국 노출 | Must |
| FR-LOC-04 | 도서 카드에 동네명 표시 | Must |
| FR-LOC-05 | GPS 미사용 (MVP) | Must |

### 2.4 도서 (BOOK)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-BOOK-01 | 도서명/저자/ISBN 검색 (카카오 책 검색 API) | Must |
| FR-BOOK-02 | 보유 도서 등록 (제목, 저자, 장르, 한줄 소개) | Must |
| FR-BOOK-03 | 카카오 API 표지 이미지 URL 자동 저장 | Must |
| FR-BOOK-04 | 장르 직접 선택 (소설/에세이/자기계발/경제경영/인문사회/과학SF/시) | Must |
| FR-BOOK-05 | 동네 자동 적용 (설정된 동네) / 미설정 시 카카오 검색으로 설정 | Must |
| FR-BOOK-06 | 내 도서 목록 조회 | Must |
| FR-BOOK-07 | 도서 상세 조회 | Must |
| FR-BOOK-08 | 도서 수정/삭제 | Should |
| FR-BOOK-09 | 위시리스트 없음 | N/A |
| FR-BOOK-10 | 직접 이미지 업로드 없음 (MVP) | N/A |
| FR-BOOK-11 | 도서 상태(상/중/하) 없음 | N/A |

### 2.5 탐색 (SEARCH)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-SEARCH-01 | 도서명/저자/키워드 검색 (전국) | Must |
| FR-SEARCH-02 | 장르 필터링 | Must |
| FR-SEARCH-03 | 최신순 정렬 | Must |
| FR-SEARCH-04 | 동네 근처 도서 탐색 (홈, 범위 선택 가능) | Must |

### 2.6 교환독서 요청 (EXCHANGE)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-EX-01 | 교환독서 요청 발송 (줄 책 선택 없이) | Must |
| FR-EX-02 | 수신자가 요청자 도서 목록 확인 | Must |
| FR-EX-03 | 수신자가 원하는 책 선택 후 수락 | Must |
| FR-EX-04 | 원하는 책 없으면 거절 | Must |
| FR-EX-05 | 요청 취소 (수락 전, 요청자만) | Should |
| FR-EX-06 | 교환독서 현황 조회 | Must |

### 2.7 약속문 (PLEDGE)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-PLEDGE-01 | 수락 후 양측 약속문 동의 필수 | Must |
| FR-PLEDGE-02 | 양측 동의 완료 시 채팅방 열림 | Must |
| FR-PLEDGE-03 | 미동의 시 채팅 불가 | Must |
| FR-PLEDGE-04 | 동의 상태 시각적 표시 | Must |

### 2.8 채팅 (CHAT)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-CHAT-01 | 약속문 동의 완료 시 채팅방 자동 생성 | Must |
| FR-CHAT-02 | 1:1 실시간 채팅 (WebSocket) | Must |
| FR-CHAT-03 | 채팅 메시지 내역 조회 | Must |
| FR-CHAT-04 | 1차 교환 날짜/장소 확정 | Must |
| FR-CHAT-05 | 확정된 날짜 채팅방 상단 고정 표시 | Should |
| FR-CHAT-06 | 안읽은 메시지 수 표시 | Should |

### 2.9 교환 완료 (COMPLETION)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-COMP-01 | 1차 교환 완료 처리 (양측 확인) | Must |
| FR-COMP-02 | 1차 완료 시 2차 교환 기간 선택 (1~30일, 기본 7일) | Must |
| FR-COMP-03 | due_date 자동 계산 (완료일 + 선택 기간) | Must |
| FR-COMP-04 | 2차 교환 완료 처리 (양측 확인) | Must |
| FR-COMP-05 | 2차 교환 기한 알림 (D-3, D-1, D-Day) | Must |

### 2.10 사용자 평가 (REVIEW)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-REVIEW-01 | 2차 교환 완료 후 상대방 평가 | Must |
| FR-REVIEW-02 | 별점 (1~5) + 한줄 후기 (최대 100자) | Must |
| FR-REVIEW-03 | 교환 상대방만 평가 가능 (1회) | Must |
| FR-REVIEW-04 | 누적 평점 프로필 표시 | Must |

### 2.11 독서 기록 공유 템플릿 (SHARE)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-SHARE-01 | 홈 플로팅 버튼으로 독립 진입 | Must |
| FR-SHARE-02 | 책 표지 사진 촬영 또는 갤러리 선택 | Must |
| FR-SHARE-03 | 카카오 책 검색으로 책 제목 자동 입력 | Must |
| FR-SHARE-04 | 읽은 페이지 수 / 시간 입력 | Must |
| FR-SHARE-05 | pace 자동 계산 (시간 / 페이지) | Must |
| FR-SHARE-06 | distance / pace / time 포맷 템플릿 합성 | Must |
| FR-SHARE-07 | PageMate 워터마크 자동 삽입 | Must |
| FR-SHARE-08 | 기기 갤러리 저장 | Must |
| FR-SHARE-09 | 외부 앱 공유 시트 호출 | Must |
| FR-SHARE-10 | 서버 이미지 저장 없음 (기기 내 처리) | Must |

### 2.12 알림 (NOTIFICATION)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-NOTI-01 | 교환독서 요청 수신 알림 (FCM) | Must |
| FR-NOTI-02 | 요청 수락/거절 알림 | Must |
| FR-NOTI-03 | 약속문 동의 요청 알림 | Must |
| FR-NOTI-04 | 채팅 메시지 알림 | Must |
| FR-NOTI-05 | 2차 교환 기한 알림 D-3, D-1, D-Day | Must |
| FR-NOTI-06 | 사용자 평가 요청 알림 | Must |
| FR-NOTI-07 | 앱 내 알림 목록 조회 | Must |
| FR-NOTI-08 | 알림 읽음 처리 | Should |

---

## 3. 비기능 요구사항

### 3.1 성능

| ID | 요구사항 |
|----|----------|
| NFR-PERF-01 | API 응답 시간 평균 500ms 이하 |
| NFR-PERF-02 | 채팅 메시지 지연 1초 이하 |
| NFR-PERF-03 | 이미지 합성 처리 3초 이하 (기기 내) |

### 3.2 보안

| ID | 요구사항 |
|----|----------|
| NFR-SEC-01 | 모든 API HTTPS 강제 |
| NFR-SEC-02 | JWT Refresh Token SecureStore 저장 |
| NFR-SEC-03 | OAuth Client Secret 서버 측 관리 |
| NFR-SEC-04 | 입력값 이중 검증 (FE: Zod, BE: @Valid) |

### 3.3 제약 사항

- 약속문 미동의 시 채팅 불가
- 사용자 평가 1회만 가능
- 위시리스트 없음
- 도서 상태(상/중/하) 없음
- 이미지 직접 업로드 없음 (MVP)
- GPS 없음 (MVP)
- 동네 직접 텍스트 입력 없음
- 결제 없음
