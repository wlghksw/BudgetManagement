import fs from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';
import { classifyWithAI } from '../utils/aiClassifier.js';

// 은행 포맷 인식 및 파싱
const parseBankFormat = (rows, format) => {
  // 기본 포맷: 날짜, 설명, 금액, 잔액
  // 각 은행별로 다른 컬럼 구조를 처리
  return rows.map((row, index) => {
    let date, description, amount, type;

    if (format === 'toss') {
      // 토스뱅크 실제 CSV 형식:
      // 컬럼: 거래 일시, 적요, 거래 유형, 거래 기관, 계좌번호, 거래 금액, 거래 후 잔액, 메모
      // 금액: 음수(-4,500) = 출금(지출), 양수(100) = 입금(수입)
      // 거래 유형: 체크카드결제, 입금, 출금, 프로모션입금, 이자입금 등
      // 주의: 거래 후 잔액은 사용하지 않음 (총 자산이 아님)
      
      date = row['거래 일시'] || row['거래일시'] || row['날짜'] || row['거래일자'] || row['일자'];
      description = row['적요'] || row['거래내용'] || row['내용'] || row['메모'];
      amount = row['거래 금액'] || row['거래금액'] || row['금액'];
      const transactionType = row['거래 유형'] || row['거래유형'] || row['구분'] || '';
      
      // 금액 파싱 (음수 부호 보존)
      const amountStr = String(amount || '').trim();
      // 따옴표 제거 (CSV에서 "-4,500" 형식일 수 있음) - 먼저 제거
      let cleanedAmount = amountStr.replace(/["']/g, '');
      // 쉼표와 공백 제거 (음수 부호는 보존)
      cleanedAmount = cleanedAmount.replace(/,/g, '').replace(/\s/g, '');
      const parsedAmountNum = parseFloat(cleanedAmount);
      
      // 디버깅: 처음 10개만 로그 출력
      if (index < 10) {
        console.log(`[토스뱅크 파싱 ${index + 1}] 원본: "${amount}", 정리: "${cleanedAmount}", 숫자: ${parsedAmountNum}, 유형: "${transactionType}", 타입: ${parsedAmountNum < 0 ? 'expense' : 'income'}`);
      }
      
      // 금액 부호가 가장 확실한 기준: 음수 = 지출, 양수 = 수입
      if (isNaN(parsedAmountNum)) {
        // 파싱 실패 시 거래 유형으로 판단
        if (transactionType.includes('프로모션입금') || transactionType.includes('이자입금') || transactionType.includes('입금')) {
          type = 'income';
        } else if (transactionType.includes('체크카드결제') || transactionType.includes('출금')) {
          type = 'expense';
        } else {
          type = 'income'; // 기본값
        }
      } else if (parsedAmountNum < 0) {
        // 음수면 무조건 지출
        type = 'expense';
      } else if (parsedAmountNum > 0) {
        // 양수면 무조건 수입
        type = 'income';
      } else {
        // 금액이 0인 경우 거래 유형으로 판단
        if (transactionType.includes('프로모션입금') || transactionType.includes('이자입금') || transactionType.includes('입금')) {
          type = 'income';
        } else if (transactionType.includes('체크카드결제') || transactionType.includes('출금')) {
          type = 'expense';
        } else {
          type = 'income'; // 기본값
        }
      }
      
      // 파싱된 금액을 amount 변수에 숫자로 저장하여 나중에 재사용
      amount = parsedAmountNum;
    } else {
      // 공통 형식 (자동 감지)
      const keys = Object.keys(row);
      date = row[keys.find(k => k.includes('날짜') || k.includes('일자') || k.includes('date'))] || row[keys[0]];
      description = row[keys.find(k => k.includes('내용') || k.includes('적요') || k.includes('설명') || k.includes('메모') || k.includes('description'))] || row[keys[1]];
      amount = row[keys.find(k => k.includes('금액') || k.includes('amount'))] || row[keys[2]];
      const typeColumn = row[keys.find(k => k.includes('구분') || k.includes('입출') || k.includes('type'))] || '';
      type = typeColumn.includes('출금') || typeColumn.includes('지출') || amount < 0 ? 'expense' : 'income';
    }

    // 금액 정규화 (토스뱅크인 경우 이미 파싱됨)
    let finalAmountNum = 0;
    
    if (format === 'toss' && typeof amount === 'number') {
      // 토스뱅크인 경우 이미 숫자로 파싱되어 있음
      finalAmountNum = amount;
    } else if (amount === null || amount === undefined || amount === '') {
      console.warn('금액이 없습니다:', row);
      finalAmountNum = 0;
    } else if (typeof amount === 'string') {
      // 문자열인 경우: 쉼표 제거, 공백 제거, 따옴표 제거, 음수 부호 보존
      let cleaned = amount.replace(/,/g, '').replace(/\s/g, '').replace(/["']/g, '');
      // 음수 부호를 보존하면서 숫자와 마이너스, 점만 남김
      cleaned = cleaned.replace(/[^0-9.-]/g, '');
      finalAmountNum = parseFloat(cleaned);
      if (isNaN(finalAmountNum)) {
        console.warn(`금액 파싱 실패: "${amount}" -> "${cleaned}"`, row);
        finalAmountNum = 0;
      }
    } else if (typeof amount === 'number') {
      finalAmountNum = isNaN(amount) ? 0 : amount;
    } else {
      // 다른 타입인 경우 문자열로 변환 후 파싱
      let cleaned = String(amount).replace(/,/g, '').replace(/\s/g, '').replace(/["']/g, '');
      cleaned = cleaned.replace(/[^0-9.-]/g, '');
      finalAmountNum = parseFloat(cleaned);
      if (isNaN(finalAmountNum)) {
        console.warn(`금액 파싱 실패: "${amount}" (타입: ${typeof amount}) -> "${cleaned}"`, row);
        finalAmountNum = 0;
      }
    }
    
    // 금액이 0이거나 NaN이면 경고하고 건너뛰기
    if (finalAmountNum === 0 || isNaN(finalAmountNum)) {
      console.warn('금액이 0이거나 유효하지 않습니다. 거래를 건너뜁니다:', { 
        amount, 
        finalAmountNum, 
        description, 
        date, 
        type,
        row: JSON.stringify(row) 
      });
      return null; // 0원 또는 NaN 거래는 건너뛰기
    }

    // 날짜 파싱 개선 (한국 날짜 형식 지원)
    let parsedDate;
    if (!date) {
      parsedDate = new Date(); // 날짜가 없으면 현재 날짜 사용
    } else if (date instanceof Date) {
      parsedDate = date;
    } else {
      const dateStr = String(date).trim();
      
      // 토스뱅크 날짜 형식: YYYY-MM-DD HH:MM:SS 또는 YYYY.MM.DD 등
      // 다양한 날짜 형식 지원
      let dateMatch = dateStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // 시간 포함 형식: YYYY-MM-DD HH:MM:SS
        dateMatch = dateStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
        if (dateMatch) {
          const [, year, month, day, hour, minute, second] = dateMatch;
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        } else {
          // 기본 Date 파싱 시도
          parsedDate = new Date(dateStr);
        }
      }
      
      // 유효하지 않은 날짜인 경우 현재 날짜 사용
      if (isNaN(parsedDate.getTime())) {
        console.warn(`날짜 파싱 실패: ${dateStr}, 현재 날짜로 대체`);
        parsedDate = new Date();
      }
    }
    
    // 설명이 없거나 비어있으면 기본값 설정
    if (!description || description.trim() === '' || description === 'undefined' || description === 'null') {
      description = '거래 내역';
    }

    // 최종 타입 확인 (디버깅용)
    const finalType = type || (finalAmountNum < 0 ? 'expense' : 'income');
    
    return {
      date: parsedDate,
      description: String(description || '').trim(),
      amount: Math.abs(finalAmountNum), // 절댓값으로 저장 (type으로 이미 구분됨)
      type: finalType
    };
  }).filter(tx => tx !== null); // null인 거래 제거
};

// 자동 카테고리 분류
const categorizeTransaction = async (description, userId, transactionType) => {
  // 수입/지출 타입에 맞는 카테고리 조회
  let categories = await Category.find({ userId, type: transactionType });
  
  // 카테고리가 없으면 기본 카테고리 생성 (중복 방지)
  if (categories.length === 0) {
    const defaultCategories = [
      // 지출 카테고리
      { name: '식비', type: 'expense', icon: '🍽️', color: '#ef4444', isDefault: true },
      { name: '교통비', type: 'expense', icon: '🚗', color: '#3b82f6', isDefault: true },
      { name: '쇼핑', type: 'expense', icon: '🛍️', color: '#8b5cf6', isDefault: true },
      { name: '의료/건강', type: 'expense', icon: '🏥', color: '#10b981', isDefault: true },
      { name: '교육', type: 'expense', icon: '📚', color: '#f59e0b', isDefault: true },
      { name: '문화/여가', type: 'expense', icon: '🎬', color: '#ec4899', isDefault: true },
      { name: '주거/통신', type: 'expense', icon: '🏠', color: '#6366f1', isDefault: true },
      { name: '기타', type: 'expense', icon: '📦', color: '#6b7280', isDefault: true },
      // 수입 카테고리
      { name: '급여', type: 'income', icon: '💰', color: '#10b981', isDefault: true },
      { name: '부수입', type: 'income', icon: '💵', color: '#3b82f6', isDefault: true },
      { name: '투자수익', type: 'income', icon: '📈', color: '#8b5cf6', isDefault: true },
      { name: '기타', type: 'income', icon: '💸', color: '#6b7280', isDefault: true }
    ];
    
    const userCategories = defaultCategories
      .filter(cat => cat.type === transactionType)
      .map(cat => ({ ...cat, userId }));
    
    try {
      // 중복 키 에러 방지: 기존 카테고리 확인 후 없는 것만 생성
      const existingNames = (await Category.find({ userId, type: transactionType })).map(c => c.name);
      const toCreate = userCategories.filter(cat => !existingNames.includes(cat.name));
      
      if (toCreate.length > 0) {
        await Category.insertMany(toCreate, { ordered: false });
      }
      // 다시 조회
      categories = await Category.find({ userId, type: transactionType });
    } catch (error) {
      // 중복 에러는 무시하고 기존 카테고리 조회
      if (error.code !== 11000) {
        console.error('카테고리 생성 실패:', error);
      }
      categories = await Category.find({ userId, type: transactionType });
    }
  }
  
  // AI 기반 분류 시도 (Claude API 사용)
  try {
    const aiCategoryId = await classifyWithAI(description, categories, transactionType);
    if (aiCategoryId) {
      return aiCategoryId;
    }
  } catch (error) {
    console.warn('[AI 분류 실패, 키워드 기반 분류로 폴백]', error.message);
  }

  // 지출인 경우에만 규칙 기반 분류 (AI 실패 시 폴백)
  if (transactionType === 'expense') {
    const rules = {
      // 식비: 편의점, 카페, 식당 모두 포함
      '식비': [
        // 편의점 (정확한 브랜드명 우선)
        '지에스25', 'GS25', '세븐일레븐', '씨유', 'CU', '이마트24', '미니스톱', '편의점',
        // 카페/커피 (정확한 브랜드명 우선)
        '스타벅스코리아', '스타벅스', '컴포즈커피', '수소수카페', '빽다방', '블랙컨테이너',
        '해피카페24', '해피카페', '베티스커피', '카페', '커피', '커피숍', '이디야', '투썸', 
        '할리스', '탐앤탐스', '카페베네', '엔젤리너스',
        // 식당/음식점 (정확한 매장명 우선)
        '백석대학교 교수회관식당', '이대조뼈다귀', '이가네 삼겹살', '이가네', '안골',
        '맥도날드', '식당', '교수회관식당', '학생식당', '구내식당', '카페테리아', '레스토랑', 
        '맛집', '음식', '식사', '삼겹살', '고기', 'BBQ',
        '버거킹', '맘스터치', '롯데리아', 'KFC', '도미노', '피자헛', '파파존스', '치킨', '피자',
        '배달의민족', '요기요', '쿠팡이츠', '배달', '포장', '테이크아웃'
      ],
      // 교통비
      '교통비': [
        '전국고속버스운송사업조합', '전국고속버스', '티머니 고속버스', '티머니',
        '이동의즐거움_택시', '이동의즐거움', '교통카드이용', '교통카드',
        '택시', '지하철', '버스', '교통', '주차', '주유', '기름', '카카오모빌리티', '우버', '카카오T'
      ],
      // 문화/여가
      '문화/여가': [
        '보라보라 코인노래연습장', '보라보라', '아이센스리그PC인천구월본점', '아이센스리그PC',
        'PC방', '영화', '콘서트', '공연', '문화', '넷플릭스', '디즈니', '게임', '노래방'
      ],
      // 쇼핑
      '쇼핑': [
        '미리디', '자라쿠', '쿠팡', '옥션', '지마켓', '11번가', '쇼핑', '구매', 
        '아마존', '네이버쇼핑', '백화점', '마트', '이마트', '롯데마트', '홈플러스'
      ],
      // 의료/건강 (올리브영 포함 - 화장품/건강)
      '의료/건강': [
        'CJ올리브영', '올리브영', '병원', '약국', '의료', '건강', '약', '치과', '안과', '한의원', '보건소'
      ],
      // 기타 (미용 등)
      '기타': [
        '리사헤어', '미용', '헤어', '미용실', '네일', '에스테틱'
      ],
      '주거/통신': [
        '전기', '가스', '수도', '인터넷', '통신', '핸드폰', '월세', '관리비', 'KT', 'SKT', 'LG',
        '통신비', '요금', '공과금'
      ]
    };

    const descLower = String(description || '').toLowerCase();
    
    // 우선순위: 식비 > 교통비 > 문화/여가 > 쇼핑 > 의료/건강 > 기타 > 주거/통신
    // 정확한 매칭을 위해 긴 키워드부터 확인
    const priorityOrder = ['식비', '교통비', '문화/여가', '쇼핑', '의료/건강', '기타', '주거/통신'];
    
    // 각 카테고리별로 키워드를 긴 것부터 정렬하여 정확한 매칭 우선
    for (const categoryName of priorityOrder) {
      const keywords = rules[categoryName] || [];
      // 긴 키워드부터 정렬 (정확한 매칭 우선)
      const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
      
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        // 정확한 매칭 우선 확인
        for (const keyword of sortedKeywords) {
          const keywordLower = keyword.toLowerCase();
          if (descLower.includes(keywordLower)) {
            // 디버깅: 처음 10개만 로그
            if (Math.random() < 0.1) {
              console.log(`[카테고리 분류] "${description}" -> ${categoryName} (키워드: ${keyword})`);
            }
            return category._id;
          }
        }
      }
    }
  }

  // 기본 카테고리 (기타) 또는 첫 번째 카테고리 반환
  const defaultCategory = categories.find(cat => cat.name === '기타') || categories[0];
  if (!defaultCategory) {
    throw new Error(`${transactionType} 타입의 카테고리가 없습니다.`);
  }
  return defaultCategory._id;
};

// 중복 거래 체크
const checkDuplicates = async (transactions, userId) => {
  const duplicates = [];
  const newTransactions = [];

  for (const tx of transactions) {
    const existing = await Transaction.findOne({
      userId,
      amount: tx.amount,
      description: tx.description,
      date: {
        $gte: new Date(tx.date.getFullYear(), tx.date.getMonth(), tx.date.getDate()),
        $lt: new Date(tx.date.getFullYear(), tx.date.getMonth(), tx.date.getDate() + 1)
      }
    });

    if (existing) {
      duplicates.push(tx);
    } else {
      newTransactions.push(tx);
    }
  }

  return { newTransactions, duplicates };
};

export const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const userId = req.user._id;
    const { format } = req.body; // 'toss', 'auto'
    const results = [];

    // CSV 파일 읽기 (토스뱅크 형식 처리)
    await new Promise((resolve, reject) => {
      let headerFound = false;
      let headerRowIndex = -1;
      const rawRows = [];
      
      fs.createReadStream(req.file.path)
        .pipe(csv({
          skipEmptyLines: false,
          headers: false,
          skipLinesWithError: false
        }))
        .on('data', (row) => {
          rawRows.push(row);
          
          // 헤더 행 찾기 (거래 일시가 포함된 행)
          const rowValues = Object.values(row);
          const rowString = rowValues.join(',');
          
          if (!headerFound && (rowString.includes('거래 일시') || rowString.includes('거래일시'))) {
            headerFound = true;
            headerRowIndex = rawRows.length - 1;
          }
        })
        .on('end', () => {
          if (headerFound && headerRowIndex >= 0) {
            // 헤더 행을 첫 번째 행으로 사용
            const headerRow = rawRows[headerRowIndex];
            const headerKeys = Object.values(headerRow).map(v => String(v || '').trim());
            
            // 헤더 이후의 데이터만 처리
            for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
              const row = rawRows[i];
              const rowValues = Object.values(row);
              
              // 첫 번째 컬럼이 빈 값인 경우 제거 (토스뱅크 CSV는 쉼표로 시작)
              const filteredValues = rowValues.slice(1); // 첫 번째 빈 컬럼 제거
              const filteredHeaderKeys = headerKeys.slice(1); // 첫 번째 빈 헤더 제거
              
              const rowObj = {};
              
              // 헤더 키와 매칭하여 객체 생성
              filteredHeaderKeys.forEach((key, index) => {
                if (filteredValues[index] !== undefined) {
                  const value = filteredValues[index];
                  const valStr = String(value || '').trim();
                  // 빈 값이 아닌 경우만 추가
                  if (valStr !== '') {
                    rowObj[key] = value;
                  }
                }
              });
              
              // 거래 일시와 거래 금액이 있는 경우만 추가 (실제 거래 데이터)
              if (rowObj['거래 일시'] && rowObj['거래 금액']) {
                results.push(rowObj);
              }
            }
          } else {
            // 헤더를 찾지 못한 경우 기본 방식 사용
            fs.createReadStream(req.file.path)
              .pipe(csv({
                skipEmptyLines: true,
                headers: true,
                skipLinesWithError: false
              }))
              .on('data', (row) => {
                const hasData = Object.values(row).some(val => val && String(val).trim() !== '');
                if (hasData) {
                  results.push(row);
                }
              })
              .on('end', resolve)
              .on('error', reject);
            return;
          }
          resolve();
        })
        .on('error', (err) => {
          console.error('CSV 파싱 에러:', err);
          reject(err);
        });
    });

    if (results.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'CSV 파일이 비어있거나 형식이 올바르지 않습니다.' });
    }
    
    // 디버깅: 첫 번째 행과 컬럼명 출력
    console.log('CSV 첫 번째 행:', JSON.stringify(results[0], null, 2));
    console.log('CSV 컬럼명:', Object.keys(results[0]));
    console.log(`총 ${results.length}건의 거래 발견`);

    // 데이터 파싱
    const parsedTransactions = parseBankFormat(results, format || 'auto');
    
    // 파싱 결과 확인 및 디버깅
    if (parsedTransactions.length > 0) {
      console.log('파싱된 첫 번째 거래:', JSON.stringify(parsedTransactions[0], null, 2));
      console.log(`파싱 성공: ${parsedTransactions.length}건`);
      
      // 수입/지출 통계
      const incomeCount = parsedTransactions.filter(tx => tx.type === 'income').length;
      const expenseCount = parsedTransactions.filter(tx => tx.type === 'expense').length;
      console.log(`✅ 수입: ${incomeCount}건, 지출: ${expenseCount}건`);
      
      // 처음 5개 거래의 타입 확인
      parsedTransactions.slice(0, 5).forEach((tx, idx) => {
        console.log(`[${idx + 1}] ${tx.description}: ${tx.amount}원 (${tx.type})`);
      });
    } else {
      console.warn('파싱된 거래가 없습니다.');
    }

    // 중복 체크
    const { newTransactions, duplicates } = await checkDuplicates(parsedTransactions, userId);

    // 카테고리 자동 분류
    const transactionsWithCategory = await Promise.all(
      newTransactions.map(async (tx) => {
        try {
          const categoryId = await categorizeTransaction(tx.description, userId, tx.type);
          if (!categoryId) {
            throw new Error(`카테고리를 찾을 수 없습니다: ${tx.description}`);
          }
          return {
            userId,
            amount: tx.amount,
            type: tx.type,
            categoryId,
            description: tx.description,
            date: tx.date
          };
        } catch (error) {
          console.error(`거래 분류 실패: ${tx.description}`, error);
          // 카테고리 분류 실패 시에도 기본 카테고리로 저장
          const fallbackCategories = await Category.find({ userId, type: tx.type });
          const fallbackCategory = fallbackCategories.find(cat => cat.name === '기타') || fallbackCategories[0];
          if (!fallbackCategory) {
            throw new Error(`${tx.type} 타입의 카테고리가 없습니다. 기본 카테고리를 생성해주세요.`);
          }
          return {
            userId,
            amount: tx.amount,
            type: tx.type,
            categoryId: fallbackCategory._id,
            description: tx.description,
            date: tx.date
          };
        }
      })
    );

    // 미리보기 데이터 반환
    res.json({
      message: '파일이 성공적으로 파싱되었습니다.',
      preview: {
        total: parsedTransactions.length,
        new: newTransactions.length,
        duplicates: duplicates.length,
        transactions: transactionsWithCategory.slice(0, 20), // 처음 20개만 미리보기
        duplicatesPreview: duplicates.slice(0, 10)
      },
      // 실제 저장은 별도 엔드포인트에서 처리
      data: transactionsWithCategory
    });

    // 임시 파일 삭제
    fs.unlinkSync(req.file.path);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const userId = req.user._id;
    const { format, sheetName } = req.body;
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Excel 파일이 비어있거나 형식이 올바르지 않습니다.' });
    }

    // 데이터 파싱 (CSV와 동일한 로직)
    const parsedTransactions = parseBankFormat(rows, format || 'auto');
    const { newTransactions, duplicates } = await checkDuplicates(parsedTransactions, userId);

    const transactionsWithCategory = await Promise.all(
      newTransactions.map(async (tx) => {
        try {
          const categoryId = await categorizeTransaction(tx.description, userId, tx.type);
          if (!categoryId) {
            throw new Error(`카테고리를 찾을 수 없습니다: ${tx.description}`);
          }
          return {
            userId,
            amount: tx.amount,
            type: tx.type,
            categoryId,
            description: tx.description,
            date: tx.date
          };
        } catch (error) {
          console.error(`거래 분류 실패: ${tx.description}`, error);
          // 카테고리 분류 실패 시에도 기본 카테고리로 저장
          const fallbackCategories = await Category.find({ userId, type: tx.type });
          const fallbackCategory = fallbackCategories.find(cat => cat.name === '기타') || fallbackCategories[0];
          if (!fallbackCategory) {
            throw new Error(`${tx.type} 타입의 카테고리가 없습니다. 기본 카테고리를 생성해주세요.`);
          }
          return {
            userId,
            amount: tx.amount,
            type: tx.type,
            categoryId: fallbackCategory._id,
            description: tx.description,
            date: tx.date
          };
        }
      })
    );

    res.json({
      message: '파일이 성공적으로 파싱되었습니다.',
      preview: {
        total: parsedTransactions.length,
        new: newTransactions.length,
        duplicates: duplicates.length,
        transactions: transactionsWithCategory.slice(0, 20),
        duplicatesPreview: duplicates.slice(0, 10)
      },
      data: transactionsWithCategory
    });

    fs.unlinkSync(req.file.path);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

// CSV/Excel 미리보기 후 실제 저장하는 엔드포인트
export const saveUploadedTransactions = async (req, res) => {
  try {
    const { transactions } = req.body; // uploadCSV/uploadExcel에서 반환한 data
    const userId = req.user._id;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: '거래 내역 데이터가 필요합니다.' });
    }

    // 일괄 저장
    const savedTransactions = await Transaction.insertMany(transactions);

    // 예산 업데이트
    const categoryIds = [...new Set(transactions.map(tx => tx.categoryId.toString()))];
    for (const categoryId of categoryIds) {
      const categoryTransactions = transactions.filter(tx => 
        tx.categoryId.toString() === categoryId && tx.type === 'expense'
      );

      for (const tx of categoryTransactions) {
        const date = new Date(tx.date);
        const budget = await Budget.findOne({
          userId,
          categoryId,
          year: date.getFullYear(),
          month: date.getMonth() + 1
        });

        if (budget) {
          await budget.updateSpent();
        }
      }
    }

    res.json({
      message: `${savedTransactions.length}건의 거래가 추가되었습니다.`,
      count: savedTransactions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

