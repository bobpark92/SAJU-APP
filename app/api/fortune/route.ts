import { NextResponse } from 'next/server';
import OpenAI from 'openai';
// @ts-ignore
import { Solar, Lunar } from 'lunar-javascript';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API Key가 설정되지 않았습니다.");
    
    const openai = new OpenAI({ apiKey });
    
    const body = await request.json();
    const { year, month, day, time, gender, calendarType } = body;

    // 1. 만세력 데이터 추출 (에러 방지 로직 포함)
    let solar;
    try {
      if (calendarType === 'lunar') {
        solar = Lunar.fromYmd(Number(year), Number(month), Number(day)).getSolar();
      } else {
        solar = Solar.fromYmd(Number(year), Number(month), Number(day));
      }
    } catch (e) {
      throw new Error("날짜 계산 중 오류가 발생했습니다. 입력을 확인해주세요.");
    }

    const lunar = solar.getLunar();
    const hours = time ? Number(time.split(':')[0]) : 12;
    const eightChars = lunar.getEightChar();
    
    // 시간 정보 설정 (라이브러리 버전에 따라 인덱스 설정이 까다로울 수 있어 안전하게 처리)
    try {
      eightChars.setTimeGanIndex(Math.floor((hours + 1) / 2) % 10);
    } catch (e) {
      console.log("Time index setting skipped");
    }

    const manseData = {
      year_top: eightChars.getYearGan() || '?',
      year_bottom: eightChars.getYearZhi() || '?',
      month_top: eightChars.getMonthGan() || '?',
      month_bottom: eightChars.getMonthZhi() || '?',
      day_top: eightChars.getDayGan() || '?',
      day_bottom: eightChars.getDayZhi() || '?',
      time_top: eightChars.getTimeGan() || '?',
      time_bottom: eightChars.getTimeZhi() || '?'
    };
    // 2. GPT에게 보낼 정밀 프롬프트
    const prompt = `
      당신은 30년 경력의 명리학 대가입니다. 아래 제공된 **정확한 사주 명식**을 바탕으로 사용자의 인생을 분석하세요.
      이미 만세력 계산은 끝났으니, 당신은 아래를 분석하는데에만 집중하세요. 
      1) 사주 원국(오행 균형, 강약, 용신 기신) 2) 십신 성향(재성 관성 식상 인성 비겁) 3) 지장간 포함분석 4) 형충파해 합 삼합 전체 
      5) 대운흐름과 주요 변화포인트 6)올해 상세운 7) 연애/직업/재문/관계운 순서로 현실조언 8) 블로그 글로 바로 올릴 수 있게 자연스럽게 작성

      [사용자 명식]
      - 연주: ${manseData.year_top}${manseData.year_bottom}
      - 월주: ${manseData.month_top}${manseData.month_bottom}
      - 일주: ${manseData.day_top}${manseData.day_bottom}
      - 시주: ${manseData.time_top}${manseData.time_bottom}
      - 성별: ${gender === 'male' ? '남성' : '여성'}

      [분석 가이드라인]
      1. 일간(Day Top)인 '${manseData.day_top}'의 특성을 중심으로 본질적인 성격을 꿰뚫어 보세요.
      2. 월지(Month Bottom)인 '${manseData.month_bottom}'를 통해 이 사람이 타고난 사회적 환경과 격국을 논하세요.
      3. 명식에 나타난 형살(인신사, 축술미 등)이나 충(자오충 등)이 있다면 이를 현대적으로 해석하여 '팩폭' 하세요.
      4. 부족한 오행(목화토금수)을 분석하여 개운법(색상, 장소, 습관 등)을 구체적으로 제시하세요.
      5. 총 13개의 테마로 구성하며, 각 테마는 매력적인 제목과 이모지를 포함해야 합니다.
      6. 각 테마는 최소 700자의 긴 문장으로 표현해야함 
      7. 마치 상대방을 간파하는것처럼 상대방의 성격과 성향 그리고 능력등을 열거하고, 이를 명리학적으로 분석
      8. 사주를 처음보는 사람도 편하게 볼 수 있게끔, 쉽게 설명하는 센스도 들어가야함. 

      [JSON 구조]
      {
        "manse": ${JSON.stringify(manseData)},
        "themes": [
          { "icon": "이모지", "title": "비유적 제목", "content": "명리학적 근거가 담긴 깊이 있는 해설" }
        ]...(13개)
      }
    `;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const resultText = completion.choices[0].message.content;
    return NextResponse.json({ result: resultText });

  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}