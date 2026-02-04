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
    if (!formData.year || !formData.month || !formData.day) return alert('정보를 입력해 주세요!');
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
        fortune_result: data.result,
      });
    } catch (err) {
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const getElementColor = (char: string) => {
    if (!char || char === '-') return { color: "#94A3B8", bg: "#F8FAFC" };
    if ("甲乙寅卯".includes(char)) return { color: "#2d6a4f", bg: "#e8f5e9" };
    if ("丙丁巳午".includes(char)) return { color: "#ae2012", bg: "#fff0f0" };
    if ("戊己辰戌丑未".includes(char)) return { color: "#9c6644", bg: "#fdf5e6" };
    if ("庚辛申酉".includes(char)) return { color: "#495057", bg: "#f8f9fa" };
    if ("壬癸亥子".includes(char)) return { color: "#003049", bg: "#e0f2fe" };
    return { color: "#3E3A31", bg: "#F1F5F9" };
  }

  const inputStyle = {
    width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E5E1D8',
    fontSize: '16px', backgroundColor: '#FFFFFF', color: '#1E293B', boxSizing: 'border-box' as const,
    outline: 'none'
  };

  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '60px', color: '#3E3A31' }}>
      
      <div style={{ backgroundColor: '#F2EFE9', padding: '60px 20px 40px', textAlign: 'center', borderBottom: '1px solid #E5E1D8' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-1.2px' }}>당분간무료사주</h1>
        <p style={{ color: '#8A8271', marginTop: '8px', fontSize: '14px' }}>라이브러리 기반 정밀 명식 분석</p>
      </div>

      <div style={{ maxWidth: '480px', margin: '-20px auto 0', padding: '0 16px' }}>
        
        {!analysis ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #E5E1D8' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>생년월일</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" placeholder="년" style={inputStyle} onChange={e => setFormData({...formData, year: e.target.value})} />
                  <input type="number" placeholder="월" style={inputStyle} onChange={e => setFormData({...formData, month: e.target.value})} />
                  <input type="number" placeholder="일" style={inputStyle} onChange={e => setFormData({...formData, day: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>태어난 시간</label>
                  <input type="time" style={inputStyle} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>성별</label>
                  <select style={inputStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="male">남성</option><option value="female">여성</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAnalyze} disabled={loading} style={{ padding: '20px', background: '#3E3A31', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '16px', marginTop: '10px' }}>
                {loading ? '🔮 정밀 분석 중...' : '운세 분석 결과 확인'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #E5E1D8' }}>
              <div style={{ backgroundColor: '#3E3A31', color: '#F2EFE9', padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '700' }}>라이브러리 정밀 명식</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9F7F2' }}>
                    {['시주','일주','월주','연주'].map(t => <th key={t} style={{ padding: '8px', fontSize: '11px', color: '#8A8271', border: '1px solid #E5E1D8', fontWeight: 'normal' }}>{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[analysis.manse.time_top, analysis.manse.day_top, analysis.manse.month_top, analysis.manse.year_top].map((char, i) => (
                      <td key={i} style={{ padding: '15px 0', textAlign: 'center', fontSize: '22px', fontWeight: '900', color: getElementColor(char).color, backgroundColor: getElementColor(char).bg, border: '1px solid #E5E1D8' }}>{char || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    {[analysis.manse.time_bottom, analysis.manse.day_bottom, analysis.manse.month_bottom, analysis.manse.year_bottom].map((char, i) => (
                      <td key={i} style={{ padding: '15px 0', textAlign: 'center', fontSize: '22px', fontWeight: '900', color: getElementColor(char).color, backgroundColor: getElementColor(char).bg, border: '1px solid #E5E1D8' }}>{char || '-'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {analysis.themes.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E1D8', overflow: 'hidden' }}>
                  <div 
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span style={{ fontWeight: '800', fontSize: '15px', flex: 1 }}>{item.title}</span>
                    <span style={{ fontSize: '12px', color: '#8A8271' }}>{openIndex === idx ? '▲' : '▼'}</span>
                  </div>
                  {openIndex === idx && (
                    <div style={{ padding: '0 20px 20px 52px', fontSize: '14.5px', lineHeight: '1.7', color: '#5C5647', whiteSpace: 'pre-wrap', borderTop: '1px solid #F9F7F2', paddingTop: '10px' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setAnalysis(null)} style={{ width: '100%', marginTop: '30px', padding: '18px', background: 'none', border: '1px solid #E5E1D8', borderRadius: '16px', color: '#8A8271', fontWeight: '700' }}>
              돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  )
}