# 설치 및 실행 가이드

## 필수 요구사항

### 1. Node.js 설치
- Node.js 18 이상 필요
- 설치 확인: `node --version`
- 다운로드: https://nodejs.org/

### 2. MongoDB 설치
두 가지 옵션 중 선택:

#### 옵션 A: 로컬 MongoDB 설치 (macOS)
```bash
# Homebrew로 설치
brew tap mongodb/brew
brew install mongodb-community

# MongoDB 시작
brew services start mongodb-community
```

#### 옵션 B: MongoDB Atlas (클라우드, 무료)
1. https://www.mongodb.com/cloud/atlas 접속
2. 무료 계정 생성
3. 클러스터 생성
4. 연결 문자열 복사

### 3. 환경 변수 설정

`backend/.env` 파일 생성:
```bash
cd backend
cp ../.env.example .env
```

`.env` 파일 내용 수정:
```env
# 로컬 MongoDB 사용 시
MONGODB_URI=mongodb://localhost:27017/budget-app

# 또는 MongoDB Atlas 사용 시
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budget-app

PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm run install:all
```

### 2. 개발 서버 실행
```bash
npm run dev
```

이 명령어는 백엔드(포트 3000)와 프론트엔드(포트 5173)를 동시에 실행합니다.

### 3. 브라우저에서 접속
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3000

## 문제 해결

### MongoDB 연결 실패
- 로컬 MongoDB: `brew services start mongodb-community` 실행 확인
- MongoDB Atlas: 연결 문자열이 올바른지 확인
- 방화벽 설정 확인

### 포트 충돌
- 포트 3000이 사용 중이면 `.env`에서 `PORT` 변경
- 포트 5173이 사용 중이면 Vite가 자동으로 다른 포트 사용

### 의존성 설치 실패
```bash
# 각 디렉토리에서 개별 설치
cd backend && npm install
cd ../frontend && npm install
```

## 프로덕션 빌드

### 프론트엔드 빌드
```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist` 디렉토리에 생성됩니다.

