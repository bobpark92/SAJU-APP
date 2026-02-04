import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const body = await request.json();
    const { year, month, day, time, gender, calendarType } = body;

    const prompt = `
      당신은 30년 경력의 명리학 대가입니다. 
      오늘 날짜는 2026년 2월 4일입니다.
      
      사용자 정보:
      - 생년월일: ${year}년 ${month}월 ${day}일 (${calendarType === 'solar' ? '양력' : '음력'})
      - 태어난 시간: ${time || '모름'}
      - 성별: ${gender === 'male' ? '남성' : '여성'}

      분석 지침:
      1. 위 정보를 바탕으로 이 사람만의 고유한 [사주팔자]와 [오행] 구성을 분석하세요.
      2. 2026년 병오년(丙午年)의 기운이 이 사람과 어떻게 충돌/보완되는지 개인 맞춤형으로 설명하세요.
      3. 뻔한 덕담은 지양하고, 특히 조심해야 할 달(月)과 행운의 아이템을 구체적으로 짚어주세요.
      4. 말투는 위트 있는 '점집 도사님' 말투를 사용하세요.
      5. 답변 시작에 "2026년 병오년, ${gender === 'male' ? '선비' : '아씨'}님을 위한 특급 처방입니다"라고 적어주세요.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8, 
    });

    const result = completion.choices[0].message.content;

    // 💡 클라이언트(page.tsx)에서 DB에 저장할 수 있도록 프롬프트와 결과를 함께 반환
    return NextResponse.json({ 
      result: result,
      promptSent: prompt 
    });
  } catch (error: any) {
    console.error('Fortune API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}