import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const openai = new OpenAI({ apiKey: apiKey || '' });
    
    const body = await request.json();
    const { year, month, day, time, gender, calendarType } = body;

    const prompt = `
      당신은 대한민국 최고의 스타 사주 상담가이자 '현대판 도사'입니다. 
      사용자의 정보를 바탕으로 소름 돋을 정도로 정확하고 매력적인 분석 결과를 **JSON 형식**으로만 답변하세요.

      [사용자 정보]
      - 생년월일: ${year}년 ${month}월 ${day}일 (${calendarType === 'solar' ? '양력' : '음력'})
      - 태어난 시간: ${time || '모름'}
      - 성별: ${gender === 'male' ? '남성' : '여성'}

      [작성 지침 - 반드시 지킬 것]
      1. 테마 구성: 반드시 12개~13개의 테마로 구성하세요.
      2. 테마 제목: "브레이크 없는 페라리", "팩폭 주의: 겉은 양반, 속은 시한폭탄" 같이 현대적이고 감각적인 비유를 사용하세요. 그렇다고 대놓고 예시와 같은걸 쓰지말고, 좀 다양하고 창의적으로 해주세요 예시는 예시일뿐,,,
      3. 말투: 구어체와 문어체를 섞어 전문적이면서도 친근하게(도사님 말투) 작성하세요. 팩폭(날카로운 지적)과 따뜻한 위로를 적절히 배치하세요.
      4. 명리학적 근거: 각 해설에는 반드시 관련 명리학 용어(십성, 신살, 오행의 합/충 등)를 언급하며 논리적으로 풀이하세요.
      5. 가독성: 각 테마의 내용은 1000자 이상의 풍부한 분량으로 작성하고, 문단 구분을 확실히 하세요.
      6. 각 테마에 예시를 풀어서 설명해주면서, 사주를 처음보는 사람들도 알아듣기 편하도록 설명하세요. 
      7. 특히 해당 테마에서 2026년의 이벤트에 대해서 설명할일이있으면 해줘도 좋아요 

      [JSON 구조예시]
            {
              "manse": {
                  "time_top": "한자", "day_top": "한자", "month_top": "한자", "year_top": "한자",
                  "time_bottom": "한자", "day_bottom": "한자", "month_bottom": "한자", "year_bottom": "한자"
                },
              "themes": [
                { 
                  "icon": "이모지", 
                  "title": "제목", 
                  "content": "상세한 해설 내용..." 
                },
                ... (총 13개)
              ]
            }

            [아이콘 지침]
            각 테마의 성격에 가장 잘 어울리는 이모지를 하나씩 골라 'icon' 필드에 넣어주세요.
            예: 돈 관련은 💰, 성격 팩폭은 ⚡, 이동/역마는 ✈️ 등.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 더 정교한 분석을 위해 gpt-4o 권장
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = completion.choices[0].message.content;
    return NextResponse.json({ result: result, promptSent: prompt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}