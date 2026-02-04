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
      if (!response.ok) throw new Error(data.error || "서버 오류");

      const parsed = JSON.parse(data.result);
      setAnalysis(parsed);

      await supabase.from('user_history').insert({
        user_id: user?.id,
        birth_year: formData.year,
        birth_month: formData.month,
        birth_day: formData.day,
        calendar_type: formData.calendarType,
        fortune_result: data.result,
      });
    } catch (err: any) {
      alert(`분석 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const getElementColor = (char: string) => {
    if (!char || char === '?' || char === '-') return { color: "#94A3B8", bg: "#F8FAFC" };
    if ("甲乙寅卯".includes(char)) return { color: "#2d6a4f", bg: "#e8f5e9" };
    if ("丙丁巳午".includes(char)) return { color: "#ae2012", bg: "#fff0f0" };
    if ("戊己辰戌丑未".includes(char)) return { color: "#9c6644", bg: "#fdf5e6" };
    if ("庚辛申酉".includes(char)) return { color: "#495057", bg: "#f8f9fa" };
    if ("壬癸亥子".includes(char)) return { color: "#003049", bg: "#e0f2fe" };
    return { color: "#3E3A31", bg: "#F1F5F9" };
  }

  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '80px', color: '#3E3A31' }}>
      <div style={{ backgroundColor: '#F2EFE9', padding: '60px 20px 40px', textAlign: 'center', borderBottom: '1px solid #E5E1D8' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>당분간무료사주</h1>
        <p style={{ color: '#8A8271', marginTop: '10px', fontSize: '15px' }}>당신의 운명을 읽는 가장 깊은 시선</p>
      </div>

      <div style={{ maxWidth: '500px', margin: '-20px auto 0', padding: '0 16px' }}>
        {!analysis ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #E5E1D8' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '4px' }}>
                <button onClick={() => setFormData({...formData, calendarType: 'solar'})} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '700', backgroundColor: formData.calendarType === 'solar' ? '#fff' : 'transparent', color: formData.calendarType === 'solar' ? '#3E3A31' : '#94A3B8' }}>양력</button>
                <button onClick={() => setFormData({...formData, calendarType: 'lunar'})} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '700', backgroundColor: formData.calendarType === 'lunar' ? '#fff' : 'transparent', color: formData.calendarType === 'lunar' ? '#3E3A31' : '#94A3B8' }}>음력</button>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', display: 'block' }}>생년월일</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" placeholder="YYYY" style={{ width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, year: e.target.value})} />
                  <input type="number" placeholder="MM" style={{ width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, month: e.target.value})} />
                  <input type="number" placeholder="DD" style={{ width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, day: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', display: 'block' }}>태어난 시간</label>
                  <input type="time" style={{ width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', display: 'block' }}>성별</label>
                  <select style={{ width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #E5E1D8' }} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="male">남성</option><option value="female">여성</option>
                  </select>
                </div>
              </div>

              <button onClick={handleAnalyze} disabled={loading} style={{ padding: '22px', background: '#3E3A31', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '18px', cursor: 'pointer' }}>
                {loading ? '🔮 운명의 지도를 그리는 중...' : '정밀 분석 시작하기'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #E5E1D8', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ backgroundColor: '#3E3A31', color: '#F2EFE9', padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '700', letterSpacing: '2px' }}>八字命式</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    {[analysis.manse?.time_top, analysis.manse?.day_top, analysis.manse?.month_top, analysis.manse?.year_top].map((char, i) => (
                      <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: getElementColor(char).color, backgroundColor: getElementColor(char).bg, border: '1px solid #E5E1D8' }}>{char || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    {[analysis.manse?.time_bottom, analysis.manse?.day_bottom, analysis.manse?.month_bottom, analysis.manse?.year_bottom].map((char, i) => (
                      <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: getElementColor(char).color, backgroundColor: getElementColor(char).bg, border: '1px solid #E5E1D8' }}>{char || '-'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analysis.themes?.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #E5E1D8', transition: '0.3s' }}>
                  <div onClick={() => setOpenIndex(openIndex === idx ? null : idx)} style={{ padding: '24px', display: 'flex', gap: '18px', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '24px' }}>{item.icon}</span>
                    <span style={{ fontWeight: '800', fontSize: '17px', flex: 1, letterSpacing: '-0.5px' }}>{item.title}</span>
                    <span style={{ color: '#8A8271' }}>{openIndex === idx ? '▲' : '▼'}</span>
                  </div>
                  {openIndex === idx && (
                    <div style={{ padding: '0 24px 28px 66px', fontSize: '15.5px', lineHeight: '1.9', color: '#5C5647', whiteSpace: 'pre-wrap', borderTop: '1px solid #F9F7F2', paddingTop: '15px' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setAnalysis(null)} style={{ width: '100%', marginTop: '40px', padding: '22px', background: 'none', border: '2px solid #E5E1D8', borderRadius: '20px', color: '#8A8271', fontWeight: '700', fontSize: '16px' }}>처음으로 돌아가기</button>
          </>
        )}
      </div>
    </div>
  )
}