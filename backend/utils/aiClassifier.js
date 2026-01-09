import Anthropic from '@anthropic-ai/sdk';

// Claude API를 사용한 카테고리 자동 분류
export const classifyWithAI = async (description, categories, transactionType) => {
  // Claude API 키가 없으면 null 반환 (키워드 기반 분류로 폴백)
  if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === 'your-claude-api-key-here') {
    return null;
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    // 카테고리 목록을 문자열로 변환
    const categoryList = categories
      .map((cat, idx) => `${idx + 1}. ${cat.name}`)
      .join('\n');

    const prompt = `다음은 거래 내역의 적요(설명)입니다. 이 거래를 가장 적절한 카테고리로 분류해주세요.

거래 적요: "${description}"
거래 유형: ${transactionType === 'expense' ? '지출' : '수입'}

사용 가능한 카테고리 목록:
${categoryList}

지침:
1. 거래 적요를 분석하여 가장 적절한 카테고리 하나만 선택하세요.
2. 카테고리 이름을 정확히 반환하세요 (번호가 아닌 이름).
3. 확실하지 않으면 "기타" 카테고리를 선택하세요.
4. 응답은 카테고리 이름만 반환하세요 (설명 없이).

예시:
- "스타벅스코리아" → 식비
- "전국고속버스운송사업조합" → 교통비
- "보라보라 코인노래연습장" → 문화/여가
- "CJ올리브영" → 의료/건강
- "리사헤어" → 기타

카테고리:`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // 응답에서 카테고리 이름 추출
    const responseText = message.content[0].text.trim();
    
    // 응답에서 카테고리 이름 찾기 (줄바꿈이나 불필요한 텍스트 제거)
    const categoryName = responseText
      .split('\n')[0] // 첫 번째 줄만 사용
      .replace(/^카테고리:\s*/i, '') // "카테고리:" 제거
      .replace(/^답변:\s*/i, '') // "답변:" 제거
      .trim();

    // 카테고리 이름으로 카테고리 찾기
    const matchedCategory = categories.find(
      cat => cat.name === categoryName || cat.name.includes(categoryName) || categoryName.includes(cat.name)
    );

    if (matchedCategory) {
      console.log(`[AI 분류] "${description}" -> ${matchedCategory.name}`);
      return matchedCategory._id;
    }

    // 매칭 실패 시 null 반환 (키워드 기반 분류로 폴백)
    console.warn(`[AI 분류 실패] "${description}" -> 매칭되는 카테고리 없음 (응답: "${categoryName}")`);
    return null;
  } catch (error) {
    console.error('[AI 분류 에러]', error.message);
    // 에러 발생 시 null 반환 (키워드 기반 분류로 폴백)
    return null;
  }
};

