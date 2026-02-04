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
    gender: 'male', calendarType: 'solar' // 기본값 양력
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
      if (!response.ok) throw new Error(data.error || "서버 응답 오류");

      const parsed = JSON.parse(data.result);
      setAnalysis(parsed);

      await supabase.from('user_history').insert({
        user_id: user?.id,
        birth_year: formData.year,
        birth_month: formData.month,
        birth_day: formData.day,
        calendar_type: formData.calendarType, // 양/음력 저장
        fortune_result: data.result,
      });

    } catch (err: any) {
      console.error("Error:", err);
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

  const commonInputStyle = {
    width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #E5E1D8',
    fontSize: '16px', color: '#1E293B', outline: 'none', backgroundColor: '#fff'
  };

  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '60px', color: '#3E3A31' }}>
      <div style={{ backgroundColor: '#F2EFE9', padding: '60px 20px 40px', textAlign: 'center', borderBottom: '1px solid #E5E1D8' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>당분간무료사주</h1>
        <p style={{ color: '#8A8271', marginTop: '8px', fontSize: '14px' }}>라이브러리 기반 정밀 분석</p>
      </div>

      <div style={{ maxWidth: '480px', margin: '-20px auto 0', padding: '0 16px' }}>
        {!analysis ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #E5E1D8' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 양력/음력 선택 토글 */}
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '4px' }}>
                <button 
                  onClick={() => setFormData({...formData, calendarType: 'solar'})}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', backgroundColor: formData.calendarType === 'solar' ? '#fff' : 'transparent', color: formData.calendarType === 'solar' ? '#3E3A31' : '#94A3B8', boxShadow: formData.calendarType === 'solar' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >양력</button>
                <button 
                  onClick={() => setFormData({...formData, calendarType: 'lunar'})}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', backgroundColor: formData.calendarType === 'lunar' ? '#fff' : 'transparent', color: formData.calendarType === 'lunar' ? '#3E3A31' : '#94A3B8', boxShadow: formData.calendarType === 'lunar' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >음력</button>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>생년월일</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" placeholder="년" style={commonInputStyle} onChange={e => setFormData({...formData, year: e.target.value})} />
                  <input type="number" placeholder="월" style={commonInputStyle} onChange={e => setFormData({...formData, month: e.target.value})} />
                  <input type="number" placeholder="일" style={commonInputStyle} onChange={e => setFormData({...formData, day: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>태어난 시간</label>
                  <input type="time" style={commonInputStyle} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>성별</label>
                  <select style={commonInputStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>

              <button onClick={handleAnalyze} disabled={loading} style={{ padding: '20px', background: '#3E3A31', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
                {loading ? '🔮 운세를 짓고 있습니다...' : '무료 분석 결과 보기'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 분석 결과 UI (만세력 카드) */}
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #E5E1D8' }}>
              <div style={{ backgroundColor: '#3E3A31', color: '#F2EFE9', padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '700' }}>{formData.calendarType === 'solar' ? '양력' : '음력'} 기반 정밀 명식</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    {[analysis.manse?.time_top, analysis.manse?.day_top, analysis.manse?.month_top, analysis.manse?.year_top].map((char, i) => (
                      <td key={i} style={{ padding: '15px 0', textAlign: 'center', fontSize: '22px', fontWeight: '900', color: getElementColor(char).color, backgroundColor: getElementColor(char).bg, border: '1px solid #E5E1D8' }}>{char || '-'}</td>
                    ))}
                  </tr>
                  <tr>
                    {[analysis.manse?.time_bottom, analysis.manse?.day_bottom, analysis.manse?.month_bottom, analysis.manse?.year_bottom].map((char, i) => (
                      <td key={i} style={{ padding: '15px 0', textAlign: 'center', fontSize: '22px', fontWeight: '900', color: getElementColor(char).color, backgroundColor: getElementColor(char).bg, border: '1px solid #E5E1D8' }}>{char || '-'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 테마 리스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysis.themes?.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E1D8', overflow: 'hidden' }}>
                  <div onClick={() => setOpenIndex(openIndex === idx ? null : idx)} style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '22px' }}>{item.icon}</span>
                    <span style={{ fontWeight: '800', fontSize: '16px', flex: 1 }}>{item.title}</span>
                    <span style={{ color: '#8A8271', fontSize: '12px' }}>{openIndex === idx ? '▲' : '▼'}</span>
                  </div>
                  {openIndex === idx && (
                    <div style={{ padding: '0 20px 24px 58px', fontSize: '15px', lineHeight: '1.8', color: '#5C5647', whiteSpace: 'pre-wrap', borderTop: '1px solid #F9F7F2', paddingTop: '15px' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setAnalysis(null)} style={{ width: '100%', marginTop: '30px', padding: '18px', background: 'none', border: '1px solid #E5E1D8', borderRadius: '16px', color: '#8A8271', fontWeight: '700' }}>처음으로 돌아가기</button>
          </>
        )}
      </div>
    </div>
  )
}