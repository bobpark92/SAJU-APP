"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

// 보내주신 URL과 KEY를 적용했습니다.
const supabaseUrl = 'https://iwdibqpymfbjblkpzvan.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZGlicXB5bWZiamJsa3B6dmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjQ3MDEsImV4cCI6MjA4NTYwMDcwMX0.6dNJ5yj6a1zmR08zpwz4j8UrlhmqOH0QRWMlyqjKk4o'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [user, setUser] = useState(null)
  const [birthDate, setBirthDate] = useState("")

  useEffect(() => {
    // 현재 로그인된 유저 정보 가져오기
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
  }, [])

  // 날짜를 입력받아 요일을 한글로 반환하는 함수
  const getDayOfWeek = (dateString) => {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayIndex = new Date(dateString).getDay();
    return days[dayIndex];
  };

  // DB에 데이터 저장하기
  const saveData = async () => {
    if (!birthDate) return alert("날짜를 먼저 선택해주세요!");

    const day = getDayOfWeek(birthDate);
    
    const { error } = await supabase
      .from('user_history') // Supabase에 만든 테이블 이름
      .insert([
        { 
          user_id: user.id, 
          birth_date: birthDate, 
          day_of_week: day,
          weather: '맑음' // 우선 연습용으로 '맑음' 고정
        }
      ]);

    if (error) {
      console.error(error);
      alert("저장 실패! (RLS 정책 설정을 확인해보세요)");
    } else {
      alert(`성공! ${birthDate}는 ${day}였습니다. DB에 저장 완료!`);
    }
  };

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      {user ? (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '15px' }}>
          <h1>🔮 {user.user_metadata.full_name}님의 사주 기록기</h1>
          <p>태어난 날짜를 선택하고 저장 버튼을 눌러보세요.</p>
          
          <input 
            type="date" 
            onChange={(e) => setBirthDate(e.target.value)} 
            style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button 
            onClick={saveData}
            style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            기록 저장하기
          </button>
          
          <div style={{ marginTop: '20px' }}>
             <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} style={{ background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>로그아웃</button>
          </div>
        </div>
      ) : (
        <div>
          <h1>사주아이 연습 서비스</h1>
          <button 
            onClick={handleLogin} 
            style={{ padding: '15px 30px', backgroundColor: '#FEE500', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
          >
            카카오 로그인으로 시작하기
          </button>
        </div>
      )}
    </div>
  )
}