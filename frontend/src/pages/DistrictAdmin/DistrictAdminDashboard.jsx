import React, { useState, useEffect } from 'react';
import { T, API_BASE, CROP_BENCH, SECTORS, fmtDate } from '../../constants/constants';
import Sidebar from '../../components/Common/Sidebar';
import Topbar from '../../components/Common/Topbar';
import PredictionDetailView from '../SectorOfficer/PredictionDetailView';
import FarmerDetailView from '../SectorOfficer/FarmerDetailView';
import DistrictSectors from './DistrictSectors';
import DistrictReports from './DistrictReports';
import DistrictAdminPanel from './DistrictAdminPanel';
import DistrictOverview from './DistrictOverview';

export default function DistrictAdminDashboard({ user, onLogout, lang, setLang }) {
  const t = T[lang];
  const [tab, setTab] = useState("overview");
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [selectedPred, setSelectedPred] = useState(null);
  const [selectedSectorId, setSelectedSectorId] = useState(null);
  const [underperforming, setUnderperforming] = useState([]);
  const [sectorPerf, setSectorPerf] = useState([]);
  const [officers, setOfficers] = useState([]);

  // Fetch sector-level crop performance from district stats
  const fetchSectorPerformance = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/district-stats`);
      const data = await res.json();
      if (data.sector_ranking) setSectorPerf(data.sector_ranking);
    } catch {
      // fallback mock
      setSectorPerf(SECTORS.slice(0, 8).map((s, i) => ({
        sector_name: s,
        avg_yield_kg_are: (20 + Math.random() * 18).toFixed(1),
        maize_avg: (18 + Math.random() * 10).toFixed(1),
        beans_avg: (9 + Math.random() * 6).toFixed(1),
        rice_avg: (30 + Math.random() * 12).toFixed(1),
        total_predictions: Math.floor(Math.random() * 20) + 3,
      })));
    }
  };

  const fetchOfficers = async () => {
    try {
      const requester = user?.id || user?.officer_id || '';
      const res = await fetch(`${API_BASE}/api/officers?role=sector&requester_id=${requester}`);
      const data = await res.json();
      if (data.success) setOfficers(data.officers);
    } catch {
      setOfficers([
        { id: 'S001', name: 'Marie Mukaso',   sector: 'Gashora', email: 'marie@sector.gov.rw' },
        { id: 'S002', name: 'Jean Habimana',  sector: 'Gashora', email: 'jean@sector.gov.rw' },
      ]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/officer-dashboard`)
      .then(r => r.json())
      .then(d => { setDashData(d); setLoading(false); })
      .catch(() => {
        setLoading(false);
        setDashData({
          farmer_count: 24,
          crop_data: { Maize: { avg_yield_kg_are: 23.8 }, Beans: { avg_yield_kg_are: 11.9 }, Rice: { avg_yield_kg_are: 36.4 } },
          recent_preds: [],
          seasons: [{ season: "Season A", avg_yield: 23.5, count: 12 }, { season: "Season B", avg_yield: 22.1, count: 8 }]
        });
      });
    fetch(`${API_BASE}/api/officer/underperforming-farms`)
      .then(r => r.json()).then(d => { if (d.success) setUnderperforming(d.farms || []); })
      .catch(() => setUnderperforming([]));
    fetchSectorPerformance();
    fetchOfficers();
  }, [user.id]);

  const renderContent = () => {
    if (selectedPred) return <PredictionDetailView prediction={selectedPred} onBack={() => setSelectedPred(null)} lang={lang} user={user} />;
    if (selectedFarmerId) return <FarmerDetailView farmerId={selectedFarmerId} onBack={() => setSelectedFarmerId(null)} lang={lang} setLang={setLang} setSelectedPred={setSelectedPred} officer={user} />;

    switch (tab) {
      case "overview": return <DistrictOverview dashData={dashData} loading={loading} underperforming={underperforming} sectorPerf={sectorPerf} officers={officers} setSelectedPred={setSelectedPred} setSelectedFarmerId={setSelectedFarmerId} setTab={setTab} lang={lang} t={t} user={user} />;
      case "sectors": return <DistrictSectors selectedSectorId={selectedSectorId} setSelectedSectorId={setSelectedSectorId} setSelectedFarmerId={setSelectedFarmerId} setSelectedPred={setSelectedPred} lang={lang} user={user} />;
      case "reports": return <DistrictReports user={user} lang={lang} />;
      case "admin": return <DistrictAdminPanel user={user} lang={lang} />;
      default: return null;
    }
  };

  const isDetail = selectedPred || selectedFarmerId;

  return (
    <div className="web-layout">
      <Sidebar
        current={isDetail ? (selectedPred ? 'history' : 'sectors') : tab}
        onNavigate={(key) => { setTab(key); setSelectedPred(null); setSelectedFarmerId(null); setSelectedSectorId(null); }}
        user={user} onLogout={onLogout} lang={lang} setLang={setLang}
      />
      <div className="main-content">
        <div className="shell">
          <Topbar
            title={
              <div className="dash-header-clean">
                <span className="dash-header-icon" style={{ background: '#ccfbf1', color: '#0d9488' }}><i className="bi bi-buildings"></i></span>
                <div className="dash-header-text">
                  <h1 className="dash-title">{lang === "en" ? "System Admin Dashboard" : "Incumbane y'Umuyobozi Mukuru"}</h1>
                  <p className="dash-subtitle">Gashora Sector · Bugesera District</p>
                </div>
              </div>
            }
            onBack={isDetail ? () => { setSelectedPred(null); setSelectedFarmerId(null); } : (selectedSectorId ? () => setSelectedSectorId(null) : null)}
            lang={lang} setLang={setLang}
            actions={<div className="dash-actions"><button className="dash-action-btn" onClick={onLogout} title={t.logout}><i className="bi bi-box-arrow-right"></i></button></div>}
          />
          <div className="scroll fade-up">
            {/* Welcome */}
            {!isDetail && (
              <div className="modern-welcome-card" style={{ padding: "20px 28px", marginBottom: "24px", background: "linear-gradient(135deg, #0f3d38 0%, #0d9488 100%)" }}>
                <div className="welcome-content">
                  <h2 className="welcome-greet" style={{ fontSize: "20px" }}>
                    {t.welcome}, <span className="welcome-name" style={{ color: "#5eead4" }}>{user.name?.split(" ")[0] || "Admin"}</span>!
                  </h2>
                  <p className="welcome-sub" style={{ marginBottom: 0, opacity: .8 }}>
                    {lang === "en" ? "Overseeing District-wide agriculture in" : "Gucunga ubuhinzi mu Karere ka"} <strong>Bugesera</strong>
                  </p>
                </div>
                <div className="welcome-illustration" style={{ fontSize: "60px" }}><i className="bi bi-bank"></i></div>
              </div>
            )}
            {/* Underline tab nav */}
            {!isDetail && !selectedSectorId && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--s100)' }}>
                {[[t.overview,"overview"],[t.sectorsTab,"sectors"],[t.reportsTab,"reports"],[t.registerTab||"Admin","admin"]].map(([label, key]) => (
                  <button key={key} onClick={() => setTab(key)} style={{
                    padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700,
                    color: tab === key ? 'var(--g700)' : 'var(--s400)',
                    borderBottom: tab === key ? '2px solid var(--g600)' : '2px solid transparent',
                    marginBottom: -2, transition: 'all .2s', whiteSpace: 'nowrap'
                  }}>{label}</button>
                ))}
              </div>
            )}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
