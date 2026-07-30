import React from 'react';
import { T } from '../../constants/constants';

export default function ClimateCard({ climate, month, season, lang, isLive = false }) {
  const t = T[lang];

  if (!climate) return (
    <div className="climate-pending">
      <div style={{ fontSize: 32, marginBottom: 8 }}>
        <i className="bi bi-cloud-sun"></i>
      </div>
      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--s800)' }}>{t.autoClimateTitle}</div>
      <div style={{ fontSize: 13, opacity: .7, color: 'var(--s600)' }}>{t.selectMonthFirst}</div>
    </div>
  );

  return (
    <div className="climate-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div className="climate-badge">
              <i className="bi bi-cloud-sun-fill"></i>
              {lang === 'en' ? 'Climate Data' : 'Amakuru y\'Ikirere'}
            </div>
            {isLive ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(251,191,36,0.25)', border: '1px solid rgba(251,191,36,0.5)',
                borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: '#fbbf24'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                LIVE
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.12)', borderRadius: 99,
                padding: '2px 8px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)'
              }}>
                <i className="bi bi-clock-history"></i> AVG
              </span>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{month} · {season}</div>
          <div style={{ fontSize: 10, opacity: 0.75 }}>
            {isLive
              ? (lang === 'en' ? 'Open-Meteo · Real-time Rwanda data' : 'Open-Meteo · Amakuru Mazima ya Rwanda')
              : (lang === 'en' ? 'Bugesera historical averages' : 'Impuzandengo y\'amateka ya Bugesera')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace' }}>
            {climate.temperature}°
          </div>
          <div style={{ fontSize: 10, opacity: .7 }}>Celsius</div>
        </div>
      </div>

      <div className="climate-grid" style={{ marginTop: 14 }}>
        {[
          { val: climate.rainfall + ' mm',           icon: 'bi-cloud-rain-fill',   lbl: lang === 'en' ? 'Rainfall' : 'Imvura' },
          { val: climate.humidity + '%',             icon: 'bi-droplet-half',      lbl: lang === 'en' ? 'Humidity' : 'Ubuhehere' },
          { val: climate.sunshine + ' h/day',        icon: 'bi-sun-fill',          lbl: lang === 'en' ? 'Sunshine' : 'Izuba' },
          { val: climate.windSpeed + ' km/h',        icon: 'bi-wind',              lbl: lang === 'en' ? 'Wind' : 'Umuyaga' },
          { val: climate.evapotranspiration + ' mm', icon: 'bi-water',             lbl: 'Evapotransp.' },
          { val: isLive ? <i className="bi bi-broadcast" style={{color: '#10b981'}}></i> : <i className="bi bi-archive-fill"></i>, icon: null, lbl: isLive ? 'Live API' : 'Historical' },
        ].map(({ val, icon, lbl }, i) => (
          <div key={i} className="climate-item">
            {icon && <i className={`bi ${icon}`} style={{ fontSize: 14, display: 'block', marginBottom: 3, opacity: .85 }}></i>}
            <div className="climate-val" style={{ fontSize: i === 5 ? 18 : 14 }}>{val}</div>
            <div className="climate-lbl">{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
