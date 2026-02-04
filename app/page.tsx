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
    if (!char || char === '-') return { color: "#94A3B8", bg: "#F8FAFC" };
    if ("甲乙寅卯".includes(char)) return { color: "#2d6a4f", bg: "#e8f5e9" };
    if ("丙丁巳午".includes(char)) return { color: "#ae2012", bg: "#fff0f0" };
    if ("戊己辰戌丑未".includes(char)) return { color: "#9c6644", bg: "#fdf5e6" };
    if ("庚辛申酉".includes(char)) return { color: "#495057", bg: "#f8f9fa" };
    if ("壬癸亥子".includes(char)) return { color: "#003049", bg: "#e0f2fe" };
    return { color: "#1E293B", bg: "#F1F5F9" };
  }

  const inputStyle = {
    width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0',
    fontSize: '16px', backgroundColor: '#FFFFFF', color: '#1E293B', boxSizing: 'border-box' as const,
    outline: 'none', appearance: 'none' as const
  };

  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Header - 세련된 샌드 베이지 톤 */}
      <div style={{ backgroundColor: '#F2EFE9', padding: '60px 24px 40px', textAlign: 'center', borderBottom: '1px solid #E5E1D8' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#3E3A31', margin: 0, letterSpacing: '-1.5px' }}>
          당분간무료사주
        </h1>
        <p style={{ color: '#8A8271', marginTop: '10px', fontSize: '15px', fontWeight: '500' }}>
          {analysis ? `${user?.user_metadata?.full_name || '귀하'}님의 명반` : "복채 없이 봐드리는 고퀄리티 사주 해설"}
        </p>
      </div>

      <div style={{ maxWidth: '480px', margin: '-20px auto 0', padding: '0 16px', boxSizing: 'border-box' }}>
        
        {!analysis ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #E5E1D8' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#3E3A31', display: 'block', marginBottom: '8px' }}>생년월일</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" placeholder="YYYY" style={inputStyle} onChange={e => setFormData({...formData, year: e.target.value})} />
                  <input type="number" placeholder="MM" style={inputStyle} onChange={e => setFormData({...formData, month: e.target.value})} />
                  <input type="number" placeholder="DD" style={inputStyle} onChange={e => setFormData({...formData, day: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', color: '#3E3A31', display: 'block', marginBottom: '8px' }}>태어난 시간</label>
                  <input type="time" style={inputStyle} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', color: '#3E3A31', display: 'block', marginBottom: '8px' }}>성별</label>
                  <select style={inputStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="male">남성</option><option value="female">여성</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#3E3A31', display: 'block', marginBottom: '8px' }}>력</label>
                <select style={inputStyle} value={formData.calendarType} onChange={e => setFormData({...formData, calendarType: e.target.value})}>
                  <option value="solar">양력(Solar)</option><option value="lunar">음력(Lunar)</option>
                </select>
              </div>

              <button onClick={handleAnalyze} disabled={loading} style={{ padding: '20px', background: '#3E3A31', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '17px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(62, 58, 49, 0.2)' }}>
                {loading ? '🔮 운세를 짓고 있습니다...' : '내 운세 무료로 보기'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 명식 카드 (데이터 렌더링 수정) */}
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E5E1D8' }}>
              <div style={{ backgroundColor: '#3E3A31', color: '#F2EFE9', padding: '14px', textAlign: 'center', fontSize: '12px', fontWeight: '700', letterSpacing: '2px' }}>八字命式 (KOREAN SAJU)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9F7F2' }}>
                      {['시주','일주','월주','연주'].map(t => <th key={t} style={{ padding: '10px', fontSize: '11px', color: '#8A8271', border: '1px solid #E5E1D8' }}>{t}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {[analysis.manse?.time_top, analysis.manse?.day_top, analysis.manse?.month_top, analysis.manse?.year_top].map((char, i) => {
                        const s = getElementColor(char || '-');
                        return <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #E5E1D8' }}>{char || '-'}</td>
                      })}
                    </tr>
                    <tr>
                      {[analysis.manse?.time_bottom, analysis.manse?.day_bottom, analysis.manse?.month_bottom, analysis.manse?.year_bottom].map((char, i) => {
                        const s = getElementColor(char || '-');
                        return <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #E5E1D8' }}>{char || '-'}</td>
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 테마 리스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysis.themes?.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #E5E1D8', overflow: 'hidden' }}>
                  <div 
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '22px' }}>{item.icon || '📜'}</div>
                    <span style={{ fontWeight: '800', fontSize: '16px', color: '#3E3A31', flex: 1, letterSpacing: '-0.5px' }}>{item.title}</span>
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

            <button onClick={() => setAnalysis(null)} style={{ width: '100%', marginTop: '30px', padding: '20px', background: 'none', border: '2px solid #E5E1D8', borderRadius: '18px', color: '#8A8271', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              처음으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  )
}