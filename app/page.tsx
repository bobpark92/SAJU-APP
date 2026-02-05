"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function Home() {
  const [formData, setFormData] = useState({ year: '', month: '', day: '', time: '', gender: 'male', calendarType: 'solar' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleAnalyze = async () => {
    if (!formData.year || !formData.month || !formData.day) return alert('생년월일을 입력해주세요!');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      alert(`에러 발생: ${err.message}`);
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
    return { color: "#3E3A31", bg: "#F1F5F9" };
  }

  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '80px', color: '#3E3A31', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#F2EFE9', borderBottom: '1px solid #E5E1D8' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>당분간무료사주</h1>
        <p style={{ color: '#8A8271', marginTop: '10px' }}>3단계 정밀 분석 리포트</p>
      </div>

      <div style={{ maxWidth: '500px', margin: '-30px auto 0', padding: '0 16px' }}>
        {!result ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #E5E1D8' }}>
            {/* 입력 폼 (이전과 동일하므로 생략 가능, 구조 유지) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '4px' }}>
                <button onClick={() => setFormData({...formData, calendarType: 'solar'})} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '700', backgroundColor: formData.calendarType === 'solar' ? '#fff' : 'transparent', color: formData.calendarType === 'solar' ? '#3E3A31' : '#94A3B8' }}>양력</button>
                <button onClick={() => setFormData({...formData, calendarType: 'lunar'})} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '700', backgroundColor: formData.calendarType === 'lunar' ? '#fff' : 'transparent', color: formData.calendarType === 'lunar' ? '#3E3A31' : '#94A3B8' }}>음력</button>
              </div>
              <input type="number" placeholder="년(YYYY)" style={{ padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, year: e.target.value})} />
              <input type="number" placeholder="월(MM)" style={{ padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, month: e.target.value})} />
              <input type="number" placeholder="일(DD)" style={{ padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, day: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="time" style={{ flex: 1, padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, time: e.target.value})} />
                <select style={{ flex: 1, padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="male">남성</option><option value="female">여성</option>
                </select>
              </div>
              <button onClick={handleAnalyze} disabled={loading} style={{ padding: '22px', background: '#3E3A31', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '18px' }}>
                {loading ? '🔮 3단계 분석 진행 중 (약 15초)...' : '정밀 분석 결과 보기'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. 만세력 테이블 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #E5E1D8' }}>
              <div style={{ backgroundColor: '#3E3A31', color: '#F2EFE9', padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }}>八字命式</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    {[result.manse.time_top, result.manse.day_top, result.manse.month_top, result.manse.year_top].map((char, i) => {
                      const s = getElementColor(char);
                      return <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #E5E1D8' }}>{char}</td>
                    })}
                  </tr>
                  <tr>
                    {[result.manse.time_bottom, result.manse.day_bottom, result.manse.month_bottom, result.manse.year_bottom].map((char, i) => {
                      const s = getElementColor(char);
                      return <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #E5E1D8' }}>{char}</td>
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. 대가의 평론 (TEXT 영역) */}
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '28px', marginBottom: '24px', border: '1px solid #E5E1D8', lineHeight: '1.8' }}>
              <h3 style={{ marginTop: 0, color: '#3E3A31', fontSize: '19px' }}>📜 대가의 정밀 총평</h3>
              <div style={{ color: '#5C5647', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                {result.commentary}
              </div>
            </div>

            {/* 3. 심화 테마 (아코디언) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {result.themes.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #E5E1D8' }}>
                  <div onClick={() => setOpenIndex(openIndex === idx ? null : idx)} style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '24px' }}>{item.icon}</span>
                    <span style={{ fontWeight: '800', fontSize: '17px', flex: 1 }}>{item.title}</span>
                    <span>{openIndex === idx ? '▲' : '▼'}</span>
                  </div>
                  {openIndex === idx && (
                    <div style={{ padding: '0 24px 28px 24px', fontSize: '15px', lineHeight: '2.0', color: '#5C5647', whiteSpace: 'pre-wrap', borderTop: '1px solid #F9F7F2', paddingTop: '15px' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setResult(null)} style={{ width: '100%', marginTop: '40px', padding: '20px', background: 'none', border: '2px solid #E5E1D8', borderRadius: '20px', color: '#8A8271', fontWeight: '700' }}>다시 분석하기</button>
          </>
        )}
      </div>
    </div>
  )
}