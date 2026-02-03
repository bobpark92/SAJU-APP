"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// Vercel 환경변수에서 가져오거나, 없으면 빈 문자열 처리
const supabaseUrl = 'https://iwdibqpymfbjblkpzvan.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZGlicXB5bWZiamJsa3B6dmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjQ3MDEsImV4cCI6MjA4NTYwMDcwMX0.6dNJ5yj6a1zmR08zpwz4j8UrlhmqOH0QRWMlyqjKk4o'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [birthDate, setBirthDate] = useState<string>('')
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    // 현재 로그인된 유저 정보 가져오기
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })

    // 데이터 불러오기
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('user_history')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setLogs(data)
  }

  // 에러 발생했던 지점: 파라미터에 : any 추가
  const getDayOfWeek = (dateString: any) => {
    if (!dateString) return '';
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayIndex = new Date(dateString).getDay();
    return days[dayIndex];
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin }
    })
  }

  const handleSave = async () => {
    if (!user || !birthDate) return alert('로그인 후 날짜를 입력해주세요!')
    
    const dayOfWeek = getDayOfWeek(birthDate)
    
    const { error } = await supabase.from('user_history').insert({
      user_id: user.id,
      birth_date: birthDate,
      day_of_week: dayOfWeek
    })

    if (error) {
      console.error(error)
      alert('저장 실패!')
    } else {
      alert('성공적으로 저장되었습니다!')
      setBirthDate('')
      fetchLogs()
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>🔮 사주아이 (SAJU-APP)</h1>
      
      {!user ? (
        <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          카카오 로그인으로 시작하기
        </button>
      ) : (
        <div>
          <p>반갑습니다, <strong>{user.user_metadata?.full_name || '사용자'}</strong>님!</p>
          <div style={{ margin: '20px 0' }}>
            <input 
              type="date" 
              value={birthDate} 
              onChange={(e) => setBirthDate(e.target.value)}
              style={{ padding: '10px', fontSize: '16px' }}
            />
            <button onClick={handleSave} style={{ padding: '10px 20px', marginLeft: '10px', cursor: 'pointer' }}>
              내 사주 정보 저장
            </button>
          </div>

          <h3>나의 저장 기록</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {logs.map((log: any) => (
              <li key={log.id} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                📅 {log.birth_date} ({log.day_of_week})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}