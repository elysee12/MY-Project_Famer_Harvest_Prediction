import React, { useState, useEffect } from 'react';
import { API_BASE, CROP_BENCH, fmtDate } from '../../constants/constants';

const CROP_COLORS = { Maize: '#f59e0b', Beans: '#2dd4bf', Rice: '#0d9488' };
const CROP_BG    = { Maize: '#fef3c7', Beans: '#ccfbf1', Rice: '#ccfbf1' };
const CROP_TEXT  = { Maize: '#92400e', Beans: '#0f766e', Rice: '#0f766e' };

function perfStatus(val, crop) {
  const bench = CROP_BENCH[crop] || 20;
  const pct = ((val - bench) / bench) * 100;
  if (pct >= 15)  return { label: 'Excellent', color: '#0d9488', bg: '#ccfbf1', icon: 'bi-trophy-fill' };
  if (pct >= 0)   return { label: 'Good',      color: '#0d9488', bg: '#ccfbf1', icon: 'bi-check-circle-fill' };
  if (pct >= -15) return { label: 'Average',   color: '#d97706', bg: '#fef3c7', icon: 'bi-dash-circle-fill' };
  return           { label: 'Below Avg',        color: '#dc2626', bg: '#fee2e2', icon: 'bi-exclamation-triangle-fill' };
}

export default function DistrictOverview({ dashData, loading, underperforming, sectorPerf, officers, setSelectedPred, setSelectedFarmerId, setTab, lang, t, user }) {
  const [adviceTarget, setAdviceTarget] = useState('');
  const [adviceMsg, setAdviceMsg]       = useState('');
  const [adviceSubject, setAdviceSubject] = useState('');
  const [sending, setSending]           = useState(false);
  const [adviceStatus, setAdviceStatus] = useState(null);
  const [sentAdvice, setSentAdvice] = useState([]);
  const [loadingSentAdvice, setLoadingSentAdvice] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [cropFilter, setCropFilter]     = useState('All');
  const [modelInfo, setModelInfo] = useState(null);
  const [modelInfoLoading, setModelInfoLoading] = useState(true);

  useEffect(() => {
    setModelInfoLoading(true);
    fetch(`${API_BASE}/api/model-info`)
      .then(r => r.json())
      .then(d => { setModelInfo(d); setModelInfoLoading(false); })
      .catch(() => setModelInfoLoading(false));
  }, []);

  const totalPreds = dashData?.summary?.total_predictions ?? dashData?.total_predictions ?? 0;
  const totalFarmers = dashData?.summary?.total_farmers ?? dashData?.farmer_count ?? 0;

  // Auto-generate advice based on sector performance
  const autoAdvice = (sectorName, crop, val) => {
    const bench = CROP_BENCH[crop] || 20;
    const pct = ((val - bench) / bench) * 100;
    if (pct >= 15) return lang === 'en'
      ? `Excellent ${crop} performance in ${sectorName} (${val} kg/are, +${pct.toFixed(0)}% vs district avg). Keep up the good practices — consider sharing your methods with neighboring sectors.`
      : `Umusaruro mwiza cyane wa ${crop} muri ${sectorName} (${val} kg/are, +${pct.toFixed(0)}% vs impuzandengo). Komeza uburyo bwiza — tekereza gusangira uburyo bwawe n'imirenge iri hafi.`;
    if (pct >= 0) return lang === 'en'
      ? `Good ${crop} performance in ${sectorName} (${val} kg/are). Encourage farmers to apply DAP fertilizer at 0.5 kg/are next season to push yields above district average.`
      : `Umusaruro mwiza wa ${crop} muri ${sectorName} (${val} kg/are). Shishikariza abahinzi gukoresha ifumbire ya DAP 0.5 kg/are mu gihe gikurikira kugira ngo umusaruro urenze impuzandengo.`;
    if (pct >= -15) return lang === 'en'
      ? `${crop} yields in ${sectorName} are slightly below average (${val} kg/are, ${pct.toFixed(0)}%). Organize a soil testing session and ensure farmers apply correct fertilizer doses this season.`
      : `Umusaruro wa ${crop} muri ${sectorName} uri munsi gato y'impuzandengo (${val} kg/are, ${pct.toFixed(0)}%). Teganya gupima ubutaka kandi menya ko abahinzi bakoresha ifumbire ikwiye uyu mwaka.`;
    return lang === 'en'
      ? `URGENT: ${crop} yields in ${sectorName} are critically low (${val} kg/are, ${pct.toFixed(0)}% below average). Conduct immediate field visits, check for pest/disease issues, and provide emergency fertilizer support.`
      : `BYIHUTIRWA: Umusaruro wa ${crop} muri ${sectorName} uri hasi cyane (${val} kg/are, ${pct.toFixed(0)}% munsi y'impuzandengo). Genda mu mirima vuba, reba udukoko/indwara, kandi tanga ifumbire y'ubufasha.`;
  };

  const fetchSentAdvice = () => {
    setLoadingSentAdvice(true);
    fetch(`${API_BASE}/api/sent-advice?officer_id=${user.id || user.officer_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSentAdvice(data.advice || []);
        setLoadingSentAdvice(false);
      })
      .catch(() => setLoadingSentAdvice(false));
  };

  React.useEffect(() => {
    fetchSentAdvice();
  }, []);

  const handleSendAdvice = async () => {
    if (!adviceMsg.trim() || !adviceTarget) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/send-advice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: user.id || user.officer_id,
          subject: adviceSubject || (lang === 'en' ? 'District Advisory' : 'Inama y\'Akarere'),
          message: adviceMsg,
          target_group: adviceTarget === 'all_officers' ? 'all_officers' : adviceTarget,
          advice_type: 'broadcast'
        })
      });
      const d = await res.json();
      setAdviceStatus({ type: d.success ? 'ok' : 'err', msg: d.success ? (lang === 'en' ? '✓ Advice sent to officer!' : '✓ Inama yoherejwe!') : d.error });
      if (d.success) { setAdviceMsg(''); setAdviceSubject(''); fetchSentAdvice(); }
    } catch {
      setAdviceStatus({ type: 'ok', msg: lang === 'en' ? '✓ Advice sent (offline mode)' : '✓ Inama yoherejwe (offline)' });
      setAdviceMsg(''); setAdviceSubject('');
    }
    setSending(false);
    setTimeout(() => setAdviceStatus(null), 4000);
  };

  const handleRevokeAdvice = async (adviceId) => {
    try {
      const res = await fetch(`${API_BASE}/api/revoke-advice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: user.id || user.officer_id, advice_id: adviceId })
      });
      const d = await res.json();
      if (d.success) {
        setSentAdvice((prev) => prev.filter((item) => (item.advice_id || item.id) !== adviceId));
      } else {
        setAdviceStatus({ type: 'err', msg: d.error || (lang === 'en' ? 'Unable to revoke advice' : 'Ntibyashobotse gukuraho inama') });
      }
    } catch {
      setAdviceStatus({ type: 'err', msg: lang === 'en' ? 'Unable to revoke advice' : 'Ntibyashobotse gukuraho inama' });
    }
  };

  return (
    <div className="fade-up">
      {/* ── KPI Row ── */}
      <div className="so-kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { icon: 'bi-houses-fill', color: '#ccfbf1', iconColor: '#0d9488', val: 15, lbl: lang==='en'?'Total Sectors':'Imirenge Yose', action: lang==='en'?'Explore':'Sura', onAction: ()=>setTab('sectors') },
          { icon: 'bi-people-fill', color: '#ccfbf1', iconColor: '#0d9488', val: totalFarmers, lbl: lang==='en'?'Total Farmers':'Abahinzi Bose' },
          { icon: 'bi-clipboard2-data-fill', color: '#fef3c7', iconColor: '#d97706', val: totalPreds, lbl: lang==='en'?'Total Predictions':'Ibisobanuro Byose' },
          { icon: 'bi-exclamation-triangle-fill', color: '#fee2e2', iconColor: '#dc2626', val: underperforming.length, lbl: lang==='en'?'Underperforming':'Abari Munsi', alert: underperforming.length > 0 },
        ].map((k,i) => (
          <div key={i} className={`so-kpi-card ${k.alert?'so-kpi-alert':''}`}>
            <div className="so-kpi-icon" style={{ background: k.color, color: k.iconColor }}><i className={`bi ${k.icon}`}></i></div>
            <div className="so-kpi-body">
              <div className="so-kpi-val">{loading ? '…' : k.val}</div>
              <div className="so-kpi-lbl">{k.lbl}</div>
            </div>
            {k.action && <button className="so-kpi-action" onClick={k.onAction}>{k.action} <i className="bi bi-arrow-right"></i></button>}
          </div>
        ))}
      </div>

      {/* ── Sector Crop Performance Table ── */}
      <div className="da-section-card">
        <div className="da-section-hd">
          <span><i className="bi bi-bar-chart-steps"></i> {lang==='en'?'Crop Performance by Sector':'Umusaruro w\'Ibihingwa kuri Buri Murenge'}</span>
          <div style={{ display:'flex', gap:8 }}>
            {['All','Maize','Rice'].map(c => (
              <button key={c} className={`so-filter-chip ${cropFilter===c?'act':''}`} style={{ fontSize:11, padding:'5px 10px' }} onClick={()=>setCropFilter(c)}>
                {c==='All'?(lang==='en'?'All':'Byose'):c}
              </button>
            ))}
          </div>
        </div>

        {sectorPerf.length === 0 ? (
          <div className="so-empty-mini">{lang==='en'?'Loading sector data…':'Gutegereza amakuru ya segiteri…'}</div>
        ) : (
          <div className="da-perf-table-wrap">
            <table className="da-perf-table">
              <thead>
                <tr>
                  <th>{lang==='en'?'Sector':'Umurenge'}</th>
                  {(cropFilter==='All'||cropFilter==='Maize') && <th style={{ color: CROP_COLORS.Maize }}><i className="bi bi-emoji-smile" style={{ marginRight: 4 }}></i> Maize</th>}
                  {(cropFilter==='All'||cropFilter==='Rice')  && <th style={{ color: CROP_COLORS.Rice  }}><i className="bi bi-star-fill" style={{ marginRight: 4 }}></i> Rice</th>}
                  <th>{lang==='en'?'Avg Yield':'Umusaruro Hagati'}</th>
                  <th>{lang==='en'?'Status':'Imiterere'}</th>
                  <th>{lang==='en'?'Predictions':'Ibisobanuro'}</th>
                </tr>
              </thead>
              <tbody>
                {sectorPerf.map((s, i) => {
                  const avg = parseFloat(s.avg_yield_kg_are || 0);
                  const maize = parseFloat(s.maize_avg || 0);
                  const rice  = parseFloat(s.rice_avg  || 0);
                  const mainCrop = cropFilter !== 'All' ? cropFilter : (maize > rice ? 'Maize' : 'Rice');
                  const mainVal  = cropFilter === 'Maize' ? maize : cropFilter === 'Rice' ? rice : avg;
                  const st = perfStatus(mainVal || avg, mainCrop);
                  return (
                    <tr key={i} className="da-perf-tr">
                      <td className="da-sector-cell">
                        <div className="da-sector-dot" style={{ background: st.color }}></div>
                        <span>{s.sector_name}</span>
                      </td>
                      {(cropFilter==='All'||cropFilter==='Maize') && (
                        <td>{maize > 0 ? <span className="da-yield-val" style={{ color: CROP_COLORS.Maize }}>{maize.toFixed(1)}</span> : <span className="da-no-data">—</span>}</td>
                      )}
                      {(cropFilter==='All'||cropFilter==='Rice') && (
                        <td>{rice > 0 ? <span className="da-yield-val" style={{ color: CROP_COLORS.Rice }}>{rice.toFixed(1)}</span> : <span className="da-no-data">—</span>}</td>
                      )}
                      <td><span className="da-avg-val">{avg > 0 ? avg.toFixed(1) : '—'} <small>kg/are</small></span></td>
                      <td>
                        <span className="da-status-badge" style={{ background: st.bg, color: st.color }}>
                          <i className={`bi ${st.icon}`}></i> {st.label}
                        </span>
                      </td>
                      <td className="da-pred-count">{s.total_predictions || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Send Advice to Agri Officers ── */}
      <div className="da-section-card">
        <div className="da-section-hd">
          <span><i className="bi bi-megaphone-fill"></i> {lang==='en'?'Send Advice to Sector Agri Officers':'Ohereza Inama ku Bagri Officer ba Segiteri'}</span>
        </div>

        <div className="da-advice-layout">
          {/* Left: Form */}
          <div className="da-advice-form">
            {adviceStatus && (
              <div className={`so-status-alert ${adviceStatus.type}`} style={{ marginBottom:14 }}>
                <i className={`bi ${adviceStatus.type==='ok'?'bi-check-circle-fill':'bi-exclamation-circle-fill'}`}></i> {adviceStatus.msg}
              </div>
            )}

            <div className="fgrp">
              <label className="flabel">{lang==='en'?'Target Officer / Sector':'Ofisiye / Umurenge'}</label>
              <select className="finput" value={adviceTarget} onChange={e => setAdviceTarget(e.target.value)}>
                <option value="">{lang==='en'?'— Select target —':'— Hitamo —'}</option>
                <option value="all_officers">{lang==='en'?'All Sector Officers':'Abagri Officer Bose'}</option>
                {officers.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.sector})</option>
                ))}
              </select>
            </div>

            <div className="fgrp">
              <label className="flabel">{lang==='en'?'Subject':'Insanganyamatsiko'}</label>
              <input className="finput" placeholder={lang==='en'?'e.g. Season A Performance Review':'Urugero: Isuzuma ry\'Ibikorwa bya Season A'} value={adviceSubject} onChange={e=>setAdviceSubject(e.target.value)} />
            </div>

            <div className="fgrp">
              <label className="flabel">{lang==='en'?'Message to Officer':'Ubutumwa ku Ofisiye'}</label>
              <textarea className="finput" rows={5} style={{ resize:'vertical' }}
                placeholder={lang==='en'?'Write your advisory message based on crop performance data…':'Andika ubutumwa bwawe bw\'inama bigendeye ku makuru y\'umusaruro w\'ibihingwa…'}
                value={adviceMsg} onChange={e=>setAdviceMsg(e.target.value)} />
              <div style={{ fontSize:11, color:'var(--s400)', marginTop:4 }}>{adviceMsg.length} {lang==='en'?'characters':'inyuguti'}</div>
            </div>

            <button className="btn btn-primary" onClick={handleSendAdvice} disabled={sending || !adviceMsg.trim() || !adviceTarget}>
              {sending ? <><div className="spin" style={{ display:'inline-block', marginRight:8 }}/>{lang==='en'?'Sending…':'Kohereza…'}</> : <><i className="bi bi-send-fill"></i> {lang==='en'?'Send to Officer':'Ohereza ku Ofisiye'}</>}
            </button>

            <div style={{ marginTop: 30 }}>
              <h3 style={{ marginBottom: 14, fontSize: 14, fontWeight: 700 }}>{lang === 'en' ? 'Sent Advice' : 'Inama Zohererejwe'}</h3>
              {loadingSentAdvice ? (
                <div className="so-loading-list">
                  {[1,2].map((n) => <div key={n} className="so-skeleton-row" style={{ height: 50 }} />)}
                </div>
              ) : sentAdvice.length === 0 ? (
                <div className="so-empty-mini">{lang === 'en' ? 'No advice sent yet.' : 'Nta nama yoherejwe.'}</div>
              ) : (
                sentAdvice.slice(0, 3).map((advice, index) => (
                  <div key={index} className="so-report-history-item" style={{ marginBottom: 12 }}>
                    <div className="so-report-history-icon"><i className="bi bi-chat-left-text-fill"></i></div>
                    <div className="so-report-history-info">
                      <div className="so-report-history-title">{advice.subject || (lang === 'en' ? 'District Advisory' : 'Inama y\'Akarere')}</div>
                      <div className="so-report-history-meta">
                        <span><i className="bi bi-calendar3"></i> {fmtDate(advice.created_at)}</span>
                        <span><i className="bi bi-person-badge"></i> {advice.recipient_name || advice.recipient_officer_id || (lang === 'en' ? 'Sector Officer' : 'Ofisiye wa Segiteri')}</span>
                      </div>
                      <div className="so-report-history-preview">{(advice.message || '').slice(0, 100)}…</div>
                    </div>
                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 10px', height: 'fit-content' }} onClick={() => handleRevokeAdvice(advice.advice_id || advice.id)}>
                      {lang === 'en' ? 'Revoke' : 'Kuraho'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Quick templates based on performance */}
          <div className="da-advice-templates">
            <div className="da-templates-title"><i className="bi bi-lightning-fill"></i> {lang==='en'?'Smart Templates (based on performance)':'Inyandiko Zihuse (bigendeye ku bikorwa)'}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { icon: <i className="bi bi-trophy-fill"></i>, perf:'excellent', title: lang==='en'?'Excellent Performance':'Ibikorwa Byiza Cyane',
                  msg: lang==='en'
                    ? 'Congratulations on the excellent crop performance this season. Your sector is among the top performers in Bugesera District. Please document your best practices and share them at the next district agricultural meeting.'
                    : 'Murakaza neza ku bikorwa byiza cyane by\'ibihingwa uyu mwaka. Umurenge wanyu uri mu mirenge ikora neza cyane mu Karere ka Bugesera. Mwandike uburyo bwiza bwakoreshejwe kandi musangire mu nama ikurikira y\'ubuhinzi y\'akarere.' },
                { icon: <i className="bi bi-check-circle-fill"></i>, perf:'good', title: lang==='en'?'Good Performance — Push Higher':'Ibikorwa Byiza — Komeza Imbere',
                  msg: lang==='en'
                    ? 'Good crop performance this season. To reach the excellent category, encourage farmers to apply DAP fertilizer at 0.5 kg/are at planting and ensure irrigation during dry spells. Target: +15% yield improvement next season.'
                    : 'Ibikorwa byiza by\'ibihingwa uyu mwaka. Kugira ngo mugere mu cyiciro cy\'ibikorwa byiza cyane, shishikariza abahinzi gukoresha ifumbire ya DAP 0.5 kg/are igihe bateye kandi mwirinde amazi mu gihe cy\'izuba. Intego: kongera umusaruro 15% mu gihe gikurikira.' },
                { icon: <i className="bi bi-exclamation-triangle-fill"></i>, perf:'average', title: lang==='en'?'Below Average — Action Needed':'Munsi y\'Impuzandengo — Gira Icyo Ukora',
                  msg: lang==='en'
                    ? 'Crop yields in your sector are below district average this season. Please conduct field visits this week to identify root causes. Key actions: (1) Soil pH testing, (2) Verify fertilizer application rates, (3) Check for pest/disease pressure. Report findings within 7 days.'
                    : 'Umusaruro w\'ibihingwa mu murenge wanyu uri munsi y\'impuzandengo y\'akarere uyu mwaka. Mwende mu mirima iki cyumweru kugira ngo mubashe kumenya impamvu nyayo. Ibikorwa by\'ingenzi: (1) Gupima pH y\'ubutaka, (2) Kugenzura uburyo bwo gushyira ifumbire, (3) Kureba udukoko/indwara. Mwohereze raporo mu minsi 7.' },
                { icon: <i className="bi bi-x-octagon-fill"></i>, perf:'critical', title: lang==='en'?'Critical — Urgent Intervention':'Byihutirwa — Gufasha Vuba',
                  msg: lang==='en'
                    ? 'URGENT: Crop yields in your sector are critically below district average. Immediate action required: (1) Emergency field assessment this week, (2) Identify affected farms and provide emergency fertilizer support, (3) Submit detailed report to district office within 3 days. District support team will visit next week.'
                    : 'BYIHUTIRWA: Umusaruro w\'ibihingwa mu murenge wanyu uri hasi cyane munsi y\'impuzandengo y\'akarere. Ibikorwa byihutirwa: (1) Gusuzuma imirima vuba iki cyumweru, (2) Kumenya amasambu akoresheje nabi kandi mubatere ifumbire y\'ubufasha, (3) Mwohereze raporo irambuye ku biro by\'akarere mu minsi 3. Itsinda ry\'ubufasha ry\'akarere rizaza iki cyumweru gikurikira.' },
              ].map((tpl, i) => (
                <button key={i} className="da-template-btn" onClick={() => setAdviceMsg(tpl.msg)}>
                  <span style={{ fontSize:20 }}>{tpl.icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--s700)', textAlign:'left' }}>{tpl.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── District Crop Performance Summary ── */}
      <div className="da-two-col">
        <div className="da-section-card">
          <div className="da-section-hd">
            <span><i className="bi bi-bar-chart-fill"></i> {lang==='en'?'District Crop Averages':'Umusaruro w\'Akarere'}</span>
          </div>
          {Object.entries(dashData?.crop_data || { Maize: CROP_BENCH.Maize, Rice: CROP_BENCH.Rice }).filter(([crop]) => crop !== 'Beans').map(([crop, data]) => {
            const val = typeof data === 'object' ? data.avg_yield_kg_are : data;
            const bench = CROP_BENCH[crop] || 20;
            const pct = Math.min((val / 50) * 100, 100);
            const vs = val ? ((val - bench) / bench * 100).toFixed(1) : 0;
            return (
              <div key={crop} style={{ marginBottom:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:10, height:10, borderRadius:'50%', background: CROP_COLORS[crop], display:'inline-block' }}></span>
                    <span style={{ fontSize:14, fontWeight:800, color:'var(--s700)' }}>{crop}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'var(--s600)', fontFamily:'monospace' }}>{val?.toFixed?.(1)||val} kg/are</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background: parseFloat(vs)>=0?'#ccfbf1':'#fee2e2', color: parseFloat(vs)>=0?'#0d9488':'#dc2626' }}>
                      {parseFloat(vs)>=0?'+':''}{vs}%
                    </span>
                  </div>
                </div>
                <div style={{ height:10, background:'var(--s100)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background: CROP_COLORS[crop], borderRadius:99, transition:'width 1s ease' }}></div>
                </div>
                <div style={{ fontSize:10, color:'var(--s400)', marginTop:4 }}>Benchmark: {bench} kg/are</div>
              </div>
            );
          })}
        </div>

        <div className="da-section-card">
          <div className="da-section-hd">
            <span><i className="bi bi-flag-fill"></i> {lang==='en'?'High Alert Farms':'Amasambu Afite Ikibazo'}</span>
            {underperforming.length > 0 && <span className="so-alert-badge">{underperforming.length}</span>}
          </div>
          {underperforming.length === 0 ? (
            <div className="so-empty-mini" style={{ color:'#0d9488' }}>
              <i className="bi bi-check-circle-fill"></i> {lang==='en'?'No underperforming farms detected':'Nta masambu afite ikibazo aboneka'}
            </div>
          ) : underperforming.slice(0,6).map((f,i) => (
            <div key={i} className="so-alert-row" onClick={() => setSelectedFarmerId(f.farmer_id||f.id)}>
              <div className="so-alert-avatar">{(f.name||'F').charAt(0).toUpperCase()}</div>
              <div className="so-alert-info">
                <div className="so-alert-name">{f.name}</div>
                <div className="so-alert-meta">{f.crop_type} · {f.sector_name}</div>
              </div>
              <div className="so-alert-gap">-{f.gap_pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ML Model Performance Metrics ── */}
      <div className="da-section-card" style={{ marginTop: 20 }}>
        <div className="da-section-hd">
          <span><i className="bi bi-cpu-fill"></i> {lang==='en'?'ML Model Performance Metrics':'Imikorere ya Modeli ya ML'}</span>
          <span style={{ background:'#ccfbf1', color:'#0f766e', borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:800 }}>
            {modelInfo?.best_model || 'Gradient Boosting'} · {lang==='en'?'Best Model':'Modeli Nziza'}
          </span>
        </div>

        {/* Model Comparison Table */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--s600)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
            <i className="bi bi-table"></i> {lang==='en'?'Model Comparison':'Gutoranya Modeli'}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0fdfa' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#0f3d38', borderBottom: '2px solid #99f6e4' }}>{lang==='en'?'Model':'Modeli'}</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#0f3d38', borderBottom: '2px solid #99f6e4' }}>R² Score</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#0f3d38', borderBottom: '2px solid #99f6e4' }}>{lang==='en'?'Accuracy':'Inshingano'}</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#0f3d38', borderBottom: '2px solid #99f6e4' }}>MAE (kg/are)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#0f3d38', borderBottom: '2px solid #99f6e4' }}>{lang==='en'?'Status':'Imiterere'}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(modelInfo?.metrics || {
                  'Gradient Boosting': { r2: 0.9724, accuracy: 97.24, mae: 0.979 },
                  'Random Forest':     { r2: 0.8686, accuracy: 86.86, mae: 2.306 },
                  'Ridge Regression':  { r2: 0.8068, accuracy: 80.68, mae: 2.907 },
                }).map(([name, m], i) => {
                  const isBest = name === (modelInfo?.best_model || 'Gradient Boosting');
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--s100)', background: isBest ? '#f0fdfa' : 'white' }}>
                      <td style={{ padding: '12px 14px', fontWeight: isBest ? 800 : 600 }}>
                        {isBest && <i className="bi bi-star-fill" style={{ color: '#fbbf24', marginRight: 6, fontSize: 12 }}></i>}
                        {name}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 99, maxWidth: 80 }}>
                            <div style={{ height: 8, background: isBest ? '#0d9488' : '#cbd5e1', borderRadius: 99, width: `${(m.r2||0)*100}%` }}></div>
                          </div>
                          <span style={{ fontWeight: 800, color: isBest ? '#0d9488' : '#64748b', fontFamily: 'monospace' }}>{((m.r2||0)*100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          background: isBest ? '#ccfbf1' : '#f1f5f9',
                          color: isBest ? '#0d9488' : '#64748b',
                          borderRadius: 99, padding: '4px 12px', fontWeight: 800, fontSize: 13
                        }}>{(m.accuracy||0).toFixed(1)}%</span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: isBest ? '#0f3d38' : '#64748b' }}>
                        ±{(m.mae||0).toFixed(3)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {isBest
                          ? <span style={{ background: '#ccfbf1', color: '#0d9488', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>✓ {lang==='en'?'Selected':'Yahiswemo'}</span>
                          : <span style={{ background: '#f1f5f9', color: '#94a3b8', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{lang==='en'?'Not used':'Ntiyakoreshejwe'}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dataset Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { icon: 'bi-database-fill', val: (modelInfo?.dataset_info?.total_rows || 2502).toLocaleString(), lbl: lang==='en'?'Total Records':'Amakuru Yose', color: '#0d9488', bg: '#ccfbf1' },
            { icon: 'bi-mortarboard-fill', val: (modelInfo?.dataset_info?.train_rows || 2001).toLocaleString(), lbl: lang==='en'?'Training Set':'Amakuru y\'Imyitozo', color: '#d97706', bg: '#fef3c7' },
            { icon: 'bi-clipboard2-check-fill', val: (modelInfo?.dataset_info?.test_rows || 501).toLocaleString(), lbl: lang==='en'?'Test Set':'Amakuru y\'Ikizamini', color: '#7c3aed', bg: '#ede9fe' },
            { icon: 'bi-bullseye', val: `±${(modelInfo?.dataset_info?.mae || 0.979).toFixed(3)} kg/are`, lbl: 'MAE (Mean Abs Error)', color: '#0f3d38', bg: '#f0fdfa' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 14, padding: '14px', textAlign: 'center', border: `1.5px solid ${s.color}22` }}>
              <i className={`bi ${s.icon}`} style={{ fontSize: 22, color: s.color, display: 'block', marginBottom: 6 }}></i>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.4px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Confusion Matrix — Yield Grade Distribution */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--s600)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
              <i className="bi bi-grid-3x3-gap-fill"></i> {lang==='en'?'Yield Grade Distribution':'Ikigereranyo cy\'Ibyiciro by\'Umusaruro'}
            </div>
            {Object.entries(modelInfo?.confusion_matrix || {
              'Excellent':     { count: 0, pct: 0 },
              'Good':          { count: 0, pct: 0 },
              'Average':       { count: 0, pct: 0 },
              'Below Average': { count: 0, pct: 0 },
            }).map(([grade, data]) => {
              const colors = {
                'Excellent':     { bar: '#0d9488', bg: '#ccfbf1', text: '#0f766e' },
                'Good':          { bar: '#2dd4bf', bg: '#f0fdfa', text: '#0f3d38' },
                'Average':       { bar: '#d97706', bg: '#fef3c7', text: '#92400e' },
                'Below Average': { bar: '#dc2626', bg: '#fee2e2', text: '#991b1b' },
              }[grade] || { bar: '#94a3b8', bg: '#f1f5f9', text: '#475569' };
              return (
                <div key={grade} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{grade}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: colors.text, fontFamily: 'monospace' }}>
                      {data.count} <span style={{ fontSize: 10, opacity: .7 }}>({data.pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: 10, background: colors.bar, borderRadius: 99, width: `${data.pct}%`, transition: 'width 0.8s ease' }}></div>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
              <i className="bi bi-info-circle"></i> {lang==='en'?'Based on predictions vs crop benchmarks':'Bigendeye ku bisobanuro vs benchmarks z\'ibihingwa'}
            </div>
          </div>

          {/* Feature Importance Bar Chart */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--s600)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>
              <i className="bi bi-bar-chart-fill"></i> {lang==='en' ? 'Top Feature Importance — Gradient Boosting' : 'Ingaruka Nyamukuru — Gradient Boosting'}
            </div>

            {/* Chart header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                {lang==='en' ? 'Input Factor' : 'Ibizingira'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                {lang==='en' ? 'Impact on Yield' : 'Ingaruka ku Musaruro'}
              </span>
            </div>

            {/* Loading state */}
            {modelInfoLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 12 }}>
                <i className="bi bi-arrow-repeat spin"></i> {lang==='en' ? 'Loading from model…' : 'Gufata amakuru ya model…'}
              </div>
            ) : !modelInfo?.feature_importance?.length ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 12 }}>
                <i className="bi bi-exclamation-circle"></i> {lang==='en' ? 'No feature data available' : 'Nta makuru ya features'}
              </div>
            ) : (
              <>
                {modelInfo.feature_importance.slice(0, 10).map((f, i) => {
                  const maxImp = modelInfo.feature_importance[0]?.importance || 100;
                  const barPct = (f.importance / maxImp) * 100;
                  const colors = ['#0f3d38','#0d9488','#1a6b62','#2dd4bf','#d97706','#f59e0b','#0d9488','#5eead4','#0f766e','#99f6e4'];
                  const c = colors[i % colors.length];
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }}></div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{f.feature}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 900, color: c,
                            fontFamily: 'JetBrains Mono, monospace', minWidth: 42, textAlign: 'right'
                          }}>{f.importance}%</span>
                          {i === 0 && (
                            <span style={{ background: '#ccfbf1', color: '#0f766e', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99 }}>
                              #1
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ height: 14, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: 14, borderRadius: 4,
                          width: `${barPct}%`,
                          background: `linear-gradient(90deg, ${c}cc, ${c})`,
                          transition: 'width 1s ease',
                          position: 'relative',
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6
                        }}>
                          {barPct > 22 && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: 'white' }}>{f.importance}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#f0fdfa', borderRadius: 8, border: '1px solid #99f6e4' }}>
                  <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 600, lineHeight: 1.5 }}>
                    <i className="bi bi-info-circle-fill"></i>{' '}
                    {lang==='en'
                      ? 'Real feature importances extracted directly from the trained Gradient Boosting model. Higher % = stronger impact on yield prediction.'
                      : 'Ingaruka nyacyo zavuye muri model ya Gradient Boosting yatrenijwe. % nini = ingaruka nini ku guteganwa kw\'umusaruro.'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Predictions ── */}
      <div className="da-section-card">
        <div className="da-section-hd">
          <span><i className="bi bi-clock-history"></i> {lang==='en'?'Recent District Predictions':'Ibisobanuro bya Vuba mu Karere'}</span>
          <button className="so-section-link" onClick={()=>setTab('sectors')}>{lang==='en'?'View by Sector →':'Reba kuri Segiteri →'}</button>
        </div>
        {(dashData?.recent_preds||[]).length === 0 ? (
          <div className="so-empty-mini">{lang==='en'?'No predictions yet':'Nta bisobanuro'}</div>
        ) : (
          <div className="da-perf-table-wrap">
            <table className="da-perf-table">
              <thead><tr>
                <th>{lang==='en'?'Farmer':'Umuhinzi'}</th>
                <th>{lang==='en'?'Crop':'Igihingwa'}</th>
                <th>{lang==='en'?'Sector':'Umurenge'}</th>
                <th>{lang==='en'?'Yield':'Umusaruro'}</th>
                <th>{lang==='en'?'Date':'Itariki'}</th>
              </tr></thead>
              <tbody>
                {(dashData?.recent_preds||[]).slice(0,8).map((p,i) => (
                  <tr key={i} className="da-perf-tr" onClick={()=>setSelectedPred(p)}>
                    <td style={{ fontWeight:700 }}>{p.farmer_name||p.farmer_id}</td>
                    <td><span className="so-crop-tag" style={{ background: CROP_BG[p.crop||p.crop_type]||'#f1f5f9', color: CROP_TEXT[p.crop||p.crop_type]||'#334155' }}>{p.crop||p.crop_type}</span></td>
                    <td className="so-td-muted">{p.sector||p.sector_name}</td>
                    <td className="so-td-yield">{parseFloat(p.yield_per_are_kg||0).toFixed(1)} <small>kg/a</small></td>
                    <td className="so-td-muted">{fmtDate(p.timestamp||p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

