"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// Supabase 클라이언트 설정
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
      return alert('필수 정보(년, 월, 일)를 모두 입력해주세요!')
    }

    setLoading(true)
    setFortune('')

    const { error } = await supabase.from('user_history').insert({
      user_id: user.id,
      birth_year: formData.year,
      birth_month: formData.month,
      birth_day: formData.day,
      birth_time: formData.time || null,
      gender: formData.gender,
      calendar_type: formData.calendarType,
      birth_date: `${formData.year}-${formData.month}-${formData.day}`
    })

    if (error) {
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
        // 상세 에러 내용을 더 잘 보이게 표시
        const msg = data.error || '분석 중 오류 발생';
        const detail = data.details || '서버 환경 변수를 확인해주세요.';
        setFortune(`❌ 에러: ${msg}\n\n도움말: ${detail}`);
      }
      fetchLogs();
    } catch (err) {
      setFortune("❌ 네트워크 오류가 발생했습니다.");
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

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ textAlign: 'center' }}>🔮 AI 사주 상담소</h1>
      
      {!user ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <button onClick={handleLogin} style={{ padding: '15px 30px', fontSize: '18px', background: '#FEE500', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
            카카오 로그인으로 시작하기
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p style={{ textAlign: 'center' }}><strong>{user.user_metadata?.full_name}</strong>님, 사주 정보를 입력해주세요.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <input placeholder="년(YYYY)" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} style={{ padding: '10px' }} />
            <input placeholder="월(MM)" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} style={{ padding: '10px' }} />
            <input placeholder="일(DD)" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} style={{ padding: '10px' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ flexShrink: 0 }}>태어난 시간:</label>
            <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ padding: '10px', flexGrow: 1 }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={{ padding: '10px', flexGrow: 1 }}>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
            <select value={formData.calendarType} onChange={e => setFormData({...formData, calendarType: e.target.value})} style={{ padding: '10px', flexGrow: 1 }}>
              <option value="solar">양력</option>
              <option value="lunar">음력</option>
            </select>
          </div>

          <button 
            onClick={handleSaveAndAnalyze} 
            disabled={loading}
            style={{ padding: '15px', background: loading ? '#ccc' : '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px' }}
          >
            {loading ? 'AI 분석 중...' : '사주 저장 및 분석하기'}
          </button>

          {fortune && (
            <div style={{ marginTop: '30px', padding: '20px', background: '#f0f4f8', borderRadius: '15px', border: '1px solid #d1d9e6' }}>
              <h2 style={{ marginTop: 0 }}>📜 AI 분석 결과</h2>
              <div style={{ whiteSpace: 'pre-wrap' }}>{fortune}</div>
            </div>
          )}

          <hr style={{ width: '100%', margin: '30px 0' }} />
          <h3>나의 과거 입력 기록</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {logs.map((log: any) => (
              <div key={log.id} style={{ fontSize: '14px', borderBottom: '1px solid #eee', padding: '8px 0' }}>
                📅 {log.birth_year}-{log.birth_month}-{log.birth_day} | {log.gender === 'male' ? '남' : '여'} | {log.calendar_type === 'solar' ? '양력' : '음력'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}