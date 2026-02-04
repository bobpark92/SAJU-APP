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
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user) })
  }, [])

  const handleAnalyze = async () => {
    if (!formData.year || !formData.month || !formData.day) return alert('생년월일을 모두 입력해주세요!');
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

      await supabase.from('user_history').insert({
        user_id: user?.id,
        birth_year: formData.year,
        birth_month: formData.month,
        birth_day: formData.day,
        birth_time: formData.time || null,
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

  // 오행 색상 로직
  const getElementColor = (char: string) => {
    if ("甲乙寅卯".includes(char)) return { color: "#2d6a4f", bg: "#e8f5e9" };
    if ("丙丁巳午".includes(char)) return { color: "#ae2012", bg: "#fff0f0" };
    if ("戊己辰戌丑未".includes(char)) return { color: "#9c6644", bg: "#fdf5e6" };
    if ("庚辛申酉".includes(char)) return { color: "#495057", bg: "#f8f9fa" };
    if ("壬癸亥子".includes(char)) return { color: "#003049", bg: "#e0f2fe" };
    return { color: "#ccc", bg: "#fff" };
  }

  // 스타일 프리셋
  const inputBaseStyle = { 
    width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', 
    fontSize: '16px', backgroundColor: '#F8FAFC', color: '#1E293B', boxSizing: 'border-box' as const 
  };
  const labelStyle = { fontSize: '14px', fontWeight: '600' as const, color: '#64748B', marginBottom: '8px', display: 'block' };

  return (
    <div style={{ backgroundColor: '#F1F5F9', minHeight: '100vh', paddingBottom: '60px', color: '#1E293B' }}>
      
      {/* Header Section */}
      <div style={{ backgroundColor: '#FFD400', padding: '60px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#332200', margin: 0, letterSpacing: '-1px' }}>
          🔮 도사의 사주풀이
        </h1>
        <p style={{ color: '#664400', marginTop: '10px', fontSize: '15px', fontWeight: '500' }}>
          정확한 생년월일로 당신의 운명을 확인하세요
        </p>
      </div>

      <div style={{ maxWidth: '480px', margin: '-25px auto 0', padding: '0 20px' }}>
        
        {/* 입력 폼 카드 */}
        {!analysis ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={labelStyle}>태어난 연도</label>
                <input type="number" placeholder="예: 1995" style={inputBaseStyle} 
                  onChange={e => setFormData({...formData, year: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>월</label>
                  <input type="number" placeholder="MM" style={inputBaseStyle} 
                    onChange={e => setFormData({...formData, month: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>일</label>
                  <input type="number" placeholder="DD" style={inputBaseStyle} 
                    onChange={e => setFormData({...formData, day: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>태어난 시간 (모름 선택가능)</label>
                <input type="time" style={inputBaseStyle} 
                  onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>성별</label>
                  <select style={inputBaseStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>양력/음력</label>
                  <select style={inputBaseStyle} value={formData.calendarType} onChange={e => setFormData({...formData, calendarType: e.target.value})}>
                    <option value="solar">양력</option>
                    <option value="lunar">음력</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                style={{ 
                  padding: '20px', background: loading ? '#CBD5E1' : '#1E293B', color: '#fff', 
                  border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '18px', 
                  marginTop: '10px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {loading ? '천기누설 중...' : '운세 무료 분석하기'}
              </button>
            </div>
          </div>
        ) : (
          /* 분석 결과 UI */
          <>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', marginBottom: '25px', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
              <div style={{ backgroundColor: '#1E293B', color: '#fff', padding: '14px', textAlign: 'center', fontSize: '14px', fontWeight: '700' }}>
                {user?.user_metadata?.full_name || '귀하'}님의 명식 (만세력)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    {['시주','일주','월주','연주'].map(t => <th key={t} style={{ padding: '12px', fontSize: '12px', color: '#94A3B8', fontWeight: '500', border: '1px solid #F1F5F9' }}>{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[analysis.manse.time_top, analysis.manse.day_top, analysis.manse.month_top, analysis.manse.year_top].map((char, i) => {
                      const s = getElementColor(char);
                      return <td key={i} style={{ padding: '20px 5px', textAlign: 'center', fontSize: '22px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #F1F5F9' }}>{char}</td>
                    })}
                  </tr>
                  <tr>
                    {[analysis.manse.time_bottom, analysis.manse.day_bottom, analysis.manse.month_bottom, analysis.manse.year_bottom].map((char, i) => {
                      const s = getElementColor(char);
                      return <td key={i} style={{ padding: '20px 5px', textAlign: 'center', fontSize: '22px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #F1F5F9' }}>{char}</td>
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {analysis.themes.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div 
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    style={{ padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '16px', color: '#334155' }}>{item.title}</span>
                    <span style={{ color: '#94A3B8' }}>{openIndex === idx ? '▲' : '▼'}</span>
                  </div>
                  {openIndex === idx && (
                    <div style={{ padding: '0 22px 22px', fontSize: '15px', lineHeight: '1.8', color: '#475569', borderTop: '1px solid #F8FAFC', whiteSpace: 'pre-wrap' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={() => setAnalysis(null)} 
              style={{ width: '100%', marginTop: '30px', padding: '18px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', color: '#64748B', fontWeight: '600' }}
            >
              처음으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  )
}