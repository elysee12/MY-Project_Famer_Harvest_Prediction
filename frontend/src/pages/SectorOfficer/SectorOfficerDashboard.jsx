import React, { useState, useEffect } from 'react';
import { T, SECTORS, API_BASE, CROP_BENCH, fmtDate } from '../../constants/constants';
import Sidebar from '../../components/Common/Sidebar';
import Topbar from '../../components/Common/Topbar';
import SectorFarmers from './SectorFarmers';
import SectorReports from './SectorReports';
import FarmerDetailView from './FarmerDetailView';
import PredictionDetailView from './PredictionDetailView';
import ActivityAnalytics from './ActivityAnalytics';

export default function SectorOfficerDashboard({ user, onLogout, lang, setLang }) {
  const t = T[lang];
  const [tab, setTab] = useState("overview");
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [selectedPred, setSelectedPred] = useState(null);
  const [underperforming, setUnderperforming] = useState([]);
  const [autoAdvice, setAutoAdvice] = useState(null);
  const [officerMessages, setOfficerMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0); // { farmerId, msg }

  const sectorName = user.sector || "Gashora";
  const sectorId = user.sector_id || (SECTORS.indexOf(sectorName) + 1);

  const fetchDashboard = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/officer-dashboard?sector=${encodeURIComponent(sectorName)}`)
      .then(r => r.json())
      .then(d => { setDashData(d); setLoading(false); })
      .catch(() => {
        setLoading(false);
        setDashData({
          farmer_count: 8,
          crop_data: { Maize: { avg_yield_kg_are: 23.4 }, Rice: { avg_yield_kg_are: 35.8 } },
          recent_preds: [],
          seasons: [{ season: "Season A", avg_yield: 22.8, count: 5 }, { season: "Season B", avg_yield: 21.2, count: 3 }]
        });
      });
  };

  const fetchUnderperforming = () => {
    fetch(`${API_BASE}/api/officer/underperforming-farms?sector_id=${sectorId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setUnderperforming(d.farms || []); })
      .catch(() => setUnderperforming([]));
  };

  const fetchOfficerMessages = () => {
    const oid = user.id || user.officer_id;
    fetch(`${API_BASE}/api/officer-notifications/${oid}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setOfficerMessages(d.messages || []);
          setUnreadMessages(d.messages?.length || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDashboard();
    fetchUnderperforming();
    fetchOfficerMessages();
  }, [sectorName]);

  const totalPreds = dashData?.total_predictions || dashData?.all_predictions?.length || dashData?.recent_preds?.length || 0;
  const avgYield = dashData?.crop_data
    ? (() => {
        const vals = Object.values(dashData.crop_data).map(v => typeof v === 'object' ? v.avg_yield_kg_are : v).filter(Boolean);
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
      })()
    : '—';

  const renderOverview = () => (
    <div className="fade-up">
      {/* KPI Cards */}
      <div className="so-kpi-grid">
        {[
          {
            icon: 'bi-people-fill', color: '#ccfbf1', iconColor: '#0d9488',
            val: dashData?.farmer_count || 0, lbl: lang === 'en' ? 'Sector Farmers' : 'Abahinzi ba Segiteri',
            action: lang === 'en' ? 'View All' : 'Reba Bose', onAction: () => setTab('farmers')
          },
          {
            icon: 'bi-graph-up-arrow', color: '#fef3c7', iconColor: '#d97706',
            val: `${avgYield}`, unit: 'kg/are', lbl: lang === 'en' ? 'Avg Yield' : 'Umusaruro Hagati'
          },
          {
            icon: 'bi-clipboard2-data-fill', color: '#ccfbf1', iconColor: '#0d9488',
            val: totalPreds, lbl: lang === 'en' ? 'Total Predictions' : 'Ibisobanuro Byose',
            action: lang === 'en' ? 'View' : 'Reba', onAction: () => setTab('predictions')
          },
          {
            icon: 'bi-exclamation-triangle-fill', color: '#fee2e2', iconColor: '#dc2626',
            val: underperforming.length, lbl: lang === 'en' ? 'Underperforming' : 'Abari Munsi',
            alert: underperforming.length > 0
          }
        ].map((k, i) => (
          <div key={i} className={`so-kpi-card ${k.alert ? 'so-kpi-alert' : ''}`}>
            <div className="so-kpi-icon" style={{ background: k.color, color: k.iconColor }}>
              <i className={`bi ${k.icon}`}></i>
            </div>
            <div className="so-kpi-body">
              <div className="so-kpi-val">
                {loading ? <span className="so-skeleton" style={{ width: 60 }} /> : k.val}
                {k.unit && <small> {k.unit}</small>}
              </div>
              <div className="so-kpi-lbl">{k.lbl}</div>
            </div>
            {k.action && (
              <button className="so-kpi-action" onClick={k.onAction}>
                {k.action} <i className="bi bi-arrow-right"></i>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="so-two-col">
        {/* Left column */}
        <div>
          {/* Crop Performance */}
          <div className="so-section-card">
            <div className="so-section-hd">
              <span><i className="bi bi-bar-chart-fill"></i> {lang === 'en' ? 'Crop Performance' : 'Umusaruro w\'Ibihingwa'}</span>
            </div>
            <div className="so-crop-bars">
              {Object.entries(dashData?.crop_data || CROP_BENCH).map(([crop, data]) => {
                const val = typeof data === 'object' ? data.avg_yield_kg_are : data;
                const bench = CROP_BENCH[crop] || 20;
                const pct = Math.min((val / 50) * 100, 100);
                const vs = val ? ((val - bench) / bench * 100).toFixed(1) : 0;
                const col = { Maize: '#f59e0b', Rice: '#0d9488' }[crop] || '#0d9488';
                return (
                  <div key={crop} className="so-crop-bar-row">
                    <div className="so-crop-bar-top">
                      <div className="so-crop-bar-name">
                        <span className="so-crop-dot" style={{ background: col }}></span>
                        {crop}
                      </div>
                      <div className="so-crop-bar-vals">
                        <span className="so-crop-yield">{val?.toFixed?.(1) || val} kg/are</span>
                        <span className={`so-crop-vs ${parseFloat(vs) >= 0 ? 'pos' : 'neg'}`}>
                          {parseFloat(vs) >= 0 ? '+' : ''}{vs}% vs avg
                        </span>
                      </div>
                    </div>
                    <div className="so-bar-track">
                      <div className="so-bar-fill" style={{ width: `${pct}%`, background: col }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Season Performance */}
          <div className="so-section-card">
            <div className="so-section-hd">
              <span><i className="bi bi-calendar-check-fill"></i> {t.seasonPerf}</span>
            </div>
            {dashData?.seasons?.length ? dashData.seasons.map((s, i) => (
              <div key={i} className="so-season-row">
                <div className="so-season-icon"><i className="bi bi-sun"></i></div>
                <div className="so-season-info">
                  <div className="so-season-name">{s.season}</div>
                  <div className="so-season-meta">{s.count} {lang === 'en' ? 'predictions' : 'ibisobanuro'}</div>
                </div>
                <div className="so-season-yield">{s.avg_yield} <small>kg/are</small></div>
              </div>
            )) : (
              <div className="so-empty-mini">{lang === 'en' ? 'No season data yet' : 'Nta makuru y\'ibihe'}</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Recent Predictions */}
          <div className="so-section-card">
            <div className="so-section-hd">
              <span><i className="bi bi-clock-history"></i> {lang === 'en' ? 'Recent Predictions' : 'Ibisobanuro bya Vuba'}</span>
              <button className="so-section-link" onClick={() => setTab('predictions')}>
                {lang === 'en' ? 'View All' : 'Reba Bose'} →
              </button>
            </div>
            {loading ? (
              <div className="so-loading-list">
                {[1,2,3].map(i => <div key={i} className="so-skeleton-row" />)}
              </div>
            ) : (dashData?.recent_preds || dashData?.all_predictions || []).slice(0, 5).length === 0 ? (
              <div className="so-empty-mini">{lang === 'en' ? 'No predictions yet' : 'Nta bisobanuro'}</div>
            ) : (
              (dashData?.recent_preds || dashData?.all_predictions || []).slice(0, 5).map((p, i) => (
                <div key={i} className="so-pred-row" onClick={() => setSelectedPred(p)}>
                  <div className="so-pred-icon">
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                  <div className="so-pred-info">
                    <div className="so-pred-name">{p.farmer_name || p.farmer_id} · <span style={{ color: 'var(--g700)' }}>{p.crop || p.crop_type}</span></div>
                    <div className="so-pred-date">{fmtDate(p.timestamp || p.created_at)}</div>
                  </div>
                  <div className="so-pred-yield">{parseFloat(p.yield_per_are_kg || 0).toFixed(1)} <small>kg/a</small></div>
                  <i className="bi bi-chevron-right so-pred-arrow"></i>
                </div>
              ))
            )}
          </div>

          {/* High Alert Farms */}
          {underperforming.length > 0 && (
            <div className="so-section-card so-alert-card">
              <div className="so-section-hd" style={{ color: '#dc2626' }}>
                <span><i className="bi bi-flag-fill"></i> {lang === 'en' ? 'High Alert Farms' : 'Amasambu Afite Ikibazo'}</span>
                <span className="so-alert-badge">{underperforming.length}</span>
              </div>
              {underperforming.slice(0, 4).map((f, i) => (
                <div key={i} className="so-alert-row" onClick={() => {
                  const msg = lang === 'en'
                    ? `Dear ${f.name?.split(' ')[0] || 'Farmer'}, your ${f.crop_type} yield was ${f.gap_pct}% below the predicted target. Please contact the sector office for support on soil management and fertilizer application to improve your next harvest.`
                    : `Muhinzi wacu ${f.name?.split(' ')[0] || ''}, umusaruro wawe wa ${f.crop_type} wari munsi ya ${f.gap_pct}% y'intego yateganyijwe. Baza ibiro by'umurenge kugira ngo ubone ubufasha ku gucunga ubutaka no gukoresha ifumbire neza mu gihe gikurikira.`;
                  setAutoAdvice({ farmerId: f.farmer_id || f.id, msg });
                  setSelectedFarmerId(f.farmer_id || f.id);
                }}>
                  <div className="so-alert-avatar">{(f.name || 'F').charAt(0).toUpperCase()}</div>
                  <div className="so-alert-info">
                    <div className="so-alert-name">{f.name}</div>
                    <div className="so-alert-meta">{f.crop_type} · {f.sector_name}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div className="so-alert-gap">-{f.gap_pct}%</div>
                    <div style={{ background:'#dc2626', color:'white', borderRadius:99, padding:'4px 10px', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                      <i className="bi bi-chat-dots-fill"></i> {lang==='en'?'Advise':'Inama'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (selectedPred) {
      return (
        <PredictionDetailView
          prediction={selectedPred}
          onBack={() => setSelectedPred(null)}
          lang={lang}
          user={user}
          onUpdate={(updated) => setSelectedPred(updated)}
        />
      );
    }
    if (selectedFarmerId) {
      return (
        <FarmerDetailView
          farmerId={selectedFarmerId}
          onBack={() => { setSelectedFarmerId(null); setAutoAdvice(null); }}
          lang={lang}
          setLang={setLang}
          setSelectedPred={setSelectedPred}
          officer={user}
          autoAdvice={autoAdvice}
          onAdviceUsed={() => setAutoAdvice(null)}
        />
      );
    }
    switch (tab) {
      case 'overview': return renderOverview();
      case 'farmers':
        return (
          <SectorFarmers
            sectorName={sectorName}
            sectorId={sectorId}
            setSelectedFarmerId={setSelectedFarmerId}
            lang={lang}
          />
        );
      case 'predictions':
        return (
          <SectorPredictionsList
            sectorName={sectorName}
            sectorId={sectorId}
            setSelectedPred={setSelectedPred}
            lang={lang}
            dashData={dashData}
          />
        );
      case 'activity':
        return (
          <ActivityAnalytics
            user={user}
            lang={lang}
          />
        );
      case 'reports':
        return (
          <SectorReports
            user={user}
            dashData={dashData}
            lang={lang}
          />
        );
      case 'messages':
        return (
          <div className="fade-up">
            <div className="so-page-header" style={{ marginBottom: 20 }}>
              <div>
                <h2 className="so-page-title">
                  <i className="bi bi-bell-fill"></i>
                  {lang === 'en' ? 'Messages from District Admin' : 'Ubutumwa buvuye ku Karere'}
                </h2>
                <p className="so-page-sub">
                  {lang === 'en' ? 'Advisory messages sent by the District Agricultural Officer' : 'Inama zoherejwe na Ofisiye w\'Ubuhinzi w\'Akarere'}
                </p>
              </div>
            </div>
            {officerMessages.length === 0 ? (
              <div className="so-empty-state">
                <i className="bi bi-bell-slash"></i>
                <p>{lang === 'en' ? 'No messages from District Admin yet' : 'Nta butumwa buvuye ku Karere'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {officerMessages.map((msg, i) => (
                  <div key={i} style={{
                    background: 'white', borderRadius: 16, padding: '18px 20px',
                    border: '1.5px solid #99f6e4', boxShadow: '0 4px 12px rgba(0,0,0,.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#0f3d38,#0d9488)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="bi bi-building" style={{ color: 'white', fontSize: 16 }}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                          {msg.sender_name || (lang === 'en' ? 'District Agri Officer' : 'Ofisiye w\'Akarere')}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          <i className="bi bi-calendar3"></i> {msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          &nbsp;·&nbsp;
                          <span style={{ background: '#ccfbf1', color: '#0f766e', padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                            {msg.advice_type || 'advisory'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {msg.subject && (
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0f3d38', marginBottom: 6 }}>
                        {msg.subject}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default: return renderOverview();
    }
  };

  const navTabs = [
    { key: 'overview',     icon: 'bi-speedometer2',    label: t.overview },
    { key: 'farmers',      icon: 'bi-people',           label: lang === 'en' ? 'Farmers' : 'Abahinzi' },
    { key: 'predictions',  icon: 'bi-clipboard2-data',  label: lang === 'en' ? 'Predictions' : 'Ibisobanuro' },
    { key: 'reports',      icon: 'bi-file-earmark-text',label: t.reportsTab },
    { key: 'messages',     icon: 'bi-bell-fill',        label: lang === 'en' ? 'Messages' : 'Ubutumwa',
      badge: unreadMessages > 0 ? unreadMessages : null },
  ];

  const isDetail = selectedPred || selectedFarmerId;

  return (
    <div className="web-layout">
      <Sidebar
        current={isDetail ? (selectedPred ? 'predictions' : 'farmers') : tab}
        onNavigate={(key) => { setTab(key); setSelectedPred(null); setSelectedFarmerId(null); }}
        user={user}
        onLogout={onLogout}
        lang={lang}
        setLang={setLang}
        unreadMessages={unreadMessages}
      />
      <div className="main-content">
        <div className="shell">
          <Topbar
            title={
              <div className="dash-header-clean">
                <span className="dash-header-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}>
                  <i className="bi bi-building"></i>
                </span>
                <div className="dash-header-text">
                  <h1 className="dash-title">{sectorName} {lang === 'en' ? 'Sector' : 'Umurenge'}</h1>
                  <p className="dash-subtitle">{lang === 'en' ? 'Agri Officer Dashboard' : 'Incumbane y\'Ofisiye'}</p>
                </div>
              </div>
            }
            onBack={isDetail ? () => { setSelectedPred(null); setSelectedFarmerId(null); } : null}
            lang={lang}
            setLang={setLang}
            actions={
              <div className="dash-actions">
                <button className="dash-action-btn" onClick={onLogout} title={t.logout}>
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              </div>
            }
          />
          <div className="scroll fade-up">
            {/* Welcome Banner */}
            {!isDetail && (
              <div className="so-welcome-banner" style={{ background: 'linear-gradient(135deg, #0f3d38 0%, #0d9488 100%)' }}>
                <div className="so-welcome-left">
                  <div className="so-welcome-greeting">
                    {t.welcome}, <span className="so-welcome-name">{user.name?.split(' ')[0] || 'Officer'}</span>
                  </div>
                  <div className="so-welcome-sub">
                    {lang === 'en'
                      ? `Managing agricultural operations in ${sectorName} Sector`
                      : `Gucunga ibikorwa by'ubuhinzi muri Umurenge wa ${sectorName}`}
                  </div>
                  <div className="so-welcome-chips">
                    <span className="so-chip green"><i className="bi bi-geo-alt-fill"></i> {sectorName}</span>
                    <span className="so-chip blue"><i className="bi bi-shield-check"></i> {lang === 'en' ? 'Sector Officer' : 'Ofisiye w\'Umurenge'}</span>
                    <span className="so-chip amber"><i className="bi bi-calendar3"></i> {fmtDate(new Date())}</span>
                  </div>
                </div>
                <div className="so-welcome-illustration">
                  <i className="bi bi-shield-check"></i>
                </div>
              </div>
            )}

            {/* Navigation handled by Sidebar only */}

            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline Predictions List ── */
function SectorPredictionsList({ sectorName, sectorId, setSelectedPred, lang, dashData }) {
  const [preds, setPreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/officer-dashboard?sector=${encodeURIComponent(sectorName)}`)
      .then(r => r.json())
      .then(d => {
        setPreds(d.all_predictions || d.recent_preds || []);
        setLoading(false);
      })
      .catch(() => {
        setPreds(dashData?.all_predictions || dashData?.recent_preds || []);
        setLoading(false);
      });
  }, [sectorName]);

  const filtered = preds
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || (p.farmer_name || p.farmer_id || '').toLowerCase().includes(q) ||
        (p.crop || p.crop_type || '').toLowerCase().includes(q);
      const matchCrop = cropFilter === 'All' || (p.crop || p.crop_type) === cropFilter;
      return matchSearch && matchCrop;
    })
    .sort((a, b) => {
      if (sortBy === 'yield') return (b.yield_per_are_kg || 0) - (a.yield_per_are_kg || 0);
      return new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0);
    });

  const gradeColor = (g) => ({ Excellent: '#0d9488', Good: '#0d9488', Average: '#d97706', 'Below Average': '#dc2626' }[g] || '#64748b');
  const gradeBg = (g) => ({ Excellent: '#ccfbf1', Good: '#ccfbf1', Average: '#fef3c7', 'Below Average': '#fee2e2' }[g] || '#f1f5f9');

  return (
    <div className="fade-up">
      <div className="so-list-toolbar">
        <div className="so-list-search">
          <i className="bi bi-search"></i>
          <input
            className="so-search-input"
            placeholder={lang === 'en' ? 'Search by farmer or crop…' : 'Shakisha umuhinzi cyangwa igihingwa…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="so-list-filters">
          {['All', 'Maize', 'Rice'].map(c => (
            <button key={c} className={`so-filter-chip ${cropFilter === c ? 'act' : ''}`} onClick={() => setCropFilter(c)}>
              {c === 'All' ? (lang === 'en' ? 'All Crops' : 'Ibihingwa Byose') : c}
            </button>
          ))}
          <select className="so-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">{lang === 'en' ? 'Sort: Date' : 'Itariki'}</option>
            <option value="yield">{lang === 'en' ? 'Sort: Yield' : 'Umusaruro'}</option>
          </select>
        </div>
      </div>

      <div className="so-pred-count">
        {loading ? '…' : filtered.length} {lang === 'en' ? 'predictions found' : 'ibisobanuro bibonetse'}
      </div>

      {loading ? (
        <div className="so-loading-list">
          {[1,2,3,4,5].map(i => <div key={i} className="so-skeleton-row" style={{ height: 72 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="so-empty-state">
          <i className="bi bi-clipboard2-x"></i>
          <p>{lang === 'en' ? 'No predictions match your search' : 'Nta bisobanuro bihuye n\'ubushakashatsi bwawe'}</p>
        </div>
      ) : (
        <div className="so-pred-table-wrap">
          <table className="so-pred-table">
            <thead>
              <tr>
                <th>{lang === 'en' ? 'Farmer' : 'Umuhinzi'}</th>
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
              {filtered.map((p, i) => (
                <tr key={i} className="so-pred-tr" onClick={() => setSelectedPred(p)}>
                  <td>
                    <div className="so-td-farmer">
                      <div className="so-td-avatar">{(p.farmer_name || p.farmer_id || 'F').charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="so-td-name">{p.farmer_name || p.farmer_id}</div>
                        <div className="so-td-id">{p.farmer_id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="so-crop-tag" style={{
                      background: { Maize: '#fef3c7', Rice: '#ccfbf1' }[p.crop || p.crop_type] || '#f1f5f9',
                      color: { Maize: '#92400e', Rice: '#0f766e' }[p.crop || p.crop_type] || '#334155'
                    }}>
                      {p.crop || p.crop_type}
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
      )}
    </div>
  );
}

