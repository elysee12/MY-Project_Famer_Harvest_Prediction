import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { T, API_BASE, fmtDate, CROP_BENCH } from '../../constants/constants';

export default function FarmerDetailView({ farmerId, onBack, lang, setLang, setSelectedPred, officer, autoAdvice, onAdviceUsed }) {
  const t = T[lang];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preds, setPreds] = useState([]);
  const [predsPage, setPredsPage] = useState(1);
  const [predsPerPage] = useState(10);
  const [loadingPreds, setLoadingPreds] = useState(false);
  const [predsHasMore, setPredsHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState(autoAdvice ? 'advice' : 'profile');
  const [showAdviceForm, setShowAdviceForm] = useState(false);
  const [adviceSubject, setAdviceSubject] = useState('');
  const [adviceMsg, setAdviceMsg] = useState(autoAdvice?.msg || '');
  const [adviceType, setAdviceType] = useState('alert');
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/farmer-stats/${farmerId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
    // load first page of predictions separately (paginated)
    fetchPredictions(1);
  }, [farmerId]);

  const fetchPredictions = (page = 1) => {
    setLoadingPreds(true);
    fetch(`${API_BASE}/api/predictions?farmer_id=${farmerId}&page=${page}&per_page=${predsPerPage}`)
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.predictions)) {
          setPreds(prev => page === 1 ? d.predictions : [...prev, ...d.predictions]);
          setPredsPage(page);
          setPredsHasMore(!!d.has_more);
        }
        setLoadingPreds(false);
      })
      .catch(() => setLoadingPreds(false));
  };

  if (loading) return (
    <div className="so-detail-loading">
      <div className="so-spinner"></div>
      <p>{lang === 'en' ? 'Loading farmer profile…' : 'Gufungura umwirondoro w\'umuhinzi…'}</p>
    </div>
  );
  if (!data || data.error) return (
    <div className="so-error-state">
      <i className="bi bi-exclamation-circle"></i>
      <p>{data?.error || (lang === 'en' ? 'Farmer not found' : 'Umuhinzi ntaboneka')}</p>
      <button className="so-back-btn" onClick={onBack}>← {lang === 'en' ? 'Go Back' : 'Subira Inyuma'}</button>
    </div>
  );

  const f = data.farmer || {};
  const stats = data.stats || {};
  const predsFromData = data?.recent_predictions || [];
  const displayedPreds = preds.length ? preds : predsFromData;
  const name = f.full_name || f.name || 'Unknown';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const avgYield = displayedPreds.length
    ? (displayedPreds.reduce((s, p) => s + parseFloat(p.yield_per_are_kg || 0), 0) / displayedPreds.length).toFixed(1)
    : '—';

  const gradeColor = (g) => ({ Excellent: '#0d9488', Good: '#0d9488', Average: '#d97706', 'Below Average': '#dc2626' }[g] || '#64748b');
  const gradeBg = (g) => ({ Excellent: '#ccfbf1', Good: '#ccfbf1', Average: '#fef3c7', 'Below Average': '#fee2e2' }[g] || '#f1f5f9');

  const handleSendAdvice = async () => {
    if (!adviceMsg.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/send-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: officer.id || officer.officer_id,
          farmer_id: f.farmer_id || f.id,
          subject: adviceSubject || (lang === 'en' ? 'Agricultural Advice' : 'Inama ku Buhinzi'),
          message: adviceMsg,
          advice_type: adviceType
        })
      });
      const d = await res.json();
      if (d.success) {
        setStatus({ type: 'ok', msg: lang === 'en' ? 'Advice sent successfully!' : 'Inama yoherejwe neza!' });
        setAdviceMsg(''); setAdviceSubject('');
        if (onAdviceUsed) onAdviceUsed();
        setTimeout(() => { setShowAdviceForm(false); setStatus(null); }, 2500);
      } else {
        setStatus({ type: 'err', msg: d.error });
      }
    } catch {
      setStatus({ type: 'ok', msg: lang === 'en' ? 'Advice sent (local simulation)' : 'Inama yoherejwe (simulation)' });
      setAdviceMsg(''); setAdviceSubject('');
      setTimeout(() => { setShowAdviceForm(false); setStatus(null); }, 2500);
    }
    setSending(false);
  };

  return (
    <div className="fade-up">
      {/* Back + Title */}
      <div className="so-detail-toprow">
        <button className="so-back-btn" onClick={onBack}>
          <i className="bi bi-arrow-left"></i> {lang === 'en' ? 'Back to Farmers' : 'Subira ku Bahinzi'}
        </button>
      </div>

      {/* Hero Card */}
      <div className="so-farmer-hero">
        <div className="so-farmer-hero-avatar">{initials}</div>
        <div className="so-farmer-hero-info">
          <h2 className="so-farmer-hero-name">{name}</h2>
          <div className="so-farmer-hero-id">
            <i className="bi bi-person-badge"></i> {f.farmer_id || f.id}
          </div>
          <div className="so-farmer-hero-chips">
            {f.sector_name && <span className="so-chip green"><i className="bi bi-geo-alt-fill"></i> {f.sector_name}</span>}
            {f.farmer_category && <span className="so-chip blue"><i className="bi bi-tag"></i> {f.farmer_category}</span>}
            {f.farm_size_are && <span className="so-chip amber"><i className="bi bi-rulers"></i> {f.farm_size_are} are</span>}
          </div>
        </div>
        <div className="so-farmer-hero-actions">
          <button className="so-advice-trigger-btn" onClick={() => setShowAdviceForm(true)}>
            <i className="bi bi-chat-dots-fill"></i>
            {lang === 'en' ? 'Send Advice' : 'Ohereza Inama'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="so-farmer-stats-row">
        {[
          { icon: 'bi-clipboard2-data', val: preds.length, lbl: lang === 'en' ? 'Predictions' : 'Ibisobanuro', color: '#0d9488', bg: '#ccfbf1' },
          { icon: 'bi-graph-up', val: avgYield, unit: 'kg/are', lbl: lang === 'en' ? 'Avg Yield' : 'Umusaruro Hagati', color: '#0d9488', bg: '#ccfbf1' },
          { icon: 'bi-rulers', val: `${f.farm_size_are || 0}`, unit: 'are', lbl: lang === 'en' ? 'Farm Size' : 'Ubuso', color: '#d97706', bg: '#fef3c7' },
          { icon: 'bi-calendar-check', val: f.created_at ? new Date(f.created_at).getFullYear() : '—', lbl: lang === 'en' ? 'Registered' : 'Yiyandikishije', color: '#7c3aed', bg: '#ede9fe' },
        ].map((s, i) => (
          <div key={i} className="so-farmer-stat">
            <div className="so-farmer-stat-icon" style={{ background: s.bg, color: s.color }}>
              <i className={`bi ${s.icon}`}></i>
            </div>
            <div className="so-farmer-stat-val">{s.val}{s.unit && <small> {s.unit}</small>}</div>
            <div className="so-farmer-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Sub-section tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid var(--s100)', paddingBottom: 0 }}>
        {[
          { key: 'profile', label: lang === 'en' ? 'Profile' : 'Umwirondoro' },
          { key: 'predictions', label: lang === 'en' ? 'Predictions' : 'Ibisobanuro' },
          { key: 'advice', label: lang === 'en' ? 'Send Advice' : 'Ohereza Inama' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700,
            color: activeTab === key ? 'var(--g700)' : 'var(--s400)',
            borderBottom: activeTab === key ? '2px solid var(--g600)' : '2px solid transparent',
            marginBottom: -2, transition: 'all .2s'
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="so-detail-section fade-up">
          <div className="so-info-grid">
            {[
              { icon: 'bi-person', lbl: lang === 'en' ? 'Full Name' : 'Amazina Yose', val: name },
              { icon: 'bi-person-badge', lbl: 'Farmer ID', val: f.farmer_id || f.id },
              { icon: 'bi-telephone', lbl: t.phoneLabel, val: f.phone || '—' },
              { icon: 'bi-envelope', lbl: 'Email', val: f.email || '—' },
              { icon: 'bi-geo-alt', lbl: t.sector, val: f.sector_name || '—' },
              { icon: 'bi-rulers', lbl: lang === 'en' ? 'Farm Size' : 'Ubuso', val: f.farm_size_are ? `${f.farm_size_are} are (${(f.farm_size_are/100).toFixed(2)} ha)` : '—' },
              { icon: 'bi-tag', lbl: lang === 'en' ? 'Category' : 'Icyiciro', val: f.farmer_category || '—' },
              { icon: 'bi-calendar', lbl: lang === 'en' ? 'Registered' : 'Itariki yo Kwiyandikisha', val: f.created_at ? new Date(f.created_at).toLocaleDateString() : '—' },
            ].map(item => (
              <div key={item.lbl} className="so-info-item">
                <div className="so-info-icon"><i className={`bi ${item.icon}`}></i></div>
                <div>
                  <div className="so-info-lbl">{item.lbl}</div>
                  <div className="so-info-val">{item.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="so-detail-section fade-up">
          {loadingPreds ? (
            <div className="so-detail-loading">
              <div className="so-spinner"></div>
              <p>{lang === 'en' ? 'Loading predictions…' : 'Gufungura ibisobanuro…'}</p>
            </div>
          ) : (preds.length === 0 && predsFromData.length === 0) ? (
            <div className="so-empty-state">
              <i className="bi bi-clipboard2-x"></i>
              <p>{lang === 'en' ? 'No predictions recorded yet' : 'Nta bisobanuro byanditswe'}</p>
            </div>
          ) : (
            <>
              <div className="so-pred-summary-row">
                {[
                  { lbl: lang === 'en' ? 'Total Predictions' : 'Ibisobanuro Byose', val: displayedPreds.length },
                  { lbl: lang === 'en' ? 'Avg Yield' : 'Umusaruro Hagati', val: `${avgYield} kg/are` },
                  { lbl: lang === 'en' ? 'Best Yield' : 'Umusaruro Mwiza', val: `${displayedPreds.length ? Math.max(...displayedPreds.map(p => parseFloat(p.yield_per_are_kg || 0))).toFixed(1) : '—'} kg/are` },
                ].map((s, i) => (
                  <div key={i} className="so-pred-summary-item">
                    <div className="so-pred-summary-val">{s.val}</div>
                    <div className="so-pred-summary-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="so-pred-table-wrap">
                <table className="so-pred-table">
                  <thead>
                    <tr>
                      <th>{lang === 'en' ? 'Crop' : 'Igihingwa'}</th>
                      <th>{lang === 'en' ? 'Season' : 'Igihe'}</th>
                      <th>{lang === 'en' ? 'Yield (kg/are)' : 'Umusaruro'}</th>
                      <th>{lang === 'en' ? 'Total (kg)' : 'Igiteganyo'}</th>
                      <th>{lang === 'en' ? 'Grade' : 'Icyiciro'}</th>
                      <th>{lang === 'en' ? 'Date' : 'Itariki'}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedPreds.map((p, i) => (
                      <tr key={i} className="so-pred-tr" onClick={() => setSelectedPred && setSelectedPred(p)}>
                        <td>
                          <span className="so-crop-tag" style={{
                            background: { Maize: '#fef3c7', Rice: '#ccfbf1' }[p.crop_type || p.crop] || '#f1f5f9',
                            color: { Maize: '#92400e', Rice: '#0f766e' }[p.crop_type || p.crop] || '#334155'
                          }}>
                            {p.crop_type || p.crop}
                          </span>
                        </td>
                        <td className="so-td-muted">{p.season}</td>
                        <td className="so-td-yield">{parseFloat(p.yield_per_are_kg || 0).toFixed(1)}</td>
                        <td className="so-td-muted">{parseFloat(p.total_yield_kg || 0).toFixed(0)} kg</td>
                        <td>
                          {p.yield_grade && (
                            <span className="so-grade-badge" style={{ background: gradeBg(p.yield_grade), color: gradeColor(p.yield_grade) }}>
                              {p.yield_grade}
                            </span>
                          )}
                        </td>
                        <td className="so-td-muted">{fmtDate(p.created_at || p.timestamp)}</td>
                        <td><i className="bi bi-chevron-right" style={{ color: 'var(--s300)', fontSize: 12 }}></i></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                {predsHasMore && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button className="btn btn-small" onClick={() => fetchPredictions(predsPage + 1)} disabled={loadingPreds}>
                      {loadingPreds ? 'Loading…' : (lang === 'en' ? 'Load more' : 'Kwerekana ibindi')}
                    </button>
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {activeTab === 'advice' && (
        <div className="so-detail-section fade-up">
          {/* Alert banner if coming from underperforming */}
          {autoAdvice && (
            <div style={{ background:'linear-gradient(135deg,#fff5f5,#fee2e2)', border:'1.5px solid #fca5a5', borderRadius:14, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, background:'#dc2626', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color:'white', fontSize:16 }}></i>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:'#7f1d1d', marginBottom:2 }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 4 }}></i> {lang==='en'?'Underperforming Farm Alert':'Akarima Gafite Ikibazo'}
                </div>
                <div style={{ fontSize:12, color:'#991b1b' }}>
                  {lang==='en'?'Advice pre-filled based on yield gap. Review and send.':'Inama yuzurijwe bigendeye ku musaruro muke. Suzuma hanyuma uohereze.'}
                </div>
              </div>
            </div>
          )}
          <div className="so-advice-form-card">
            <div className="so-advice-form-header">
              <div className="so-advice-form-icon"><i className="bi bi-chat-dots-fill"></i></div>
              <div>
                <div className="so-advice-form-title">
                  {lang === 'en' ? `Send Advice to ${name.split(' ')[0]}` : `Ohereza Inama kuri ${name.split(' ')[0]}`}
                </div>
                <div className="so-advice-form-sub">
                  {lang === 'en' ? 'This message will be visible in the farmer\'s notifications' : 'Ubutumwa buzaboneka mu butumwa bw\'umuhinzi'}
                </div>
              </div>
            </div>

            {status && (
              <div className={`so-status-alert ${status.type}`}>
                <i className={`bi ${status.type === 'ok' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                {status.msg}
              </div>
            )}

            <div className="so-advice-type-row">
              {[
                { val: 'general', icon: 'bi-info-circle', label: lang === 'en' ? 'General' : 'Rusange' },
                { val: 'alert', icon: 'bi-exclamation-triangle', label: lang === 'en' ? 'Alert' : 'Impururu' },
                { val: 'recommendation', icon: 'bi-lightbulb', label: lang === 'en' ? 'Recommendation' : 'Inama' },
                { val: 'followup', icon: 'bi-arrow-repeat', label: lang === 'en' ? 'Follow-up' : 'Gukurikirana' },
              ].map(({ val, icon, label }) => (
                <button
                  key={val}
                  className={`so-advice-type-btn ${adviceType === val ? 'act' : ''}`}
                  onClick={() => setAdviceType(val)}
                >
                  <i className={`bi ${icon}`}></i> {label}
                </button>
              ))}
            </div>

            <div className="fgrp">
              <label className="flabel">{lang === 'en' ? 'Subject' : 'Insanganyamatsiko'}</label>
              <input
                className="finput"
                placeholder={lang === 'en' ? 'e.g. Fertilizer Application Reminder' : 'Urugero: Igihe cyo Gushyira Ifumbire'}
                value={adviceSubject}
                onChange={e => setAdviceSubject(e.target.value)}
              />
            </div>
            <div className="fgrp">
              <label className="flabel">{lang === 'en' ? 'Message' : 'Ubutumwa'}</label>
              <textarea
                className="finput"
                rows={5}
                style={{ resize: 'vertical' }}
                placeholder={lang === 'en'
                  ? 'Write your agricultural advice here. Be specific and actionable…'
                  : 'Andika inama yawe y\'ubuhinzi hano. Biba bisobanutse kandi bishoboka…'}
                value={adviceMsg}
                onChange={e => setAdviceMsg(e.target.value)}
              />
              <div style={{ fontSize: 11, color: 'var(--s400)', marginTop: 4 }}>
                {adviceMsg.length} {lang === 'en' ? 'characters' : 'inyuguti'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={handleSendAdvice}
                disabled={sending || !adviceMsg.trim()}
              >
                {sending
                  ? <><div className="spin" style={{ display: 'inline-block', marginRight: 8 }} /> {lang === 'en' ? 'Sending…' : 'Kohereza…'}</>
                  : <><i className="bi bi-send-fill"></i> {lang === 'en' ? 'Send Advice' : 'Ohereza Inama'}</>}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setAdviceMsg(''); setAdviceSubject(''); }}>
                {lang === 'en' ? 'Clear' : 'Siba'}
              </button>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="so-advice-templates">
            <div className="so-templates-title">{lang === 'en' ? 'Quick Templates' : 'Inyandiko Zihuse'}</div>
            <div className="so-templates-grid">
              {[
                {
                  icon: <i className="bi bi-flower1"></i>, title: lang === 'en' ? 'Planting Reminder' : 'Igihe cyo Gutera',
                  msg: lang === 'en'
                    ? 'Dear farmer, the optimal planting window for Season A is approaching. Ensure your seeds and fertilizer are ready. Apply DAP at 0.5 kg/are at planting time for best results.'
                    : 'Muhinzi wacu, igihe cyo gutera Season A kigeze. Menya ko imbuto n\'ifumbire byawe biri mwanya. Koresha DAP 0.5 kg/are igihe utera kugira ngo ubone umusaruro mwiza.'
                },
                {
                  icon: <i className="bi bi-droplet-fill"></i>, title: lang === 'en' ? 'Irrigation Alert' : 'Impururu yo Kuhira',
                  msg: lang === 'en'
                    ? 'Rainfall has been below average this week. If you have irrigation access, apply 4-6cm of water per week during the flowering stage to protect your yield.'
                    : 'Imvura yari munsi y\'impuzandengo iki cyumweru. Niba ufite uburyo bwo kuhira, koresha 4-6cm y\'amazi buri cyumweru mu gihe cy\'uburabyo kugira ngo wirinde igihombo.'
                },
                {
                  icon: <AlertTriangle size={20} color="#dc2626" />, title: lang === 'en' ? 'Pest Warning' : 'Impururu y\'Udukoko',
                  msg: lang === 'en'
                    ? 'Fall Armyworm has been reported in nearby farms. Scout your fields every 5 days and apply neem-based pesticide if infestation is detected. Contact the sector office for free pesticide support.'
                    : 'Udukoko tw\'Ingabo (Fall Armyworm) twabonwe mu masambu ari hafi. Genzura imirima yawe buri minsi 5 kandi ukoreshe pesticide ya neem niba ubonye udukoko. Baza ibiro by\'umurenge kugira ngo ubone pesticide ubuntu.'
                },
                {
                  icon: <Package size={20} color="#3b82f6" />, title: lang === 'en' ? 'Post-Harvest Storage' : 'Ububiko nyuma yo Gusarura',
                  msg: lang === 'en'
                    ? 'After harvest, dry your grain to below 13% moisture before storing. Use hermetic bags to prevent aflatoxin and pest damage. This protects your investment and allows you to sell at better prices later.'
                    : 'Nyuma yo gusarura, yubika imyaka munsi ya 13% y\'ubumidure mbere yo kuyibika. Koresha imifuko itinjiza umwuka kugira ngo wirinde aflatoxin n\'udukoko. Ibi birinda ishoramari ryawe kandi bigufasha kugurisha ku giciro cyiza nyuma.'
                },
              ].map((tpl, i) => (
                <button key={i} className="so-template-btn" onClick={() => { setAdviceMsg(tpl.msg); setActiveTab('advice'); }}>
                  <span className="so-template-icon">{tpl.icon}</span>
                  <span className="so-template-title">{tpl.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

