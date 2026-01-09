# 예산 관리 앱 (Budget Management App)

Vue.js 기반 개인 재무 관리 애플리케이션

## 주요 기능

- ✅ 사용자 인증 (회원가입/로그인)
- ✅ 수입/지출 거래 추가 및 관리
- ✅ 카테고리별 분류 (식비, 교통비, 쇼핑 등)
- ✅ 총 수입, 지출, 잔액 실시간 계산
- ✅ 카테고리별 지출 통계 및 시각화 (도넛 차트)
- ✅ 거래 내역 조회, 수정, 삭제
- ✅ 날짜별 필터링
- ✅ CSV 파일 업로드 (토스뱅크 거래내역 자동 파싱)
- ✅ 예산 설정 및 관리
- ✅ 통화 설정 (KRW, USD, EUR, JPY)

## 기술 스택

- **Frontend**: Vue.js 3, Vue Router, Pinia, Chart.js, Vite
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **File Upload**: CSV/Excel 파싱 (csv-parser, xlsx)
- **Authentication**: JWT (jsonwebtoken, bcryptjs)

## 빠른 시작

### 1. 필수 요구사항
- Node.js 18 이상
- MongoDB (로컬 또는 Atlas)

자세한 설치 가이드는 [SETUP.md](./SETUP.md) 참고

### 2. 설치 및 실행

```bash
# 모든 의존성 설치
npm run install:all

# 환경 변수 설정
cd backend
cp ../.env.example .env
# .env 파일을 열어서 MongoDB URI와 JWT_SECRET 설정

# 개발 서버 실행 (백엔드 + 프론트엔드)
npm run dev
```

### 3. 접속
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3000

## 환경 변수 설정

`backend/.env` 파일 생성 (`.env.example` 참고):

```env
# 로컬 MongoDB
MONGODB_URI=mongodb://localhost:27017/budget-app

# 또는 MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budget-app

PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 프로젝트 구조

```
ManagementApp/
├── backend/              # Node.js 백엔드
│   ├── models/           # MongoDB 모델 (User, Transaction, Category, Budget)
│   ├── routes/           # API 라우터
│   ├── controllers/      # 비즈니스 로직
│   ├── middleware/       # 인증 미들웨어
│   └── server.js         # Express 서버
├── frontend/             # Vue.js 프론트엔드
│   ├── src/
│   │   ├── components/   # 재사용 가능한 컴포넌트
│   │   ├── views/        # 페이지 컴포넌트
│   │   ├── stores/       # Pinia 상태 관리
│   │   ├── router/       # Vue Router 설정
│   │   └── utils/        # 유틸리티 함수
│   └── vite.config.js
├── .env.example          # 환경 변수 예시
├── SETUP.md              # 상세 설치 가이드
└── package.json
```

## 주요 API 엔드포인트

- `POST /api/users/register` - 회원가입
- `POST /api/users/login` - 로그인
- `GET /api/transactions` - 거래 내역 조회
- `POST /api/transactions` - 거래 추가
- `DELETE /api/transactions/all` - 전체 거래 삭제
- `POST /api/upload/csv` - CSV 파일 업로드
- `GET /api/budgets` - 예산 조회
- `POST /api/budgets` - 예산 설정

## CSV 업로드 형식

토스뱅크 CSV 파일을 지원합니다:
- 컬럼: 거래 일시, 적요, 거래 유형, 거래 금액 등
- 음수 금액 = 지출, 양수 금액 = 수입
- 자동 카테고리 분류 지원

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트 환영합니다!


