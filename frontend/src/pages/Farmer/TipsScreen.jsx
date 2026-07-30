import React, { useState } from 'react';
import { T } from '../../constants/constants';
import Topbar from '../../components/Common/Topbar';

export default function TipsScreen({ onNavigate, lang, setLang, user }) {
  const t = T[lang];
  const [open, setOpen] = useState(null);

  const tips = [
    {
      icon: <i className="bi bi-flower2"></i>,
      title: lang === "en" ? "Soil Preparation" : "Gutegura Ubutaka",
      bg: "var(--g50)",
      bc: "var(--g300)",
      tc: "var(--g800)",
      items: lang === "en"
        ? [
            "Test soil pH every season — optimal 5.8–7.0 for Bugesera crops",
            "Add compost (20 kg/are) 2 weeks before planting",
            "Deep plow to 20–25cm to break hardpan",
            "Apply lime if pH < 5.5 (2 kg lime/are)"
          ]
        : [
            "Suzuma pH buri gihe — Bugesera: 5.8–7.0",
            "Ongeraho imborera (20 kg/are) ibyumweru 2 mbere yo gutera",
            "Hinga bugufi 20–25cm",
            "Koresha lime niba pH < 5.5"
          ]
    },
    {
      icon: <i className="bi bi-droplet"></i>,
      title: lang === "en" ? "Water Management" : "Gucunga Amazi",
      bg: "var(--blue-l)",
      bc: "#5eead4",
      tc: "var(--blue-d)",
      items: lang === "en"
        ? [
            "Furrow or drip irrigation saves 30–40% water",
            "Water early morning (6–8am) to minimize evaporation",
            "Apply 4–6cm mulch to retain soil moisture",
            "Monitor at 15cm depth — irrigate when dry"
          ]
        : [
            "Kuhira mu mirwamo bigabanya amazi 30–40%",
            "Hira mu gitondo (6–8am)",
            "Shyira imfuro (4–6cm) ku butaka",
            "Suzuma ubuhehere 15cm munsi y'ubutaka"
          ]
    },
    {
      icon: <i className="bi bi-flower1"></i>,
      title: lang === "en" ? "Maize Agronomy" : "Ubuhinzi bw'Ibigori",
      bg: "#fffbeb",
      bc: "#fde68a",
      tc: "var(--amber-d)",
      items: lang === "en"
        ? [
            "Spacing: 75cm × 25cm (~53,000 plants/ha)",
            "Apply DAP 0.5kg/are at planting; top-dress CAN at knee-height",
            "Scout weekly for Fall Armyworm",
            "Harvest at grain moisture ≤25%; dry to ≤13% before storage"
          ]
        : [
            "Intambuko: 75cm × 25cm (~53,000 plants/ha)",
            "Koresha DAP 0.5kg/are igihe utera; CAN ibigori bigeze ku mavi",
            "Scout buri cyumweru ureba Nkongwa y'ibigori",
            "Sarura ubushyuhe bugeze kuri ≤25%; yubika ≤13%"
          ]
    },
    {
      icon: <i className="bi bi-tree"></i>,
      title: lang === "en" ? "Rice Agronomy" : "Ubuhinzi bw'Umuceri",
      bg: "var(--purple-l)",
      bc: "#c4b5fd",
      tc: "#5b21b6",
      items: lang === "en"
        ? [
            "Use certified flood-tolerant varieties (JASMINE 85 or NERICA)",
            "Transplant at 20×20cm spacing",
            "Keep paddy flooded 5cm during vegetative stage",
            "Apply urea 0.5kg/are at tillering"
          ]
        : [
            "Koresha imbuto yemejwe yihanganira amazi (JASMINE 85 cyangwa NERICA)",
            "Kura mu nyanza wimure intera ya 20×20cm",
            "Bika amazi ku rugero rwa 5cm igihe umuceri ukura",
            "Koresha Urea 0.5kg/are igihe utangiye gushyira amashami"
          ]
    },
    {
      icon: <i className="bi bi-bug"></i>,
      title: lang === "en" ? "Pest Management" : "Kurwanya Udukoko",
      bg: "var(--red-l)",
      bc: "#fca5a5",
      tc: "var(--red-d)",
      items: lang === "en"
        ? [
            "Scout every 7 days during growing season",
            "Report Fall Armyworm to RAB extension",
            "Use neem oil (5ml/L) as first-line control",
            "Rotate crops each season"
          ]
        : [
            "Genyura umurima wawe buri minsi 7",
            "Menyesha extension officer (RAB) Fall Armyworm ubibonye",
            "Koresha amavuta ya neem (5ml/L) kurinda imyaka",
            "Hinduranya ibihingwa buri gihe cy'ihinga"
          ]
    }
  ];

  return (
    <>
      <Topbar 
        title={<><i className="bi bi-book"></i> {t.tipsTitle}</>} 
        sub={t.tipsSubtitle} 
        onBack={() => onNavigate("dashboard")} 
        lang={lang} 
        setLang={setLang}
      />
      <div className="scroll wide-scroll fade-up">
        <div style={{ fontSize: 12, color: "var(--s500)", marginBottom: 14, width: "100%", margin: "0 auto" }}>
          <i className="bi bi-clipboard-data"></i> {t.tailoredTips}
        </div>
        {tips.map((tip, i) => (
          <div 
            key={i} 
            className="tip-card" 
            style={{
              background: tip.bg,
              border: `1.5px solid ${tip.bc}`,
              borderRadius: "var(--radius)",
              padding: 20,
              marginBottom: 12,
              cursor: "pointer",
              width: "100%",
              margin: "0 auto"
            }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>{tip.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: tip.tc }}>{tip.title}</div>
                <div style={{ fontSize: 11, color: "var(--s500)", marginTop: 2 }}>{tip.items.length} {lang === "en" ? "tips" : "inama"}</div>
              </div>
              <span style={{ fontSize: 18, color: tip.tc }}>{open === i ? "▲" : "▼"}</span>
            </div>
            {open === i && (
              <div className="tip-body" style={{ marginTop: 15, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12 }}>
                {tip.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, marginBottom: 7, fontSize: 13, color: "var(--s700)", lineHeight: 1.5 }}>
                    <span style={{ fontSize: 10, marginTop: 4, color: tip.tc, flexShrink: 0 }}>●</span>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
