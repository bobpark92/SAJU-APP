"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    year: '', month: '', day: '', time: '',
    gender: 'male', calendarType: 'solar'
  })
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(0) // 첫번째 항목은 열어둠

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user) })
  }, [])

  const handleAnalyze = async () => {
    if (!formData.year || !formData.month || !formData.day) return alert('정보를 입력해주세요!');
    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      const parsed = JSON.parse(data.result);
      setAnalysis(parsed);

      // DB 저장
      await supabase.from('user_history').insert({
        user_id: user?.id,
        birth_year: formData.year,
        birth_month: formData.month,
        birth_day: formData.day,
        gender: formData.gender,
        calendar_type: formData.calendarType,
        fortune_result: data.result,
        prompt_sent: data.promptSent
      });
    } catch (err) {
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 오행별 색상 지정 함수 (만세력 시각화용)
  const getElementColor = (char: string) => {
    if ("甲乙寅卯".includes(char)) return { color: "#2d6a4f", bg: "#e8f5e9" }; // 목(초록)
    if ("丙丁巳午".includes(char)) return { color: "#ae2012", bg: "#fff0f0" }; // 화(빨강)
    if ("戊己辰戌丑未".includes(char)) return { color: "#9c6644", bg: "#fdf5e6" }; // 토(노랑/갈색)
    if ("庚辛申酉".includes(char)) return { color: "#495057", bg: "#f8f9fa" }; // 금(흰색/회색)
    if ("壬癸亥子".includes(char)) return { color: "#003049", bg: "#e0f2fe" }; // 수(검정/파랑)
    return { color: "#333", bg: "#fff" };
  }

  const ManseCell = ({ char }: { char: string }) => {
    const style = getElementColor(char);
    return (
      <td style={{ 
        padding: '15px 5px', border: '1px solid #eee', textAlign: 'center', 
        fontSize: '20px', fontWeight: 'bold', color: style.color, backgroundColor: style.bg 
      }}>
        {char}
      </td>
    );
  }

  return (
    <div style={{ backgroundColor: '#F8F9FB', minHeight: '100vh', paddingBottom: '50px' }}>
      {/* 상단 노란색 배너 영역 */}
      <div style={{ backgroundColor: '#FFD400', padding: '50px 20px 30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px' }}>
          {user?.user_metadata?.full_name || '손님'}님의 운세 해설
        </h1>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          {formData.year || '0000'}년 {formData.month || '0'}월 {formData.day || '0'}일생 · {formData.gender === 'male' ? '남성' : '여성'}
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-20px auto 0', padding: '0 16px' }}>
        {!analysis ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="number" placeholder="출생년도(4자리)" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }} onChange={e => setFormData({...formData, year: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" placeholder="월" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }} onChange={e => setFormData({...formData, month: e.target.value})} />
                <input type="number" placeholder="일" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }} onChange={e => setFormData({...formData, day: e.target.value})} />
              </div>
              <button onClick={handleAnalyze} disabled={loading} style={{ padding: '18px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                {loading ? '운명 분석 중...' : '무료 사주 풀이 보기'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 만세력 테이블 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ backgroundColor: '#222', color: '#fff', padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>만세력 분석</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fdfdfd' }}>
                    {['시주','일주','월주','연주'].map(t => <th key={t} style={{ padding: '10px', fontSize: '11px', color: '#999', fontWeight: 'normal', border: '1px solid #eee' }}>{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <ManseCell char={analysis.manse.time_top} />
                    <ManseCell char={analysis.manse.day_top} />
                    <ManseCell char={analysis.manse.month_top} />
                    <ManseCell char={analysis.manse.year_top} />
                  </tr>
                  <tr>
                    <ManseCell char={analysis.manse.time_bottom} />
                    <ManseCell char={analysis.manse.day_bottom} />
                    <ManseCell char={analysis.manse.month_bottom} />
                    <ManseCell char={analysis.manse.year_bottom} />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 아코디언 테마 리스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysis.themes.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #edf2f7', overflow: 'hidden' }}>
                  <div 
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{item.title}</span>
                    <span style={{ transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', fontSize: '12px' }}>▼</span>
                  </div>
                  {openIndex === idx && (
                    <div style={{ padding: '0 20px 20px', fontSize: '14.5px', lineHeight: '1.8', color: '#4a5568', whiteSpace: 'pre-wrap' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={() => setAnalysis(null)} style={{ width: '100%', marginTop: '30px', padding: '15px', background: 'none', border: '1px solid #ddd', borderRadius: '12px', color: '#888' }}>
              새로 분석하기
            </button>
          </>
        )}
      </div>
    </div>
  )
}