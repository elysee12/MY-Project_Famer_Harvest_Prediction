import React from 'react';
import { T, fmtDate, CROP_BENCH } from '../../constants/constants';
import Topbar from '../../components/Common/Topbar';
import CropIcon from '../../components/Common/CropIcon';

const CROP_COLORS = { Maize: '#f59e0b', Rice: '#0d9488' };
const CROP_BG    = { Maize: '#fef3c7', Rice: '#ccfbf1' };

export default function CooperativeDashboard({ user, onNavigate, onResult, history = [], lang, setLang, notifications = [] }) {
  console.log('🟦 COOPERATIVE DASHBOARD RENDERED');
  console.log('🟦 User data:', { 
    id: user.id, 
    name: user.name, 
    role: user.role,
    cooperative_name: user.cooperative_name,
    coop_total_members: user.coop_total_members,
    cell_name: user.cell_name,
    village_name: user.village_name
  });
  
  const t = T[lang];
  const farmHa  = user.farm_size_ha  || 0;
  const farmAre = user.farm_size_are || Math.round(farmHa * 100);
  const unread  = notifications.filter(n => !n.read).length;
  const cooperativeName = user.cooperative_name || user.coop_name || 'Cooperative';
  const cooperativeMembers = user.coop_total_members || 0;

  // Compute avg yield from history
  const avgYield = history.length
    ? (history.reduce((s, p) => s + parseFloat(p.yield_per_are_kg || 0), 0) / history.length).toFixed(1)
    : null;

  // Best prediction
  const bestPred = history.length
    ? history.reduce((best, p) => parseFloat(p.yield_per_are_kg) > parseFloat(best.yield_per_are_kg) ? p : best, history[0])
    : null;

  return (
    <>
      <Topbar
        title={
          <div className="dash-header-clean">
            <span className="dash-header-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <i className="bi bi-people-fill"></i>
            </span>
            <div className="dash-header-text">
              <h1 className="dash-title">{lang === 'en' ? 'Cooperative Dashboard' : 'Incumbane ya Kooperative'}</h1>
              <p className="dash-subtitle">{fmtDate(new Date())}</p>
            </div>
          </div>
        }
        onBack={null}
        lang={lang}
        setLang={setLang}
        actions={
          <div className="dash-actions">
            <button className="dash-action-btn" onClick={() => onNavigate('notifications')} style={{ position: 'relative' }}>
              <i className="bi bi-bell-fill"></i>
              {unread > 0 && (
                <span style={{ position:'absolute', top:6, right:6, width:8, height:8, background:'#ef4444', borderRadius:'50%', border:'2px solid white' }}></span>
              )}
            </button>
            <button className="dash-action-btn" onClick={() => onNavigate('profile')} style={{ background: '#2563eb', color: 'white', border: 'none' }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{user.name ? user.name.charAt(0).toUpperCase() : 'C'}</span>
            </button>
          </div>
        }
      />

      <div className="scroll fade-up">

        {/* ── Welcome Banner (Blue Theme) ── */}
        <div className="modern-welcome-card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
          <div className="welcome-content">
            <h2 className="welcome-greet">
              {t.welcome}, <span className="welcome-name">{user.name?.split(' ')[0] || 'Leader'}</span>!
            </h2>
            <p className="welcome-sub" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-people-fill"></i> 
              <strong style={{ fontSize: 14 }}>{cooperativeName}</strong>
              {cooperativeMembers > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                  {cooperativeMembers} {lang === 'en' ? 'members' : 'abanyamuryango'}
                </span>
              )}
            </p>
            <p className="welcome-sub" style={{ marginBottom: 8, fontSize: 12, opacity: 0.9 }}>
              <i className="bi bi-geo-alt-fill"></i> {user.sector || 'Gashora'} Sector · ID: <strong>{user.id || user.farmer_id}</strong>
            </p>
            {(user.cell_name || user.village_name) && (
              <p className="welcome-sub" style={{ marginBottom: 20, fontSize: 12, opacity: 0.85 }}>
                <i className="bi bi-house-fill"></i> {user.cell_name || ''}{user.cell_name && user.village_name ? ' · ' : ''}{user.village_name || ''}
              </p>
            )}
            {!user.cell_name && !user.village_name && (
              <div style={{ marginBottom: 20 }}></div>
            )}
            <div className="welcome-stats">
              <div className="w-stat">
                <span className="w-stat-val">{farmAre}</span>
                <span className="w-stat-lbl">{lang === 'en' ? 'Farm (are)' : 'Akarima (are)'}</span>
              </div>
              <div className="w-stat-divider"></div>
              <div className="w-stat">
                <span className="w-stat-val">{history.length}</span>
                <span className="w-stat-lbl">{t.predictions}</span>
              </div>
              {avgYield && <>
                <div className="w-stat-divider"></div>
                <div className="w-stat">
                  <span className="w-stat-val">{avgYield}</span>
                  <span className="w-stat-lbl">kg/are avg</span>
                </div>
              </>}
            </div>
          </div>
          <div className="welcome-illustration"><i className="bi bi-people-fill"></i></div>
        </div>

        {/* ── Cooperative Benefits Info ── */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '2px solid #93c5fd',
          borderRadius: 16,
          padding: '18px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14
        }}>
          <div style={{ width:40, height:40, background:'#2563eb', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, color:'white' }}>
            <i className="bi bi-info-circle-fill"></i>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:14, color:'#1e3a8a', marginBottom:6 }}>
              {lang === 'en' ? 'Cooperative Member Benefits' : 'Inyungu zo Kuba Umunyamuryango'}
            </div>
            <div style={{ fontSize:12, color:'#1e40af', lineHeight:1.6 }}>
              {lang === 'en' 
                ? 'As a cooperative member, you have access to shared resources, bulk purchasing power, and collective marketing opportunities.'
                : 'Nk\'umunyamuryango, ufite uburenganzira ku bikoresho bisangiye, kugura ibintu byinshi hamwe, no kugurisha hamwe.'}
            </div>
          </div>
        </div>

        {/* ── Notifications Banner ── */}
        {unread > 0 && (
          <div onClick={() => onNavigate('notifications')} style={{
            background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: 'white',
            borderRadius: 16, padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(37,99,235,0.3)'
          }}>
            <div style={{ width:40, height:40, background:'rgba(255,255,255,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
              <i className="bi bi-bell-fill"></i>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:14 }}>
                {unread} {lang === 'en' ? 'new message(s) from your Agri Officer' : 'ubutumwa bushya buvuye ku Ofisiye w\'Ubuhinzi'}
              </div>
              <div style={{ fontSize:12, opacity:.85, marginTop:2 }}>
                {lang === 'en' ? 'Tap to read advice and recommendations' : 'Kanda urebe inama n\'ibisobanuro'}
              </div>
            </div>
            <i className="bi bi-chevron-right" style={{ opacity:.7 }}></i>
          </div>
        )}

        {/* ── Quick Actions (Blue Theme) ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'var(--s500)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:14 }}>
            {lang === 'en' ? 'Quick Actions' : 'Ibikorwa Byihuse'}
          </div>
          <div className="modern-action-grid">
            {[
              { icon: 'bi-tree-fill', label: t.newPred, desc: lang==='en'?'Start new prediction':'Teganya isarura', color:'#2563eb', target:'predict' },
              { icon: 'bi-bar-chart-line-fill',label: lang==='en'?'History':'Amateka',   desc: lang==='en'?'View past predictions':'Reba amateka',     color:'#2563eb', target:'history' },
              { icon: 'bi-cloud-sun-fill',     label: lang==='en'?'Weather':'Ikirere',   desc: lang==='en'?'Local forecast':'Amakuru y\'ikirere',       color:'#f59e0b', target:'weather' },
              { icon: 'bi-lightbulb-fill',     label: lang==='en'?'Tips':'Inama',        desc: lang==='en'?'Agronomic advice':'Inama z\'ubuhinzi',      color:'#8b5cf6', target:'tips'    },
            ].map(item => (
              <button key={item.target} className="modern-action-card" onClick={() => onNavigate(item.target)} style={{'--accent-color': item.color}}>
                <div className="m-card-icon" style={{ backgroundColor:`${item.color}18`, color:item.color }}>
                  <i className={`bi ${item.icon}`} style={{ fontSize:22 }}></i>
                </div>
                <div className="m-card-info">
                  <span className="m-card-label">{item.label}</span>
                  <span className="m-card-desc">{item.desc}</span>
                </div>
                <i className="bi bi-chevron-right" style={{ color:'var(--s300)', fontSize:14 }}></i>
              </button>
            ))}
          </div>
        </div>

        {/* ── Best Prediction highlight (Blue Theme) ── */}
        {bestPred && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'var(--s500)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:14 }}>
              <i className="bi bi-trophy-fill" style={{ marginRight: 6 }}></i> {lang === 'en' ? 'Your Best Prediction' : 'Igisobanuro Cyawe Cyiza Cyane'}
            </div>
            <div onClick={() => onResult(bestPred)} style={{
              background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'white',
              borderRadius:20, padding:'20px 24px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:16,
              boxShadow:'0 8px 24px rgba(37,99,235,0.25)'
            }}>
              <div style={{ width:52, height:52, background:'rgba(255,255,255,0.15)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                <CropIcon name={bestPred.crop} size={28} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:16 }}>{bestPred.crop}</div>
                <div style={{ fontSize:12, opacity:.8, marginTop:2 }}>{fmtDate(bestPred.timestamp)} · {bestPred.sector}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:28, fontWeight:900, fontFamily:'monospace', lineHeight:1 }}>{parseFloat(bestPred.yield_per_are_kg).toFixed(1)}</div>
                <div style={{ fontSize:11, opacity:.75 }}>kg/are</div>
              </div>
              <i className="bi bi-chevron-right" style={{ opacity:.6 }}></i>
            </div>
          </div>
        )}

        {/* ── Recent Predictions ── */}
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">
              <i className="bi bi-clock-history" style={{ marginRight:8 }}></i>
              {t.recentPredictions}
            </h3>
            {history.length > 0 && (
              <button className="section-link" onClick={() => onNavigate('history')}>
                {lang === 'en' ? 'View All' : 'Byose'} →
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon"><i className="bi bi-clipboard2-x" style={{ fontSize:48, opacity:.4 }}></i></div>
              <p style={{ fontWeight:600, color:'var(--s500)' }}>
                {lang === 'en' ? 'No predictions yet. Start your first one!' : 'Nta bisobanuro bihari. Tangira ubwa mbere!'}
              </p>
              <button className="btn-start-mini" onClick={() => onNavigate('predict')} style={{ background:'#2563eb' }}>
                <i className="bi bi-tree-fill"></i> {t.newPred}
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {history.slice(0, 4).map((p, i) => {
                const crop = p.crop || p.crop_type;
                const bench = CROP_BENCH[crop] || 20;
                const yld = parseFloat(p.yield_per_are_kg || 0);
                const vs = ((yld - bench) / bench * 100).toFixed(0);
                return (
                  <div key={i} className="modern-history-item" onClick={() => onResult(p)}>
                    <div className="mh-icon" style={{ background: CROP_BG[crop] || '#f1f5f9', color: CROP_COLORS[crop] || '#64748b' }}>
                      <CropIcon name={crop} size={22} />
                    </div>
                    <div className="mh-info">
                      <span className="mh-crop">{crop}</span>
                      <span className="mh-date">{fmtDate(p.timestamp)} · {p.sector}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{
                        fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99,
                        background: parseFloat(vs)>=0?'#dbeafe':'#fee2e2',
                        color: parseFloat(vs)>=0?'#2563eb':'#dc2626'
                      }}>
                        {parseFloat(vs)>=0?'+':''}{vs}%
                      </span>
                      <div className="mh-yield">
                        <span className="mh-val">{yld.toFixed(1)}</span>
                        <span className="mh-unit">kg/are</span>
                      </div>
                    </div>
                    <i className="bi bi-chevron-right" style={{ color:'var(--s300)', fontSize:13 }}></i>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
