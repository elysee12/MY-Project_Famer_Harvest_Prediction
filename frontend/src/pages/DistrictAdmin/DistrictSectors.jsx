import React, { useState, useEffect } from 'react';
import { API_BASE, SECTORS, CROP_BENCH, fmtDate } from '../../constants/constants';

const CROP_COLORS = { Maize: '#f59e0b', Rice: '#0d9488' };
const CROP_BG    = { Maize: '#fef3c7', Rice: '#ccfbf1' };
const CROP_TEXT  = { Maize: '#92400e', Rice: '#0f766e' };

function perfStatus(val, crop) {
  const bench = CROP_BENCH[crop] || 20;
  const pct = ((val - bench) / bench) * 100;
  if (pct >= 15)  return { label: 'Excellent', color: '#0d9488', bg: '#ccfbf1', icon: 'bi-trophy-fill' };
  if (pct >= 0)   return { label: 'Good',      color: '#0d9488', bg: '#ccfbf1', icon: 'bi-check-circle-fill' };
  if (pct >= -15) return { label: 'Average',   color: '#d97706', bg: '#fef3c7', icon: 'bi-dash-circle-fill' };
  return           { label: 'Below Avg',        color: '#dc2626', bg: '#fee2e2', icon: 'bi-exclamation-triangle-fill' };
}

export default function DistrictSectors({ selectedSectorId, setSelectedSectorId, setSelectedFarmerId, setSelectedPred, lang, user }) {

  if (selectedSectorId) {
    return (
      <SectorDetailView
        sectorId={selectedSectorId}
        onBack={() => setSelectedSectorId(null)}
        lang={lang}
      />
    );
  }

  return <SectorGrid setSelectedSectorId={setSelectedSectorId} lang={lang} />;
}

/* ── Sector Grid ── */
function SectorGrid({ setSelectedSectorId, lang }) {
  const getSectorId = (name) => SECTORS.indexOf(name) + 1;

  return (
    <div className="fade-up">
      <div className="sec-hd"><i className="bi bi-geo-alt"></i> {lang === 'en' ? 'Select a Sector to View Details' : 'Hitamo Umurenge urebe Amakuru'}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 15 }}>
        {SECTORS.map((sec, idx) => (
          <div
            key={sec}
            className="card hvr"
            style={{ padding: 20, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setSelectedSectorId(idx + 1)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="avatar-sm" style={{ background: "var(--s50)", color: "var(--s600)" }}>
                <i className="bi bi-geo-alt"></i>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{sec}</div>
                <div style={{ fontSize: 11, color: "var(--s500)" }}>
                  {lang === 'en' ? 'View details' : 'Reba amakuru'} <i className="bi bi-arrow-right"></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sector Detail View ── */
function SectorDetailView({ sectorId, onBack, lang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/admin/sector-details/${sectorId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sectorId]);

  if (loading) return (
    <div className="so-detail-loading">
      <div className="so-spinner"></div>
      <p>{lang === 'en' ? 'Loading sector data…' : 'Gutegereza amakuru ya segiteri…'}</p>
    </div>
  );

  const sectorName = data?.sector?.sector_name || SECTORS[sectorId - 1] || 'Sector';
  const preds = data?.predictions || [];

  // Compute per-crop stats
  const cropStats = {};
  preds.forEach(p => {
    const c = p.crop_type || p.crop;
    if (!c) return;
    if (!cropStats[c]) cropStats[c] = { count: 0, totalYield: 0, totalKg: 0, grades: {} };
    cropStats[c].count++;
    cropStats[c].totalYield += parseFloat(p.yield_per_are_kg || 0);
    cropStats[c].totalKg    += parseFloat(p.total_yield_kg   || 0);
    const g = p.yield_grade || 'Average';
    cropStats[c].grades[g] = (cropStats[c].grades[g] || 0) + 1;
  });

  const filtered = preds
    .filter(p => cropFilter === 'All' || (p.crop_type || p.crop) === cropFilter)
    .sort((a, b) => sortBy === 'yield'
      ? (b.yield_per_are_kg || 0) - (a.yield_per_are_kg || 0)
      : new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

  return (
    <div className="fade-up">
      {/* Back */}
      <div className="so-detail-toprow">
        <button className="so-back-btn" onClick={onBack}>
          <i className="bi bi-arrow-left"></i> {lang === 'en' ? 'Back to Sectors' : 'Subira ku Mirenge'}
        </button>
        <div className="so-pred-id-badge"><i className="bi bi-geo-alt"></i> {sectorName}</div>
      </div>

      {/* Hero */}
      <div className="da-sector-hero">
        <div className="da-sector-hero-icon"><i className="bi bi-geo-alt-fill"></i></div>
        <div className="da-sector-hero-info">
          <h2 className="da-sector-hero-name">{sectorName} {lang === 'en' ? 'Sector' : 'Umurenge'}</h2>
          <p className="da-sector-hero-sub">{lang === 'en' ? 'Bugesera District · Crop Performance Analysis' : 'Akarere ka Bugesera · Isuzuma ry\'Umusaruro w\'Ibihingwa'}</p>
        </div>
        <div className="da-sector-hero-stat">
          <div className="da-sector-hero-val">{preds.length}</div>
          <div className="da-sector-hero-lbl">{lang === 'en' ? 'Total Predictions' : 'Ibisobanuro Byose'}</div>
        </div>
      </div>

      {/* Per-Crop Summary Cards */}
      <div className="da-crop-summary-grid">
        {['Maize', 'Rice'].map(crop => {
          const cs = cropStats[crop];
          if (!cs) return (
            <div key={crop} className="da-crop-summary-card da-crop-empty">
              <div className="da-crop-summary-icon" style={{ background: CROP_BG[crop], color: CROP_COLORS[crop] }}>
                <i className="bi bi-flower2"></i>
              </div>
              <div className="da-crop-summary-name">{crop}</div>
              <div className="da-crop-summary-no">{lang === 'en' ? 'No data' : 'Nta makuru'}</div>
            </div>
          );
          const avg = (cs.totalYield / cs.count).toFixed(1);
          const bench = CROP_BENCH[crop] || 20;
          const vs = ((avg - bench) / bench * 100).toFixed(1);
          const st = perfStatus(parseFloat(avg), crop);
          const topGrade = Object.entries(cs.grades).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
          return (
            <div key={crop} className="da-crop-summary-card">
              <div className="da-crop-summary-top">
                <div className="da-crop-summary-icon" style={{ background: CROP_BG[crop], color: CROP_COLORS[crop] }}>
                  <i className="bi bi-flower2"></i>
                </div>
                <div>
                  <div className="da-crop-summary-name">{crop}</div>
                  <div className="da-crop-summary-count">{cs.count} {lang === 'en' ? 'predictions' : 'ibisobanuro'}</div>
                </div>
                <span className="da-status-badge" style={{ background: st.bg, color: st.color, marginLeft: 'auto' }}>
                  <i className={`bi ${st.icon}`}></i> {st.label}
                </span>
              </div>
              <div className="da-crop-summary-stats">
                <div className="da-crop-stat">
                  <div className="da-crop-stat-val" style={{ color: CROP_COLORS[crop] }}>{avg}</div>
                  <div className="da-crop-stat-lbl">kg/are avg</div>
                </div>
                <div className="da-crop-stat">
                  <div className="da-crop-stat-val" style={{ color: parseFloat(vs) >= 0 ? '#0d9488' : '#dc2626' }}>
                    {parseFloat(vs) >= 0 ? '+' : ''}{vs}%
                  </div>
                  <div className="da-crop-stat-lbl">vs district</div>
                </div>
                <div className="da-crop-stat">
                  <div className="da-crop-stat-val">{parseFloat(cs.totalKg).toFixed(0)}</div>
                  <div className="da-crop-stat-lbl">kg total</div>
                </div>
                <div className="da-crop-stat">
                  <div className="da-crop-stat-val" style={{ fontSize: 12 }}>{topGrade}</div>
                  <div className="da-crop-stat-lbl">top grade</div>
                </div>
              </div>
              {/* Mini bar vs benchmark */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--s400)', marginBottom: 4 }}>
                  <span>0</span><span>Benchmark: {bench}</span><span>50</span>
                </div>
                <div style={{ height: 8, background: 'var(--s100)', borderRadius: 99, position: 'relative', overflow: 'visible' }}>
                  <div style={{ height: '100%', width: `${Math.min((avg/50)*100,100)}%`, background: CROP_COLORS[crop], borderRadius: 99, transition: 'width 1s ease' }}></div>
                  <div style={{ position: 'absolute', top: -3, left: `${Math.min((bench/50)*100,100)}%`, width: 2, height: 14, background: 'var(--s400)', borderRadius: 99, transform: 'translateX(-50%)' }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Predictions Table */}
      <div className="da-section-card">
        <div className="da-section-hd">
          <span><i className="bi bi-clipboard2-data-fill"></i> {lang === 'en' ? 'All Predictions in ' + sectorName : 'Ibisobanuro Byose muri ' + sectorName}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All','Maize','Rice'].map(c => (
              <button key={c} className={`so-filter-chip ${cropFilter===c?'act':''}`} style={{ fontSize:11, padding:'5px 10px' }} onClick={() => setCropFilter(c)}>
                {c === 'All' ? (lang==='en'?'All Crops':'Byose') : c}
              </button>
            ))}
            <select className="so-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">{lang==='en'?'Sort: Date':'Itariki'}</option>
              <option value="yield">{lang==='en'?'Sort: Yield':'Umusaruro'}</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="so-empty-state">
            <i className="bi bi-clipboard2-x"></i>
            <p>{lang === 'en' ? 'No predictions found' : 'Nta bisobanuro bibonetse'}</p>
          </div>
        ) : (
          <div className="da-perf-table-wrap">
            <table className="da-perf-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{lang==='en'?'Crop':'Igihingwa'}</th>
                  <th>{lang==='en'?'Season':'Igihe'}</th>
                  <th>{lang==='en'?'Yield (kg/are)':'Umusaruro'}</th>
                  <th>{lang==='en'?'Total (kg)':'Igiteganyo'}</th>
                  <th>{lang==='en'?'Grade':'Icyiciro'}</th>
                  <th>{lang==='en'?'Date':'Itariki'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const crop = p.crop_type || p.crop;
                  const grade = p.yield_grade;
                  const gradeColor = { Excellent:'#0d9488', Good:'#0d9488', Average:'#d97706', 'Below Average':'#dc2626' }[grade] || '#64748b';
                  const gradeBg   = { Excellent:'#ccfbf1', Good:'#ccfbf1', Average:'#fef3c7', 'Below Average':'#fee2e2' }[grade] || '#f1f5f9';
                  return (
                    <tr key={i} className="da-perf-tr">
                      <td className="da-pred-count">{i + 1}</td>
                      <td>
                        <span className="so-crop-tag" style={{ background: CROP_BG[crop]||'#f1f5f9', color: CROP_TEXT[crop]||'#334155' }}>{crop}</span>
                      </td>
                      <td className="so-td-muted">{p.season}</td>
                      <td className="so-td-yield">{parseFloat(p.yield_per_are_kg||0).toFixed(1)}</td>
                      <td className="so-td-muted">{parseFloat(p.total_yield_kg||0).toFixed(0)} kg</td>
                      <td>
                        {grade && <span className="so-grade-badge" style={{ background: gradeBg, color: gradeColor }}>{grade}</span>}
                      </td>
                      <td className="so-td-muted">{fmtDate(p.created_at || p.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

