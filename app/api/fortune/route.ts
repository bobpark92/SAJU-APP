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
    const currentYear = now.getFullYear(); // 서버의 현재 연도 (예: 2026)
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    // 한국 나이(세는 나이) 계산: (현재연도 - 태어난연도) + 1
    const koreanAge = currentYear - Number(year) + 1;
    
    // 만 나이 계산 (더 정밀한 분석을 위해)
    let internationalAge = currentYear - Number(year);
    if (currentMonth < Number(month) || (currentMonth === Number(month) && currentDay < Number(day))) {
      internationalAge--;
    }

    // 시간을 시/분으로 분리
    const hours = time ? Number(time.split(':')[0]) : 12;
    const minutes = time ? Number(time.split(':')[1]) : 0;

    // [Step 0] 만세력 라이브러리 계산 (시간을 포함하여 생성)
    let lunar;
    if (calendarType === 'lunar') {
      lunar = Lunar.fromYmdHms(Number(year), Number(month), Number(day), hours, minutes, 0);
    } else {
      const solar = Solar.fromYmdHms(Number(year), Number(month), Number(day), hours, minutes, 0);
      lunar = solar.getLunar();
    }

    const eightChars = lunar.getEightChar();
    
    // 에러 발생했던 setTimeGanIndex 부분은 이제 필요 없습니다. 
    // 위에서 fromYmdHms로 시간을 넣었기 때문에 자동으로 시주가 계산됩니다.

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




    // 사주 정보에 현재 연도와 나이를 대놓고 명시합니다.


    const sajuInfo = `
    [기준 정보]
    - 기준 연도: ${currentYear}년 ${currentMonth}월 ${currentDay}일
    - 태어난 해: ${year}년
    - 현재 나이: 한국식 ${koreanAge}세 (만 ${internationalAge}세)
    - 사용자 생년월일: ${year}년 ${month}월 ${day}일
    - 성별: ${gender === 'male' ? '남성' : '여성'}
    - 명식: ${manseData.year_top}${manseData.year_bottom}년, ${manseData.month_top}${manseData.month_bottom}월, ${manseData.day_top}${manseData.day_bottom}일, ${manseData.time_top}${manseData.time_bottom}시
  
  [중요 지시]
      당신은 현재 ${currentYear}년에 살고 있습니다. 사용자의 나이는 ${koreanAge}세이므로, 
      사회적 위치나 생애 주기(결혼, 직업적 안정기, 자녀 등)를 이 나이대에 완벽히 맞춰서 분석하세요.
      절대 과거의 나이대(예: 92년생을 20대로 부르는 등)로 착각하지 마세요.
      `;

    // [Step 1, 2, 3] 세 개의 프롬프트 병렬 호출
    const [res1, res2, res3] = await Promise.all([
      // 프롬프트 1: 만세력 분석 (JSON)
      openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "system", content: "당신은 만세력 분석 전문가입니다." },
                   { role: "user", content: `${sajuInfo} 이 명식의 오행 구성과 강약을 분석해 JSON으로 줘. { "analysis": "내용" }` }],
        response_format: { type: "json_object" },
        temperature: 0.5
      }),
      // 프롬프트 2: 대가의 재치있는 평론 (TEXT)
      openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "system", content: "당신은 재치있고 입담좋은 명리학 대가입니다" },
                   { role: "user", content: `${sajuInfo}      이미 만세력 계산은 끝났으니, 당신은 아래를 분석하는데에만 집중하세요. 
                    20대 여자애가 블로그 글에 올리는 요즘느낌으로 센스있게 1000자정도 분량으로 작성부탁. 사용자가 읽었을때 재미없으면 안됨. 당장 블로그에 글을 올려도 될정도의 퀄리티로부탁. 특히 **표시는 적지말고...
      1) 사주 원국(오행 균형, 강약, 용신 기신) 2) 십신 성향(재성 관성 식상 인성 비겁) 3) 지장간 포함분석 4) 형충파해 합 삼합 전체 
      5) 대운흐름과 주요 변화포인트 6)올해 상세운 7) 연애/직업/재문/관계운 순서로 미래 대운흐름시점을 넣어서 적어주면 좋음 8)너무 좋은말만 적지말고 조심해야할 점 도 간간히 적어주면 좋음 
` }],
          temperature: 0.9
      }),
      // 프롬프트 3: 7가지 심화 테마 (JSON)
      openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "system", content: "당신은 친절하고 상세한 사주 상담가입니다. 자극적이고 사용자들이 궁금해할만한 테마로 엮어서 정리해줘야합니다." },
                   { role: "user", content: `${sajuInfo} 사주 초보자도 이해하기 쉽게 재밌고 자극적인 7개의 테마를 정합니다.
                    각테마에서는 특정 나이대에 겪게되는 미래에 관련된 이야기도 적어주면 좋습니다. 각테마는 700자 이상의 아주 상세한 내용을 담아 JSON으로 줘.읽었을때 재미없으면 안되고, 재치있고 톡톡튀는 말투로 부탁 { "themes": [{ "icon": "이모지", "title": "센스있는 요즘 20대 유행어등을 섞어쓴 제목", "content": "700자 이상의 내용" }] }` }],
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