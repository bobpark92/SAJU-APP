"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, useRef } from 'react'
import Script from 'next/script' 
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

declare global {
  interface Window {
    Kakao: any;
  }
}

// 타입 정의
type AnalysisType = 'saju' | 'gunghap' | 'face' | 'hand' | null;
type ViewState = 'menu' | 'form' | 'result' | 'history';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  
  // --- 상태 관리 ---
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]); 
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isKakaoReady, setIsKakaoReady] = useState(false);

  // 1. 사주/궁합용 입력 데이터 (내 정보)
  const [myData, setMyData] = useState({ year: '', month: '', day: '', time: '', gender: 'male', calendarType: 'solar' });
  // 2. 궁합용 상대방 데이터
  const [partnerData, setPartnerData] = useState({ year: '', month: '', day: '', time: '', gender: 'female', calendarType: 'solar' });
  // 3. 관상/손금용 이미지 데이터 (Base64)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  // --- 핸들러 함수들 ---

  const handleMenuClick = (type: AnalysisType) => {
    setAnalysisType(type);
    setCurrentView('form');
    setResult(null);
    setSelectedImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    // 유효성 검사
    if (analysisType === 'saju') {
       if (!myData.year || !myData.month || !myData.day) return alert('생년월일을 입력해주세요!');
    } else if (analysisType === 'gunghap') {
       if (!myData.year || !myData.month || !myData.day) return alert('본인의 생년월일을 입력해주세요!');
       if (!partnerData.year || !partnerData.month || !partnerData.day) return alert('상대방의 생년월일을 입력해주세요!');
    } else if (analysisType === 'face' || analysisType === 'hand') {
       if (!selectedImage) return alert('사진을 업로드해주세요!');
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: analysisType, // 분석 종류 (saju, gunghap, face, hand)
          myData, 
          partnerData,
          image: selectedImage 
        }), 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResult(data);
      setCurrentView('result');

      // 로그 저장 (로그인 시)
      if (user) {
        const kakaoId = user.user_metadata?.sub || user.identities?.find((id: any) => id.provider === 'kakao')?.id;
        await supabase.from('fortune_logs').insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.user_metadata?.name,
          kakao_id: kakaoId, 
          // 저장할 데이터 정리
          birth_info: analysisType === 'gunghap' ? { my: myData, partner: partnerData } : myData,
          result_data: data,
          provider: (analysisType === 'face' || analysisType === 'hand') ? 'openai' : 'claude',
          analysis_type: analysisType // DB에 컬럼 추가 필요할 수 있음
        });
      }
    } catch (err: any) {
      alert(`에러 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ... (기존 카카오 로그인, 로그아웃, 히스토리, 공유하기 함수들은 그대로 유지)
  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: window.location.origin } });
    if (error) alert(error.message);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setCurrentView('menu'); setResult(null);
  };
  const fetchHistory = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    setLoading(true);
    const { data, error } = await supabase.from('fortune_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) alert("기록 조회 실패");
    else { setHistoryList(data || []); setCurrentView('history'); }
    setLoading(false);
  };
  const handleHistoryClick = (item: any) => {
    // 복원 로직이 좀 복잡해질 수 있으나 일단 단순화
    setResult(item.result_data); setCurrentView('result');
  };
  const handleKakaoShare = () => { /* 기존 코드 유지 */ 
    if (!isKakaoReady && (!window.Kakao || !window.Kakao.isInitialized())) {
        if (window.Kakao) window.Kakao.init('35ce6b06959807394a004fd6fc0922b2');
        else return alert("로딩중...");
    }
    window.Kakao.Share.sendDefault({
        objectType: 'text',
        text: `[인생분석] 결과가 도착했습니다!`,
        link: { mobileWebUrl: window.location.href, webUrl: window.location.href },
        buttonTitle: '결과 보기',
    });
  };
  const getElementColor = (char: string) => { /* 기존 코드 유지 */ 
    if ("甲乙寅卯".includes(char)) return { color: "#2d6a4f", bg: "#e8f5e9" };
    if ("丙丁巳午".includes(char)) return { color: "#ae2012", bg: "#fff0f0" };
    if ("戊己辰戌丑未".includes(char)) return { color: "#9c6644", bg: "#fdf5e6" };
    if ("庚辛申酉".includes(char)) return { color: "#495057", bg: "#f8f9fa" };
    if ("壬癸亥子".includes(char)) return { color: "#003049", bg: "#e0f2fe" };
    return { color: "#3E3A31", bg: "#F1F5F9" };
  }
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, icon }: any) => { /* 기존 코드 유지 */
     const RADIAN = Math.PI / 180;
     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
     const x = cx + radius * Math.cos(-midAngle * RADIAN);
     const y = cy + radius * Math.sin(-midAngle * RADIAN);
     if (percent === 0) return null;
     return (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '24px', fontWeight:'bold', filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))' }}>{icon}</text>);
  };

  // 공통 입력 폼 컴포넌트
  const BirthInputForm = ({ data, setData, title }: { data: any, setData: any, title?: string }) => (
    <div style={{ marginBottom: '20px' }}>
      {title && <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>{title}</h4>}
      <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '4px', marginBottom:'10px' }}>
        <button onClick={() => setData({...data, calendarType: 'solar'})} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '700', backgroundColor: data.calendarType === 'solar' ? '#fff' : 'transparent', color: data.calendarType === 'solar' ? '#3E3A31' : '#94A3B8' }}>양력</button>
        <button onClick={() => setData({...data, calendarType: 'lunar'})} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '700', backgroundColor: data.calendarType === 'lunar' ? '#fff' : 'transparent', color: data.calendarType === 'lunar' ? '#3E3A31' : '#94A3B8' }}>음력</button>
      </div>
      <div style={{ display:'flex', gap:'5px', marginBottom:'10px' }}>
        <input type="number" placeholder="년(YYYY)" value={data.year} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setData({...data, year: e.target.value})} />
        <input type="number" placeholder="월" value={data.month} style={{ width:'60px', padding:'12px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setData({...data, month: e.target.value})} />
        <input type="number" placeholder="일" value={data.day} style={{ width:'60px', padding:'12px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setData({...data, day: e.target.value})} />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" value={data.time} style={{ flex: 1, padding:'12px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setData({...data, time: e.target.value})} />
        <select value={data.gender} style={{ width:'80px', padding:'12px', borderRadius:'12px', border:'1px solid #E5E1D8' }} onChange={e => setData({...data, gender: e.target.value})}>
          <option value="male">남성</option><option value="female">여성</option>
        </select>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '80px', color: '#3E3A31', fontFamily: 'sans-serif', position: 'relative' }}>
      
      <Script src="/kakao.js" strategy="afterInteractive" onLoad={() => { if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init('35ce6b06959807394a004fd6fc0922b2'); setIsKakaoReady(true); }} />

      {/* 헤더 */}
      <div style={{ padding: '40px 20px 20px', textAlign: 'center', backgroundColor: '#F2EFE9', borderBottom: '1px solid #E5E1D8' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, cursor:'pointer' }} onClick={() => setCurrentView('menu')}>🔮 인생분석연구소</h1>
        
        {/* 로그인 상태 */}
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!user ? (
             <button onClick={handleKakaoLogin} style={{ padding: '8px 16px', backgroundColor: '#FEE500', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize:'13px' }}>💬 카카오 로그인</button>
          ) : (
            <>
              <span style={{ fontSize: '13px', alignSelf:'center' }}><b>{user.user_metadata?.full_name}</b>님</span>
              <button onClick={handleLogout} style={{ padding: '4px 8px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize:'11px' }}>로그아웃</button>
            </>
          )}
        </div>
        {user && <p onClick={fetchHistory} style={{ fontSize:'13px', textDecoration:'underline', cursor:'pointer', marginTop:'5px', color:'#666' }}>📜 내 기록 보기</p>}
      </div>

      <div style={{ maxWidth: '500px', margin: '30px auto 0', padding: '0 16px' }}>
        
        {/* VIEW: 메인 메뉴 (선택) */}
        {currentView === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: '0 0 10px 5px', fontSize: '18px' }}>어떤 걸 분석해드릴까요?</h3>
            
            <div onClick={() => handleMenuClick('saju')} style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #E5E1D8', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>📜 사주</div>
              <div style={{ fontSize: '14px', color: '#888' }}>인생 스포주의! 나의 타고난 운명 분석</div>
            </div>

            <div onClick={() => handleMenuClick('gunghap')} style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #E5E1D8', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>💕 궁합</div>
              <div style={{ fontSize: '14px', color: '#888' }}>우리 궁합 몇 점? 연인/썸남썸녀 필독</div>
            </div>

            <div onClick={() => handleMenuClick('face')} style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #E5E1D8', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>🥸 관상</div>
              <div style={{ fontSize: '14px', color: '#888' }}>내가 왕이 될 상인가? 얼굴로 보는 운세</div>
            </div>

            <div onClick={() => handleMenuClick('hand')} style={{ padding: '25px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #E5E1D8', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>✋ 손금</div>
              <div style={{ fontSize: '14px', color: '#888' }}>손바닥에 적힌 인생의 떡밥들...</div>
            </div>

            {/* 이벤트성 분석 (비활성화) */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 10px 5px', fontSize: '14px', color: '#999' }}>✨ 이벤트 분석 (오픈 예정)</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ padding: '8px 12px', backgroundColor: '#eee', borderRadius: '20px', fontSize: '12px', color: '#aaa' }}>💼 사업운</span>
                <span style={{ padding: '8px 12px', backgroundColor: '#eee', borderRadius: '20px', fontSize: '12px', color: '#aaa' }}>💔 이별상담</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: 입력 폼 (분기 처리) */}
        {currentView === 'form' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #E5E1D8' }}>
            <button onClick={() => setCurrentView('menu')} style={{ border:'none', background:'none', fontSize:'14px', color:'#888', marginBottom:'15px', cursor:'pointer' }}>← 뒤로가기</button>
            
            {/* 1. 사주 입력 */}
            {analysisType === 'saju' && (
              <>
                <h2 style={{ marginTop:0 }}>📜 내 사주 정보</h2>
                <BirthInputForm data={myData} setData={setMyData} />
              </>
            )}

            {/* 2. 궁합 입력 (2명) */}
            {analysisType === 'gunghap' && (
              <>
                <h2 style={{ marginTop:0 }}>💕 궁합 정보 입력</h2>
                <BirthInputForm title="내 정보 (A)" data={myData} setData={setMyData} />
                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px dashed #ddd' }} />
                <BirthInputForm title="상대방 정보 (B)" data={partnerData} setData={setPartnerData} />
              </>
            )}

            {/* 3. 관상/손금 (사진 업로드) */}
            {(analysisType === 'face' || analysisType === 'hand') && (
              <>
                <h2 style={{ marginTop:0 }}>{analysisType === 'face' ? '🥸 관상' : '✋ 손금'} 사진 업로드</h2>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                  {analysisType === 'face' ? '이마, 눈, 코, 입이 잘 나온 정면 사진을 올려주세요.' : '손바닥의 선이 선명하게 나온 사진을 올려주세요.'}
                  <br/>(3장 정도 찍어서 제일 잘 나온 걸로 골라주세요!)
                </p>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    width: '100%', height: '200px', backgroundColor: '#f8f9fa', borderRadius: '16px', border: '2px dashed #ccc', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow:'hidden', position:'relative'
                  }}>
                  {selectedImage ? (
                    <img src={selectedImage} alt="preview" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                  ) : (
                    <>
                      <span style={{ fontSize: '40px' }}>📷</span>
                      <span style={{ marginTop: '10px', fontWeight: 'bold', color: '#888' }}>사진 찍기 / 올리기</span>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </div>
              </>
            )}

            <button onClick={handleAnalyze} disabled={loading} style={{ width:'100%', marginTop:'20px', padding: '20px', background: '#3E3A31', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '18px', cursor: 'pointer' }}>
              {loading ? '🔮 대가가 분석 중입니다...' : '결과 분석하기'}
            </button>
          </div>
        )}

        {/* VIEW: 결과 화면 (공통) */}
        {currentView === 'result' && result && (
          <>
             {/* 사주/궁합일 때만 오행/명식 보여줌 */}
            {(analysisType === 'saju' || analysisType === 'gunghap') && result.manse && (
              <>
                <div style={{ textAlign:'center', marginBottom:'15px' }}>
                   <span style={{ backgroundColor: '#fff5f0', color: '#da7756', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: `1px solid #da7756` }}>
                     🧠 Analysis by Claude 3.5 Sonnet
                   </span>
                </div>
                {/* 오행 차트 (사주만) */}
                {analysisType === 'saju' && result.ohaeng && (
                  <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '24px', border: '1px solid #E5E1D8', display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: '#3E3A31' }}>🌟 기운 분포 (오행)</h3>
                    <div style={{ width: '100%', height: '200px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={result.ohaeng} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={70} fill="#8884d8" dataKey="value" isAnimationActive={true}>
                            {result.ohaeng.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}

             {/* 관상/손금일 때 AI 배지 */}
             {(analysisType === 'face' || analysisType === 'hand') && (
                <div style={{ textAlign:'center', marginBottom:'15px' }}>
                   <span style={{ backgroundColor: '#e6fffa', color: '#10a37f', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: `1px solid #10a37f` }}>
                     👁️ Analysis by GPT-4o Vision
                   </span>
                </div>
             )}

            {/* 대가의 총평 */}
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '28px', marginBottom: '24px', border: '1px solid #E5E1D8', lineHeight: '1.8' }}>
              <h3 style={{ marginTop: 0, color: '#3E3A31', fontSize: '19px' }}>📜 대가의 분석</h3>
              <div style={{ color: '#5C5647', fontSize: '15px', whiteSpace: 'pre-wrap' }}>{result.commentary}</div>
            </div>

            {/* 테마 아코디언 */}
            {result.themes && (
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
            )}

            <button onClick={() => { setResult(null); setCurrentView('menu'); setSelectedImage(null); }} style={{ width: '100%', marginTop: '40px', padding: '20px', background: 'none', border: '2px solid #E5E1D8', borderRadius: '20px', color: '#8A8271', fontWeight: '700', cursor: 'pointer' }}>
              다른 분석 하러가기
            </button>
          </>
        )}

        {/* 공유 버튼 (결과화면 전용) */}
        {currentView === 'result' && result && (
          <div onClick={handleKakaoShare} style={{ position: 'fixed', bottom: '30px', right: '25px', width: '60px', height: '60px', backgroundColor: '#FEE500', borderRadius: '50%', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>💬</div>
        )}
        
        {/* 히스토리 화면은 생략 (기존 로직 유지) */}
        {currentView === 'history' && (
           <div>
              <button onClick={() => setCurrentView('menu')} style={{ marginBottom:'10px' }}>뒤로</button>
              {historyList.map(item => <div key={item.id} onClick={() => handleHistoryClick(item)} style={{ padding:'10px', borderBottom:'1px solid #eee' }}>{item.created_at}</div>)}
           </div>
        )}
      </div>
    </div>
  )
}