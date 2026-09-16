import React, { useState } from 'react';
import { T, CROPS, YIELD_THRESHOLDS, fmtDate } from '../../constants/constants';
import Topbar from '../../components/Common/Topbar';
import CropIcon from '../../components/Common/CropIcon';
import { LuChartBar, LuCalendar, LuLayers } from 'react-icons/lu';

export default function HistoryScreen({ predictions, onNavigate, lang, setLang, setSelectedPred, user, hideLangBtn = false }) {
  const t = T[lang];
  const [crop, setCrop] = useState("All");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  
  const hList = predictions || [];
  
  // Determine if this is a cooperative leader viewing cooperative history
  const isCooperativeLeader = user && (user.role === 'cooperative_leader' || user.role === 'cooperative');
  
  const filtered = hList.filter(p => {
    if (!p) return false;
    const yr = new Date(p.created_at || p.timestamp || Date.now()).getFullYear();
    const pCrop = p.crop || p.crop_type || "Unknown";
    const pSector = p.sector || p.sector_name || "";
    const pFarmer = p.farmer_name || "";
    return (crop === "All" || pCrop === crop) &&
           (yearFilter === "All" || String(yr) === String(yearFilter)) &&
           (!search || pCrop.toLowerCase().includes(search.toLowerCase()) ||
            pSector.toLowerCase().includes(search.toLowerCase()) ||
            pFarmer.toLowerCase().includes(search.toLowerCase()));
  });

  const historyTitle = isCooperativeLeader 
    ? (lang === 'en' ? 'Cooperative Predictions History' : 'Amateka y\'Ibisobanuro bya Koperative')
    : t.predHistory;

  return (
    <>
      <Topbar title={historyTitle} onBack={() => onNavigate("dashboard")} lang={lang} setLang={setLang} hideLangBtn={hideLangBtn} />
      <div className="scroll wide-scroll fade-up">
        <input 
          className="finput" 
          placeholder={isCooperativeLeader 
            ? (lang === 'en' ? 'Search by crop, farmer, or sector...' : 'Shakisha ku gihingwa, umuhinzi, cyangwa agace...')
            : t.searchCrop
          } 
          value={search}
          onChange={e => setSearch(e.target.value)} 
          style={{ marginBottom: 12 }}
        />
        <div className="frow" style={{ marginBottom: 14 }}>
          <select className="finput" value={crop} onChange={e => setCrop(e.target.value)}>
            <option value="All">{t.allCrops}</option>
            {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="finput" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="All">All Years</option>
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="card card-hero" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 12, opacity: .8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><LuChartBar size={14} /> {t.overallStats}</div>
              <div style={{ fontSize: 38, fontWeight: 800, fontFamily: "monospace" }}>{hList.length}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>{t.totalPredictions}</div>
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--s400)", fontSize: 13 }}>
            {isCooperativeLeader 
              ? (lang === 'en' ? 'No predictions found from cooperative members.' : 'Nta bisobanuro byabonetse bivuye mu banyamuryango ba koperative.')
              : 'No predictions found. Make a new prediction!'
            }
          </div>
        )}

        {filtered.map((p, i) => {
          const pCrop = p.crop || p.crop_type || "Maize";
          const thresh = YIELD_THRESHOLDS[pCrop] || YIELD_THRESHOLDS.Maize;
          const yVal = parseFloat(p.yield_per_are_kg || 0);
          
          const grade = p.yield_grade || (
            yVal >= thresh.excellent ? "Excellent" :
            yVal >= thresh.good ? "Good" :
            yVal >= thresh.avg ? "Average" : "Below Average"
          );
          
          const gColor = grade === "Excellent" ? "var(--g600)" : grade === "Good" ? "var(--g500)" : grade === "Average" ? "var(--amber)" : "var(--red)";
          const dateStr = fmtDate(p.created_at || p.timestamp);
          const revenue = Math.round(parseFloat(p.total_yield_kg || 0) * ({ Maize: 300, Rice: 500 }[pCrop] || 400));
          
          return (
            <div 
              key={i} 
              className="hitem-elevated" 
              style={{ borderLeft: `4px solid ${gColor}`, marginBottom: 16, padding: "16px", cursor: "pointer" }} 
              onClick={() => setSelectedPred && setSelectedPred(p)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "var(--g700)" }}>
                  <CropIcon name={pCrop} style={{ fontSize: 32 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "var(--g900)", marginBottom: 4 }}>
                    {pCrop} — {p.sector || p.sector_name || ""}
                  </div>
                  {p.farmer_name && (
                    <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, marginBottom: 2 }}>
                      👤 {p.farmer_name} {p.farmer_phone && `• ${p.farmer_phone}`}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--s500)", marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.season || ""} · {p.month || ""} · <LuCalendar size={12} /> {dateStr}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: gColor, fontFamily: "monospace" }}>
                    {yVal.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--s400)", textTransform: "uppercase", fontWeight: 700 }}>kg/are</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 0 }}>
                {[
                  [(<LuLayers size={14} />), "Total", `${parseFloat(p.total_yield_kg || 0).toLocaleString()} kg`],
                  [(<i className="bi bi-rulers"></i>), "Area", `${parseFloat(p.area_planted_are || p.area_planted_ha * 100 || 0).toFixed(0)} are`],
                  [(<i className="bi bi-cash-stack"></i>), "Revenue", `RWF ${revenue.toLocaleString()}`],
                ].map(([icon, label, val], idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: 10, color: "var(--s400)", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>{icon} {label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--s700)" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
