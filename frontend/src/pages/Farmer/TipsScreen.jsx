import React, { useState } from 'react';
import { T } from '../../constants/constants';
import Topbar from '../../components/Common/Topbar';
import { 
  LuSprout, LuDroplets, LuWheat, LuLeaf, LuBug, 
  LuChevronDown, LuChevronUp, LuCircleCheck, 
  LuCircleAlert, LuTrendingUp, LuBookOpen, LuSparkles
} from 'react-icons/lu';

export default function TipsScreen({ onNavigate, lang, setLang, user, hideLangBtn = false }) {
  const t = T[lang];
  const [open, setOpen] = useState(null);

  const tips = [
    {
      icon: <LuSprout size={24} />,
      title: lang === "en" ? "Soil Preparation" : "Gutegura Ubutaka",
      category: lang === "en" ? "Foundation" : "Ishingiro",
      gradient: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
      color: "#059669",
      lightBg: "#f0fdf4",
      items: lang === "en"
        ? [
            { text: "Test soil pH every season — optimal 5.8–7.0 for Bugesera crops", priority: "high" },
            { text: "Add compost (20 kg/are) 2 weeks before planting", priority: "high" },
            { text: "Deep plow to 20–25cm to break hardpan", priority: "medium" },
            { text: "Apply lime if pH < 5.5 (2 kg lime/are)", priority: "medium" }
          ]
        : [
            { text: "Suzuma pH buri gihe — Bugesera: 5.8–7.0", priority: "high" },
            { text: "Ongeraho imborera (20 kg/are) ibyumweru 2 mbere yo gutera", priority: "high" },
            { text: "Hinga bugufi 20–25cm", priority: "medium" },
            { text: "Koresha lime niba pH < 5.5", priority: "medium" }
          ]
    },
    {
      icon: <LuDroplets size={24} />,
      title: lang === "en" ? "Water Management" : "Gucunga Amazi",
      category: lang === "en" ? "Resource" : "Umutungo",
      gradient: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
      color: "#0891b2",
      lightBg: "#f0f9ff",
      items: lang === "en"
        ? [
            { text: "Furrow or drip irrigation saves 30–40% water", priority: "high" },
            { text: "Water early morning (6–8am) to minimize evaporation", priority: "high" },
            { text: "Apply 4–6cm mulch to retain soil moisture", priority: "medium" },
            { text: "Monitor at 15cm depth — irrigate when dry", priority: "medium" }
          ]
        : [
            { text: "Kuhira mu mirwamo bigabanya amazi 30–40%", priority: "high" },
            { text: "Hira mu gitondo (6–8am)", priority: "high" },
            { text: "Shyira imfuro (4–6cm) ku butaka", priority: "medium" },
            { text: "Suzuma ubuhehere 15cm munsi y'ubutaka", priority: "medium" }
          ]
    },
    {
      icon: <LuWheat size={24} />,
      title: lang === "en" ? "Maize Agronomy" : "Ubuhinzi bw'Ibigori",
      category: lang === "en" ? "Crop-Specific" : "Igihingwa",
      gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      color: "#d97706",
      lightBg: "#fffbeb",
      items: lang === "en"
        ? [
            { text: "Spacing: 75cm × 25cm (~53,000 plants/ha)", priority: "high" },
            { text: "Apply DAP 0.5kg/are at planting; top-dress CAN at knee-height", priority: "high" },
            { text: "Scout weekly for Fall Armyworm", priority: "high" },
            { text: "Harvest at grain moisture ≤25%; dry to ≤13% before storage", priority: "medium" }
          ]
        : [
            { text: "Intambuko: 75cm × 25cm (~53,000 plants/ha)", priority: "high" },
            { text: "Koresha DAP 0.5kg/are igihe utera; CAN ibigori bigeze ku mavi", priority: "high" },
            { text: "Scout buri cyumweru ureba Nkongwa y'ibigori", priority: "high" },
            { text: "Sarura ubushyuhe bugeze kuri ≤25%; yubika ≤13%", priority: "medium" }
          ]
    },
    {
      icon: <LuLeaf size={24} />,
      title: lang === "en" ? "Rice Agronomy" : "Ubuhinzi bw'Umuceri",
      category: lang === "en" ? "Crop-Specific" : "Igihingwa",
      gradient: "linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)",
      color: "#7c3aed",
      lightBg: "#faf5ff",
      items: lang === "en"
        ? [
            { text: "Use certified flood-tolerant varieties (JASMINE 85 or NERICA)", priority: "high" },
            { text: "Transplant at 20×20cm spacing", priority: "high" },
            { text: "Keep paddy flooded 5cm during vegetative stage", priority: "medium" },
            { text: "Apply urea 0.5kg/are at tillering", priority: "medium" }
          ]
        : [
            { text: "Koresha imbuto yemejwe yihanganira amazi (JASMINE 85 cyangwa NERICA)", priority: "high" },
            { text: "Kura mu nyanza wimure intera ya 20×20cm", priority: "high" },
            { text: "Bika amazi ku rugero rwa 5cm igihe umuceri ukura", priority: "medium" },
            { text: "Koresha Urea 0.5kg/are igihe utangiye gushyira amashami", priority: "medium" }
          ]
    },
    {
      icon: <LuBug size={24} />,
      title: lang === "en" ? "Pest Management" : "Kurwanya Udukoko",
      category: lang === "en" ? "Protection" : "Kurinda",
      gradient: "linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)",
      color: "#dc2626",
      lightBg: "#fef2f2",
      items: lang === "en"
        ? [
            { text: "Scout every 7 days during growing season", priority: "high" },
            { text: "Report Fall Armyworm to RAB extension", priority: "high" },
            { text: "Use neem oil (5ml/L) as first-line control", priority: "medium" },
            { text: "Rotate crops each season", priority: "medium" }
          ]
        : [
            { text: "Genyura umurima wawe buri minsi 7", priority: "high" },
            { text: "Menyesha extension officer (RAB) Fall Armyworm ubibonye", priority: "high" },
            { text: "Koresha amavuta ya neem (5ml/L) kurinda imyaka", priority: "medium" },
            { text: "Hinduranya ibihingwa buri gihe cy'ihinga", priority: "medium" }
          ]
    }
  ];

  const getPriorityBadge = (priority) => {
    if (priority === "high") {
      return (
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 4,
          background: '#dc2626',
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3
        }}>
          <LuCircleAlert size={9} />
          {lang === "en" ? "KEY" : "NYAMUKURU"}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <Topbar 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LuBookOpen size={22} />
            {t.tipsTitle}
          </div>
        } 
        sub={t.tipsSubtitle} 
        onBack={() => onNavigate("dashboard")} 
        lang={lang} 
        setLang={setLang}
        hideLangBtn={hideLangBtn}
      />
      <div className="scroll wide-scroll fade-up" style={{ padding: '20px 16px' }}>
        
        {/* Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 24,
          color: 'white',
          boxShadow: '0 8px 20px rgba(13, 148, 136, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <LuSparkles size={24} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, marginBottom: 4 }}>
                {lang === "en" ? "Expert Farming Guidance" : "Ubuhanga mu Buhinzi"}
              </h2>
              <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>
                {t.tailoredTips || (lang === "en" ? "Tailored for Bugesera District smallholder farmers" : "Byagenwe abahinzi ba Bugesera")}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{tips.length}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{lang === "en" ? "Topics" : "Ingingo"}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {tips.reduce((acc, tip) => acc + tip.items.length, 0)}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{lang === "en" ? "Tips" : "Inama"}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <LuTrendingUp size={20} />
                100%
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{lang === "en" ? "Practical" : "Bifatika"}</div>
            </div>
          </div>
        </div>

        {/* Tips Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tips.map((tip, i) => (
            <div 
              key={i} 
              className="tip-card-modern"
              style={{
                background: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Header */}
              <div 
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  background: tip.gradient,
                  padding: '18px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  userSelect: 'none'
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tip.color,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  flexShrink: 0
                }}>
                  {tip.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: tip.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 4
                  }}>
                    {tip.category}
                  </div>
                  <div style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: '#0f172a',
                    marginBottom: 4
                  }}>
                    {tip.title}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <LuCircleCheck size={13} />
                    {tip.items.length} {lang === "en" ? "practical tips" : "inama zifatika"}
                  </div>
                </div>
                
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tip.color,
                  fontSize: 18,
                  flexShrink: 0
                }}>
                  {open === i ? <LuChevronUp size={20} /> : <LuChevronDown size={20} />}
                </div>
              </div>

              {/* Content */}
              {open === i && (
                <div style={{
                  padding: '20px',
                  background: tip.lightBg,
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tip.items.map((item, j) => (
                      <div 
                        key={j} 
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: '12px 14px',
                          background: 'white',
                          borderRadius: 10,
                          border: `1px solid ${tip.color}20`,
                          fontSize: 13,
                          color: '#334155',
                          lineHeight: 1.6,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: tip.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 2
                        }}>
                          {j + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ flex: 1, fontWeight: 500 }}>{item.text}</span>
                            {getPriorityBadge(item.priority)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Footer */}
                  <div style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    background: 'white',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#64748b',
                    border: `1px dashed ${tip.color}40`
                  }}>
                    <LuCircleAlert size={16} color={tip.color} />
                    <span style={{ fontWeight: 600 }}>
                      {lang === "en" 
                        ? "Need help? Contact your sector agricultural officer" 
                        : "Ufite ikibazo? Vugana n'ofisiye w'ubuhinzi w'umurenge wawe"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Info Card */}
        <div style={{
          marginTop: 24,
          padding: '16px 18px',
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          color: '#64748b'
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#f0fdf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <LuCircleCheck size={18} color="#059669" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 2 }}>
              {lang === "en" ? "Updated for Bugesera District" : "Byavuguruwe kuri Bugesera"}
            </div>
            <div style={{ fontSize: 11 }}>
              {lang === "en" 
                ? "All tips are validated by RAB agricultural experts" 
                : "Izi nama zose zemejwe n'impuguke z'ubuhinzi za RAB"}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .tip-card-modern {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
