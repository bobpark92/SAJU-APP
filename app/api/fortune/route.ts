import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 1. 빌드 타임에 미리 페이지를 만들지 않도록 강제함 (정석 설정)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 2. 키 검사를 실제 요청이 들어온 순간(Runtime)에 수행
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    // 3. 필요할 때만 OpenAI 객체 생성
    const openai = new OpenAI({ apiKey });

    const body = await request.json();
    const { year, month, day, time, gender, calendarType } = body;

    const prompt = `
      사주 전문가로서 다음 사람의 사주를 분석해주세요.
      - 출생년월일: ${year}년 ${month}월 ${day}일 (${calendarType === 'solar' ? '양력' : '음력'})
      - 출생시간: ${time || '모름'}
      - 성별: ${gender === 'male' ? '남성' : '여성'}

      위 정보를 바탕으로 올해의 총운, 성격, 주의할 점을 한국어로 상세히 설명해주세요.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ result: completion.choices[0].message.content });

  } catch (error: any) {
    console.error('Fortune API Error:', error);
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}