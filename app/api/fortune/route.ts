import { NextResponse } from 'next/server';
import OpenAI from 'openai';
// @ts-ignore
import { Solar, Lunar } from 'lunar-javascript';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const openai = new OpenAI({ apiKey: apiKey || '' });
    const body = await request.json();
    const { year, month, day, time, gender, calendarType } = body;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    // 한국 나이 계산
    const koreanAge = currentYear - Number(year) + 1;
    
    // 만 나이 계산
    let internationalAge = currentYear - Number(year);
    if (currentMonth < Number(month) || (currentMonth === Number(month) && currentDay < Number(day))) {
      internationalAge--;
    }

    // 시간 분리
    const hours = time ? Number(time.split(':')[0]) : 12;
    const minutes = time ? Number(time.split(':')[1]) : 0;

    // 만세력 계산
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
      절대 과거의 나이대(예: 92년생을 20대로 부르는 등)로 착각하지 마세요.
      `;

    // 병렬 호출
    const [res1, res2, res3] = await Promise.all([
      // 프롬프트 1: 만세력 분석 (JSON)
      openai.chat.completions.create({
        model: "gpt-5.2", // gpt-5.2는 없으므로 gpt-4o로 변경 (프롬프트 유지)
        messages: [{ role: "system", content: "당신은 만세력 분석 전문가입니다." },
                   { role: "user", content: `${sajuInfo} 이 명식의 오행 구성과 강약을 분석해 JSON으로 줘. { "analysis": "내용" }` }],
        response_format: { type: "json_object" },
        temperature: 0.5
      }),
      // 프롬프트 2: 대가의 재치있는 평론 (TEXT)
      openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "system", content: "당신은 재치있고 입담좋은 명리학 대가입니다" },
                   { role: "user", content: `${sajuInfo}      이미 만세력 계산은 끝났으니, 사주를 면밀히 분석하는데, 
                   10대 청소년도 이해할 수 있을정도로 쉽고 재치있고 센스있게 ! 딱히 1)2)식으로 문단 나누지말고, 친구가 말해주듯이 친근하게 구어체로 풀어서 1500자 분량정도로 써줘 
                   =================== 
                   1. 사용자의 성격과 특성, 숨겨진성격등 분석 . 그에따른 잘 맞는 직업분석 
                   2. 평소 대인관계 분석. 
                   3. 잘 맞는 궁합의 사람 분석 
                   4. 연애/직업/재물/관계 등의 미래 대운시점 포착 
                   5. 올해 상세운
                   6. 조심해야할것. 
                   7. 너무 좋은말만 적지 않아도 됨. 팩폭부탁
                   8. ## **등의 특수문자 쓰지말고, 구어체. 

` }],
         temperature: 0.9
      }),
      // 프롬프트 3: 7가지 심화 테마 (JSON)
      openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "system", content: "당신은 친절하고 상세한 사주 상담가입니다. 자극적이고 사용자들이 궁금해할만한 테마로 엮어서 정리해줘야합니다." },
                   { role: "user", content: `${sajuInfo} 사주 초보자도 이해하기 쉽게 재밌고 자극적인 7개의 테마를 정합니다.
                     각테마는 700자 이상의 아주 상세한 내용을 담아 JSON으로 줘.
                    1. 재미있는 친구가 말해주듯이 구어체느낌으로 내용을 구성. 
                    2. 떄로는 팩폭을, 떄로는 위로와 충고, 적절하고 재치있는 비유롤 넣어줘도 좋음. (하지만 팩폭등 이런 말을 반복해서 사용하는건 지양.)
                    3. 각테마에서는 특정 나이대에 겪게되는 미래에 관련된 이야기도 적어주면 좋습니다.
                    4. 사용자는 한국에 살고있는 한국인을 가정. 
                    5. 반환형식은 { "themes": [{ "icon": "이모지", "title": "센스있는 요즘 20대 유행어등을 섞어쓴 제목", "content": "700자 이상의 내용" }] }` }],
        response_format: { type: "json_object" },
        temperature: 0.85
      })
    ]);

    return NextResponse.json({ 
      manse: manseData,
      commentary: res2.choices[0].message.content,
      themes: JSON.parse(res3.choices[0].message.content || '{}').themes
    });

  } catch (error: any) {
    console.error("API Error Details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}