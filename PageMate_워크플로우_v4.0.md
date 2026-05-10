# PageMate 워크플로우
### Workflow Document v4.0 | 2026

---

| 버전 | v4.0 |
|------|------|
| 기준 PRD | v3.5 |

---

## 1. 전체 서비스 플로우

```
앱 실행
  ├── 비로그인 → 로그인 → 닉네임 입력 → 홈 → 취향 바텀시트
  └── 로그인   → 홈

[교환독서 사이클]
도서 등록
  → 교환독서 요청 발송 (줄 책 선택 없음)
  → 수신자가 요청자 도서 목록에서 책 선택 후 수락 or 거절
  → 약속문 동의 (양측 필수)
  → 채팅 (1차 날짜/장소 확정)
  → 1차 교환 완료 + 2차 기간 선택 (1~30일, 기본 7일)
  → 각자 책 읽으며 실물 메모
  → 2차 교환 완료
  → 사용자 평가

[독립 기능]
홈 플로팅 버튼 → 독서 기록 공유 템플릿 (교환독서 무관)
```

---

## 2. 인증 워크플로우

```
[앱] 소셜 버튼 탭
  ↓
[소셜 SDK] 인가 코드 획득
  ↓
[앱 → BE] POST /auth/oauth/{provider}
  ↓
[BE] users 테이블 upsert
  ├── 신규 → 닉네임 입력 화면
  └── 기존 → 홈 화면
  ↓
[앱] SecureStore에 토큰 저장
```

---

## 3. 회원가입 워크플로우

```
[닉네임 입력]
[앱] 닉네임 입력 (2~10자) + 실시간 중복 확인
  ↓
[앱 → BE] PATCH /users/me (nickname 저장)
  ↓
[앱] 홈 이동
  ↓
[홈 첫 진입 시] 취향 장르 바텀시트 자동 표시
  ↓
장르 선택 (복수, 스킵 가능)
  ↓
[앱 → BE] PATCH /users/me (genres 저장)
```

---

## 4. 동네 설정 워크플로우

```
[트리거 1] 첫 도서 등록 시 동네 미설정
[트리거 2] 프로필 → 설정 → 동네 설정
  ↓
동네 설정 바텀시트 표시
  ↓
[앱] 카카오 주소 검색 API 호출 (동 단위)
  ↓
동 선택
  ↓
[앱 → BE] PATCH /users/me (neighborhood 저장)
  ↓
이후 도서 등록 시 자동 적용
```

---

## 5. 도서 등록 워크플로우

```
[앱] 카카오 책 검색 → 도서 선택
  (표지 imageUrl 자동)
  ↓
장르 선택
  ↓
동네 확인
  ├── 설정됨 → 자동 표시 (변경 가능)
  └── 미설정 → 동네 설정 바텀시트 → 완료 후 복귀
  ↓
한줄 소개 입력 (선택)
  ↓
[앱 → BE] POST /books
  ↓
[BE] books INSERT (status: AVAILABLE)
```

---

## 6. 교환독서 요청 워크플로우

```
[요청자]
도서 상세 → 교환독서 요청 버튼 탭
  ↓
[앱 → BE] POST /exchanges { targetBookId }
  (줄 책 선택 없음)
  ↓
[BE] exchange_requests INSERT (status: REQUESTED)
[BE → FCM] 수신자에게 알림
  "OOO님이 교환독서를 요청했어요"

[수신자]
알림 탭 → 요청 확인하기
  ↓
요청 수신 화면
  - 내 어떤 책이 요청받았는지 표시
  - 요청자의 도서 목록 전체 표시
  ↓
  ├── 원하는 책 선택 후 수락
  │     [앱 → BE] PATCH /exchanges/{id}/respond
  │               { action: ACCEPT, selectedBookId: 3 }
  │     [BE] status → ACCEPTED / selected_book_id 저장
  │     [BE → FCM] 요청자에게 수락 알림
  │     → 약속문 워크플로우
  │
  └── 원하는 책 없음 → 거절
        [BE] status → REJECTED
        [BE → FCM] 요청자에게 거절 알림
```

---

## 7. 약속문 동의 워크플로우

```
[앱 - 양측] 약속문 화면 자동 표시
  ↓
약속문 전문 확인
  ↓
"동의하고 교환독서 시작하기" 탭
  ↓
[앱 → BE] POST /exchanges/{id}/pledge
  ↓
  ├── 한쪽만 동의 → 상대방에게 동의 요청 알림
  │                 "OOO님이 약속문에 동의했어요"
  │
  └── 양측 모두 동의
        [BE] status → PLEDGED
        [BE] chat_rooms INSERT
        [BE → FCM] 양측에 알림
        → 채팅방 이동
```

---

## 8. 채팅 및 일정 확정 워크플로우

```
[시스템 메시지] "교환독서 약속이 완료됐어요. 만날 날짜를 정해보세요."
  ↓
[채팅] 1차 교환 날짜/장소 협의
  ↓
[앱 → BE] PATCH /exchanges/{id}/schedule
  ↓
[BE] status → SCHEDULED
[시스템 메시지] "1차 교환 날짜가 확정됐어요. {날짜} {장소}"
  ↓
[채팅방 상단] 기한 배너 고정

[WebSocket 채팅]
wss://api.pagemate.app/ws
Subscribe: /topic/chat/{roomId}
Publish:   /app/chat/{roomId}/send
```

---

## 9. 1차 교환 완료 + 2차 기간 선택 워크플로우

```
[오프라인] 직접 만나 책 교환
  ↓
[앱] 교환독서 탭 → 1차 교환 완료 버튼 탭
  ↓
2차 교환 기간 선택 바텀시트
  슬라이더 1~30일 / 기본 7일
  due_date 미리보기 표시
  ↓
완료 탭
  ↓
[앱 → BE] PATCH /exchanges/{id}/first-complete
           { secondExchangePeriodDays: 7 }
  ↓
[BE] 본인 confirmed 플래그 업데이트
  ├── 한쪽만 → 상대방 확인 대기 표시
  └── 양측 모두
        [BE] status → FIRST_EXCHANGED
        [BE] due_date = CURDATE() + 7일
        [BE] D-3/D-1/D-Day 알림 스케줄 등록
        [시스템 메시지] "1차 교환 완료! 7일 후(5월 8일)에 다시 만나요."
```

---

## 10. 2차 교환 기한 알림 스케줄러

```
[Spring Scheduler] 매일 오전 9시
  ↓
SELECT WHERE status = 'FIRST_EXCHANGED'
  AND second_exchange_due_date IN (D+3, D+1, D-Day)
  ↓
[BE → FCM] 양측 알림
  D-3:   "2차 교환 기한이 3일 남았어요"
  D-1:   "내일이 2차 교환 기한이에요"
  D-Day: "오늘이 2차 교환 기한이에요"
```

---

## 11. 2차 교환 완료 워크플로우

```
[오프라인] 책 돌려받음
  ↓
[앱 - 각자] 2차 교환 완료 버튼 탭
  ↓
[BE] 양측 모두 confirmed
  ↓
[BE] status → SECOND_EXCHANGED
[BE] 양측 도서 status → AVAILABLE
[시스템 메시지] "2차 교환 완료! 서로 평가를 남겨보세요."
[BE → FCM] 평가 요청 알림
  ↓
[앱] 사용자 평가 화면 이동
```

---

## 12. 사용자 평가 워크플로우

```
[앱] 별점 선택 (1~5) + 한줄 후기 (선택)
  ↓
[앱 → BE] POST /exchanges/{id}/reviews
  ↓
[BE] user_reviews INSERT
[BE] 상대방 average_rating / review_count 갱신
  ↓
[BE] 양측 모두 평가 완료 → status → COMPLETED
```

---

## 13. 독서 기록 공유 템플릿 워크플로우 (독립 기능)

```
[진입 경로]
홈 플로팅 버튼 (📷 독서 공유) 탭
  또는 교환독서 완료 후 평가 화면 하단 버튼
  ↓
[앱] 책 표지 사진 촬영 or 갤러리 선택
  ↓
[앱] 카카오 책 검색 → 책 제목 선택
  ↓
[앱] 읽은 페이지 수 / 시간 입력
  ↓
[앱] pace 자동 계산 (시간 ÷ 페이지)
  ↓
[react-native-skia] 템플릿 합성
  distance(N pages) / pace / time
  + 책 제목 + PageMate 워터마크
  ↓
미리보기 확인
  ↓
  ├── 갤러리 저장 (expo-media-library)
  └── 공유하기 (expo-sharing → 공유 시트)

서버 전송 없음 / 기기 내 처리
```

---

## 14. 알림 워크플로우

```
[이벤트 발생]
  ↓
[BE] notifications INSERT
  ↓
[BE] fcm_tokens 조회
  ├── 토큰 있음 → FCM 푸시 발송
  └── 토큰 없음 → DB만 저장
  ↓
[앱] 알림 목록에서 확인
  └── 탭 시 해당 화면으로 이동
```

---

## 15. 화면 전환 맵

```
SCR-001 스플래시
  ├── SCR-002 로그인 → SCR-003 닉네임 → SCR-005 홈
  └── SCR-005 홈

SCR-005 홈
  ├── SCR-006 탐색 → SCR-007 도서 상세 → [요청 발송]
  ├── SCR-013 교환독서 탭
  │     ├── SCR-014 기간 선택 바텀시트
  │     └── SCR-015 사용자 평가
  ├── SCR-011 채팅 목록 → SCR-012 채팅방
  ├── SCR-017 프로필 → SCR-008 도서 등록
  │                          └── SCR-008-A 동네 설정 바텀시트
  ├── SCR-018 알림
  │     ├── SCR-009 요청 수신 → SCR-010 약속문 → SCR-012 채팅방
  │     ├── SCR-013 교환독서 탭
  │     └── SCR-015 사용자 평가
  └── 📷 플로팅 버튼 → SCR-016 공유 템플릿 (독립)
```
