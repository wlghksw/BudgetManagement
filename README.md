# 예산 관리 앱

Vue.js 기반 개인 재무 관리 애플리케이션

## 주요 기능

- 수입/지출 거래 추가 및 관리
- 카테고리별 분류 (식비, 교통비, 쇼핑 등)
- 총 수입, 지출, 잔액 실시간 계산
- 카테고리별 지출 통계 및 시각화
- 거래 내역 조회 및 삭제
- 날짜별 기록
- CSV 파일 업로드 (은행 거래내역)
- 예산 설정 및 관리

## 기술 스택

- **Frontend**: Vue.js 3, Vue Router, Pinia, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **File Upload**: CSV/Excel 파싱

## 설치 및 실행

```bash
# 모든 의존성 설치
npm run install:all

# 개발 서버 실행 (백엔드 + 프론트엔드)
npm run dev

# 또는 개별 실행
npm run dev:backend  # 백엔드만
npm run dev:frontend # 프론트엔드만
```

## 환경 변수 설정

`backend/.env` 파일 생성:
```
MONGODB_URI=mongodb://localhost:27017/budget-app
PORT=3000
JWT_SECRET=your-secret-key
```

## 프로젝트 구조

```
ManagementApp/
├── backend/          # Node.js 백엔드
│   ├── models/       # MongoDB 모델
│   ├── routes/       # API 라우터
│   ├── controllers/  # 컨트롤러
│   ├── middleware/   # 미들웨어
│   └── utils/        # 유틸리티
├── frontend/         # Vue.js 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   └── router/
└── package.json
```


