import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
// @ts-ignore
import { Solar, Lunar } from 'lunar-javascript';

export const dynamic = 'force-dynamic';

// 🧹 JSON 청소 함수
function cleanAndParseJSON(text: string) {
  try {
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parsing Error:", e);
    return {}; 
  }
}

// ⭐ [수정됨] 0개인 오행도 그대로 반환하도록 필터 제거
function calculateOhaeng(manseData: any) {
  const chars = [
    manseData.year_top, manseData.year_bottom,
    manseData.month_top, manseData.month_bottom,
    manseData.day_top, manseData.day_bottom,
    manseData.time_top, manseData.time_bottom
  ];

  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  
  const mapping: { [key: string]: string } = {
    '甲': 'wood', '乙': 'wood', '寅': 'wood', '卯': 'wood',
    '丙': 'fire', '丁': 'fire', '巳': 'fire', '午': 'fire',
    '戊': 'earth', '己': 'earth', '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
    '庚': 'metal', '辛': 'metal', '申': 'metal', '酉': 'metal',
    '壬': 'water', '癸': 'water', '亥': 'water', '子': 'water'
  };

  chars.forEach(char => {
    const element = mapping[char];
    if (element) {
      // @ts-ignore
      counts[element]++;
    }
  });

  // .filter(item => item.value > 0) 부분을 삭제하여 0개인 것도 보냅니다.
  return [
    { name: '나무', id: 'wood', value: counts.wood, color: '#2d6a4f', icon: '🌳' },
    { name: '불', id: 'fire', value: counts.fire, color: '#e63946', icon: '🔥' },
    { name: '흙', id: 'earth', value: counts.earth, color: '#d4a373', icon: '⛰️' },
    { name: '쇠', id: 'metal', value: counts.metal, color: '#adb5bd', icon: '⚔️' },
    { name: '물', id: 'water', value: counts.water, color: '#457b9d', icon: '💧' }
  ];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year, month, day, time, gender, calendarType, provider = 'openai' } = body;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    const koreanAge = currentYear - Number(year) + 1;
    let internationalAge = currentYear - Number(year);
    if (currentMonth < Number(month) || (currentMonth === Number(month) && currentDay < Number(day))) {
      internationalAge--;
    }

    const hours = time ? Number(time.split(':')[0]) : 12;
    const minutes = time ? Number(time.split(':')[1]) : 0;

    let lunar;
    if (calendarType === 'lunar') {
      lunar = Lunar.fromYmdHms(Number(year), Number(month), Number(day), hours, minutes, 0);
    } else {
      const solar = Solar.fromYmdHms(Number(year), Number(month), Number(day), hours, minutes, 0);
      lunar = solar.getLunar();
    }

    const eightChars = lunar.getEightChar();
    
    const manseData = {
      year_top: eightChars.getYearGan(), 
      year_bottom: eightChars.getYearZhi(),
      month_top: eightChars.getMonthGan(), 
      month_bottom: eightChars.getMonthZhi(),
      day_top: eightChars.getDayGan(), 
      day_bottom: eightChars.getDayZhi(),
      time_top: eightChars.getTimeGan(), 
      time_bottom: eightChars.getTimeZhi()
    };

    const ohaengData = calculateOhaeng(manseData);

    const sajuInfo = `
    [기준 정보]
    - 기준 연도: ${currentYear}년 ${currentMonth}월 ${currentDay}일
    - 태어난 해: ${year}년
    - 현재 나이: 한국식 ${koreanAge}세 (만 ${internationalAge}세)
    - 사용자 생년월일: ${year}년 ${month}월 ${day}일
    - 성별: ${gender === 'male' ? '남성' : '여성'}
    - 명식: ${manseData.year_top}${manseData.year_bottom}년, ${manseData.month_top}${manseData.month_bottom}월, ${manseData.day_top}${manseData.day_bottom}일, ${manseData.time_top}${manseData.time_bottom}시
  
    [중요 지시]
    당신은 현재 ${currentYear}년 한국에 살고 있습니다. 사용자의 나이는 ${koreanAge}세이므로, 
    사회적 위치나 생애 주기(결혼, 직업적 안정기, 자녀 등)를 이 나이대에 완벽히 맞춰서 분석하세요.
    아래는 어떤경우에든 조심해주세요. 
    =====================================
    0. 성별에 따라 형 또는 언니 라고 지칭하면서 문장을 쓸것. 
    1.절대 과거의 나이대(예: 92년생을 20대로 부르는 등)로 착각하지 마세요.
    2.그리고 절대 한자를 쓰지마세요. 
    3.사용자는 한국에 살고있는 한국인을 가정
    4.당연한말, 식상한말은 최소화
    5.적절하고 재치있는 비유롤 넣어줘도 좋음
    6. 친구가 말해주듯이 반말로 친근하게 구어체로 풀어서써야함. 재치있고 센스있어야하고, 10대 청소년도 이해할 수 있을정도의 직관적이고 재밌는 글로 구성. 하지만 너무 건방지진 않게. 
    7. 프롬프트 요청사항을 결과물에 직접 드러내지 말것
    8. ** // 등의 특수문자 쓰지말것. 
    `;

    const systemPrompt1 = "당신은 만세력 분석 전문가입니다. JSON 형식으로만 응답하세요.";
    const userPrompt1 = `${sajuInfo} 이 명식의 오행 구성과 강약을 분석해 JSON으로 줘. { "analysis": "내용" }`;

    const systemPrompt2 = "당신은 재치있고 입담좋은 명리학 대가입니다";
    const userPrompt2 = `${sajuInfo}      이미 만세력 계산은 끝났으니, 사주를 면밀히 분석하는데, 
                     딱히 1)2)식으로 문단 나누지말고, 1000자 분량정도로 써줘.아래가 적어야 하는 내용들이야. 맨 첫 마디는 너무 오버하거나 어색하지않고, 자연스러운 요즘애들 느낌으로 .
                    =================== 
                    0. 사주나 명리학에 대해 이야기할 때 인목, 정인, 상관, 신금 같은 전문 한자어는 쓰지 말아줘. 대신 '큰 나무의 기운', '불의 기운', '말재주 기운', '보석의 기운'처럼 누구나 이해하기 쉬운 우리말과 자연의 기운으로 풀어서 설명해줘.
                    1. 전반적인 사주팔자 구성 설명
                    2. 사주팔자로 보는 운명
                    3. 음양오향 기반의 성격과 기질, 그리고 숨겨진 성격
                    4. 인생의 고점,저점 분석
                    5. 부와 성공이 예약된 황금기
                    6. 조심해야 할 인생의 암흑기
                     `;

    const systemPrompt3 = "당신은 친절하고 상세한 사주 상담가입니다. 자극적이고 사용자들이 궁금해할만한 테마로 엮어서 정리해줘야합니다. 결과는 반드시 JSON 형식이어야 합니다.";
    const userPrompt3 = `${sajuInfo} 사주를 면밀히 분석하는데, 
                      아래는 7가지 테마에 대한 구체적인 요청이야.  700자 이상의 아주 상세한 내용을 담아 JSON으로 줘. 
                      * 반환형식은 { "themes": [{ "icon": "이모지", "title": "센스있는 요즘 20대 유행어등을 섞어쓴 제목", "content": "700자 이상의 내용" }] }
                      ============================================
                      1. 연애운과 배우자운 (연애유형과 성향, 사주가 알려주는 운명의상대, 천생연분을 만나는 최적의 시기)
                      2. 재물운 ( 사주 속에 숨겨진 재물운 , 돈이 불어날 때와 조심해야 할 때, 재물복을 놏이는 방법과 제테크 전략)
                      3. 직업과 성공의 운명(적합한 직업과 직종 제안, 내운명은 사업가일까 직장인일까)
                      4. 건강,체질,거주환경 (타고난 건강 체질과 관리법 , 건강에 유의해야 할 시기와 대처법, 추천하는 거주지역 특성과 구체적인 도시예시 )
                      5. 운명의 귀인 ( 나를 돕는 귀인의 특징, 운명의 귀인을 만나는 시기 )
                      6. 운명을 바꾸는 법 ( 사주가 가리키는 운명의 개선점, 운의 물길을 바꾸는 인생전략)
                      7. 미래예측 ( 올해의 월별 운명 분석, 향후 10년 운명 분석)`;


    let resultCommentary = "";
    let resultThemes = [];

    if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
      // ✅ [약속] 모델명 고정
      const modelName = "claude-sonnet-4-5"; 

      const [res1, res2, res3] = await Promise.all([
        anthropic.messages.create({
          model: modelName,
          max_tokens: 2048,
          system: systemPrompt1,
          messages: [{ role: "user", content: userPrompt1 }],
        }),
        anthropic.messages.create({
          model: modelName,
          max_tokens: 4096,
          system: systemPrompt2,
          messages: [{ role: "user", content: userPrompt2 }],
        }),
        anthropic.messages.create({
          model: modelName,
          max_tokens: 8192,
          system: systemPrompt3,
          messages: [{ role: "user", content: userPrompt3 + "\n\nJSON output only. Do not include markdown formatting like ```json" }], 
        })
      ]);

      // @ts-ignore
      resultCommentary = res2.content[0].text;
      // @ts-ignore
      const themesObj = cleanAndParseJSON(res3.content[0].text);
      resultThemes = themesObj.themes || [];

    } else {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
      const modelName = "gpt-5.2";

      const [res1, res2, res3] = await Promise.all([
        openai.chat.completions.create({
          model: modelName,
          messages: [{ role: "system", content: systemPrompt1 }, { role: "user", content: userPrompt1 }],
          response_format: { type: "json_object" },
          temperature: 0.5
        }),
        openai.chat.completions.create({
          model: modelName,
          messages: [{ role: "system", content: systemPrompt2 }, { role: "user", content: userPrompt2 }],
          temperature: 0.9
        }),
        openai.chat.completions.create({
          model: modelName,
          messages: [{ role: "system", content: systemPrompt3 }, { role: "user", content: userPrompt3 }],
          response_format: { type: "json_object" },
          temperature: 0.85
        })
      ]);

      resultCommentary = res2.choices[0].message.content || "";
      const themesObj = JSON.parse(res3.choices[0].message.content || '{}');
      resultThemes = themesObj.themes || [];
    }

    return NextResponse.json({ 
      manse: manseData,
      ohaeng: ohaengData, 
      commentary: resultCommentary,
      themes: resultThemes,
      provider: provider
    });

  } catch (error: any) {
    console.error("API Error Details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}