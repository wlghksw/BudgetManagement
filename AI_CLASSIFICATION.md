# AI 카테고리 자동 분류 설정 가이드

이 앱은 Claude API를 사용하여 거래 내역을 자동으로 적절한 카테고리로 분류합니다.

## 설정 방법

### 1. Claude API 키 발급

1. [Anthropic Console](https://console.anthropic.com/)에 접속
2. 계정 생성 또는 로그인
3. API Keys 메뉴에서 새 API 키 생성
4. 생성된 API 키 복사

### 2. 환경 변수 설정

`backend/.env` 파일에 다음 내용을 추가하세요:

```env
CLAUDE_API_KEY=sk-ant-api03-여기에-실제-API-키-입력
```

### 3. 작동 방식

- **AI 분류 우선**: Claude API를 사용하여 거래 적요를 분석하고 가장 적절한 카테고리로 분류합니다.
- **자동 폴백**: API 키가 없거나 AI 분류가 실패하면 기존 키워드 기반 분류로 자동 전환됩니다.
- **비용**: Claude API는 사용량에 따라 과금됩니다. 자세한 내용은 [Anthropic 가격 페이지](https://www.anthropic.com/pricing)를 참조하세요.

## 예시

다음과 같은 거래 내역들이 AI로 자동 분류됩니다:

- "스타벅스코리아" → 식비
- "전국고속버스운송사업조합" → 교통비
- "보라보라 코인노래연습장" → 문화/여가
- "CJ올리브영 인천길병원점" → 의료/건강
- "리사헤어" → 기타

## 비활성화

AI 분류를 사용하지 않으려면:
- `backend/.env` 파일에서 `CLAUDE_API_KEY`를 제거하거나
- 값을 `your-claude-api-key-here`로 설정하세요.

이 경우 키워드 기반 분류만 사용됩니다.

