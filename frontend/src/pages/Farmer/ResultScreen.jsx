import React from 'react';
import { T, fmtDate } from '../../constants/constants';
import Topbar from '../../components/Common/Topbar';

export default function ResultScreen({ result, onNavigate, onSave, history = [], lang, setLang }) {
  const t = T[lang];
  if (!result) return null;

  const SEASON_BENCH_RESULT = {
    "Season A": { Maize: 23.86, Rice: 37.96 },
    "Season B": { Maize: 22.59, Rice: 34.77 },
  };

  const seasonAvg = (SEASON_BENCH_RESULT[result.season] || SEASON_BENCH_RESULT["Season A"])[result.crop]
                    || result.district_avg_kg_are || 20;
  const pct = ((result.yield_per_are_kg - seasonAvg) / seasonAvg * 100);

  const generatePDF = () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF library still loading, please wait a moment.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(22, 163, 74); // var(--g600)
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Harvest Predictor - Official Report", 15, 25);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 25);

    // Farmer Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("1. Farmer Information", 15, 55);
    doc.setFontSize(11);
    const farmerData = [
      ["Report ID", result.id],
      ["Farmer ID", result.farmer_id],
      ["Location", `Bugesera · ${result.sector}`],
      ["Crop Type", `${result.crop}`],
      ["Land Size", `${result.area_planted_are || result.farm_size_are} are`],
    ];
    doc.autoTable({
      startY: 60,
      head: [['Field', 'Details']],
      body: farmerData,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] }
    });

    // Prediction Result
    doc.setFontSize(14);
    doc.text("2. Prediction Analysis", 15, doc.lastAutoTable.finalY + 15);
    const predData = [
      ["Expected Yield (Range)", result.yield_range],
      ["Yield per Are", `${result.yield_per_are_kg} kg/are`],
      ["Total Estimate", `${result.total_yield_kg} kg`],
      ["ML Confidence Score", `${result.confidence_pct}%`],
      ["Model Used", result.model_used],
    ];
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Metric', 'Value']],
      body: predData,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] }
    });

    // Recommendations
    doc.setFontSize(14);
    doc.text("3. Agricultural Recommendations", 15, doc.lastAutoTable.finalY + 15);
    const recs = result.recommendations.map(r => [r.category?.split(" / ")[0] || r.category, r.message]);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Category', 'Advice']],
      body: recs,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Note: These estimates are based on ML models and historical weather patterns in Bugesera.", 15, finalY);
    doc.text("Always consult with local extension officers for field-specific decisions.", 15, finalY + 5);
    
    doc.save(`Harvest_Report_${result.id}.pdf`);
  };

  const sameCropHistory = history.filter(h =>
    h.crop === result.crop && h.id !== result.id
  );
  const sameSeasonHistory = history.filter(h =>
    h.crop === result.crop && h.season === result.season && h.id !== result.id
  );
  const histAvg = sameCropHistory.length > 0
    ? sameCropHistory.reduce((s, h) => s + h.yield_per_are_kg, 0) / sameCropHistory.length
    : null;
  const lastSame = sameSeasonHistory.length > 0
    ? sameSeasonHistory[sameSeasonHistory.length - 1]
    : null;
  const histTrend = histAvg
    ? ((result.yield_per_are_kg - histAvg) / histAvg * 100)
    : null;

  return (
    <>
      <Topbar 
        title={lang === "en" ? "Prediction Result" : "Ibisobanuro"} 
        sub={`ID: ${result.id}`}
        onBack={() => onNavigate("dashboard")} 
        lang={lang} 
        setLang={setLang}
      />
      <div className="scroll fade-up">
        <div className="result-hero" style={{ background: "linear-gradient(135deg, var(--g900), var(--g800))", color: "white", padding: "30px 20px", borderRadius: "18px", textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, opacity: .75, marginBottom: 4 }}>{t.expectedHarvest}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{t.predictionComplete}</div>
          <div className="result-big" style={{ fontSize: 32, fontWeight: 900, marginTop: 12 }}>{result.yield_range}</div>
          <div className="result-unit" style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{t.perAreEst}</div>
          <div className="result-meta" style={{ display: "flex", justifyContent: "space-around", marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
            <div className="result-meta-item">
              <div className="result-meta-val" style={{ fontWeight: 800 }}>{result.total_yield_kg} kg</div>
              <div className="result-meta-lbl" style={{ fontSize: 10, opacity: 0.8 }}>{t.total} ({result.area_planted_are || result.farm_size_are}a)</div>
            </div>
            <div className="result-meta-item">
              <div className="result-meta-val" style={{ fontWeight: 800 }}>{result.confidence_pct}%</div>
              <div className="result-meta-lbl" style={{ fontSize: 10, opacity: 0.8 }}>{t.confidence}</div>
            </div>
            <div className="result-meta-item">
              <div className="result-meta-val" style={{ fontWeight: 800, fontSize: 12 }}>
                {result.model_used || "Gradient Boosting"}
              </div>
              <div className="result-meta-lbl" style={{ fontSize: 10, opacity: 0.8 }}>
                {lang === "en" ? "Analysis Method" : "Uburyo Bwakoreshejwe"}
              </div>
            </div>
          </div>
        </div>

        {/* Powered-by badge */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'rgba(255,255,255,0.08)', borderRadius: 99,
          padding: '5px 14px', marginBottom: 4, marginTop: -8
        }}>
          <i className="bi bi-cpu" style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}></i>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
            {lang === 'en'
              ? `Powered by ${result.model_used || 'Gradient Boosting'} · Based on 2,502 Bugesera farm records`
              : `Bikoresheje ${result.model_used || 'Gradient Boosting'} · Bishingiye ku masambu 2,502 ya Bugesera`}
          </span>
        </div>

        {/* Key Metrics */}
        <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 14 }}>
          {[
            [(<i className="bi bi-graph-up"></i>), `${result.yield_per_are_kg} kg/are`, lang === "en" ? "Yield per Are" : "Umusaruro kuri Are"],
            [(<i className="bi bi-house-fill"></i>), `${result.yield_per_ha_kg} kg/ha`, lang === "en" ? "Yield per Ha" : "Umusaruro kuri Ha"],
            [(<i className="bi bi-box-seam"></i>), `${result.total_yield_kg} kg`, lang === "en" ? "Total Harvest" : "Umusaruro Wose"],
            [(<i className="bi bi-rulers"></i>), `${result.area_planted_are || result.farm_size_are} are`, lang === "en" ? "Area Planted" : "Ubuso Bwatewe"],
          ].map(([icon, val, lbl]) => (
            <div key={lbl} className="stat-box" style={{ background: "white", border: "1px solid var(--s200)", padding: 12, borderRadius: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 22, color: "var(--g700)" }}>{icon}</div>
              <div className="stat-val" style={{ fontSize: 15, fontWeight: 800 }}>{val}</div>
              <div className="stat-lbl" style={{ fontSize: 10, color: "var(--s500)" }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="sec-hd" style={{ marginBottom: 10 }}><i className="bi bi-bar-chart-line"></i> {t.comparison}</div>
          {[
            [`${result.season || "Season"} average:`, `${seasonAvg.toFixed(2)} kg/are`],
            [t.yourPrediction, `${result.yield_per_are_kg} kg/are`]
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--s100)" }}>
              <span style={{ fontSize: 13, color: "var(--s500)" }}>{k}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: "var(--g700)" }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: 8, background: pct >= 0 ? "var(--g50)" : "var(--amber-l)", borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 700, color: pct >= 0 ? "var(--g800)" : "var(--amber-d)" }}>
            {pct >= 0
              ? (<><i className="bi bi-check-circle"></i> +{pct.toFixed(1)}% above {result.season || "season"} average ({seasonAvg.toFixed(1)} kg/are)</>)
              : (<><i className="bi bi-exclamation-triangle"></i> {pct.toFixed(1)}% below {result.season || "season"} average ({seasonAvg.toFixed(1)} kg/are)</>)}
          </div>
        </div>

        {/* History comparison card */}
        {sameCropHistory.length > 0 && (
          <div className="card" style={{ marginBottom: 14, borderColor: histTrend >= 10 ? "var(--g300)" : histTrend >= -10 ? "var(--s200)" : "var(--red-l)" }}>
            <div className="sec-hd" style={{ marginBottom: 10 }}>
              <i className="bi bi-graph-up"></i> {lang === "en" ? "Your Crop Harvest History" : "Amateka y'Imyaka yawe"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--s100)" }}>
              <span style={{ fontSize: 13, color: "var(--s500)" }}>Your avg ({sameCropHistory.length} prediction{sameCropHistory.length > 1 ? "s" : ""})</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: "var(--g700)" }}>{histAvg.toFixed(2)} kg/are</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--s100)" }}>
              <span style={{ fontSize: 13, color: "var(--s500)" }}>This prediction</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: "var(--g700)" }}>{result.yield_per_are_kg} kg/are</span>
            </div>
            {lastSame && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--s100)" }}>
                <span style={{ fontSize: 13, color: "var(--s500)" }}>Last {result.season}</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: "var(--g700)" }}>{lastSame.yield_per_are_kg} kg/are</span>
              </div>
            )}
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, textAlign: "center", fontWeight: 700, fontSize: 13, background: histTrend >= 10 ? "var(--g100)" : histTrend >= -10 ? "var(--blue-l)" : "var(--red-l)", color: histTrend >= 10 ? "var(--g800)" : histTrend >= -10 ? "var(--blue-d)" : "var(--red-d)" }}>
              {histTrend >= 10
                ? (<><i className="bi bi-check-circle"></i> +{histTrend.toFixed(1)}% better than your own average — improving!</>)
                : histTrend >= -10
                  ? (<><i className="bi bi-bar-chart-line"></i> {histTrend.toFixed(1)}% vs your own average — consistent</>)
                  : (<><i className="bi bi-exclamation-triangle"></i> {histTrend.toFixed(1)}% below your own average — needs attention</>)}
            </div>
          </div>
        )}

        {/* Soil details */}
        {result.soil_data && Object.keys(result.soil_data).length > 0 && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="sec-hd" style={{ marginBottom: 10 }}><i className="bi bi-flower2"></i> {t.soilInfo} — {result.sector}</div>
            {[
              ["pH Level", result.soil_data.ph_level || result.soil_data.ph],
              ["Nitrogen", result.soil_data.nitrogen_ppm || result.soil_data.n],
              ["Phosphorus", result.soil_data.phosphorus_ppm || result.soil_data.p],
              ["Potassium", result.soil_data.potassium_ppm || result.soil_data.k]
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--s100)" }}>
                <span style={{ fontSize: 13, color: "var(--s500)" }}>{k}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{v || "Good"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div className="sec-hd" style={{ marginBottom: 4 }}>
          <i className="bi bi-clipboard-data"></i> {t.recommendations}
        </div>
        <div style={{ background: "var(--g50)", border: "1px solid var(--g200)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "var(--g800)", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <i className="bi bi-bullseye" style={{ fontSize: 15, marginTop: 1, flexShrink: 0 }}></i>
          <span>
            <strong>{lang === "en" ? "Goal:" : "Intego:"}</strong> {lang === "en"
              ? "Data-driven recommendations to help you optimize planting schedules, resource use, and harvest planning."
              : "Inama zishingiye ku makuru kugirango ugufashe gutegura igihe cyo gutera, gukoresha ibikoresho, no gutegura gusarura."}
          </span>
        </div>

        {result.recommendations?.map((r, i) => (
          <div key={i} className={`rec rec-${r.type}`} style={{ marginBottom: 10, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 2 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                background: r.type === "success" ? "var(--g100)" : r.type === "warning" ? "#fef3c7" : "#ccfbf1",
                color: r.type === "success" ? "var(--g700)" : r.type === "warning" ? "#92400e" : "#0d9488"
              }}>
                <i className={`bi ${r.icon || 'bi-lightbulb'}`}></i>
              </div>
              <div style={{ fontWeight: 800, fontSize: 13, color: r.type === "success" ? "var(--g800)" : r.type === "warning" ? "#92400e" : "#0f3d38", line: 1.3 }}>
                {r.category?.split(" / ")[lang === "en" ? 0 : 1] || r.category}
              </div>
            </div>
            <div style={{ fontSize: 13, line: 1.6, color: "var(--s700)", paddingLeft: 43 }}>
              {lang === "en" ? r.message : (r.message_rw || r.message)}
            </div>
            {r.goal && (
              <div style={{ paddingLeft: 43, marginTop: 2 }}>
                <span style={{ fontSize: 10, background: "rgba(0,0,0,0.05)", borderRadius: 6, padding: "2px 8px", color: "var(--s500)", fontWeight: 600 }}>
                  ✔ {lang === "en" ? "Goal: " : "Intego: "}{lang === "en" ? r.goal : (r.goal_rw || r.goal)}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Download PDF Reports and Re-predict Triggers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24, marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={generatePDF} 
            style={{ background: "var(--g700)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "15px", borderRadius: 14 }}>
            <span style={{ fontSize: 20 }}><i className="bi bi-file-earmark-text"></i></span> {lang === "en" ? "Download Your Prediction Result" : "Kuramo Raporo y'Igisobanuro Cyawe"}
          </button>
          
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => onNavigate("predict")} 
              style={{ flex: 1, border: "1px solid var(--s300)", background: "white", color: "var(--s700)", padding: "12px", borderRadius: 12, fontWeight: 700 }}>
               <i className="bi bi-arrow-repeat"></i> {lang === "en" ? "New Prediction" : "Ibisobanuro bishya"}
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate("dashboard")} 
              style={{ flex: 1, border: "1px solid var(--s300)", background: "white", color: "var(--s700)", padding: "12px", borderRadius: 12, fontWeight: 700 }}>
               <i className="bi bi-house"></i> {lang === "en" ? "Dashboard" : "Ahabanza"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
