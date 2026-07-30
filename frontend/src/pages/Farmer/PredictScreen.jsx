import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  T, SECTORS, SEASONS, CROPS, SOILS, CROP_BENCH, 
  SECTOR_SOIL_TYPE, SOIL_DISPLAY, API_BASE, 
  getClimate, getSeasonFromMonth, simulateOffline, buildRecs 
} from '../../constants/constants';
import Topbar from '../../components/Common/Topbar';
import ClimateCard from '../../components/Farmer/ClimateCard';
import CropIcon from '../../components/Common/CropIcon';

function estimateConfidence(inputs) {
  let score = 94.0;
  if (inputs.fertilizer) score += 2.0;
  if (inputs.irrigation) score += 2.0;
  if (inputs.pestPressure === 'Low') score += 2.0;
  else if (inputs.pestPressure === 'High') score -= 5.0;
  if (inputs.extensionAccess === 'Yes') score += 1.0;
  if (inputs.creditAccess === 'Yes') score += 0.8;
  if (['Maize', 'Rice', 'Legume'].includes(inputs.previousCrop)) score += 1.0;
  if (inputs.laborAvail === 'Adequate') score += 0.5;
  else if (inputs.laborAvail === 'Limited') score -= 1.5;
  if (['Loam', 'Clay Soil'].includes(inputs.soil)) score += 0.5;

  const climate = getClimate(inputs.month || 'October', inputs.season || 'Season A');
  const cropRainOpt = { Maize: 500, Rice: 650 }[inputs.crop] || 500;
  const rainAdequacy = climate.rainfall / cropRainOpt;
  if (rainAdequacy >= 0.9 && rainAdequacy <= 1.2) score += 1.0;
  else if (rainAdequacy < 0.6) score -= 2.0;

  const tempOpt = { Maize: 23, Rice: 25 }[inputs.crop] || 23;
  const tempDev = Math.abs(climate.temperature - tempOpt);
  if (tempDev <= 2) score += 0.8;
  else if (tempDev > 5) score -= 1.2;

  return Math.round(Math.min(97, Math.max(60, score)) * 10) / 10;
}

// Harvest days per crop
const HARVEST_DAYS = { Maize: 90, Rice: 120 };

// Seed variety effect on yield (multiplier)
const SEED_EFFECT = { 'Improved': 1.0, 'Hybrid': 1.0, 'Local': 0.85 };

// Terrain effect on yield
const TERRAIN_EFFECT = { 'Valley': 1.0, 'Flat': 0.95, 'Hillside': 0.88 };

// Fertilizer amount effect (kg/are → yield boost factor)
function fertEffect(kgAre) {
  if (!kgAre || kgAre <= 0) return 0;
  return Math.min(kgAre / 2.0, 1.0); // max effect at 2 kg/are
}

export default function PredictScreen({ user, onNavigate, onResult, onSave, history = [], lang, setLang }) {
  const t = T[lang];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [form, setForm] = useState({
    crop: "",
    sector: user.sector || "",
    season: "",
    month: "",
    plantingDate: "",
    areaPlantedHa: String(user.farm_size_ha || ""),
    soil: SECTOR_SOIL_TYPE[user.sector || ""] || "Clay Soil",
    farmerCategory: "Medium",
    previousCrop: "Maize",
    laborAvail: "Adequate",
    pestPressure: "Low",
    extensionAccess: "Yes",
    creditAccess: "No",
    fertilizer: false,
    fertilizerAmountKgAre: "",   // NEW: fertilizer amount
    fertilizerType: "DAP",       // NEW: fertilizer type
    seedVariety: "Improved",     // NEW: seed variety
    terrain: "Flat",             // NEW: terrain type
    irrigation: false,
  });

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  // ── Live weather from Open-Meteo ──────────────────────────────────────────
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!form.sector) return;
    setWeatherLoading(true);
    fetch(`${API_BASE}/api/weather?sector=${encodeURIComponent(form.sector)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.weather) setLiveWeather(d.weather);
        setWeatherLoading(false);
      })
      .catch(() => { setWeatherLoading(false); });
  }, [form.sector]);

  // Build autoClimate — prefer live data, fallback to historical
  const autoClimate = useMemo(() => {
    if (!form.month && !form.season) return null;
    if (liveWeather && liveWeather.Avg_Temperature_Celsius) {
      return {
        temperature:       liveWeather.Avg_Temperature_Celsius,
        rainfall:          liveWeather.Total_Rainfall_mm,
        humidity:          liveWeather.Relative_Humidity_Pct,
        sunshine:          liveWeather.Sunshine_Hours_per_Day,
        windSpeed:         liveWeather.Wind_Speed_kmh,
        evapotranspiration:liveWeather.Evapotranspiration_mm,
        source:            liveWeather.source,
      };
    }
    return form.month && form.season ? getClimate(form.month, form.season) : null;
  }, [form.month, form.season, liveWeather]);

  const isLiveClimate = liveWeather?.source === 'open-meteo-live';

  // ── Planting date logic ────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0,0,0,0);

  const plantingStatus = useMemo(() => {
    if (!form.plantingDate || !form.crop) return null;
    const plantDate  = new Date(form.plantingDate);
    const harvestDays= HARVEST_DAYS[form.crop] || 90;
    const harvestDate= new Date(plantDate);
    harvestDate.setDate(harvestDate.getDate() + harvestDays);

    const diffDays   = Math.round((plantDate - today) / 86400000);
    const daysToHarv = Math.round((harvestDate - today) / 86400000);

    const harvestStr = harvestDate.toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-RW',
      { day: 'numeric', month: 'long', year: 'numeric' });

    // Climate at harvest time
    const harvestMonth = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December'][harvestDate.getMonth()];
    const harvestSeason= getSeasonFromMonth(harvestMonth);
    const harvestClim  = getClimate(harvestMonth, harvestSeason);

    return { plantDate, harvestDate, harvestStr, diffDays, daysToHarv,
             harvestMonth, harvestSeason, harvestClim, harvestDays };
  }, [form.plantingDate, form.crop, lang]);

  const step1Valid = form.crop && form.sector && form.season && form.month
                  && form.areaPlantedHa && form.plantingDate;

  const handleDateChange = (val) => {
    set("plantingDate", val);
    if (val) {
      const d = new Date(val);
      const mo = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"][d.getMonth()];
      set("month", mo);
      set("season", getSeasonFromMonth(mo));
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    const areaAre = Math.round(parseFloat(form.areaPlantedHa) * 100);
    const farmAre = areaAre;
    const clim    = getClimate(form.month, form.season);

    // Fertilizer amount — affects model directly
    const fertKgAre = form.fertilizer ? (parseFloat(form.fertilizerAmountKgAre) || 1.865) : 0;

    const payload = {
      farmer_id         : user.id || user.farmer_id,
      crop              : form.crop,
      sector            : form.sector,
      season            : form.season,
      month             : form.month,
      planting_date     : form.plantingDate,
      farm_size         : farmAre,
      area_planted      : areaAre,
      farmer_category   : form.farmerCategory,
      fertilizer_used   : form.fertilizer ? 'Yes' : 'No',
      fertilizer_amount_kg_are: fertKgAre,
      fertilizer_type   : form.fertilizerType || 'DAP',
      irrigation_used   : form.irrigation ? 'Yes' : 'No',
      soil_type         : form.soil,
      previous_crop     : form.previousCrop || 'Maize',
      labor_availability: form.laborAvail || 'Adequate',
      pest_pressure     : form.pestPressure || 'Low',
      extension_access  : form.extensionAccess || 'Yes',
      credit_access     : form.creditAccess || 'No',
      seed_variety      : form.seedVariety || 'Improved',
      terrain           : form.terrain || 'Flat',
      temperature       : clim.temperature,
      rainfall          : clim.rainfall,
      humidity          : clim.humidity,
      sunshine          : clim.sunshine,
      wind_speed        : clim.windSpeed,
      evapotranspiration: clim.evapotranspiration,
      year              : new Date(form.plantingDate).getFullYear(),
    };

    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setLoading(false); 
      setOffline(false);
      
      const formattedData = {
        ...data,
        id: data.id || data.prediction_id,
        crop: data.crop || form.crop,
        timestamp: data.timestamp || new Date().toISOString(),
        sector: data.sector || form.sector
      };
      
      if (onSave) await onSave(formattedData);
      onResult(formattedData); 
      onNavigate("result");
    } catch (err) {
      console.log("Prediction API error, falling back to offline:", err);
      // Offline fallback
      setOffline(true);
      const yieldPA = simulateOffline({
        crop: form.crop, 
        month: form.month, 
        season: form.season,
        farmSizeAre: areaAre, 
        areaPlantedAre: areaAre,
        fertilizer: form.fertilizer, 
        irrigation: form.irrigation, 
        soil: form.soil
      });

      const result = {
        id: `PRED-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        farmer_id: user.id || user.farmer_id,
        crop: form.crop,
        sector: form.sector,
        season: form.season,
        month: form.month,
        planting_date: form.plantingDate,
        farm_size_are: farmAre,
        farm_size_ha: parseFloat(form.areaPlantedHa),
        area_planted_are: areaAre,
        area_planted_ha: areaAre / 100,
        yield_per_are_kg: yieldPA,
        yield_per_ha_kg: Math.round(yieldPA * 100 * 10) / 10,
        total_yield_kg: Math.round(yieldPA * areaAre * 10) / 10,
        yield_range: `${Math.round(yieldPA * 0.92 * 10) / 10}–${Math.round(yieldPA * 1.08 * 10) / 10} kg/are`,
        confidence_pct: estimateConfidence({
          crop: form.crop,
          fertilizer: form.fertilizer,
          irrigation: form.irrigation,
          pestPressure: form.pestPressure,
          extensionAccess: form.extensionAccess,
          creditAccess: form.creditAccess,
          previousCrop: form.previousCrop,
          laborAvail: form.laborAvail,
          soil: form.soil,
          month: form.month,
          season: form.season,
        }),
        model_used: "Local Simulation (API offline)",
        district_avg_kg_are: CROP_BENCH[form.crop] || 20,
        inputs: {
          temperature: clim.temperature, 
          rainfall: clim.rainfall,
          humidity: clim.humidity, 
          sunshine: clim.sunshine,
          fertilizer_used: form.fertilizer, 
          irrigation_used: form.irrigation,
          soil_type: form.soil, 
          climate_source: "auto"
        },
        recommendations: buildRecs(form.crop, yieldPA, {
          area_are: areaAre,
          history: history,
          fertilizer: form.fertilizer,
          irrigation: form.irrigation,
          soil: form.soil,
          season: form.season,
          month: form.month,
          pest: form.pestPressure || "Low",
          prevCrop: form.previousCrop || "Maize",
          sector: form.sector,
          labor: form.laborAvail || "Adequate",
          credit: form.creditAccess || "No",
          extension: form.extensionAccess || "Yes",
          plantingDate: form.plantingDate,
        }),
      };
      setLoading(false);
      onResult(result);
      if (onSave) onSave(result);
      onNavigate("result");
    }
  };

  return (
    <>
      <Topbar 
        title={
          <div className="dash-header-clean">
            <button className="back-btn-modern" onClick={() => step === 1 ? onNavigate("dashboard") : setStep(1)}>
              <i className="bi bi-arrow-left"></i>
            </button>
            <div className="dash-header-text">
              <h1 className="dash-title">{t.newPred}</h1>
              <p className="dash-subtitle">{t.stepOf} {step}/2 — {step === 1 ? t.cropLocation : t.summary}</p>
            </div>
          </div>
        }
        onBack={null}
        lang={lang} 
        setLang={setLang}
        actions={null}
      />
      
      <div className="modern-steps-container">
        <div className={`m-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className={`m-step-line ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`m-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
      </div>

      {offline && <div className="modern-alert alert-error" style={{ margin: "0 24px 16px" }}>
        <i className="bi bi-wifi-off"></i> {t.offlineMode}
      </div>}

      <div className="scroll fade-up predict-content">
        {step === 1 ? (
          <div className="modern-form-container">
            <div className="form-section-title">
              <span className="title-icon"><i className="bi bi-info-circle"></i></span>
              <h3>{t.enterFarmDetails}</h3>
            </div>

            {/* Crop selection */}
            <div className="m-fgrp">
              <label className="m-flabel">{t.selectCrop}</label>
              <div className="modern-crop-selector">
                {CROPS.map(c => (
                  <button key={c} className={`m-crop-card ${form.crop === c ? "active" : ""}`} onClick={() => set("crop", c)}>
                    <div className="m-crop-icon"><CropIcon name={c} size={32} /></div>
                    <span className="m-crop-name">{c}</span>
                    {form.crop === c && <div className="m-crop-check"><i className="bi bi-check-lg"></i></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="m-form-grid">
              {/* Area Planted */}
              <div className="m-fgrp">
                <label className="m-flabel">{t.areaPlantedHa}</label>
                <div className="m-input-wrapper">
                  <i className="bi bi-rulers" style={{ fontSize:14 }} />
                  <input 
                    className="m-finput" 
                    type="number" 
                    min="0.01" 
                    max="25" 
                    step="0.01"
                    placeholder="0.00"
                    value={form.areaPlantedHa}
                    onChange={e => set("areaPlantedHa", e.target.value)}
                  />
                  <span className="m-input-suffix">ha</span>
                </div>
                {form.areaPlantedHa && (
                  <div className="m-hint">
                    <i className="bi bi-info-circle"></i> {Math.round(parseFloat(form.areaPlantedHa) * 100)} are
                    {parseFloat(form.areaPlantedHa) < 0.5 ? " (Small)" : parseFloat(form.areaPlantedHa) <= 1.5 ? " (Medium)" : " (Large)"}
                  </div>
                )}
              </div>

              {/* Farmer Category */}
              <div className="m-fgrp">
                <label className="m-flabel">{t.farmerCategory}</label>
                <div className="m-input-wrapper">
                  <i className="bi bi-person-badge" style={{ fontSize:14 }} />
                  <select className="m-finput" value={form.farmerCategory} onChange={e => set("farmerCategory", e.target.value)}>
                    <option value="Small">Small (&lt; 50 are)</option>
                    <option value="Medium">Medium (50–150 are)</option>
                    <option value="Large">Large (&gt; 150 are)</option>
                  </select>
                </div>
              </div>

              {/* Sector */}
              <div className="m-fgrp">
                <label className="m-flabel">{t.districtSector}</label>
                <div className="m-input-wrapper">
                  <i className="bi bi-geo-alt" style={{ fontSize:14 }} />
                  <select className="m-finput" value={form.sector} onChange={e => {
                    set("sector", e.target.value);
                    set("soil", SECTOR_SOIL_TYPE[e.target.value] || "Clay Soil");
                  }}>
                    <option value="">{t.selectLocation}</option>
                    {SECTORS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Planting Date */}
              <div className="m-fgrp">
                <label className="m-flabel">{t.plantingDate}</label>
                <div className="m-input-wrapper">
                  <i className="bi bi-calendar3" style={{ fontSize:14 }} />
                  <input 
                    className="m-finput" 
                    type="date" 
                    value={form.plantingDate}
                    onChange={e => handleDateChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Soil Type Info */}
            <div className="m-fgrp">
              <label className="m-flabel">{t.soilType}</label>
              {form.sector ? (() => {
                const st = SECTOR_SOIL_TYPE[form.sector] || "Clay Soil";
                const sd = SOIL_DISPLAY[st] || SOIL_DISPLAY["Clay Soil"];
                return (
                  <div className="modern-info-tile" style={{"--tile-color": sd.color}}>
                    <div className="tile-icon"><i className="bi bi-flower2"></i></div>
                    <div className="tile-content">
                      <div className="tile-title">{st}</div>
                      <div className="tile-sub">{sd.health} Quality · {form.sector} Sector</div>
                    </div>
                    <div className="tile-badge">{sd.health}</div>
                  </div>
                );
              })() : (
                <div className="modern-empty-tile">
                  <i className="bi bi-geo-alt"></i> {lang === "en" ? "Select sector to detect soil type" : "Hitamo Segiteri"}
                </div>
              )}
            </div>

            {/* Climate preview */}
            <div className="m-fgrp">
              <ClimateCard climate={autoClimate} month={form.month} season={form.season} lang={lang} isLive={isLiveClimate} />
            </div>

            <div className="form-section-title" style={{marginTop: 24}}>
              <span className="title-icon"><i className="bi bi-toggles"></i></span>
              <h3>{lang === "en" ? "Additional Factors" : "Ibindi bintu"}</h3>
            </div>

            <div className="m-form-grid">
              <div className="m-fgrp">
                <label className="m-flabel">{t.fertilizerUsed}</label>
                <div className="modern-toggle">
                  <button className={`m-toggle-btn ${form.fertilizer ? "active" : ""}`} onClick={() => set("fertilizer", true)}>{lang === "en" ? "Yes" : "Yego"}</button>
                  <button className={`m-toggle-btn ${!form.fertilizer ? "active" : ""}`} onClick={() => set("fertilizer", false)}>{lang === "en" ? "No" : "Oya"}</button>
                </div>
              </div>

              <div className="m-fgrp">
                <label className="m-flabel">{t.irrigationUsed}</label>
                <div className="modern-toggle">
                  <button className={`m-toggle-btn ${form.irrigation ? "active" : ""}`} onClick={() => set("irrigation", true)}>{lang === "en" ? "Yes" : "Yego"}</button>
                  <button className={`m-toggle-btn ${!form.irrigation ? "active" : ""}`} onClick={() => set("irrigation", false)}>{lang === "en" ? "No" : "Oya"}</button>
                </div>
              </div>
            </div>

            {/* Fertilizer amount — shown only when fertilizer = Yes */}
            {form.fertilizer && (
              <div className="m-fgrp fade-up" style={{ background:'var(--g50)', border:'1.5px solid var(--g200)', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                <label className="m-flabel" style={{ color:'var(--g800)' }}>
                  <i className="bi bi-droplet-fill" style={{ marginRight:6 }}></i>
                  {lang === 'en' ? 'Fertilizer Type' : 'Ubwoko bw\'Ifumbire'}
                </label>
                <div className="modern-chip-selector" style={{ marginBottom:12 }}>
                  {[
                    { val:'None',    label:'None',    hint: lang==='en'?'No fertilizer':'Nta fumbire',    askAmt: false },
                    { val:'DAP',     label:'DAP',     hint: lang==='en'?'At planting':'Igihe cyo gutera',   askAmt: true  },
                    { val:'NPK',     label:'NPK',     hint: lang==='en'?'Balanced':'Yuzuye',                askAmt: true  },
                    { val:'Urea',    label:'Urea',    hint: lang==='en'?'Top dressing':'Nyuma yo gutera',   askAmt: true  },
                    { val:'Organic', label:'Organic', hint: lang==='en'?'Compost/Manure':'Imborera/Amase', askAmt: false },
                    { val:'Mixed',   label:'Mixed',   hint: lang==='en'?'Organic+Inorganic':'Ivanze',       askAmt: true  },
                  ].map(s => (
                    <button key={s.val}
                      className={`m-chip ${form.fertilizerType === s.val ? 'active' : ''}`}
                      onClick={() => set('fertilizerType', s.val)}
                      style={{ flexDirection:'column', gap:2, padding:'8px 12px' }}
                    >
                      <span style={{ fontWeight:800 }}>{s.label}</span>
                      <span style={{ fontSize:10, opacity:.75 }}>{s.hint}</span>
                    </button>
                  ))}
                </div>

                {/* Amount — only for non-organic and non-none */}
                {form.fertilizerType && form.fertilizerType !== 'Organic' && form.fertilizerType !== 'None' && (
                  <div className="fade-up">
                    <label className="m-flabel" style={{ color:'var(--g800)' }}>
                      <i className="bi bi-rulers" style={{ marginRight:6 }}></i>
                      {lang === 'en' ? 'Amount (kg/are)' : 'Ingano (kg/are)'}
                    </label>
                    <div className="m-input-wrapper">
                      <input
                        className="m-finput"
                        type="number" min="0.1" max="5" step="0.1"
                        placeholder={lang === 'en' ? 'e.g. 1.5' : 'Urugero: 1.5'}
                        value={form.fertilizerAmountKgAre}
                        onChange={e => set('fertilizerAmountKgAre', e.target.value)}
                      />
                      <span className="m-input-suffix">kg/are</span>
                    </div>
                    <div className="m-hint">
                      <i className="bi bi-info-circle"></i>
                      {lang === 'en'
                        ? `Recommended for ${form.crop || 'your crop'}: ${form.crop === 'Maize' ? '1.5 kg/are' : '1.8 kg/are'}`
                        : `Birasabwa kuri ${form.crop || 'igihingwa cyawe'}: ${form.crop === 'Maize' ? '1.5 kg/are' : '1.8 kg/are'}`}
                    </div>
                  </div>
                )}

                {/* Organic — no amount needed */}
                {form.fertilizerType === 'Organic' && (
                  <div className="fade-up" style={{ background:'#f0fdfa', borderRadius:10, padding:'10px 12px', fontSize:12, color:'var(--g700)', fontWeight:600 }}>
                    <i className="bi bi-check-circle-fill" style={{ marginRight:6, color:'var(--g600)' }}></i>
                    {lang === 'en'
                      ? 'Organic fertilizer (compost/manure) — no specific amount needed. Good for soil health.'
                      : 'Ifumbire y\'imborera/amase — nta ngano ihariye isabwa. Byiza ku buzima bw\'ubutaka.'}
                  </div>
                )}

                {/* None — no fertilizer */}
                {form.fertilizerType === 'None' && (
                  <div className="fade-up" style={{ background:'#fef9c3', borderRadius:10, padding:'10px 12px', fontSize:12, color:'#713f12', fontWeight:600 }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ marginRight:6, color:'#d97706' }}></i>
                    {lang === 'en'
                      ? 'No fertilizer applied — this may reduce your yield by up to 12%. Consider applying fertilizer next season.'
                      : 'Nta fumbire yakoreshejwe — ibi bishobora kugabanya umusaruro wawe kugeza 12%. Tekereza gukoresha ifumbire mu gihe gikurikira.'}
                  </div>
                )}
              </div>
            )}

            {/* Seed Variety — shown after crop is selected */}
            {form.crop && (
              <div className="m-fgrp fade-up">
                <label className="m-flabel">
                  <i className="bi bi-flower2" style={{ marginRight:6 }}></i>
                  {lang === 'en' ? 'Seed Variety' : 'Ubwoko bw\'Imbuto'}
                </label>
                <div className="modern-chip-selector">
                  {[
                    { val:'Improved', icon: <i className="bi bi-star-fill"></i>, label: lang==='en'?'Improved':'Nziza', hint: lang==='en'?'+15% yield':'Umusaruro +15%' },
                    { val:'Hybrid',   icon: <i className="bi bi-stars"></i>, label: lang==='en'?'Hybrid':'Hybrid',  hint: lang==='en'?'+20% yield':'Umusaruro +20%' },
                    { val:'Local',    icon: <i className="bi bi-flower1"></i>, label: lang==='en'?'Local':'Gakondo',   hint: lang==='en'?'Standard':'Isanzwe' },
                  ].map(s => (
                    <button key={s.val}
                      className={`m-chip ${form.seedVariety === s.val ? 'active' : ''}`}
                      onClick={() => set('seedVariety', s.val)}
                      style={{ flexDirection:'column', gap:2, padding:'10px 14px' }}
                    >
                      <span style={{ fontSize:18 }}>{s.icon}</span>
                      <span style={{ fontWeight:800 }}>{s.label}</span>
                      <span style={{ fontSize:10, opacity:.75 }}>{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Terrain */}
            <div className="m-fgrp">
              <label className="m-flabel">
                <i className="bi bi-geo-alt" style={{ marginRight:6 }}></i>
                {lang === 'en' ? 'Farm Terrain' : 'Aho Akarima Gaherereye'}
              </label>
              <div className="modern-chip-selector">
                {[
                  { val:'Valley',   icon: <i className="bi bi-water"></i>, label: lang==='en'?'Valley':'Ikiyaga',   hint: lang==='en'?'Best for Rice':'Ryiza kuri Umuceri' },
                  { val:'Flat',     icon: <i className="bi bi-dash-lg"></i>, label: lang==='en'?'Flat Land':'Gasozi',  hint: lang==='en'?'Good for all':'Byiza kuri byose' },
                  { val:'Hillside', icon: <i className="bi bi-triangle-fill"></i>, label: lang==='en'?'Hillside':'Umusozi',  hint: lang==='en'?'Lower yield':'Umusaruro muke' },
                ].map(s => (
                  <button key={s.val}
                    className={`m-chip ${form.terrain === s.val ? 'active' : ''}`}
                    onClick={() => set('terrain', s.val)}
                    style={{ flexDirection:'column', gap:2, padding:'10px 14px' }}
                  >
                    <span style={{ fontSize:18 }}>{s.icon}</span>
                    <span style={{ fontWeight:800 }}>{s.label}</span>
                    <span style={{ fontSize:10, opacity:.75 }}>{s.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="m-fgrp">
              <label className="m-flabel">{lang === "en" ? "Previous Crop" : "Igihingwa Cyahinzwe"}</label>
              <div className="modern-chip-selector">
                {["Maize", "Rice", "Fallow", "Cassava"].map(pc => (
                  <button key={pc} className={`m-chip ${form.previousCrop === pc ? "active" : ""}`} onClick={() => set("previousCrop", pc)}>
                    {pc}
                  </button>
                ))}
              </div>
            </div>

            {/* Planting Date Status Card */}
            {plantingStatus && (
              <div className="fade-up" style={{
                background: plantingStatus.diffDays > 0
                  ? 'linear-gradient(135deg,#f0fdfa,#ccfbf1)'
                  : 'linear-gradient(135deg,#f0fdfa,#ccfbf1)',
                border: `1.5px solid ${plantingStatus.diffDays > 0 ? '#5eead4' : '#5eead4'}`,
                borderRadius: 16, padding: '16px 18px', marginBottom: 16
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    background: plantingStatus.diffDays > 0 ? '#0d9488' : '#0d9488',
                    display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:16
                  }}>
                    <i className={`bi ${plantingStatus.diffDays > 0 ? 'bi-calendar-event' : 'bi-check-circle-fill'}`}></i>
                  </div>
                  <div style={{ fontWeight:800, fontSize:14, color: plantingStatus.diffDays > 0 ? '#0f3d38' : '#0f3d38' }}>
                    {plantingStatus.diffDays > 0
                      ? (lang==='en' ? `Planting in ${plantingStatus.diffDays} days` : `Gutera mu minsi ${plantingStatus.diffDays}`)
                      : plantingStatus.diffDays === 0
                        ? (lang==='en' ? 'Planting Today!' : 'Utera Uyu Munsi!')
                        : (lang==='en' ? `Already planted ${Math.abs(plantingStatus.diffDays)} days ago` : `Wateye hashize imisi ${Math.abs(plantingStatus.diffDays)}`)}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div style={{ background:'white', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px' }}>
                      {lang==='en' ? 'Expected Harvest' : 'Itariki yo Gusarura'}
                    </div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginTop:3 }}>
                      📅 {plantingStatus.harvestStr}
                    </div>
                    <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>
                      {plantingStatus.daysToHarv > 0
                        ? (lang==='en' ? `in ${plantingStatus.daysToHarv} days` : `mu minsi ${plantingStatus.daysToHarv}`)
                        : (lang==='en' ? 'Harvest time!' : 'Igihe cyo gusarura!')}
                    </div>
                  </div>
                  <div style={{ background:'white', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px' }}>
                      {lang==='en' ? 'Climate at Harvest' : 'Ikirere Igihe cyo Gusarura'}
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', marginTop:3 }}>
                      <i className="bi bi-thermometer-half" style={{ marginRight: 4 }}></i> {plantingStatus.harvestClim?.temperature}°C
                      &nbsp;·&nbsp;
                      <i className="bi bi-cloud-rain-fill" style={{ marginRight: 4 }}></i> {plantingStatus.harvestClim?.rainfall}mm
                    </div>
                    <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>
                      {plantingStatus.harvestMonth} · {plantingStatus.harvestSeason}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button className="btn-modern-primary" onClick={() => setStep(2)} disabled={!step1Valid} style={{ marginTop: 8 }}>
              {t.continueStep2 || 'Continue →'} <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        ) : (
          <div className="modern-form-container">
            <div className="form-section-title">
              <span className="title-icon"><i className="bi bi-check-circle-fill"></i></span>
              <h3>{t.reviewPredict}</h3>
            </div>

            <div className="modern-summary-card">
              <div className="summary-main">
                <div className="s-main-item">
                  <span className="s-label">{t.cropType}</span>
                  <div className="s-val-group">
                    <CropIcon name={form.crop} size={32} />
                    <span className="s-val-large">{form.crop}</span>
                  </div>
                </div>
                <div className="s-main-item">
                  <span className="s-label">{t.areaPlantedHa}</span>
                  <span className="s-val-large">{form.areaPlantedHa} ha</span>
                </div>
              </div>
              
              <div className="summary-grid">
                {[
                  { label: "Location",   val: form.sector,   icon: <i className="bi bi-geo-alt" style={{ color:'var(--g600)' }}></i> },
                  { label: "Date",       val: form.plantingDate, icon: <i className="bi bi-calendar3" style={{ color:'var(--g600)' }}></i> },
                  { label: "Season",     val: form.season,   icon: <i className="bi bi-sun" style={{ color:'var(--g600)' }}></i> },
                  { label: "Soil",       val: form.soil,     icon: <i className="bi bi-flower2" style={{ color:'var(--g600)' }}></i> },
                  { label: "Fertilizer", val: form.fertilizer ? `Yes (${form.fertilizerAmountKgAre || '1.5'} kg/are)` : "No", icon: <i className="bi bi-droplet" style={{ color:'var(--g600)' }}></i> },
                  { label: "Irrigation", val: form.irrigation ? "Yes" : "No", icon: <i className="bi bi-water" style={{ color:'var(--g600)' }}></i> },
                  { label: "Seed",       val: form.seedVariety || 'Improved',       icon: <i className="bi bi-flower2" style={{ color:'var(--g600)' }}></i> },
                  { label: "Terrain",    val: form.terrain || 'Flat',               icon: <i className="bi bi-geo-alt" style={{ color:'var(--g600)' }}></i> },
                ].map(item => (
                  <div key={item.label} className="s-grid-item">
                    <div className="s-grid-icon">{item.icon}</div>
                    <div className="s-grid-info">
                      <span className="s-grid-lbl">{item.label}</span>
                      <span className="s-grid-val">{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Harvest date preview in step 2 */}
              {plantingStatus && (
                <div style={{ marginTop:14, padding:'12px 14px', background:'var(--g50)', borderRadius:10, border:'1px solid var(--g200)', display:'flex', alignItems:'center', gap:10 }}>
                  <i className="bi bi-calendar-check-fill" style={{ color:'var(--g600)', fontSize:18 }}></i>
                  <div>
                    <div style={{ fontSize:12, fontWeight:800, color:'var(--g800)' }}>
                      {lang==='en' ? 'Expected Harvest:' : 'Itariki yo Gusarura:'} {plantingStatus.harvestStr}
                    </div>
                    <div style={{ fontSize:11, color:'var(--s500)' }}>
                      {lang==='en'
                        ? `${plantingStatus.harvestDays} days growing · Climate: ${plantingStatus.harvestClim?.temperature}°C, ${plantingStatus.harvestClim?.rainfall}mm rain`
                        : `Imisi ${plantingStatus.harvestDays} yo gukura · Ikirere: ${plantingStatus.harvestClim?.temperature}°C, ${plantingStatus.harvestClim?.rainfall}mm imvura`}
                    </div>
                  </div>
                </div>
              )}
              
              <button className="btn-edit-modern" onClick={() => setStep(1)} style={{ marginTop:12 }}>
                <i className="bi bi-pencil"></i> {t.edit}
              </button>
            </div>

            <ClimateCard climate={autoClimate} month={form.month} season={form.season} lang={lang} isLive={isLiveClimate} />

            <div className="modern-info-banner">
              <i className="bi bi-stars"></i>
              <p>{lang === "en" ? "Ready to generate your prediction using Gradient Boosting ML model." : "Teguye gukora isubiramo ukoresheje ML model."}</p>
            </div>

            <button className="btn-modern-primary btn-predict" onClick={handlePredict} disabled={loading}>
              {loading ? <><div className="spin-white" /> {t.runningModel}</> : <><i className="bi bi-cpu-fill"></i> {t.getHarvestPrediction}</>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}


