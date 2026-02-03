"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// Vercel 환경변수에서 가져오거나, 없으면 빈 문자열 처리
const supabaseUrl = 'https://iwdibqpymfbjblkpzvan.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZGlicXB5bWZiamJsa3B6dmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjQ3MDEsImV4cCI6MjA4NTYwMDcwMX0.6dNJ5yj6a1zmR08zpwz4j8UrlhmqOH0QRWMlyqjKk4o'

const supabase = createClient(supabaseUrl, supabaseAnonKey)


export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    year: '', month: '', day: '', time: '',
    gender: 'male', calendarType: 'solar'
  })
  const [logs, setLogs] = useState<any[]>([])

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

  const handleSave = async () => {
    if (!user || !formData.year || !formData.month || !formData.day) {
      return alert('필수 정보를 모두 입력해주세요!')
    }

    const { error } = await supabase.from('user_history').insert({
      user_id: user.id,
      birth_year: formData.year,
      birth_month: formData.month,
      birth_day: formData.day,
      birth_time: formData.time || null,
      gender: formData.gender,
      calendar_type: formData.calendarType,
      birth_date: `${formData.year}-${formData.month}-${formData.day}` // 기존 컬럼 호환용
    })

    if (error) alert('저장 실패!')
    else {
      alert('사주 정보가 저장되었습니다!');
      fetchLogs();
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>🔮 AI 사주 상담소</h1>
      
      {!user ? (
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: window.location.origin } })}>
          카카오 로그인으로 시작하기
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p><strong>{user.user_metadata?.full_name}</strong>님의 사주 입력</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
            <input placeholder="년(YYYY)" onChange={e => setFormData({...formData, year: e.target.value})} />
            <input placeholder="월(MM)" onChange={e => setFormData({...formData, month: e.target.value})} />
            <input placeholder="일(DD)" onChange={e => setFormData({...formData, day: e.target.value})} />
          </div>

          <input type="time" title="출생시간" onChange={e => setFormData({...formData, time: e.target.value})} />

          <select onChange={e => setFormData({...formData, gender: e.target.value})}>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>

          <select onChange={e => setFormData({...formData, calendarType: e.target.value})}>
            <option value="solar">양력</option>
            <option value="lunar">음력</option>
          </select>

          <button onClick={handleSave} style={{ padding: '10px', background: '#333', color: '#fff', cursor: 'pointer' }}>
            사주 저장 및 분석 준비
          </button>

          <hr />
          <h3>저장된 사주 목록</h3>
          {logs.map(log => (
            <div key={log.id} style={{ fontSize: '14px', borderBottom: '1px solid #eee', padding: '5px 0' }}>
              {log.birth_year}년 {log.birth_month}월 {log.birth_day}일 ({log.calendar_type === 'solar' ? '양력' : '음력'}) - {log.gender === 'male' ? '남' : '여'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}