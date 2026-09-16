import React, { useState } from 'react';
import { T, API_BASE, CROP_ICON, fmtDate, CROP_BENCH } from '../../constants/constants';

export default function PredictionDetailView({ prediction, onBack, lang, user, onUpdate }) {
  const t = T[lang];
  const p = prediction;
  const [actualYield, setActualYield] = useState(p.actual_yield_kg_are || '');
  const [harvestDate, setHarvestDate] = useState(p.actual_harvest_date || new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const bench = CROP_BENCH[p.crop || p.crop_type] || 20;
  const yieldVal = parseFloat(p.yield_per_are_kg || 0);
  const pctVsBench = bench ? ((yieldVal - bench) / bench * 100).toFixed(1) : 0;
  const gradeColor = { Excellent: '#0d9488', Good: '#0d9488', Average: '#d97706', 'Below Average': '#dc2626' }[p.yield_grade] || '#64748b';
  const gradeBg = { Excellent: '#ccfbf1', Good: '#ccfbf1', Average: '#fef3c7', 'Below Average': '#fee2e2' }[p.yield_grade] || '#f1f5f9';

  const handleSaveActual = async () => {
    if (!actualYield) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/predictions/record-actual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction_id: p.prediction_id || p.id,
          actual_yield: actualYield,
          harvest_date: harvestDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'ok', msg: lang === 'en' ? 'Actual harvest recorded!' : 'Isarura nyaryo ryanditswe!' });
        if (onUpdate) onUpdate({ ...p, actual_yield_kg_are: actualYield, actual_harvest_date: harvestDate });
      } else {
        setStatus({ type: 'err', msg: data.error });
      }
    } catch {
      setStatus({ type: 'ok', msg: lang === 'en' ? 'Recorded locally (offline mode)' : 'Byanditswe (offline mode)' });
      if (onUpdate) onUpdate({ ...p, actual_yield_kg_are: actualYield, actual_harvest_date: harvestDate });
    }
    setSaving(false);
  };

  const accuracy = p.actual_yield_kg_are || actualYield
    ? ((1 - Math.abs(yieldVal - parseFloat(p.actual_yield_kg_are || actualYield)) / yieldVal) * 100).toFixed(1)
    : null;

  return (
    <div className="fade-up">
      {/* Back */}
      <div className="so-detail-toprow">
        <button className="so-back-btn" onClick={onBack}>
          <i className="bi bi-arrow-left"></i> {lang === 'en' ? 'Back to Predictions' : 'Subira ku Bisobanuro'}
        </button>
        <div className="so-pred-id-badge">
          <i className="bi bi-hash"></i> {p.prediction_id || p.id}
        </div>
      </div>

      {/* Hero */}
      <div className="so-pred-hero">
        <div className="so-pred-hero-left">
          <div className="so-pred-hero-crop-icon">
            <i className={`bi ${CROP_ICON[p.crop || p.crop_type] || 'bi-flower2'}`}></i>
          </div>
          <div>
            <div className="so-pred-hero-crop">{p.crop || p.crop_type}</div>
            <div className="so-pred-hero-meta">
              <span><i className="bi bi-geo-alt"></i> {p.sector || p.sector_name}</span>
              <span><i className="bi bi-calendar3"></i> {p.season}</span>
              <span><i className="bi bi-person"></i> {p.farmer_name || p.farmer_id}</span>
            </div>
          </div>
        </div>
        <div className="so-pred-hero-right">
          <div className="so-pred-hero-yield">{yieldVal.toFixed(1)}</div>
          <div className="so-pred-hero-unit">kg/are</div>
          {p.yield_grade && (
            <span className="so-grade-badge" style={{ background: gradeBg, color: gradeColor, marginTop: 8 }}>
              {p.yield_grade}
            </span>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="so-pred-kpi-row">
        {[
          { icon: 'bi-graph-up', val: `${yieldVal.toFixed(1)} kg/are`, lbl: lang === 'en' ? 'Predicted Yield' : 'Umusaruro Wateganyijwe', color: '#0d9488', bg: '#ccfbf1' },
          { icon: 'bi-box-seam', val: `${parseFloat(p.total_yield_kg || 0).toFixed(0)} kg`, lbl: lang === 'en' ? 'Total Harvest' : 'Isarura Ryose', color: '#0d9488', bg: '#ccfbf1' },
          { icon: 'bi-rulers', val: `${p.area_planted_are || 0} are`, lbl: lang === 'en' ? 'Area Planted' : 'Akarima Gatewe', color: '#d97706', bg: '#fef3c7' },
          { icon: 'bi-shield-check', val: p.confidence_pct ? `${p.confidence_pct}%` : '…', lbl: lang === 'en' ? 'Confidence' : 'Inyemeza', color: '#7c3aed', bg: '#ede9fe' },
        ].map((k, i) => (
          <div key={i} className="so-pred-kpi">
            <div className="so-pred-kpi-icon" style={{ background: k.bg, color: k.color }}>
              <i className={`bi ${k.icon}`}></i>
            </div>
            <div className="so-pred-kpi-val">{k.val}</div>
            <div className="so-pred-kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Benchmark comparison */}
      <div className="so-bench-card">
        <div className="so-bench-label">{lang === 'en' ? 'vs District Average' : 'vs Impuzandengo y\'Akarere'}</div>
        <div className="so-bench-row">
          <div className="so-bench-item">
            <div className="so-bench-val" style={{ color: '#0d9488' }}>{yieldVal.toFixed(1)}</div>
            <div className="so-bench-sub">{lang === 'en' ? 'This Prediction' : 'Iki Gisobanuro'}</div>
          </div>
          <div className={`so-bench-vs ${parseFloat(pctVsBench) >= 0 ? 'pos' : 'neg'}`}>
            {parseFloat(pctVsBench) >= 0 ? '+' : ''}{pctVsBench}%
          </div>
          <div className="so-bench-item">
            <div className="so-bench-val" style={{ color: '#64748b' }}>{bench}</div>
            <div className="so-bench-sub">{lang === 'en' ? 'District Avg' : 'Impuzandengo'}</div>
          </div>
        </div>
        <div className="so-bench-bar-track">
          <div className="so-bench-bar-fill" style={{ width: `${Math.min((yieldVal / (bench * 1.5)) * 100, 100)}%` }}></div>
          <div className="so-bench-bar-marker" style={{ left: `${Math.min((bench / (bench * 1.5)) * 100, 100)}%` }}></div>
        </div>
      </div>

      {/* Sub-section tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid var(--s100)', paddingBottom: 0 }}>
        {[
          { key: 'overview', label: lang === 'en' ? 'Overview' : 'Incamake' },
          { key: 'inputs', label: lang === 'en' ? 'Farm Inputs' : 'Ibikoresho' },
          { key: 'climate', label: lang === 'en' ? 'Climate' : 'Ibihe' },
          { key: 'actual', label: lang === 'en' ? 'Record Actual' : 'Andika Nyaryo' },
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

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="so-detail-section fade-up">
          <div className="so-info-grid">
            {[
              { icon: 'bi-flower2', lbl: lang === 'en' ? 'Crop Type' : 'Igihingwa', val: p.crop || p.crop_type },
              { icon: 'bi-geo-alt', lbl: lang === 'en' ? 'Sector' : 'Umurenge', val: p.sector || p.sector_name },
              { icon: 'bi-sun', lbl: lang === 'en' ? 'Season' : 'Igihe cy\'Ihinga', val: p.season },
              { icon: 'bi-calendar', lbl: lang === 'en' ? 'Planting/Planted Date' : 'Itariki yo Gutera/Wateje', val: fmtDate(p.planting_date) || '—' },
              { icon: 'bi-person', lbl: lang === 'en' ? 'Farmer' : 'Umuhinzi', val: p.farmer_name || p.farmer_id },
              { icon: 'bi-cpu', lbl: lang === 'en' ? 'Model Used' : 'Modeli Yakoreshejwe', val: p.model_used || 'Random Forest' },
              { icon: 'bi-clock', lbl: lang === 'en' ? 'Prediction Date' : 'Itariki y\'Igisobanuro', val: fmtDate(p.created_at || p.timestamp) },
              { icon: 'bi-hash', lbl: 'Prediction ID', val: p.prediction_id || p.id },
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

          {/* Recommendations */}
          {p.recommendations?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="so-section-hd" style={{ marginBottom: 12 }}>
                <span><i className="bi bi-lightbulb-fill"></i> {t.recommendations}</span>
              </div>
              {p.recommendations.map((rec, i) => (
                <div key={i} className={`rec rec-${rec.type}`} style={{ marginBottom: 10 }}>
                  <div className="rec-cat">
                    <i className={`bi ${rec.icon || 'bi-info-circle'}`} style={{ marginRight: 6 }}></i>
                    {rec.category}
                  </div>
                  <div className="rec-text">{lang === 'rw' && rec.message_rw ? rec.message_rw : rec.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Farm Inputs */}
      {activeTab === 'inputs' && (
        <div className="so-detail-section fade-up">
          <div className="so-info-grid">
            {[
              { icon: 'bi-rulers', lbl: lang === 'en' ? 'Area Planted' : 'Akarima Gatewe', val: `${p.area_planted_are || 0} are` },
              { icon: 'bi-flower2', lbl: lang === 'en' ? 'Soil Type' : 'Ubwoko bw\'Ubutaka', val: p.soil_type || p.inputs?.soil_type || '—' },
              { icon: 'bi-check-circle', lbl: lang === 'en' ? 'Fertilizer Used' : 'Ifumbire Yakoreshejwe', val: p.fertilizer_used || (p.inputs?.fertilizer_used ? 'Yes' : 'No') },
              { icon: 'bi-droplet', lbl: lang === 'en' ? 'Irrigation Used' : 'Kuhira Byakoreshejwe', val: p.irrigation_used || (p.inputs?.irrigation_used ? 'Yes' : 'No') },
              { icon: 'bi-arrow-repeat', lbl: lang === 'en' ? 'Previous Crop' : 'Igihingwa cy\'Imbere', val: p.previous_crop || '—' },
              { icon: 'bi-bug', lbl: lang === 'en' ? 'Pest Pressure' : 'Udukoko', val: p.pest_pressure || '—' },
              { icon: 'bi-people', lbl: lang === 'en' ? 'Labor Availability' : 'Abakozi', val: p.labor_availability || '—' },
              { icon: 'bi-person-check', lbl: lang === 'en' ? 'Extension Access' : 'Ubufasha bw\'Agronome', val: p.extension_access || '—' },
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

      {/* Tab: Climate */}
      {activeTab === 'climate' && (
        <div className="so-detail-section fade-up">
          <div className="so-climate-grid">
            {[
              { icon: 'bi-thermometer-half', lbl: t.temperature, val: `${p.avg_temperature || p.inputs?.temperature || '—'}°C`, color: '#dc2626', bg: '#fee2e2' },
              { icon: 'bi-cloud-rain', lbl: t.rainfall, val: `${p.total_rainfall_mm || p.inputs?.rainfall || '—'} mm`, color: '#0d9488', bg: '#ccfbf1' },
              { icon: 'bi-droplet-half', lbl: t.humidity, val: `${p.humidity_pct || p.inputs?.humidity || '—'}%`, color: '#0891b2', bg: '#cffafe' },
              { icon: 'bi-sun', lbl: t.sunshine, val: `${p.sunshine_hrs || p.inputs?.sunshine || '—'} hrs/day`, color: '#d97706', bg: '#fef3c7' },
            ].map((c, i) => (
              <div key={i} className="so-climate-card">
                <div className="so-climate-icon" style={{ background: c.bg, color: c.color }}>
                  <i className={`bi ${c.icon}`}></i>
                </div>
                <div className="so-climate-val">{c.val}</div>
                <div className="so-climate-lbl">{c.lbl}</div>
              </div>
            ))}
          </div>
          <div className="so-climate-note">
            <i className="bi bi-info-circle"></i>
            {lang === 'en'
              ? 'Climate data auto-loaded from Bugesera historical averages at planting time.'
              : 'Amakuru y\'ibihe yafashwe bwite kuva ku makuru ya Bugesera igihe cyo gutera.'}
          </div>
        </div>
      )}

      {/* Tab: Record Actual */}
      {activeTab === 'actual' && (
        <div className="so-detail-section fade-up">
          <div className="so-actual-card">
            <div className="so-actual-header">
              <div className="so-actual-icon"><i className="bi bi-check2-square"></i></div>
              <div>
                <div className="so-actual-title">{lang === 'en' ? 'Record Actual Harvest Result' : 'Andika Isarura Nyaryo'}</div>
                <div className="so-actual-sub">
                  {lang === 'en'
                    ? 'Compare predicted vs actual yield to improve model accuracy'
                    : 'Geranya umusaruro wateganyijwe n\'umusaruro nyaryo kugira ngo wongerezwe ubushobozi bwa modeli'}
                </div>
              </div>
            </div>

            {status && (
              <div className={`so-status-alert ${status.type}`}>
                <i className={`bi ${status.type === 'ok' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                {status.msg}
              </div>
            )}

            <div className="frow">
              <div className="fgrp">
                <label className="flabel">{lang === 'en' ? 'Actual Yield (kg/are)' : 'Umusaruro Nyaryo (kg/are)'}</label>
                <input
                  className="finput"
                  type="number"
                  step="0.1"
                  min="0"
                  value={actualYield}
                  onChange={e => setActualYield(e.target.value)}
                  placeholder="e.g. 22.5"
                />
              </div>
              <div className="fgrp">
                <label className="flabel">{lang === 'en' ? 'Harvest Date' : 'Itariki yo Gusarura'}</label>
                <input
                  className="finput"
                  type="date"
                  value={harvestDate}
                  onChange={e => setHarvestDate(e.target.value)}
                />
              </div>
            </div>

            {/* Accuracy Preview */}
            {actualYield && (
              <div className="so-accuracy-preview">
                <div className="so-accuracy-row">
                  <div className="so-accuracy-item">
                    <div className="so-accuracy-lbl">{lang === 'en' ? 'Predicted' : 'Wateganyijwe'}</div>
                    <div className="so-accuracy-val green">{yieldVal.toFixed(1)} kg/are</div>
                  </div>
                  <div className="so-accuracy-arrow"><i className="bi bi-arrow-left-right"></i></div>
                  <div className="so-accuracy-item">
                    <div className="so-accuracy-lbl">{lang === 'en' ? 'Actual' : 'Nyaryo'}</div>
                    <div className="so-accuracy-val blue">{parseFloat(actualYield).toFixed(1)} kg/are</div>
                  </div>
                  <div className="so-accuracy-item">
                    <div className="so-accuracy-lbl">{lang === 'en' ? 'Model Accuracy' : 'Ubushobozi bwa Modeli'}</div>
                    <div className="so-accuracy-val" style={{ color: parseFloat(accuracy) >= 85 ? '#0d9488' : '#d97706' }}>
                      {accuracy}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSaveActual}
              disabled={saving || !actualYield}
              style={{ marginTop: 8 }}
            >
              {saving
                ? <><div className="spin" style={{ display: 'inline-block', marginRight: 8 }} /> {lang === 'en' ? 'Saving…' : 'Kubika…'}</>
                : <><i className="bi bi-save-fill"></i> {lang === 'en' ? 'Save Actual Result' : 'Bika Isarura Nyaryo'}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

