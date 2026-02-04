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
      당신은 사주팔자와 만세력 전문가입니다. 사용자의 정보를 바탕으로 분석 결과를 **반드시 JSON 형식**으로만 답변하세요.

      사용자 정보:
      - 생년월일: ${year}년 ${month}월 ${day}일 (${calendarType === 'solar' ? '양력' : '음력'})
      - 시간: ${time || '모름'}
      - 성별: ${gender === 'male' ? '남성' : '여성'}

      분석 지침:
      1. 'manse' 객체에는 연주, 월주, 일주의 천간과 지지를 각각 1글자의 한자로 포함하세요. (시주는 모를 경우 '-' 처리)
      2. 'themes' 배열에는 최소 6개의 분석 테마를 넣으세요.
      3. 각 테마의 'title'은 "화려한 조명 속에서 칼춤 추는 승부사" 같이 아주 매력적이고 은유적인 소제목으로 지으세요.
      4. 'content'는 해당 테마에 대한 심층적인 분석 내용을 '도사님' 말투로 상세히 적으세요.
      5. 각 테마안에서는 최소 공백포함 600자가 되도록 설명해줘 
      6. 사람들이 테마안의 설명을 볼때 사주내용이 어려울 수 있으니, 쉽게 표현하고 구체적인 예시를 들어줘서 설명해주는것도 좋아. 

      응답 예시 형식:
      {
        "manse": {
          "year_top": "壬", "year_bottom": "申",
          "month_top": "壬", "month_bottom": "寅",
          "day_top": "丁", "day_bottom": "巳",
          "time_top": "-", "time_bottom": "-"
        },
        "themes": [
          { "title": "소제목1", "content": "내용1" },
          { "title": "소제목2", "content": "내용2" }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, // JSON 출력 강제
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;

    return NextResponse.json({ 
      result: result, // JSON 문자열
      promptSent: prompt 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}