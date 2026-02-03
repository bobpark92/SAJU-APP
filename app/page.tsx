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
      return alert('필수 정보(년, 월, 일)를 모두 입력해주세요!')
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

  return (
    // 전체 배경을 밝은 회색으로 설정하여 흰색 카드가 잘 보이게 함
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '20px', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        
        <h1 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '30px' }}>🔮 AI 사주 상담소</h1>
        
        {!user ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <button onClick={handleLogin} style={{ padding: '15px 30px', fontSize: '18px', background: '#FEE500', color: '#3c1e1e', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
              카카오 로그인으로 시작하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ textAlign: 'center', fontSize: '18px' }}>
              👋 안녕하세요, <strong>{user.user_metadata?.full_name}</strong>님!
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <input placeholder="년(YYYY)" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', color: '#000' }} />
              <input placeholder="월(MM)" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', color: '#000' }} />
              <input placeholder="일(DD)" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', color: '#000' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>태어난 시간:</label>
              <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', color: '#000', flexGrow: 1 }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', color: '#000', flexGrow: 1 }}>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
              <select value={formData.calendarType} onChange={e => setFormData({...formData, calendarType: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', color: '#000', flexGrow: 1 }}>
                <option value="solar">양력</option>
                <option value="lunar">음력</option>
              </select>
            </div>

            <button 
              onClick={handleSaveAndAnalyze} 
              disabled={loading}
              style={{ padding: '16px', background: loading ? '#aaa' : '#4a90e2', color: '#fff', border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '18px', fontWeight: 'bold', transition: '0.3s' }}
            >
              {loading ? '🔮 운세를 읽는 중...' : '사주 저장 및 분석하기'}
            </button>

            {/* AI 분석 결과창 - 디자인 대폭 강화 */}
            {fortune && (
              <div style={{ marginTop: '30px', padding: '25px', backgroundColor: '#fff9eb', borderRadius: '15px', border: '2px solid #e6b800', position: 'relative' }}>
                <h2 style={{ marginTop: 0, color: '#856404', borderBottom: '1px solid #ffeeba', paddingBottom: '10px' }}>📜 AI가 풀어준 사주 정보</h2>
                <div style={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: '1.8', fontSize: '16px', marginTop: '15px' }}>
                  {fortune}
                </div>
              </div>
            )}

            <hr style={{ width: '100%', margin: '40px 0', border: '0', borderTop: '1px solid #eee' }} />
            
            <h3 style={{ color: '#666' }}>📅 나의 이전 기록</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f9f9f9', borderRadius: '10px', padding: '10px' }}>
              {logs.length > 0 ? logs.map((log: any) => (
                <div key={log.id} style={{ fontSize: '14px', borderBottom: '1px solid #eee', padding: '10px', color: '#555' }}>
                  {log.birth_year}년 {log.birth_month}월 {log.birth_day}일 | {log.gender === 'male' ? '남' : '여'} | {log.calendar_type === 'solar' ? '양력' : '음력'}
                </div>
              )) : <p style={{ textAlign: 'center', color: '#999' }}>기록이 없습니다.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}