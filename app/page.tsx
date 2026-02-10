"use client";
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
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

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({ year: '', month: '', day: '', time: '', gender: 'male', calendarType: 'solar' });
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'form' | 'result' | 'history'>('form');
  const [result, setResult] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]); 
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  const [provider] = useState<'openai' | 'claude'>('claude');

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

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin },
    });
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('form');
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!formData.year || !formData.month || !formData.day) return alert('생년월일을 입력해주세요!');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, provider }), 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResult(data);
      setCurrentView('result');

      if (user) {
        const kakaoId = user.user_metadata?.sub || user.identities?.find((id: any) => id.provider === 'kakao')?.id;
        await supabase.from('fortune_logs').insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.user_metadata?.name,
          kakao_id: kakaoId, 
          birth_info: formData,
          result_data: data,
          provider: provider 
        });
      }
    } catch (err: any) {
      alert(`에러 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const fetchHistory = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    setLoading(true);
    const { data, error } = await supabase
      .from('fortune_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) alert("기록 조회 실패");
    else {
      setHistoryList(data || []);
      setCurrentView('history');
    }
    setLoading(false);
  };

  const handleHistoryClick = (item: any) => {
    setFormData(item.birth_info); 
    setResult(item.result_data);  
    setCurrentView('result');
  };

  const handleKakaoShare = () => {
    if (!isKakaoReady && (!window.Kakao || !window.Kakao.isInitialized())) {
       if (window.Kakao) {
         window.Kakao.init('35ce6b06959807394a004fd6fc0922b2');
       } else {
         return alert("카카오 기능 로딩 중입니다. 잠시 후 다시 눌러주세요.");
       }
    }
    try {
        window.Kakao.Share.sendDefault({
            objectType: 'text',
            text: `[당분간무료사주] ${formData.year}년생의 운세 분석 결과가 도착했습니다!\n\n"${result?.commentary ? result.commentary.substring(0, 50) : '결과 보기'}..."`,
            link: { mobileWebUrl: window.location.href, webUrl: window.location.href },
            buttonTitle: '결과 보기',
        });
    } catch (e) {
        console.error(e);
        alert("공유하기 실행 오류: " + e);
    }
  };

  // 차트 라벨 커스텀 렌더링
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, icon }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    // 값이 0이 아닐 때만 차트 위에 아이콘 표시
    if (percent === 0) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '24px', fontWeight:'bold', filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))' }}>
        {icon}
      </text>
    );
  };

  return (
    <div style={{ backgroundColor: '#F9F7F2', minHeight: '100vh', paddingBottom: '80px', color: '#3E3A31', fontFamily: 'sans-serif', position: 'relative' }}>
      
      <Script
        src="/kakao.js" 
        strategy="afterInteractive"
        onLoad={() => {
          if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init('35ce6b06959807394a004fd6fc0922b2');
          }
          setIsKakaoReady(true);
        }}
      />

      <div style={{ padding: '60px 20px 20px', textAlign: 'center', backgroundColor: '#F2EFE9', borderBottom: '1px solid #E5E1D8' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, cursor:'pointer' }} onClick={() => setCurrentView('form')}>당분간무료사주</h1>
        <p style={{ color: '#8A8271', marginTop: '10px' }}>당분간 무료임. 근데 막쓰진 마셈</p>
        
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
        
        {user && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '16px', fontWeight: '700' }}>
            <span onClick={() => setCurrentView('form')} style={{ cursor: 'pointer', color: currentView === 'form' ? '#3E3A31' : '#999', borderBottom: currentView === 'form' ? '2px solid #3E3A31' : 'none', paddingBottom:'4px' }}>사주보기</span>
            <span onClick={fetchHistory} style={{ cursor: 'pointer', color: currentView === 'history' ? '#3E3A31' : '#999', borderBottom: currentView === 'history' ? '2px solid #3E3A31' : 'none', paddingBottom:'4px' }}>나의 기록</span>
            <span onClick={() => alert('다음 업데이트를 기대해주세요!')} style={{ cursor: 'pointer', color: '#ccc' }}>궁합(준비중)</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '500px', margin: '30px auto 0', padding: '0 16px' }}>
        
        {currentView === 'form' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #E5E1D8' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ textAlign: 'right', marginBottom: '-10px' }}>
                 <span style={{ fontSize: '11px', color: '#da7756', fontWeight: 'bold', backgroundColor: '#fff5f0', padding: '4px 8px', borderRadius: '10px' }}>
                   ⚡ Powered by Claude 3.5 Sonnet
                 </span>
              </div>

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

        {currentView === 'result' && result && (
          <>
            <div style={{ textAlign:'center', marginBottom:'15px' }}>
               <span style={{ backgroundColor: '#fff5f0', color: '#da7756', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: `1px solid #da7756` }}>
                 🧠 Analysis by Claude 3.5 Sonnet
               </span>
            </div>

            {/* ⭐ [수정됨] 만세력 테이블은 삭제하고, 원형 그래프만 표시 */}
            {result.ohaeng && result.ohaeng.length > 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '24px', border: '1px solid #E5E1D8', display:'flex', flexDirection:'column', alignItems:'center' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: '#3E3A31' }}>🌟 나의 타고난 기운 (오행)</h3>
                <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={result.ohaeng}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel} 
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={true}
                      >
                        {result.ohaeng.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* ⭐ [핵심] 범례 리스트
                   백엔드에서 0개인 항목도 보내주므로, 여기서 0%인 것도 리스트에는 뜹니다.
                */}
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center', marginTop:'-20px' }}>
                   {result.ohaeng.map((item:any, idx:number) => (
                     <div key={idx} style={{ fontSize:'12px', display:'flex', alignItems:'center', gap:'4px', opacity: item.value === 0 ? 0.5 : 1 }}>
                       <span style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor: item.color }}></span>
                       {item.name} {Math.round((item.value / 8) * 100)}%
                     </div>
                   ))}
                </div>
              </div>
            )}

            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '28px', marginBottom: '24px', border: '1px solid #E5E1D8', lineHeight: '1.8' }}>
              <h3 style={{ marginTop: 0, color: '#3E3A31', fontSize: '19px' }}>📜 대가의 총평</h3>
              <div style={{ color: '#5C5647', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                {result.commentary}
              </div>
            </div>

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

      {currentView === 'result' && result && (
        <div 
          onClick={handleKakaoShare}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '25px',
            width: '60px',
            height: '60px',
            backgroundColor: '#FEE500', 
            borderRadius: '50%',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)', 
            cursor: 'pointer',
            zIndex: 9999, 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '24px',
            transition: 'transform 0.2s' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        >
          💬
        </div>
      )}

    </div>
  )
}