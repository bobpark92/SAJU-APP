"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Script from 'next/script' // ✅ Next.js Script 사용

// Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function Home() {
  // --- 상태 관리 ---
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({ year: '', month: '', day: '', time: '', gender: 'male', calendarType: 'solar' });
  const [loading, setLoading] = useState(false);
  
  // 화면 전환: 'form'(입력), 'result'(결과), 'history'(기록)
  const [currentView, setCurrentView] = useState<'form' | 'result' | 'history'>('form');
  const [result, setResult] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]); 
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // 카카오 SDK 로드 상태
  const [isKakaoReady, setIsKakaoReady] = useState(false);

  // --- 초기화 (로그인 세션 체크) ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- 기능 함수들 ---

  // 1. 카카오 로그인
  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin, 
      },
    });
    if (error) alert(error.message);
  };

  // 2. 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('form'); // 로그아웃 시 입력폼으로 이동
    setResult(null);
  };

  // 3. 사주 분석 요청 및 DB 저장 (원래 로직 복구)
  const handleAnalyze = async () => {
    if (!formData.year || !formData.month || !formData.day) return alert('생년월일을 입력해주세요!');
    setLoading(true);
    setResult(null);

    try {
      // 실제 API 호출
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResult(data);
      setCurrentView('result'); // 결과 화면으로 전환

      // 로그인한 유저라면 DB에 저장
      if (user) {
        const kakaoId = user.user_metadata?.sub || user.identities?.find((id: any) => id.provider === 'kakao')?.id;
        
        await supabase.from('fortune_logs').insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.user_metadata?.name,
          kakao_id: kakaoId, 
          birth_info: formData,
          result_data: data
        });
      }

    } catch (err: any) {
      alert(`에러 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // 4. 히스토리(나의 기록) 불러오기
  const fetchHistory = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    setLoading(true);
    
    const { data, error } = await supabase
      .from('fortune_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      alert("기록을 불러오는데 실패했습니다.");
    } else {
      setHistoryList(data || []);
      setCurrentView('history'); // 기록 화면으로 전환
    }
    setLoading(false);
  };

  // 5. 기록 리스트 클릭 시 결과 복원
  const handleHistoryClick = (item: any) => {
    setFormData(item.birth_info); // 당시 입력했던 정보 복원
    setResult(item.result_data);  // 당시 결과 복원
    setCurrentView('result');
  };

  // 6. ⭐ 카카오톡 공유하기 (성공한 로직 적용)
  const handleKakaoShare = () => {
    // 로컬 파일 방식이라 로딩 실패 확률이 거의 없지만 안전장치 추가
    if (!isKakaoReady && (!window.Kakao || !window.Kakao.isInitialized())) {
      // 혹시 모르니 강제 초기화 시도
       if (window.Kakao) {
         window.Kakao.init('35ce6b06959807394a004fd6fc0922b2');
       } else {
         return alert("카카오 기능 로딩 중입니다. 잠시 후 다시 눌러주세요.");
       }
    }

    try {
        window.Kakao.Share.sendDefault({
            objectType: 'text',
            text: `[당분간무료사주] ${formData.year}년생의 운세 분석 결과가 도착했습니다!\n\n"${result?.commentary ? result.commentary.substring(0, 50) : '소름돋는 분석 결과'}..."`,
            link: {
                mobileWebUrl: window.location.href,
                webUrl: window.location.href,
            },
            buttonTitle: '나도 결과 보기',
        });
    } catch (e) {
        console.error(e);
        alert("공유하기 실행 오류: " + e);
    }
  };

  // 오행 색상 결정 함수 (디자인 복구)
  const getElementColor = (char: string) => {
    if ("甲乙寅卯".includes(char)) return { color: "#2d6a4f", bg: "#e8f5e9" };
    if ("丙丁巳午".includes(char)) return { color: "#ae2012", bg: "#fff0f0" };
    if ("戊己辰戌丑未".includes(char)) return { color: "#9c6644", bg: "#fdf5e6" };
    if ("庚辛申酉".includes(char)) return { color: "#495057", bg: "#f8f9fa" };
    if ("壬癸亥子".includes(char)) return { color: "#003049", bg: "#e0f2fe" };
    return { color: "#3E3A31", bg: "#F1F5F9" };
  }

  // --- 화면 렌더링 ---
  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '80px', color: '#3E3A31', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* ⭐⭐⭐ 핵심: 성공한 로컬 파일 방식 적용 ⭐⭐⭐ */}
      {/* public 폴더에 kakao.js 파일이 반드시 있어야 합니다! */}
      <Script
        src="/kakao.js" 
        strategy="afterInteractive"
        onLoad={() => {
          console.log("✅ Kakao SDK Loaded (Local)");
          if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init('35ce6b06959807394a004fd6fc0922b2');
          }
          setIsKakaoReady(true);
        }}
      />

      {/* 1. 헤더 및 네비게이션 영역 */}
      <div style={{ padding: '60px 20px 20px', textAlign: 'center', backgroundColor: '#F2EFE9', borderBottom: '1px solid #E5E1D8' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, cursor:'pointer' }} onClick={() => setCurrentView('form')}>당분간무료사주</h1>
        <p style={{ color: '#8A8271', marginTop: '10px' }}>당분간 무료임. 근데 막쓰진 마셈</p>
        
        {/* 로그인 상태바 */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!user ? (
             <button onClick={handleKakaoLogin} style={{ padding: '10px 20px', backgroundColor: '#FEE500', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize:'14px' }}>
               💬 카카오 1초 로그인
             </button>
          ) : (
            <>
              <span style={{ padding: '8px', fontSize: '14px', alignSelf:'center' }}>반가워요, <b>{user.user_metadata?.full_name || '이용자'}</b>님!</span>
              <button onClick={handleLogout} style={{ padding: '6px 12px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize:'12px' }}>로그아웃</button>
            </>
          )}
        </div>
        
        {/* 탭 메뉴 (로그인 시에만 보임) */}
        {user && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '16px', fontWeight: '700' }}>
            <span onClick={() => setCurrentView('form')} style={{ cursor: 'pointer', color: currentView === 'form' ? '#3E3A31' : '#999', borderBottom: currentView === 'form' ? '2px solid #3E3A31' : 'none', paddingBottom:'4px' }}>사주보기</span>
            <span onClick={fetchHistory} style={{ cursor: 'pointer', color: currentView === 'history' ? '#3E3A31' : '#999', borderBottom: currentView === 'history' ? '2px solid #3E3A31' : 'none', paddingBottom:'4px' }}>나의 기록</span>
            <span onClick={() => alert('다음 업데이트를 기대해주세요!')} style={{ cursor: 'pointer', color: '#ccc' }}>궁합(준비중)</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '500px', margin: '30px auto 0', padding: '0 16px' }}>
        
        {/* VIEW 1: 정보 입력 폼 */}
        {currentView === 'form' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #E5E1D8' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '4px' }}>
                <button onClick={() => setFormData({...formData, calendarType: 'solar'})} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '700', backgroundColor: formData.calendarType === 'solar' ? '#fff' : 'transparent', color: formData.calendarType === 'solar' ? '#3E3A31' : '#94A3B8' }}>양력</button>
                <button onClick={() => setFormData({...formData, calendarType: 'lunar'})} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '700', backgroundColor: formData.calendarType === 'lunar' ? '#fff' : 'transparent', color: formData.calendarType === 'lunar' ? '#3E3A31' : '#94A3B8' }}>음력</button>
              </div>
              <input type="number" placeholder="년(YYYY)" value={formData.year} style={{ padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, year: e.target.value})} />
              <input type="number" placeholder="월(MM)" value={formData.month} style={{ padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, month: e.target.value})} />
              <input type="number" placeholder="일(DD)" value={formData.day} style={{ padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, day: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="time" value={formData.time} style={{ flex: 1, padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, time: e.target.value})} />
                <select value={formData.gender} style={{ flex: 1, padding:'16px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="male">남성</option><option value="female">여성</option>
                </select>
              </div>
              <button onClick={handleAnalyze} disabled={loading} style={{ padding: '22px', background: '#3E3A31', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '18px', cursor: 'pointer' }}>
                {loading ? '🔮 대가가 분석 중입니다...' : '정밀 분석 결과 보기'}
              </button>
              {!user && <p style={{ fontSize:'12px', color:'#999', textAlign:'center', margin:0 }}>* 로그인하면 결과를 저장하고 다시 볼 수 있어요.</p>}
            </div>
          </div>
        )}

        {/* VIEW 2: 분석 결과 화면 (원래대로 복구) */}
        {currentView === 'result' && result && (
          <>
            {/* 만세력 테이블 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #E5E1D8' }}>
              <div style={{ backgroundColor: '#3E3A31', color: '#F2EFE9', padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }}>팔자명식</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    {[result.manse.time_top, result.manse.day_top, result.manse.month_top, result.manse.year_top].map((char: string, i: number) => {
                      const s = getElementColor(char);
                      return <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #E5E1D8' }}>{char}</td>
                    })}
                  </tr>
                  <tr>
                    {[result.manse.time_bottom, result.manse.day_bottom, result.manse.month_bottom, result.manse.year_bottom].map((char: string, i: number) => {
                      const s = getElementColor(char);
                      return <td key={i} style={{ padding: '20px 0', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: s.color, backgroundColor: s.bg, border: '1px solid #E5E1D8' }}>{char}</td>
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 대가의 평론 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '28px', marginBottom: '24px', border: '1px solid #E5E1D8', lineHeight: '1.8' }}>
              <h3 style={{ marginTop: 0, color: '#3E3A31', fontSize: '19px' }}>📜 대가의 총평</h3>
              <div style={{ color: '#5C5647', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                {result.commentary}
              </div>
            </div>

            {/* 심화 테마 (아코디언) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {result.themes.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #E5E1D8' }}>
                  <div onClick={() => setOpenIndex(openIndex === idx ? null : idx)} style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '24px' }}>{item.icon}</span>
                    <span style={{ fontWeight: '800', fontSize: '17px', flex: 1 }}>{item.title}</span>
                    <span style={{ color:'#ccc' }}>{openIndex === idx ? '▲' : '▼'}</span>
                  </div>
                  {openIndex === idx && (
                    <div style={{ padding: '0 24px 28px 24px', fontSize: '15px', lineHeight: '2.0', color: '#5C5647', whiteSpace: 'pre-wrap', borderTop: '1px solid #F9F7F2', paddingTop: '15px' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => { setResult(null); setCurrentView('form'); }} style={{ width: '100%', marginTop: '40px', padding: '20px', background: 'none', border: '2px solid #E5E1D8', borderRadius: '20px', color: '#8A8271', fontWeight: '700', cursor: 'pointer' }}>
              다른 사주 보러가기
            </button>
          </>
        )}

        {/* VIEW 3: 나의 기록 리스트 (원래대로 복구) */}
        {currentView === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: '0 0 10px 10px', fontSize: '18px' }}>📜 저장된 기록</h3>
            {historyList.length === 0 ? (
               <div style={{ textAlign: 'center', color: '#999', padding: '60px 20px', backgroundColor:'#fff', borderRadius:'24px', border:'1px solid #E5E1D8' }}>
                 아직 저장된 사주 기록이 없습니다.<br/>첫 번째 분석을 받아보세요!
               </div>
            ) : (
              historyList.map((item: any) => (
                <div key={item.id} onClick={() => handleHistoryClick(item)} style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px', border: '1px solid #E5E1D8', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow:'0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                      {item.birth_info.year}년 {item.birth_info.month}월 {item.birth_info.day}일생
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      분석일: {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', color: '#3E3A31', fontWeight:'bold' }}>결과보기 👉</span>
                </div>
              ))
            )}
            <button onClick={() => setCurrentView('form')} style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#3E3A31', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>새 분석 하러가기</button>
          </div>
        )}
      </div>

      {/* ⭐ 플로팅 공유 버튼 (모든 화면에서 우측 하단 고정) ⭐ */}
      <div 
        onClick={handleKakaoShare}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '25px',
          width: '60px',
          height: '60px',
          backgroundColor: '#FEE500', // 카카오 노란색
          borderRadius: '50%',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)', // 그림자 효과
          cursor: 'pointer',
          zIndex: 9999, // 제일 위에 뜨도록
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px',
          transition: 'transform 0.2s' // 누를 때 살짝 움직이는 효과
        }}
        // 마우스 올렸을 때 살짝 커지는 효과
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
      >
        💬
      </div>

    </div>
  )
}