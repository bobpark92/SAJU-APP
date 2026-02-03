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
    const { data } = await supabase.from('user_history').select('*').order('created_at', { ascending: false })
    if (data) setLogs(data)
  }

  const handleSaveAndAnalyze = async () => {
    if (!user || !formData.year || !formData.month || !formData.day) {
      return alert('태어난 년, 월, 일을 모두 입력해주세요!')
    }

    setLoading(true)
    setFortune('')

    const { error: dbError } = await supabase.from('user_history').insert({
      user_id: user.id,
      birth_year: formData.year,
      birth_month: formData.month,
      birth_day: formData.day,
      birth_time: formData.time || null,
      gender: formData.gender,
      calendar_type: formData.calendarType,
      birth_date: `${formData.year}-${formData.month}-${formData.day}`
    })

    if (dbError) {
      alert('데이터 저장 중 오류가 발생했습니다.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.result) {
        setFortune(data.result);
      } else {
        setFortune(`❌ 오류: ${data.error || '분석 실패'}\n💡 도움말: ${data.details || '알 수 없는 이유'}`);
      }
      fetchLogs();
    } catch (err) {
      setFortune("❌ 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
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

  // 스타일 헬퍼 (중복 코드 방지)
  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold' as const, color: '#555', fontSize: '14px' };
  const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', color: '#000', fontSize: '16px', boxSizing: 'border-box' as const };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '15px', color: '#333' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', backgroundColor: '#ffffff', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        <h1 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '5px', fontSize: '24px' }}>🔮 AI 사주 상담소</h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginBottom: '30px' }}>2026년 병오년(丙午年) 운세 분석</p>
        
        {!user ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ marginBottom: '20px', color: '#666' }}>당신의 미래를 AI 전문가가 풀어드립니다.</p>
            <button onClick={handleLogin} style={{ width: '100%', padding: '18px', fontSize: '18px', background: '#FEE500', color: '#3c1e1e', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
              카카오로 1초만에 시작하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ textAlign: 'center', fontSize: '16px', margin: '0 0 10px 0' }}>
              반가워요, <strong>{user.user_metadata?.full_name}</strong>님!
            </p>
            
            {/* 세로 배치 입력창들 */}
            <div>
              <label style={labelStyle}>태어난 연도</label>
              <input type="number" placeholder="예: 1990" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
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
              <label style={labelStyle}>태어난 시간 (선택)</label>
              <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>성별</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={inputStyle}>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>양력/음력</label>
                <select value={formData.calendarType} onChange={e => setFormData({...formData, calendarType: e.target.value})} style={inputStyle}>
                  <option value="solar">양력</option>
                  <option value="lunar">음력</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleSaveAndAnalyze} 
              disabled={loading}
              style={{ 
                padding: '18px', 
                background: loading ? '#ccc' : 'linear-gradient(135deg, #6e8efb, #a777e3)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '14px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontSize: '18px', 
                fontWeight: 'bold',
                marginTop: '10px',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(110, 142, 251, 0.3)'
              }}
            >
              {loading ? '🔮 운세 분석 중...' : '2026년 내 운세 보기'}
            </button>

            {/* AI 분석 결과창 */}
            {fortune && (
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff9eb', borderRadius: '18px', border: '1px solid #f3e1a0' }}>
                <h2 style={{ marginTop: 0, color: '#856404', fontSize: '18px', borderBottom: '1px solid #f3e1a0', paddingBottom: '10px', marginBottom: '15px' }}>📜 2026년 운세 풀이</h2>
                <div style={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: '1.7', fontSize: '15px' }}>
                  {fortune}
                </div>
              </div>
            )}

            <hr style={{ width: '100%', margin: '30px 0', border: '0', borderTop: '1px solid #eee' }} />
            
            <h3 style={{ color: '#888', fontSize: '15px', marginBottom: '10px' }}>🕒 최근 조회 기록</h3>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {logs.length > 0 ? logs.slice(0, 5).map((log: any) => (
                <div key={log.id} style={{ fontSize: '13px', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '10px', marginBottom: '8px', color: '#666' }}>
                  📅 {log.birth_year}.{log.birth_month}.{log.birth_day} ({log.calendar_type === 'solar' ? '양력' : '음력'})
                </div>
              )) : <p style={{ fontSize: '13px', color: '#ccc', textAlign: 'center' }}>조회 기록이 없습니다.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}