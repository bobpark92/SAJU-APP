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
    if (!formData.year || !formData.month || !formData.day) return alert('정보를 정확히 입력해주세요!');
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

  const getElementColor = (char: string) => {
    if ("甲乙寅卯".includes(char)) return { color: "#2d6a4f", bg: "#e8f5e9" };
    if ("丙丁巳午".includes(char)) return { color: "#ae2012", bg: "#fff0f0" };
    if ("戊己辰戌丑未".includes(char)) return { color: "#9c6644", bg: "#fdf5e6" };
    if ("庚辛申酉".includes(char)) return { color: "#495057", bg: "#f8f9fa" };
    if ("壬癸亥子".includes(char)) return { color: "#003049", bg: "#e0f2fe" };
    return { color: "#94A3B8", bg: "#F8FAFC" };
  }

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#FFD400', padding: '60px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#2D2400', margin: 0, letterSpacing: '-1px' }}>
          🔮 도사의 시크릿 사주
        </h1>
        <p style={{ color: '#664400', marginTop: '10px', fontSize: '15px', fontWeight: '600' }}>
          {analysis ? `${user?.user_metadata?.full_name || '귀하'}님의 인생 해설서` : "당신의 타고난 운명을 낱낱이 파헤칩니다"}
        </p>
      </div>

      <div style={{ maxWidth: '500px', margin: '-30px auto 0', padding: '0 16px' }}>
        
        {!analysis ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '32px', padding: '35px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '10px' }}>생년월일</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" placeholder="YYYY" style={{ flex: 2, padding: '16px', borderRadius: '15px', border: '1px solid #E2E8F0', fontSize: '16px', backgroundColor: '#F1F5F9' }} onChange={e => setFormData({...formData, year: e.target.value})} />
                  <input type="number" placeholder="MM" style={{ flex: 1, padding: '16px', borderRadius: '15px', border: '1px solid #E2E8F0', fontSize: '16px', backgroundColor: '#F1F5F9' }} onChange={e => setFormData({...formData, month: e.target.value})} />
                  <input type="number" placeholder="DD" style={{ flex: 1, padding: '16px', borderRadius: '15px', border: '1px solid #E2E8F0', fontSize: '16px', backgroundColor: '#F1F5F9' }} onChange={e => setFormData({...formData, day: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '10px' }}>태어난 시간</label>
                  <input type="time" style={{ width: '100%', padding: '16px', borderRadius: '15px', border: '1px solid #E2E8F0', fontSize: '16px', boxSizing: 'border-box', backgroundColor: '#F1F5F9' }} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '10px' }}>성별</label>
                  <select style={{ width: '100%', padding: '16px', borderRadius: '15px', border: '1px solid #E2E8F0', fontSize: '16px', backgroundColor: '#F1F5F9' }} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="male">남성</option><option value="female">여성</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAnalyze} disabled={loading} style={{ padding: '22px', background: '#1E293B', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '800', fontSize: '18px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                {loading ? '🔮 운명을 읽고 있습니다...' : '사주 분석 시작하기'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 명식 카드 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '28px', overflow: 'hidden', marginBottom: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <div style={{ backgroundColor: '#1E293B', color: '#fff', padding: '14px', textAlign: 'center', fontSize: '12px', fontWeight: '700', letterSpacing: '3px' }}>八字命式</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    {['시주','일주','월주','연주'].map(t => <th key={t} style={{ padding: '12px', fontSize: '11px', color: '#94A3B8', border: '1px solid #F1F5F9' }}>{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[analysis.manse.time_top, analysis.manse.day_top, analysis.manse.month_top, analysis.manse.year_top].map((char, i) => {
                      const s = getElementColor(char);
                      return <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '26px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #F1F5F9' }}>{char}</td>
                    })}
                  </tr>
                  <tr>
                    {[analysis.manse.time_bottom, analysis.manse.day_bottom, analysis.manse.month_bottom, analysis.manse.year_bottom].map((char, i) => {
                      const s = getElementColor(char);
                      return <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '26px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #F1F5F9' }}>{char}</td>
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 테마 리스트 (아이콘 포함) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analysis.themes.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: openIndex === idx ? '0 10px 25px rgba(0,0,0,0.03)' : 'none' }}>
                  <div 
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    style={{ padding: '24px', display: 'flex', gap: '18px', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                      {item.icon || '📜'}
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '17px', color: '#1E293B', flex: 1, letterSpacing: '-0.5px' }}>{item.title}</span>
                    <span style={{ color: '#CBD5E1', fontSize: '14px', transform: openIndex === idx ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▼</span>
                  </div>
                  {openIndex === idx && (
                    <div style={{ padding: '0 24px 28px 66px', fontSize: '15.5px', lineHeight: '1.9', color: '#475569', whiteSpace: 'pre-wrap', borderTop: '1px solid #F8FAFC', paddingTop: '10px' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setAnalysis(null)} style={{ width: '100%', marginTop: '40px', padding: '22px', background: '#fff', border: '2px solid #E2E8F0', borderRadius: '22px', color: '#94A3B8', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
              새로운 운세 확인하기
            </button>
          </>
        )}
      </div>
    </div>
  )
}