import React, { useState, useEffect } from 'react';
import { T, CLIMATE, API_BASE } from '../../constants/constants';
import Topbar from '../../components/Common/Topbar';

// WMO weather code → icon + label
function weatherInfo(code, lang) {
  if (code === null || code === undefined) return { icon: 'bi-cloud-sun', label: lang === 'en' ? 'Partly Cloudy' : 'Igicu gake' };
  if (code === 0)  return { icon: 'bi-sun-fill',        label: lang === 'en' ? 'Clear Sky'     : 'Ijuru Rikeye' };
  if (code <= 2)   return { icon: 'bi-cloud-sun-fill',  label: lang === 'en' ? 'Partly Cloudy' : 'Igicu gake' };
  if (code <= 3)   return { icon: 'bi-clouds-fill',     label: lang === 'en' ? 'Overcast'      : 'Ibicu byinshi' };
  if (code <= 49)  return { icon: 'bi-cloud-fog2-fill', label: lang === 'en' ? 'Foggy'         : 'Igihu' };
  if (code <= 59)  return { icon: 'bi-cloud-drizzle-fill', label: lang === 'en' ? 'Drizzle'    : 'Imvura nto' };
  if (code <= 69)  return { icon: 'bi-cloud-rain-fill', label: lang === 'en' ? 'Rain'          : 'Imvura' };
  if (code <= 79)  return { icon: 'bi-cloud-snow-fill', label: lang === 'en' ? 'Snow'          : 'Theluji' };
  if (code <= 84)  return { icon: 'bi-cloud-rain-heavy-fill', label: lang === 'en' ? 'Heavy Rain' : 'Imvura nyinshi' };
  if (code <= 99)  return { icon: 'bi-cloud-lightning-rain-fill', label: lang === 'en' ? 'Thunderstorm' : 'Inkuba' };
  return { icon: 'bi-cloud-sun', label: lang === 'en' ? 'Unknown' : 'Ntizwi' };
}

const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_RW = ['Cyu','Kub','Gat','Kane','Gat','Gat','Cya'];

export default function WeatherScreen({ onNavigate, lang, setLang, user }) {
  const t = T[lang];
  const sector = user?.sector || 'Gashora';

  const [current, setCurrent]   = useState(null);
  const [forecast, setForecast] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchWeather = () => {
    setLoading(true);
    setError(null);

    // Fetch both current summary + 7-day forecast in parallel
    Promise.all([
      fetch(`${API_BASE}/api/weather?sector=${encodeURIComponent(sector)}`).then(r => r.json()),
      fetch(`${API_BASE}/api/weather/forecast?sector=${encodeURIComponent(sector)}`).then(r => r.json()),
    ])
      .then(([summaryData, forecastData]) => {
        if (summaryData.success) setSummary(summaryData.weather);
        if (forecastData.success) {
          setCurrent(forecastData.current);
          setForecast(forecastData.forecast || []);
          setLastUpdate(forecastData.fetched_at);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(lang === 'en' ? 'Could not connect to weather service' : 'Ntibishoboye gutumanaho na serivisi y\'ikirere');
        setLoading(false);
      });
  };

  useEffect(() => { fetchWeather(); }, [sector]);

  const isLive = summary?.source === 'open-meteo-live';
  const monthly = Object.entries(CLIMATE).map(([m, d]) => ({ m: m.slice(0, 3), rain: d.rainfall, temp: d.temperature }));
  const maxR = Math.max(...monthly.map(d => d.rain));

  return (
    <>
      <Topbar
        title={<><i className="bi bi-cloud-sun"></i> {t.weatherTitle}</>}
        sub={`${sector} · Bugesera`}
        onBack={() => onNavigate('dashboard')}
        lang={lang}
        setLang={setLang}
      />
      <div className="scroll fade-up">

        {/* ── Current Conditions Card ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f3d38, #0d9488)',
          borderRadius: 20, padding: '22px', marginBottom: 16, color: 'white'
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                <i className="bi bi-geo-alt-fill"></i> {sector} · Bugesera District
              </div>
              <div style={{ fontSize: 11, opacity: .7, display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? (
                  <><i className="bi bi-arrow-repeat spin"></i> {lang === 'en' ? 'Fetching live data…' : 'Gufata amakuru mazima…'}</>
                ) : isLive ? (
                  <>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }}></span>
                    {lang === 'en' ? 'Live · Open-Meteo Rwanda' : 'Mazima · Open-Meteo Rwanda'}
                  </>
                ) : (
                  <><i className="bi bi-clock-history"></i> {lang === 'en' ? 'Historical averages' : 'Impuzandengo y\'amateka'}</>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={fetchWeather} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 99,
                color: 'white', padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700
              }}>
                <i className="bi bi-arrow-clockwise"></i> {lang === 'en' ? 'Refresh' : 'Vugurura'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', opacity: .7 }}>
              <i className="bi bi-cloud-sun spin" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}></i>
              {lang === 'en' ? 'Loading live weather from Open-Meteo…' : 'Gutegereza amakuru y\'ikirere ya Open-Meteo…'}
            </div>
          ) : error ? (
            <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <i className="bi bi-wifi-off" style={{ fontSize: 24, display: 'block', marginBottom: 6 }}></i>
              <div style={{ fontSize: 13 }}>{error}</div>
              <button onClick={fetchWeather} style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 99, color: 'white', padding: '6px 16px', cursor: 'pointer', fontSize: 12 }}>
                {lang === 'en' ? 'Try Again' : 'Ongera Ugerageze'}
              </button>
            </div>
          ) : (
            <>
              {/* Current temp + condition */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace' }}>
                    {current?.temperature ?? summary?.Avg_Temperature_Celsius ?? '—'}°
                  </div>
                  <div style={{ fontSize: 13, opacity: .8, marginTop: 4 }}>
                    {current ? weatherInfo(current.weathercode, lang).label : (lang === 'en' ? 'Current conditions' : 'Ikirere ubu')}
                  </div>
                </div>
                <div style={{ fontSize: 52, opacity: .85 }}>
                  <i className={`bi ${current ? weatherInfo(current.weathercode, lang).icon : 'bi-cloud-sun-fill'}`}></i>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { icon: 'bi-cloud-rain-fill', val: `${summary?.Total_Rainfall_mm ?? '—'} mm`,  lbl: lang==='en'?'30-day Rain':'Imvura (30d)' },
                  { icon: 'bi-droplet-half',    val: `${summary?.Relative_Humidity_Pct ?? '—'}%`, lbl: lang==='en'?'Humidity':'Ubuhehere' },
                  { icon: 'bi-sun-fill',        val: `${summary?.Sunshine_Hours_per_Day ?? '—'} h/d`, lbl: lang==='en'?'Sunshine':'Izuba' },
                  { icon: 'bi-wind',            val: `${current?.wind_speed ?? summary?.Wind_Speed_kmh ?? '—'} km/h`, lbl: lang==='en'?'Wind':'Umuyaga' },
                  { icon: 'bi-water',           val: `${summary?.Evapotranspiration_mm ?? '—'} mm`, lbl: 'Evapotransp.' },
                  { icon: 'bi-calendar3',       val: new Date().toLocaleDateString(lang==='rw'?'fr-RW':'en-RW',{day:'numeric',month:'short'}), lbl: lang==='en'?'Today':'Uyu Munsi' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                    <i className={`bi ${s.icon}`} style={{ fontSize: 18, display: 'block', marginBottom: 4 }}></i>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{s.val}</div>
                    <div style={{ fontSize: 10, opacity: .75, marginTop: 2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Source + time */}
              <div style={{ marginTop: 12, fontSize: 10, opacity: .55, textAlign: 'right' }}>
                <i className="bi bi-broadcast"></i> Open-Meteo API · Rwanda
                {lastUpdate && ` · ${new Date(lastUpdate).toLocaleTimeString()}`}
              </div>
            </>
          )}
        </div>

        {/* ── 7-Day Forecast ── */}
        {forecast.length > 0 && (
          <>
            <div className="sec-hd">
              <i className="bi bi-calendar-week"></i>
              {lang === 'en' ? '7-Day Forecast' : 'Iteganyabikorwa ry\'Iminsi 7'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 16 }}>
              {forecast.map((day, i) => {
                const date = new Date(day.date);
                const dayName = (lang === 'en' ? DAYS_EN : DAYS_EN)[date.getDay()];
                const info = weatherInfo(day.code, lang);
                const isToday = i === 0;
                return (
                  <div key={i} style={{
                    background: isToday ? 'linear-gradient(135deg,#0f3d38,#0d9488)' : 'white',
                    color: isToday ? 'white' : 'var(--s800)',
                    borderRadius: 14, padding: '12px 6px', textAlign: 'center',
                    border: isToday ? 'none' : '1.5px solid var(--s100)',
                    boxShadow: isToday ? '0 4px 16px rgba(13,148,136,0.3)' : '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, opacity: isToday ? .9 : .6, marginBottom: 6, textTransform: 'uppercase' }}>
                      {isToday ? (lang === 'en' ? 'Today' : 'Ubu') : dayName}
                    </div>
                    <i className={`bi ${info.icon}`} style={{ fontSize: 20, display: 'block', marginBottom: 6, color: isToday ? '#fbbf24' : '#0d9488' }}></i>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>{day.temp_max ?? '—'}°</div>
                    <div style={{ fontSize: 11, opacity: .65 }}>{day.temp_min ?? '—'}°</div>
                    {day.rain > 0 && (
                      <div style={{ fontSize: 10, marginTop: 4, color: isToday ? '#5eead4' : '#0d9488', fontWeight: 700 }}>
                        <i className="bi bi-cloud-rain"></i> {day.rain}mm
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Monthly Rainfall Chart ── */}
        <div className="sec-hd"><i className="bi bi-bar-chart-line"></i> {t.monthlyRainfall}</div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--s500)', marginBottom: 10 }}>
            {lang === 'en' ? 'Bugesera District - Historical monthly averages (mm)' : 'Akarere ka Bugesera - Impuzandengo y\'imvura buri kwezi (mm)'}
          </div>
          {monthly.map(d => (
            <div key={d.m} className="bar-row">
              <div className="bar-lbl">{d.m}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(d.rain / maxR) * 100}%` }} />
              </div>
              <div className="bar-val">{d.rain} mm</div>
            </div>
          ))}
        </div>

        {/* ── Monthly Temperature Chart ── */}
        <div className="sec-hd"><i className="bi bi-thermometer-half"></i> {t.monthlyTemp}</div>
        <div className="card" style={{ marginBottom: 14 }}>
          {monthly.map(d => (
            <div key={d.m} className="bar-row">
              <div className="bar-lbl">{d.m}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${((d.temp - 20) / 8) * 100}%`, background: 'linear-gradient(90deg,#0d9488,#f97316)' }} />
              </div>
              <div className="bar-val">{d.temp}°C</div>
            </div>
          ))}
        </div>

        {/* ── Planting Calendar ── */}
        <div className="card" style={{ background: '#f0fdfa', borderColor: '#99f6e4', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#0f3d38', marginBottom: 10 }}>
            <i className="bi bi-flower2"></i> {t.plantingCalendar}
          </div>
          {[
            { title: lang==='en'?'Season A (Oct-Jan)':'Igihe A (Ukwakira-Mutarama)', desc: lang==='en'?'Maize, Rice: main season, +10% yields':'Ibigori, Umuceri: igihe gikomeye, umusaruro +10%' },
            { title: lang==='en'?'Season B (Mar-Jul)':'Igihe B (Werurwe-Nyakanga)',  desc: lang==='en'?'Rice, Vegetables: secondary season':'Umuceri, Imboga: igihe gito' },
            { title: lang==='en'?'Best planting time':'Igihe cyiza cyo gutera',       desc: lang==='en'?'Oct–Nov (Season A) · Mar–Apr (Season B)':'Ukwakira–Ugushyingo (A) · Werurwe–Mata (B)' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ padding: '8px 0', borderBottom: '1px solid #99f6e4' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#0f3d38' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--s600)', marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
