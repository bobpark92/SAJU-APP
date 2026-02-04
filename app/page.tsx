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
  const [logs, setLogs] = useState<any[]>([])
  const [fortune, setFortune] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('user_history')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setLogs(data)
  }

  const handleSaveAndAnalyze = async () => {
    if (!user || !formData.year || !formData.month || !formData.day) {
      return alert('태어난 년, 월, 일을 모두 입력해주세요!')
    }

    setLoading(true)
    setFortune('')

    try {
      // 1. AI 분석 요청
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '분석 실패');

      // 2. Supabase에 모든 기록 저장 (created_at은 DB에서 자동으로 now() 처리됨)
      const { error: dbError } = await supabase.from('user_history').insert({
        user_id: user.id,
        birth_year: formData.year,
        birth_month: formData.month,
        birth_day: formData.day,
        birth_time: formData.time || null,
        gender: formData.gender,
        calendar_type: formData.calendarType,
        birth_date: `${formData.year}-${formData.month}-${formData.day}`,
        prompt_sent: data.promptSent,
        fortune_result: data.result
      });

      if (dbError) console.error("DB 저장 실패:", dbError);

      setFortune(data.result);
      fetchLogs(); // 저장 후 목록 새로고침
    } catch (err: any) {
      console.error(err);
      setFortune(`❌ 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({ 
      provider: 'kakao', 
      options: { redirectTo: window.location.origin } 
    })
  }

  // 헬퍼 함수: 날짜 포맷 (기록 확인용)
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
  }

  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold' as const, color: '#555', fontSize: '14px' };
  const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd', color: '#000', fontSize: '16px', boxSizing: 'border-box' as const, backgroundColor: '#fff' };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '15px', color: '#333' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', backgroundColor: '#ffffff', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        
        <h1 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '5px', fontSize: '26px' }}>🔮 AI 사주 상담소</h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginBottom: '30px' }}>당신의 운명을 기록하는 가장 스마트한 방법</p>
        
        {!user ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <button onClick={handleLogin} style={{ width: '100%', padding: '18px', fontSize: '18px', background: '#FEE500', color: '#3c1e1e', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
              카카오로 시작하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>태어난 연도</label>
              <input type="number" placeholder="YYYY" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>월</label>
                <input type="number" placeholder="MM" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>일</label>
                <input type="number" placeholder="DD" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>태어난 시간</label>
              <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={inputStyle}><option value="male">남성</option><option value="female">여성</option></select>
              <select value={formData.calendarType} onChange={e => setFormData({...formData, calendarType: e.target.value})} style={inputStyle}><option value="solar">양력</option><option value="lunar">음력</option></select>
            </div>

            <button onClick={handleSaveAndAnalyze} disabled={loading} style={{ padding: '20px', background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>
              {loading ? '🔮 운세 기록 및 분석 중...' : '운세 분석 및 결과 저장'}
            </button>

            {fortune && (
              <div style={{ marginTop: '20px', padding: '25px', backgroundColor: '#fff9eb', borderRadius: '20px', border: '1px solid #f3e1a0' }}>
                <h2 style={{ marginTop: 0, color: '#856404', fontSize: '19px' }}>📜 2026년 운세 풀이</h2>
                <div style={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: '1.8', fontSize: '15px' }}>{fortune}</div>
              </div>
            )}

            <hr style={{ width: '100%', margin: '30px 0', border: '0', borderTop: '1px solid #eee' }} />
            <h3 style={{ color: '#888', fontSize: '15px' }}>🕒 최근 저장된 기록</h3>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {logs.length > 0 ? logs.slice(0, 5).map((log: any) => (
                <div key={log.id} style={{ fontSize: '13px', backgroundColor: '#f9f9f9', padding: '14px', borderRadius: '12px', marginBottom: '10px', color: '#555', border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📅 {log.birth_year}.{log.birth_month}.{log.birth_day}</span>
                  <span style={{ fontSize: '11px', color: '#999' }}>{formatDate(log.created_at)} 조회</span>
                </div>
              )) : <p style={{ fontSize: '13px', color: '#ccc', textAlign: 'center' }}>기록이 없습니다.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}