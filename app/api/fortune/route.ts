import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Solar, Lunar, LunarMonth } from 'lunar-javascript';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const openai = new OpenAI({ apiKey: apiKey || '' });
    
    const body = await request.json();
    const { year, month, day, time, gender, calendarType } = body;

    // 1. 라이브러리를 이용한 정확한 만세력 계산
    let solar: Solar;
    if (calendarType === 'lunar') {
      solar = Lunar.fromYmd(Number(year), Number(month), Number(day)).getSolar();
    } else {
      solar = Solar.fromYmd(Number(year), Number(month), Number(day));
    }

    const lunar = solar.getLunar();
    const hours = time ? Number(time.split(':')[0]) : 12; // 시간 모를 시 정오 기준
    const minutes = time ? Number(time.split(':')[1]) : 0;
    
    // 만세력 8글자 추출
    const eightChars = lunar.getEightChar();
    // 시주(Time)는 라이브러리 특성상 시간 설정이 필요함
    eightChars.setTimeGanIndex(Math.floor((hours + 1) / 2) % 10); 

    const manseData = {
      year_top: eightChars.getYearGan(), year_bottom: eightChars.getYearZhi(),
      month_top: eightChars.getMonthGan(), month_bottom: eightChars.getMonthZhi(),
      day_top: eightChars.getDayGan(), day_bottom: eightChars.getDayZhi(),
      time_top: eightChars.getTimeGan(), time_bottom: eightChars.getTimeZhi()
    };

    // 2. GPT에게 보낼 정밀 프롬프트
    const prompt = `
      당신은 30년 경력의 명리학 대가입니다. 아래 제공된 **정확한 사주 명식**을 바탕으로 사용자의 인생을 분석하세요.
      이미 만세력 계산은 끝났으니, 당신은 이 글자들의 상생상극과 형충파해를 분석하는 데만 집중하세요.

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

      [JSON 구조]
      {
        "manse": ${JSON.stringify(manseData)},
        "themes": [
          { "icon": "이모지", "title": "비유적 제목", "content": "명리학적 근거가 담긴 깊이 있는 해설" }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.75,
    });

    return NextResponse.json({ 
      result: completion.choices[0].message.content,
      promptSent: prompt 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}