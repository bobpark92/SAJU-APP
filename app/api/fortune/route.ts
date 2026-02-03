import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 서버 측에서만 실행되도록 설정
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // 클라이언트로부터 전달받은 데이터 읽기
    const body = await request.json();
    const { year, month, day, time, gender, calendarType } = body;

    // AI에게 보낼 질문(Prompt) 작성
    const prompt = `
      사주 전문가로서 다음 사람의 사주를 분석해주세요.
      - 출생년월일: ${year}년 ${month}월 ${day}일 (${calendarType === 'solar' ? '양력' : '음력'})
      - 출생시간: ${time || '모름'}
      - 성별: ${gender === 'male' ? '남성' : '여성'}

      위 정보를 바탕으로 올해의 총운, 성격, 주의할 점을 친절하고 위트있게 설명해주세요.
      답변은 한국어로 작성하고, 가독성 좋게 줄바꿈을 많이 해주세요.
    `;

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const result = completion.choices[0].message.content;

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: 'AI 분석 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}