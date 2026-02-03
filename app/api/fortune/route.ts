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

// app/api/fortune/route.ts 내 프롬프트 부분 수정
    const prompt = `
    당신은 2026년 현재 최고의 사주 전문가입니다.
    오늘은 2026년 2월 3일입니다.

    다음 사람의 사주를 분석하여 **2026년 병오년(丙午年)**의 운세를 중심으로 풀이해주세요.
    - 출생: ${year}년 ${month}월 ${day}일 (${calendarType === 'solar' ? '양력' : '음력'})
    - 시간: ${time || '모름'}
    - 성별: ${gender === 'male' ? '남성' : '여성'}

    2026년의 전체적인 흐름, 재물운, 애정운, 그리고 주의할 점을 한국어로 부드럽게 상세히 설명해주세요. 
    그리고 자식운에 대해서도 마지막에 꼭 적어주세요 !!! (자식이 있다면 어떻게 성장할것인가, 관계는 어떨것인가 등등 )
    "2023년" 같은 과거 이야기는 절대 하지 마세요.
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