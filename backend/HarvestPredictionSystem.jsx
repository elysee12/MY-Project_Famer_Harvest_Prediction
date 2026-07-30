import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   BUGESERA HARVEST PREDICTION SYSTEM  v4.0
   Author : Cesalie UWIMPUHWE | UNIVERSITY OF KIGALI
   Units  : ha input → are sent to model | Result: kg/are
   ═══════════════════════════════════════════════════════════════════════ */

const API_BASE = "http://localhost:5000";

// ── Monthly climate averages ──────────────────────────────────────────────────
const CLIMATE = {
  January:   {temperature:22.4,rainfall:66, humidity:72,sunshine:7.8,windSpeed:11.2,evapotranspiration:108},
  February:  {temperature:22.8,rainfall:72, humidity:73,sunshine:7.6,windSpeed:11.0,evapotranspiration:110},
  March:     {temperature:23.1,rainfall:95, humidity:76,sunshine:7.2,windSpeed:10.8,evapotranspiration:112},
  April:     {temperature:23.5,rainfall:108,humidity:79,sunshine:6.8,windSpeed:10.4,evapotranspiration:106},
  May:       {temperature:23.2,rainfall:78, humidity:77,sunshine:7.0,windSpeed:10.6,evapotranspiration:104},
  June:      {temperature:22.9,rainfall:35, humidity:68,sunshine:8.2,windSpeed:12.1,evapotranspiration:116},
  July:      {temperature:22.5,rainfall:28, humidity:64,sunshine:8.6,windSpeed:12.8,evapotranspiration:120},
  August:    {temperature:23.0,rainfall:42, humidity:66,sunshine:8.4,windSpeed:12.4,evapotranspiration:118},
  September: {temperature:23.6,rainfall:78, humidity:74,sunshine:7.4,windSpeed:11.6,evapotranspiration:114},
  October:   {temperature:23.8,rainfall:110,humidity:80,sunshine:6.6,windSpeed:10.2,evapotranspiration:102},
  November:  {temperature:23.4,rainfall:102,humidity:78,sunshine:7.0,windSpeed:10.6,evapotranspiration:105},
  December:  {temperature:22.6,rainfall:85, humidity:74,sunshine:7.5,windSpeed:11.4,evapotranspiration:109},
};

const MONTHS  = Object.keys(CLIMATE);
const SEASONS = ["Season A","Season B"];
const SECTORS = ["Gashora","Juru","Kamabuye","Mareba","Mayange","Musenyi","Mwogo","Ngeruka","Ntarama","Nyamata","Nyarugenge","Rilima","Ruhuha","Rweru","Shyara"];
const CROPS   = ["Maize","Beans","Rice"];
const SOILS   = ["Clay","Sandy-Clay","Loam"];
const CROP_ICON = {Maize:"🌽",Beans:"🫘",Rice:"🌾"};
const CROP_BENCH = {Maize:23.22,Beans:11.91,Rice:36.36};

function getClimate(month, season) {
  const b = CLIMATE[month]; if (!b) return null;
  const m = season==="Season A"?{rb:1.05,ta:0.2}:{rb:0.95,ta:-0.1};
  return {temperature:+(b.temperature+m.ta).toFixed(1),rainfall:+(b.rainfall*m.rb).toFixed(1),
          humidity:b.humidity,sunshine:b.sunshine,windSpeed:b.windSpeed,evapotranspiration:b.evapotranspiration};
}

function getSeasonFromMonth(month) {
  const m = MONTHS.indexOf(month)+1;
  return (m>=10||m<=1)?"Season A":"Season B";
}

// ── In-memory user store (fallback when API offline) ─────────────────────────
const DEMO_USERS = {
  "F001":{id:"F001",name:"Cesalie Uwimpuhwe",phone:"+250782001001",sector:"Nyamata",farm_size_ha:0.25,farm_size_are:25,crops:["Maize","Beans"],role:"farmer",password:"harvest2024"},
  "F002":{id:"F002",name:"Jean Pierre Habimana",phone:"+250782002002",sector:"Gashora",farm_size_ha:1.8,farm_size_are:180,crops:["Rice"],role:"farmer",password:"harvest2024"},
  "F003":{id:"F003",name:"Vestine Mukamana",phone:"+250782003003",sector:"Juru",farm_size_ha:3.2,farm_size_are:320,crops:["Maize","Rice"],role:"farmer",password:"harvest2024"},
  "A001":{id:"A001",name:"Dr. Pascal Nkurunziza",phone:"+250788100100",sector:"Bugesera",department:"Crop Production",role:"officer",password:"harvest2024"},
};
let USER_STORE = {...DEMO_USERS};
let nextFNum = 4;

// ── Offline simulation fallback ───────────────────────────────────────────────
function simulateOffline({crop,month,season,farmSizeAre,areaPlantedAre,fertilizer,irrigation,soil}) {
  const BASE = {Maize:23.22,Beans:11.91,Rice:36.36};
  const c = CLIMATE[month]||CLIMATE.October;
  const OPT_T={Maize:23,Beans:22,Rice:25}, OPT_R={Maize:90,Beans:75,Rice:130};
  const tf = Math.exp(-0.5*Math.pow((c.temperature-OPT_T[crop])/2,2));
  const rf = Math.tanh(c.rainfall/OPT_R[crop]);
  const hf = 1-0.003*Math.abs(c.humidity-74);
  const sf = c.sunshine/7.5;
  let y = BASE[crop]*tf*rf*hf*sf;
  if (season==="Season A") y*={Maize:1.12,Beans:1.05,Rice:1.10}[crop];
  if (soil==="Loam") y*=1.05; else if (soil==="Sandy-Clay") y*=0.92;
  if (fertilizer) y*=1.18;
  if (irrigation)  y*=1.10;
  return Math.max(1,Math.round(y*100)/100);
}

function buildRecs(crop,yieldPA) {
  const base=CROP_BENCH[crop]||20, pct=(yieldPA-base)/base*100;
  if (pct>=20) return [
    {type:"success",category:"🎉 Excellent Harvest!",icon:"🌟",message:`Your yield of ${yieldPA} kg/are is ${pct.toFixed(0)}% above district average (${base} kg/are).`},
    {type:"success",category:"📦 Storage",icon:"🏚️",message:"Use hermetic bags. Seal grain within 48h to prevent aflatoxin and pests."},
    {type:"success",category:"💰 Market",icon:"💰",message:"Contact Bugesera cooperative before harvest. Sell 70% early, keep 30% as seed."},
    {type:"success",category:"📅 Next Season",icon:"📅",message:`Repeat fertilizer and soil management. Save best ${crop} seeds from this harvest.`},
  ];
  if (pct>-20) return [
    {type:"info",category:"📊 Good Average Harvest",icon:"👍",message:`Yield of ${yieldPA} kg/are is near district average (${base} kg/are). Solid season.`},
    {type:"info",category:"🐛 Pest Scouting",icon:"⚙️",message:"Scout every 7 days in final 4 weeks. Late attack reduces yield 15–20%."},
    {type:"info",category:"📦 Storage",icon:"🏚️",message:"Dry grain below 13% moisture before storage. Use hermetic bags."},
    {type:"info",category:"📈 Improve Next Season",icon:"📈",message:`Add DAP fertilizer at planting + compost. Boosts ${crop} yield 20–30%.`},
  ];
  return [
    {type:"warning",category:"⚠️ Below Average",icon:"🔴",message:`Yield of ${yieldPA} kg/are is ${Math.abs(pct).toFixed(0)}% below average (${base} kg/are). Act now.`},
    {type:"warning",category:"🚨 Contact RAB",icon:"🚨",message:"Contact RAB extension officer this week to identify root cause."},
    {type:"warning",category:"🧪 Soil pH Test",icon:"🧪",message:"Test soil pH. Below 5.5 is most common cause of poor yields. Apply lime 2kg/are."},
    {type:"warning",category:"💧 Irrigation",icon:"💧",message:"One extra watering per week during flowering recovers 20% lost yield."},
  ];
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --g50:#f0fdf4;--g100:#dcfce7;--g200:#bbf7d0;--g300:#86efac;--g400:#4ade80;
  --g500:#22c55e;--g600:#16a34a;--g700:#15803d;--g800:#166534;--g900:#14532d;
  --s50:#f8fafc;--s100:#f1f5f9;--s200:#e2e8f0;--s300:#cbd5e1;--s400:#94a3b8;
  --s500:#64748b;--s600:#475569;--s700:#334155;--s800:#1e293b;--s900:#0f172a;
  --amber:#f59e0b;--amber-l:#fef3c7;--amber-d:#92400e;
  --blue:#3b82f6;--blue-l:#dbeafe;--blue-d:#1e40af;
  --red:#ef4444;--red-l:#fee2e2;--red-d:#991b1b;
  --purple:#8b5cf6;--purple-l:#ede9fe;
  --radius:18px;--radius-sm:12px;--radius-xs:8px;
  --shadow:0 2px 20px rgba(22,163,74,.10);--shadow-md:0 6px 30px rgba(22,163,74,.15);
  --shadow-lg:0 16px 50px rgba(0,0,0,.16);
}
html,body{height:100%;background:#e8f5e9;font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased}
#root{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.shell{width:100%;max-width:420px;min-height:100vh;max-height:860px;background:var(--s50);border-radius:32px;box-shadow:var(--shadow-lg);overflow:hidden;display:flex;flex-direction:column;position:relative;}
@media(max-width:460px){.shell{border-radius:0;max-height:none;min-height:100vh}}
.topbar{background:linear-gradient(135deg,var(--g800) 0%,var(--g600) 100%);color:white;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;z-index:10;}
.topbar-brand{font-size:17px;font-weight:800;letter-spacing:-.3px}
.topbar-sub{font-size:11px;opacity:.7;font-weight:500;margin-top:1px}
.topbar-actions{display:flex;gap:8px}
.tb-btn{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.18);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:white;transition:background .2s;}
.tb-btn:hover{background:rgba(255,255,255,.28)}
.back-row{display:flex;align-items:center;gap:10px;cursor:pointer}
.back-icon{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:15px;border:none;color:white;cursor:pointer;}
.lang-sw{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.15);border-radius:99px;padding:4px 10px;cursor:pointer;border:none;color:white;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;transition:background .2s;}
.lang-sw:hover{background:rgba(255,255,255,.25)}
.scroll{flex:1;overflow-y:auto;padding:20px;padding-bottom:90px;scrollbar-width:none}
.scroll::-webkit-scrollbar{display:none}
.bnav{position:absolute;bottom:0;left:0;right:0;background:white;border-top:1px solid var(--s200);padding:6px 0 10px;display:flex;z-index:20;}
.bn-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:6px 4px;border:none;background:none;font-family:'Outfit',sans-serif;color:var(--s400);transition:color .2s;}
.bn-item.act{color:var(--g600)}
.bn-icon{font-size:22px;line-height:1}.bn-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.bn-dot{width:4px;height:4px;border-radius:50%;background:var(--g500);margin-top:2px;opacity:0}
.bn-item.act .bn-dot{opacity:1}
.card{background:white;border-radius:var(--radius);padding:18px;border:1px solid var(--s200);margin-bottom:14px;box-shadow:var(--shadow)}
.card-hero{background:linear-gradient(135deg,var(--g800) 0%,var(--g600) 100%);color:white;border:none}
.card-blue{background:linear-gradient(135deg,var(--blue-d) 0%,var(--blue) 100%);color:white;border:none}
.card-amber{background:linear-gradient(135deg,var(--amber-d) 0%,var(--amber) 100%);color:white;border:none}
.card-purple{background:linear-gradient(135deg,#5b21b6 0%,var(--purple) 100%);color:white;border:none}
.climate-card{background:linear-gradient(135deg,#0c4a6e,#0284c7);color:white;border-radius:var(--radius);padding:18px;margin-bottom:14px;position:relative;overflow:hidden}
.climate-card::before{content:'🌦️';position:absolute;right:-8px;top:-8px;font-size:72px;opacity:.08}
.climate-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.18);border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;margin-bottom:10px}
.climate-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.climate-item{background:rgba(255,255,255,.12);border-radius:10px;padding:9px 6px;text-align:center}
.climate-val{font-size:16px;font-weight:800;font-family:'JetBrains Mono',monospace;line-height:1}
.climate-lbl{font-size:9px;opacity:.8;margin-top:3px;text-transform:uppercase;letter-spacing:.4px}
.climate-pending{background:rgba(3,105,161,.1);border:2px dashed rgba(3,105,161,.3);border-radius:var(--radius);padding:18px;text-align:center;color:var(--blue-d);margin-bottom:14px}
.flabel{font-size:12px;font-weight:700;color:var(--s500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}
.finput{width:100%;padding:12px 14px;border:1.5px solid var(--s200);border-radius:var(--radius-xs);font-family:'Outfit',sans-serif;font-size:14px;background:var(--g50);color:var(--s900);outline:none;transition:border-color .2s,box-shadow .2s;}
.finput:focus{border-color:var(--g500);box-shadow:0 0 0 3px rgba(34,197,94,.12)}
.finput::placeholder{color:var(--s400)}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.fgrp{margin-bottom:14px}
.hint{font-size:11px;color:var(--g700);margin-top:4px;font-weight:600}
.hint-gray{font-size:11px;color:var(--s400);margin-top:3px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border:none;border-radius:var(--radius-sm);font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;}
.btn-primary{background:linear-gradient(135deg,var(--g700),var(--g500));color:white;box-shadow:0 4px 18px rgba(22,163,74,.3)}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 22px rgba(22,163,74,.4)}
.btn-primary:disabled{opacity:.6;cursor:not-allowed}
.btn-outline{background:white;color:var(--g700);border:2px solid var(--g600)}
.btn-ghost{background:var(--s100);color:var(--s700);border:1.5px solid var(--s200)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700}
.bg-green{background:var(--g100);color:var(--g800)}
.bg-amber{background:var(--amber-l);color:var(--amber-d)}
.bg-blue{background:var(--blue-l);color:var(--blue-d)}
.bg-red{background:var(--red-l);color:var(--red-d)}
.bg-purple{background:var(--purple-l);color:#5b21b6}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.stat-box{background:white;border:1px solid var(--s200);border-radius:var(--radius-sm);padding:15px;text-align:center}
.stat-val{font-size:24px;font-weight:800;color:var(--g600);font-family:'JetBrains Mono',monospace}
.stat-lbl{font-size:11px;color:var(--s500);font-weight:600;margin-top:3px;text-transform:uppercase;letter-spacing:.4px}
.sec-hd{font-size:14px;font-weight:800;color:var(--s800);margin-bottom:12px;display:flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:.5px}
.rec{padding:12px 14px;border-radius:var(--radius-xs);margin-bottom:9px;border-left:4px solid}
.rec-success{background:var(--g100);border-color:var(--g600)}
.rec-warning{background:var(--amber-l);border-color:var(--amber)}
.rec-info{background:var(--blue-l);border-color:var(--blue)}
.rec-cat{font-size:11px;font-weight:800;text-transform:uppercase;margin-bottom:3px;letter-spacing:.4px}
.rec-success .rec-cat{color:var(--g800)}.rec-warning .rec-cat{color:var(--amber-d)}.rec-info .rec-cat{color:var(--blue-d)}
.rec-text{font-size:13px;line-height:1.55;color:var(--s700)}
.hitem{background:white;border:1px solid var(--s200);border-radius:var(--radius);padding:14px;margin-bottom:10px;cursor:pointer;transition:box-shadow .2s,transform .15s;}
.hitem:hover{box-shadow:var(--shadow);transform:translateX(2px)}
.hitem-icon{width:44px;height:44px;border-radius:12px;background:var(--g100);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.hitem-yield{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:var(--g700);text-align:right}
.prog-track{height:5px;background:var(--s200);border-radius:99px;overflow:hidden;margin-top:10px}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--g700),var(--g400));border-radius:99px;transition:width .6s ease}
.steps-bar{height:4px;background:var(--s200);flex-shrink:0}
.steps-fill{height:100%;background:linear-gradient(90deg,var(--g700),var(--g500));transition:width .4s ease;border-radius:0 4px 4px 0}
.crop-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.crop-btn{padding:14px 8px;border-radius:var(--radius-sm);border:2px solid var(--s200);background:white;cursor:pointer;text-align:center;transition:all .2s;font-family:'Outfit',sans-serif;}
.crop-btn:hover{border-color:var(--g400);background:var(--g50)}
.crop-btn.sel{border-color:var(--g600);background:var(--g100)}
.crop-btn-icon{font-size:28px;display:block;margin-bottom:6px}
.crop-btn-name{font-size:12px;font-weight:700;color:var(--s700);text-transform:uppercase;letter-spacing:.3px}
.crop-btn.sel .crop-btn-name{color:var(--g800)}
.toggle-group{display:flex;gap:8px}
.toggle-opt{flex:1;padding:11px 8px;border:1.5px solid var(--s200);border-radius:var(--radius-xs);background:white;cursor:pointer;text-align:center;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:var(--s600);transition:all .2s;}
.toggle-opt:hover{border-color:var(--g400)}
.toggle-opt.sel{border-color:var(--g600);background:var(--g100);color:var(--g800)}
.auth-wrap{min-height:100vh;background:linear-gradient(160deg,#0f4c22 0%,#1a6b35 40%,#22a156 100%);display:flex;align-items:center;justify-content:center;padding:20px}
.auth-card{background:white;border-radius:28px;padding:32px 26px;width:100%;max-width:380px;box-shadow:0 30px 80px rgba(0,0,0,.3);max-height:92vh;overflow-y:auto;}
.auth-card::-webkit-scrollbar{display:none}
.auth-logo{width:72px;height:72px;background:var(--g100);border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:38px;margin:0 auto 18px;box-shadow:0 8px 24px rgba(22,163,74,.25)}
.auth-title{font-size:24px;font-weight:800;color:var(--g900);text-align:center}
.auth-sub{font-size:12px;color:var(--s500);text-align:center;margin-top:3px;margin-bottom:22px;line-height:1.5}
.role-tabs{display:flex;background:var(--s100);border-radius:12px;padding:4px;gap:4px;margin-bottom:18px}
.role-tab{flex:1;padding:9px;border:none;border-radius:9px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;cursor:pointer;background:none;color:var(--s500);transition:all .2s}
.role-tab.act{background:white;color:var(--g700);box-shadow:0 1px 6px rgba(0,0,0,.1)}
.auth-switch{text-align:center;margin-top:16px;font-size:13px;color:var(--s500)}
.auth-switch a{color:var(--g700);font-weight:700;cursor:pointer;text-decoration:underline}
.demo-box{background:var(--g50);border:1px solid var(--g200);border-radius:10px;padding:11px;margin-top:12px;font-size:12px;color:var(--g800);cursor:pointer}
.demo-box code{font-family:'JetBrains Mono',monospace;background:white;padding:2px 5px;border-radius:4px}
.lang-bar{display:flex;justify-content:center;gap:8px;margin-bottom:18px}
.lang-pill{padding:6px 16px;border-radius:99px;border:2px solid var(--s200);background:white;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;color:var(--s500);transition:all .2s;display:flex;align-items:center;gap:6px}
.lang-pill.act{border-color:var(--g600);background:var(--g100);color:var(--g800)}
.result-hero{background:linear-gradient(135deg,var(--g900),var(--g700) 50%,var(--g600));color:white;border-radius:var(--radius);padding:26px;margin-bottom:14px;text-align:center;position:relative;overflow:hidden}
.result-hero::before{content:'🌾';position:absolute;right:-10px;top:-10px;font-size:90px;opacity:.08}
.result-big{font-size:48px;font-weight:800;font-family:'JetBrains Mono',monospace;line-height:1}
.result-unit{font-size:14px;opacity:.8;margin-top:4px}
.result-meta{display:flex;justify-content:center;gap:20px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.2)}
.result-meta-item{text-align:center}
.result-meta-val{font-size:17px;font-weight:800;font-family:'JetBrains Mono',monospace}
.result-meta-lbl{font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.officer-chip{display:inline-flex;align-items:center;gap:6px;background:#fef3c7;color:#92400e;padding:5px 14px;border-radius:99px;font-size:12px;font-weight:800;margin-bottom:16px;border:1px solid #fde68a}
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.bar-lbl{font-size:12px;width:90px;color:var(--s500);font-weight:600;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar-track{flex:1;height:8px;background:var(--g100);border-radius:99px;overflow:hidden}
.bar-fill{height:100%;background:linear-gradient(90deg,var(--g800),var(--g400));border-radius:99px;transition:width .8s ease}
.bar-val{font-size:12px;font-weight:800;color:var(--g800);width:65px;text-align:right;font-family:'JetBrains Mono',monospace}
.pill-tabs{display:flex;background:var(--s100);border-radius:11px;padding:4px;gap:4px;margin-bottom:16px;flex-shrink:0}
.pill-tab{flex:1;padding:8px 4px;border:none;border-radius:8px;font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;cursor:pointer;background:none;color:var(--s500);transition:all .2s;text-transform:uppercase;letter-spacing:.3px}
.pill-tab.act{background:white;color:var(--g700);box-shadow:0 1px 5px rgba(0,0,0,.1)}
.farmer-row{background:white;border:1px solid var(--s200);border-radius:var(--radius-xs);padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.avatar-sm{width:38px;height:38px;border-radius:50%;background:var(--g100);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.tip-card{border-radius:var(--radius);padding:16px;margin-bottom:12px;cursor:pointer}
.tip-body{font-size:13px;line-height:1.65;margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,.06)}
.alert{padding:12px 14px;border-radius:var(--radius-xs);margin-bottom:10px;font-size:13px;font-weight:600;display:flex;align-items:flex-start;gap:8px}
.alert-err{background:var(--red-l);color:var(--red-d);border-left:3px solid var(--red)}
.alert-ok{background:var(--g100);color:var(--g800);border-left:3px solid var(--g600)}
.profile-avatar{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--g700),var(--g500));display:flex;align-items:center;justify-content:center;font-size:34px;margin:0 auto 14px;box-shadow:0 6px 20px rgba(22,163,74,.3)}
.info-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--s100)}
.info-row:last-child{border-bottom:none}
.info-key{font-size:12px;font-weight:700;color:var(--s500);text-transform:uppercase;letter-spacing:.4px}
.info-val{font-size:14px;font-weight:600;color:var(--s800)}
.spin{width:20px;height:20px;border:2.5px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fade-up{animation:fadeUp .35s ease-out}
.summary-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--g200)}
.summary-key{font-size:12px;color:var(--s500);font-weight:600}
.summary-val{font-size:13px;font-weight:700;color:var(--s800)}
`;

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    appName:"Harvest Predictor",appSub:"Bugesera District · Rwanda · Smart Farming",
    login:"Login",register:"Create Account",logout:"Logout",
    farmer:"Farmer",officer:"Agri Officer",
    phone:"Phone / Farmer ID",password:"Password",confirmPw:"Confirm Password",
    fullName:"Full Name",sector:"Sector",
    farmSizeHa:"Farm Size (ha) *",areaPlantedHa:"Area Planted (ha) *",
    plantingDate:"Planting Date *",
    signingIn:"Signing in…",creatingAccount:"Creating account…",
    loginBtn:"→ Login",registerBtn:"✓ Create Account",
    alreadyHave:"Already have an account?",noAccount:"Don't have an account?",
    signInHere:"Sign in",createHere:"Create one",
    demoTitle:"Demo Credentials (click to fill)",
    invalidCreds:"Invalid credentials.",pwMismatch:"Passwords do not match.",
    allRequired:"Please fill all required fields.",phoneTaken:"Phone already registered.",
    welcome:"Welcome",farmerId:"Farmer ID",
    predictions:"Predictions",accuracy:"Accuracy",
    farmSummary:"Your Farm Summary",totalFarmSize:"Total Farm Size",
    activeCrops:"Active Crops",predictionsMade:"Predictions Made",
    recentPredictions:"Recent Predictions",
    home:"Home",predict:"Predict",history:"History",tips:"Tips",
    newPred:"New Prediction",stepOf:"Step",
    enterFarmDetails:"Enter Your Farm Details",cropLocation:"Crop & Location",
    selectCrop:"1. Select Crop Type *",
    districtSector:"District/Sector *",
    season:"Season *",month:"Month (auto)",soilType:"Soil Type",
    farmerCategory:"Farmer Category",
    fertilizerUsed:"Fertilizer Used?",irrigationUsed:"Irrigation Used?",
    yes:"✅ Yes",no:"❌ No",continueStep2:"Continue to Step 2 →",
    requiredFields:"* Required fields",
    reviewPredict:"Review & Predict",summary:"Summary",edit:"✏️ Edit",
    cropType:"Crop Type",location:"Location",fertilizer:"Fertilizer",irrigation:"Irrigation",
    autoClimateTitle:"Auto-Detected Climate",autoClimateNote:"Based on Bugesera historical averages",
    saveFarm:"💾 Save for future use",
    getHarvestPrediction:"🌾 Get Harvest Prediction",runningModel:"Running AI Model…",
    expectedHarvest:"EXPECTED HARVEST",predictionComplete:"✅ Prediction Complete!",
    perAreEst:"per are (a) estimated",total:"Total",confidence:"Confidence",modelUsed:"Model",
    comparison:"Comparison",avgYieldArea:"District average:",yourPrediction:"Your prediction:",
    recommendations:"Recommendations",makeAnother:"🔄 New Prediction",
    predHistory:"Prediction History",searchCrop:"Search by crop or sector…",
    allCrops:"All Crops",overallStats:"Overall Statistics",
    avgAccuracy:"Avg Accuracy",totalPredictions:"Total",
    completed:"Completed",growing:"Growing",successRate:"Success Rate",
    predicted:"Predicted:",total2:"Total:",viewDetails:"View Details →",
    weatherTitle:"Weather Info",currentSeason:"Current Season",
    monthlyRainfall:"Monthly Rainfall (mm)",monthlyTemp:"Monthly Temperature (°C)",
    plantingCalendar:"Bugesera Planting Calendar",
    tipsTitle:"Tips & Advice",tipsSubtitle:"Expert farming guidance",
    tailoredTips:"Tailored for Bugesera District smallholder farmers",
    myProfile:"My Profile",personalInfo:"Personal Information",
    name:"Name",id:"ID",phoneLabel:"Phone",settings:"Settings",
    editProfile:"Edit Profile",changePassword:"Change Password",
    language:"Language",aboutApp:"About App",
    districtDash:"Agricultural Dashboard",officerView:"Bugesera District — Officer View",
    overview:"📊 Overview",sectorsTab:"📍 Sectors",farmersTab:"👨‍🌾 Farmers",reportsTab:"📄 Reports",
    districtYield:"District Yield by Crop (kg/are avg)",
    seasonPerf:"Season Performance",districtAlerts:"District Alerts",
    sectorYield:"Predicted Yield by Sector",sectorRisk:"Sector Risk Assessment",
    searchFarmers:"Search farmers…",farmerStats:"Farmer Statistics",
    generateReport:"Generate District Report",generatePDF:"📥 Generate PDF",
    sendAdvice:"Send Advice to Farmers",targetGroup:"Target Group",
    adviceMessage:"Advice Message",sendToFarmers:"📢 Send",
    temperature:"Temperature",rainfall:"Rainfall",humidity:"Humidity",sunshine:"Sunshine",
    selectLocation:"Select location…",selectSeason:"Select season…",selectMonth:"Select month…",
    selectMonthFirst:"← Select planting date to load climate",
    offlineMode:"⚠️ Offline mode — using local simulation",
    soilInfo:"Soil Info",
  },
  rw: {
    appName:"Gusesengura Imyaka",appSub:"Akarere ka Bugesera · Rwanda · Ubuhinzi Bw'Ikoranabuhanga",
    login:"Injira",register:"Fungura Konti",logout:"Sohoka",
    farmer:"Umuhinzi",officer:"Ofisiye w'Ubuhinzi",
    phone:"Telefone / ID",password:"Ijambo ry'Ibanga",confirmPw:"Emeza Ijambo ry'Ibanga",
    fullName:"Amazina Yose",sector:"Segiteri",
    farmSizeHa:"Ubuso bw'Akarima (ha) *",areaPlantedHa:"Akarima Gatewe (ha) *",
    plantingDate:"Itariki yo Gutera *",
    signingIn:"Injira…",creatingAccount:"Fungura konti…",
    loginBtn:"→ Injira",registerBtn:"✓ Fungura Konti",
    alreadyHave:"Usanzwe ufite konti?",noAccount:"Nta konti ufite?",
    signInHere:"Injira hano",createHere:"Fungura hano",
    demoTitle:"Amakuru yo Gerageza",
    invalidCreds:"Amakuru atari yo.",pwMismatch:"Amagambo ntahura.",
    allRequired:"Uzuza ibisabwa.",phoneTaken:"Iyo nimero isanzwe iyanditswe.",
    welcome:"Murakaza Neza",farmerId:"ID y'Umuhinzi",
    predictions:"Ibisobanuro",accuracy:"Ikarita",
    farmSummary:"Incamake y'Akarima",totalFarmSize:"Ubuso bwose",
    activeCrops:"Ibihingwa",predictionsMade:"Ibisobanuro Byakozwe",
    recentPredictions:"Ibisobanuro bya Vuba",
    home:"Ahabanza",predict:"Sobanura",history:"Amateka",tips:"Inama",
    newPred:"Gusobanura Bishya",stepOf:"Intambwe",
    enterFarmDetails:"Injiza Amakuru y'Akarima",cropLocation:"Igihingwa n'Aho Biherereye",
    selectCrop:"1. Hitamo Igihingwa *",
    districtSector:"Akarere/Segiteri *",
    season:"Igihe cy'Ihinga *",month:"Ukwezi (bwite)",soilType:"Ubwoko bw'Ubutaka",
    farmerCategory:"Icyiciro cy'Umuhinzi",
    fertilizerUsed:"Mwakoresheje Ifumbire?",irrigationUsed:"Mwakoresheje Kuhira?",
    yes:"✅ Yego",no:"❌ Oya",continueStep2:"Komeza ku Ntambwe ya 2 →",
    requiredFields:"* Birasabwa",
    reviewPredict:"Reba Hanyuma Usobanure",summary:"Incamake",edit:"✏️ Hindura",
    cropType:"Igihingwa",location:"Aho Biherereye",fertilizer:"Ifumbire",irrigation:"Kuhira",
    autoClimateTitle:"Amakuru y'Ibihe Bwite",autoClimateNote:"Bikoreshwa muri Bugesera",
    saveFarm:"💾 Bika Akarima",
    getHarvestPrediction:"🌾 Bona Ibisobanuro by'Imyaka",runningModel:"Koresha Modeli…",
    expectedHarvest:"IMYAKA ITEGANYIJWE",predictionComplete:"✅ Birakozwe!",
    perAreEst:"kuri are imwe biteganyijwe",total:"Igiteganyo",confidence:"Inyemeza",modelUsed:"Modeli",
    comparison:"Igereranya",avgYieldArea:"Hagati ya zone:",yourPrediction:"Ibisobanuro byawe:",
    recommendations:"Inama",makeAnother:"🔄 Sobanura Ukundi",
    predHistory:"Amateka y'Ibisobanuro",searchCrop:"Shakisha…",
    allCrops:"Ibihingwa Byose",overallStats:"Ibarurishamibare",
    avgAccuracy:"Ikarita Hagati",totalPredictions:"Byose",
    completed:"Byarangiye",growing:"Birakura",successRate:"Intsinzi",
    predicted:"Byateganyijwe:",total2:"Byose:",viewDetails:"Reba →",
    weatherTitle:"Amakuru y'Ibihe",currentSeason:"Igihe cy'Ubu",
    monthlyRainfall:"Imvura buri kwezi (mm)",monthlyTemp:"Ubushyuhe (°C)",
    plantingCalendar:"Gahunda yo Gutera muri Bugesera",
    tipsTitle:"Inama n'Ubujyanama",tipsSubtitle:"Ubuyobozi bw'inzobere",
    tailoredTips:"Bigenewe abahinzi bato ba Bugesera",
    myProfile:"Umwirondoro Wanjye",personalInfo:"Amakuru Bwite",
    name:"Amazina",id:"Indangamuntu",phoneLabel:"Telefone",settings:"Igenamiterere",
    editProfile:"Hindura Umwirondoro",changePassword:"Hindura Ijambo ry'Ibanga",
    language:"Ururimi",aboutApp:"Ibyerekeye App",
    districtDash:"Ikibaho cy'Ubuhinzi",officerView:"Akarere ka Bugesera — Ofisiye",
    overview:"📊 Incamake",sectorsTab:"📍 Inzego",farmersTab:"👨‍🌾 Abahinzi",reportsTab:"📄 Raporo",
    districtYield:"Umusaruro w'Akarere (kg/are)",
    seasonPerf:"Imikorere y'Ibihe",districtAlerts:"Imenyesha",
    sectorYield:"Umusaruro kuri Segiteri",sectorRisk:"Ingorane kuri Segiteri",
    searchFarmers:"Shakisha abahinzi…",farmerStats:"Ibarurishamibare",
    generateReport:"Kora Raporo",generatePDF:"📥 Kora PDF",
    sendAdvice:"Ohereza Inama",targetGroup:"Ishyirahamwe",
    adviceMessage:"Ubutumwa",sendToFarmers:"📢 Ohereza",
    temperature:"Ubushyuhe",rainfall:"Imvura",humidity:"Ubuhehere",sunshine:"Izuba",
    selectLocation:"Hitamo aho biherereye…",selectSeason:"Hitamo igihe…",selectMonth:"Hitamo ukwezi…",
    selectMonthFirst:"← Injiza itariki yo gutera",
    offlineMode:"⚠️ Offline — gukoresha simulation",
    soilInfo:"Amakuru y'Ubutaka",
  }
};

// ── Global Style ──────────────────────────────────────────────────────────────
function GlobalStyle() {
  useEffect(() => {
    const tag = document.createElement("style");
    tag.innerHTML = CSS;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);
  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function LangBtn({lang,setLang}) {
  return (
    <button className="lang-sw" onClick={()=>setLang(l=>l==="en"?"rw":"en")}>
      <span>{lang==="en"?"🇷🇼":"🇬🇧"}</span>
      <span>{lang==="en"?"Kinyarwanda":"English"}</span>
    </button>
  );
}

function Topbar({title,sub,onBack,actions,lang,setLang}) {
  return (
    <div className="topbar">
      <div className="back-row" onClick={onBack} style={{cursor:onBack?"pointer":"default"}}>
        {onBack && <button className="back-icon">←</button>}
        <div><div className="topbar-brand">{title}</div>{sub&&<div className="topbar-sub">{sub}</div>}</div>
      </div>
      <div className="topbar-actions">
        <LangBtn lang={lang} setLang={setLang}/>{actions}
      </div>
    </div>
  );
}

function BottomNav({current,onNavigate,lang}) {
  const t = T[lang];
  return (
    <nav className="bnav">
      {[["🏠",t.home,"dashboard"],["🌾",t.predict,"predict"],
        ["📊",t.history,"history"],["📚",t.tips,"tips"]].map(([icon,label,sc])=>(
        <button key={sc} className={`bn-item ${current===sc?"act":""}`} onClick={()=>onNavigate(sc)}>
          <span className="bn-icon">{icon}</span>
          <span className="bn-label">{label}</span>
          <span className="bn-dot"/>
        </button>
      ))}
    </nav>
  );
}

function ClimateCard({climate,month,season,lang}) {
  const t = T[lang];
  if (!climate) return (
    <div className="climate-pending">
      <div style={{fontSize:28,marginBottom:6}}>🌦️</div>
      <div style={{fontWeight:700,marginBottom:3}}>{t.autoClimateTitle}</div>
      <div style={{fontSize:12,opacity:.8}}>{t.selectMonthFirst}</div>
    </div>
  );
  return (
    <div className="climate-card">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="climate-badge">🤖 {t.autoClimateTitle}</div>
          <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>{month} · {season}</div>
          <div style={{fontSize:11,opacity:.75}}>{t.autoClimateNote}</div>
        </div>
        <div style={{fontSize:32,opacity:.9}}>🌦️</div>
      </div>
      <div className="climate-grid">
        {[
          [climate.temperature+"°C","🌡️ Temp"],
          [climate.rainfall+"mm","🌧️ Rain"],
          [climate.humidity+"%","💧 Humid"],
          [climate.sunshine+"h","☀️ Sun"],
          [climate.windSpeed,"💨 Wind km/h"],
          [climate.evapotranspiration,"🌫️ ET mm"],
        ].map(([val,lbl])=>(
          <div key={lbl} className="climate-item">
            <div className="climate-val">{val}</div>
            <div className="climate-lbl">{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthScreen({onLogin,lang,setLang}) {
  const t = T[lang];
  const [mode,setMode]       = useState("login");
  const [role,setRole]       = useState("farmer");
  const [phone,setPhone]     = useState("");
  const [pw,setPw]           = useState("");
  const [cpw,setCpw]         = useState("");
  const [name,setName]       = useState("");
  const [sector,setSector]   = useState("");
  const [farmHa,setFarmHa]   = useState("");
  const [dept,setDept]       = useState("");
  const [showPw,setShowPw]   = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError]     = useState("");
  const [success,setSuccess] = useState("");
  const DEPTS = ["Crop Production","Livestock","Soil & Water","Extension Services","Agronomy Research"];
  const reset = ()=>{ setPhone("");setPw("");setCpw("");setName("");setSector("");setFarmHa("");setDept("");setError("");setSuccess(""); };

  const handleLogin = async ()=>{
    setError(""); setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    // Try API first
    try {
      const res = await fetch(`${API_BASE}/api/login`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:phone.trim(),password:pw,role})
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) { onLogin(data.user); return; }
    } catch(_) {}
    // Fallback to local store
    const u = Object.values(USER_STORE).find(u=>
      (u.id===phone.trim()||u.phone?.replace(/\s/g,"")=== phone.replace(/\s/g,""))
      && u.password===pw && u.role===role);
    setLoading(false);
    if (u) onLogin(u); else setError(t.invalidCreds);
  };

  const handleRegister = async ()=>{
    setError(""); setSuccess("");
    if (role==="farmer") { if (!name||!phone||!pw||!sector||!farmHa){setError(t.allRequired);return;} }
    else { if (!name||!phone||!pw||!dept){setError(t.allRequired);return;} }
    if (pw!==cpw){setError(t.pwMismatch);return;}
    if (Object.values(USER_STORE).some(u=>u.phone?.replace(/\s/g,"")=== phone.replace(/\s/g,""))){setError(t.phoneTaken);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,1000));
    let nid, nu;
    if (role==="farmer") {
      nid = `F${String(nextFNum++).padStart(3,"0")}`;
      nu  = {id:nid,name,phone,sector,farm_size_ha:parseFloat(farmHa),farm_size_are:Math.round(parseFloat(farmHa)*100),crops:[],role:"farmer",password:pw};
    } else {
      const oc = Object.values(USER_STORE).filter(u=>u.role==="officer").length;
      nid = `A${String(oc+1).padStart(3,"0")}`;
      nu  = {id:nid,name,phone,sector:"Bugesera",department:dept,role:"officer",password:pw};
    }
    USER_STORE[nid]=nu;
    setLoading(false);
    setSuccess(`✅ Account created! Your ID is ${nid}. Signing in…`);
    await new Promise(r=>setTimeout(r,1200));
    onLogin(nu);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="lang-bar">
          {["en","rw"].map(l=>(
            <button key={l} className={`lang-pill ${lang===l?"act":""}`} onClick={()=>setLang(l)}>
              {l==="en"?<><span>🇬🇧</span>English</>:<><span>🇷🇼</span>Kinyarwanda</>}
            </button>
          ))}
        </div>
        <div className="auth-logo">🌾</div>
        <div className="auth-title">{t.appName}</div>
        <div className="auth-sub">{t.appSub}</div>
        <div className="role-tabs">
          {["farmer","officer"].map(r=>(
            <button key={r} className={`role-tab ${role===r?"act":""}`} onClick={()=>{setRole(r);reset();}}>
              {r==="farmer"?`👨‍🌾 ${t.farmer}`:`🏛️ ${t.officer}`}
            </button>
          ))}
        </div>
        {error   && <div className="alert alert-err">⚠️ {error}</div>}
        {success && <div className="alert alert-ok">{success}</div>}

        {mode==="login" ? (
          <>
            <div className="fgrp">
              <label className="flabel">📱 {role==="farmer"?t.phone:"Officer ID"}</label>
              <input className="finput" placeholder={role==="farmer"?"+250 7XX XXX XXX or F001":"e.g. A001"}
                value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            </div>
            <div className="fgrp" style={{position:"relative"}}>
              <label className="flabel">🔒 {t.password}</label>
              <input className="finput" type={showPw?"text":"password"} placeholder={t.password}
                value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{paddingRight:46}}/>
              <button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:12,top:34,border:"none",background:"none",cursor:"pointer",fontSize:16}}>
                {showPw?"🙈":"👁️"}
              </button>
            </div>
            <button className="btn btn-primary" onClick={handleLogin} disabled={loading||!phone||!pw}>
              {loading?<><div className="spin"/>{t.signingIn}</>:t.loginBtn}
            </button>
            <div className="demo-box" onClick={()=>{setPhone(role==="farmer"?"F001":"A001");setPw("harvest2024");}}>
              <div style={{fontWeight:700,marginBottom:4}}>🔑 {t.demoTitle}</div>
              <div>ID: <code>{role==="farmer"?"F001":"A001"}</code> · Password: <code>harvest2024</code></div>
            </div>
            <div className="auth-switch">{t.noAccount} <a onClick={()=>{setMode("register");reset();}}>{t.createHere}</a></div>
          </>
        ):(
          <>
            <div className="fgrp">
              <label className="flabel">👤 {t.fullName} *</label>
              <input className="finput" placeholder="e.g. Amina Uwimana" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
            <div className="fgrp">
              <label className="flabel">📱 {t.phone} *</label>
              <input className="finput" placeholder="+250 7XX XXX XXX" value={phone} onChange={e=>setPhone(e.target.value)}/>
            </div>
            {role==="farmer" ? (
              <div className="frow">
                <div>
                  <label className="flabel">🏘️ {t.sector} *</label>
                  <select className="finput" value={sector} onChange={e=>setSector(e.target.value)}>
                    <option value="">Select…</option>
                    {SECTORS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flabel">📐 {t.farmSizeHa}</label>
                  <input className="finput" type="number" min="0.01" max="5" step="0.01" placeholder="e.g. 1.5"
                    value={farmHa} onChange={e=>setFarmHa(e.target.value)}/>
                  {farmHa && <div className="hint">= {Math.round(parseFloat(farmHa)*100)} are</div>}
                </div>
              </div>
            ):(
              <div className="fgrp">
                <label className="flabel">🏢 Department *</label>
                <select className="finput" value={dept} onChange={e=>setDept(e.target.value)}>
                  <option value="">Select…</option>
                  {DEPTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div className="fgrp" style={{position:"relative"}}>
              <label className="flabel">🔒 {t.password} *</label>
              <input className="finput" type={showPw?"text":"password"} placeholder={t.password}
                value={pw} onChange={e=>setPw(e.target.value)} style={{paddingRight:46}}/>
              <button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:12,top:34,border:"none",background:"none",cursor:"pointer",fontSize:16}}>
                {showPw?"🙈":"👁️"}
              </button>
            </div>
            <div className="fgrp">
              <label className="flabel">🔒 {t.confirmPw} *</label>
              <input className="finput" type="password" placeholder={t.confirmPw}
                value={cpw} onChange={e=>setCpw(e.target.value)}/>
            </div>
            <button className="btn btn-primary" onClick={handleRegister}
              disabled={loading||!name||!phone||!pw||!cpw||(role==="farmer"&&(!sector||!farmHa))||(role==="officer"&&!dept)}>
              {loading?<><div className="spin"/>{t.creatingAccount}</>:t.registerBtn}
            </button>
            <div className="auth-switch">{t.alreadyHave} <a onClick={()=>{setMode("login");reset();}}>{t.signInHere}</a></div>
          </>
        )}
        <div style={{textAlign:"center",marginTop:14,fontSize:11,color:"var(--s400)"}}>
          🌾 Bugesera Agricultural System · UNIVERSITY OF KIGALI
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardScreen({user,onNavigate,history,lang,setLang}) {
  const t = T[lang];
  const farmHa   = user.farm_size_ha  || 0;
  const farmAre  = user.farm_size_are || Math.round(farmHa*100);
  return (
    <>
      <Topbar title={`🌾 ${t.appName}`} sub="Bugesera District" onBack={null} lang={lang} setLang={setLang}
        actions={<><button className="tb-btn" onClick={()=>onNavigate("profile")}>👤</button><button className="tb-btn">🔔</button></>}/>
      <div className="scroll fade-up">
        <div className="card card-hero" style={{marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",fontSize:60,opacity:.12}}>🌾</div>
          <div style={{fontSize:20,fontWeight:800}}>{t.welcome}, {user.name.split(" ")[0]}! 👋</div>
          <div style={{fontSize:12,opacity:.8,marginTop:3,fontFamily:"JetBrains Mono,monospace"}}>{t.farmerId}: {user.id}</div>
          <div style={{display:"flex",gap:20,marginTop:16,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.2)",flexWrap:"wrap"}}>
            {[[`${farmHa}ha`,t.totalFarmSize],[history.length,t.predictions],["84.8%",t.accuracy],[user.sector,"Sector"]].map(([v,l])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontWeight:800,fontSize:18}}>{v}</div>
                <div style={{fontSize:10,opacity:.75,textTransform:"uppercase",letterSpacing:".5px"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-blue" style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,opacity:.85,marginBottom:10}}>📊 {t.farmSummary}</div>
          {[[t.totalFarmSize,`${farmHa} ha = ${farmAre} are`],
            [t.activeCrops,user.crops?.length?user.crops.join(", "):"Maize, Beans"],
            [t.predictionsMade,String(history.length)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.15)"}}>
              <span style={{fontSize:13,opacity:.9}}>{k}</span>
              <span style={{fontWeight:800,fontSize:14}}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[["🌾","NEW PREDICTION",t.getHarvestPrediction.replace("🌾 ",""),"card-hero","predict"],
            ["📈","VIEW HISTORY",t.predHistory,"card-purple","history"],
            ["🌦️","WEATHER INFO","Climate conditions","card-blue","weather"],
            ["📚","TIPS & ADVICE","Farming guidance","card-amber","tips"]].map(([icon,label,desc,cls,act])=>(
            <button key={act} className={`card ${cls} btn`}
              style={{flexDirection:"column",gap:8,alignItems:"flex-start",textAlign:"left",cursor:"pointer",padding:16}}
              onClick={()=>onNavigate(act)}>
              <span style={{fontSize:28}}>{icon}</span>
              <div>
                <div style={{fontWeight:800,fontSize:11,letterSpacing:".5px"}}>{label}</div>
                <div style={{fontSize:11,opacity:.85,marginTop:2}}>{desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="sec-hd">📋 {t.recentPredictions}</div>
        {history.length===0 && (
          <div style={{textAlign:"center",padding:"20px",color:"var(--s400)",fontSize:13}}>
            No predictions yet. Make your first prediction!
          </div>
        )}
        {history.slice(0,3).map((p,i)=>(
          <div key={i} className="hitem" onClick={()=>onNavigate("history")}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div className="hitem-icon">{CROP_ICON[p.crop]||"🌱"}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{p.crop}</div>
                <div style={{fontSize:12,color:"var(--s500)",marginTop:2}}>
                  📅 {new Date(p.timestamp||Date.now()).toLocaleDateString()} · {p.sector}
                </div>
              </div>
              <div>
                <div className="hitem-yield">{p.yield_per_are_kg}<span style={{fontSize:11}}>kg</span></div>
                <div style={{fontSize:10,color:"var(--s400)",textAlign:"right"}}>/are</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav current="dashboard" onNavigate={onNavigate} lang={lang}/>
    </>
  );
}

// ── PREDICT ───────────────────────────────────────────────────────────────────
function PredictScreen({user,onNavigate,onResult,lang,setLang}) {
  const t = T[lang];
  const [step,setStep]       = useState(1);
  const [loading,setLoading] = useState(false);
  const [offline,setOffline] = useState(false);
  const [form,setForm]       = useState({
    crop:"", sector:user.sector||"", season:"", month:"",
    plantingDate:"", farmSizeHa:String(user.farm_size_ha||""),
    areaPlantedHa:"", farmerCategory:"Medium",
    fertilizer:false, irrigation:false, soil:"Clay",
  });
  const set = useCallback((k,v)=>setForm(f=>({...f,[k]:v})),[]);

  const autoClimate = (form.month&&form.season)?getClimate(form.month,form.season):null;

  const step1Valid = form.crop && form.sector && form.season && form.month
                  && form.farmSizeHa && form.plantingDate;

  const handleDateChange = (val)=>{
    set("plantingDate",val);
    if(val){
      const d = new Date(val);
      const mo = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"][d.getMonth()];
      set("month",mo);
      set("season",getSeasonFromMonth(mo));
    }
  };

  const handlePredict = async ()=>{
    setLoading(true);
    const farmAre     = Math.round(parseFloat(form.farmSizeHa)*100);
    const areaAre     = form.areaPlantedHa
                          ? Math.round(parseFloat(form.areaPlantedHa)*100)
                          : Math.round(farmAre*0.9);
    const clim        = getClimate(form.month,form.season);
    const payload     = {
      farmer_id       : user.id,
      crop            : form.crop,
      sector          : form.sector,
      season          : form.season,
      month           : form.month,
      planting_date   : form.plantingDate,
      farm_size       : farmAre,
      area_planted    : areaAre,
      farmer_category : form.farmerCategory,
      fertilizer_used : form.fertilizer,
      irrigation_used : form.irrigation,
      soil_type       : form.soil,
      temperature     : clim.temperature,
      rainfall        : clim.rainfall,
      humidity        : clim.humidity,
      sunshine        : clim.sunshine,
      wind_speed      : clim.windSpeed,
      evapotranspiration: clim.evapotranspiration,
    };

    try {
      const res = await fetch(`${API_BASE}/api/predict`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      if(!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setLoading(false); setOffline(false);
      onResult(data); onNavigate("result");
    } catch(err) {
      // Offline fallback
      setOffline(true);
      const yieldPA  = simulateOffline({
        crop:form.crop, month:form.month, season:form.season,
        farmSizeAre:farmAre, areaPlantedAre:areaAre,
        fertilizer:form.fertilizer, irrigation:form.irrigation, soil:form.soil
      });
      const result = {
        id               : `PRED-${Date.now().toString().slice(-6)}`,
        timestamp        : new Date().toISOString(),
        farmer_id        : user.id,
        crop             : form.crop,
        sector           : form.sector,
        season           : form.season,
        month            : form.month,
        planting_date    : form.plantingDate,
        farm_size_are    : farmAre,
        farm_size_ha     : parseFloat(form.farmSizeHa),
        area_planted_are : areaAre,
        area_planted_ha  : areaAre/100,
        yield_per_are_kg : yieldPA,
        yield_per_ha_kg  : Math.round(yieldPA*100*10)/10,
        total_yield_kg   : Math.round(yieldPA*areaAre*10)/10,
        yield_range      : `${Math.round(yieldPA*0.92*10)/10}–${Math.round(yieldPA*1.08*10)/10} kg/are`,
        confidence_pct   : 84.8,
        model_used       : "Local Simulation (API offline)",
        district_avg_kg_are: CROP_BENCH[form.crop]||20,
        inputs           : {temperature:clim.temperature,rainfall:clim.rainfall,
                            humidity:clim.humidity,sunshine:clim.sunshine,
                            fertilizer_used:form.fertilizer,irrigation_used:form.irrigation,
                            soil_type:form.soil,climate_source:"auto"},
        recommendations  : buildRecs(form.crop,yieldPA),
      };
      setLoading(false);
      onResult(result); onNavigate("result");
    }
  };

  return (
    <>
      <Topbar title={t.newPred} sub={`${t.stepOf} ${step}/2`}
        onBack={()=>step===1?onNavigate("dashboard"):setStep(1)}
        lang={lang} setLang={setLang}
        actions={<button className="tb-btn">❓</button>}/>
      <div className="steps-bar"><div className="steps-fill" style={{width:`${step*50}%`}}/></div>
      {offline && <div className="alert alert-err" style={{margin:"8px 16px 0"}}>{t.offlineMode}</div>}
      <div className="scroll fade-up">

        {step===1 ? (
          <>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:18,fontWeight:800,color:"var(--s900)"}}>{t.enterFarmDetails}</div>
              <div style={{fontSize:13,color:"var(--s500)",marginTop:3}}>{t.stepOf} 1/2 — {t.cropLocation}</div>
            </div>

            {/* Crop */}
            <div className="fgrp">
              <label className="flabel">{t.selectCrop}</label>
              <div className="crop-grid">
                {CROPS.map(c=>(
                  <button key={c} className={`crop-btn ${form.crop===c?"sel":""}`} onClick={()=>set("crop",c)}>
                    <span className="crop-btn-icon">{CROP_ICON[c]}</span>
                    <span className="crop-btn-name">{c}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Farm Size + Area Planted */}
            <div className="frow">
              <div>
                <label className="flabel">{t.farmSizeHa}</label>
                <input className="finput" type="number" min="0.01" max="5" step="0.01"
                  placeholder="e.g. 1.50" value={form.farmSizeHa}
                  onChange={e=>set("farmSizeHa",e.target.value)}/>
                {form.farmSizeHa && <div className="hint">= {Math.round(parseFloat(form.farmSizeHa)*100)} are</div>}
              </div>
              <div>
                <label className="flabel">{t.areaPlantedHa}</label>
                <input className="finput" type="number" min="0.01" max="5" step="0.01"
                  placeholder="e.g. 1.20" value={form.areaPlantedHa}
                  onChange={e=>set("areaPlantedHa",e.target.value)}/>
                {form.areaPlantedHa && <div className="hint">= {Math.round(parseFloat(form.areaPlantedHa)*100)} are</div>}
              </div>
            </div>

            {/* Farmer Category */}
            <div className="fgrp">
              <label className="flabel">{t.farmerCategory}</label>
              <select className="finput" value={form.farmerCategory} onChange={e=>set("farmerCategory",e.target.value)}>
                <option value="Small">Small (&lt; 50 are)</option>
                <option value="Medium">Medium (50–150 are)</option>
                <option value="Large">Large (&gt; 150 are)</option>
              </select>
            </div>

            {/* Sector + Season */}
            <div className="frow">
              <div>
                <label className="flabel">{t.districtSector}</label>
                <select className="finput" value={form.sector} onChange={e=>set("sector",e.target.value)}>
                  <option value="">{t.selectLocation}</option>
                  {SECTORS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="flabel">{t.season}</label>
                <select className="finput" value={form.season} onChange={e=>set("season",e.target.value)}>
                  <option value="">{t.selectSeason}</option>
                  {SEASONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Planting Date → auto fills Month */}
            <div className="frow">
              <div>
                <label className="flabel">{t.plantingDate}</label>
                <input className="finput" type="date" value={form.plantingDate}
                  onChange={e=>handleDateChange(e.target.value)}/>
                {form.month && <div className="hint">📅 {form.month} · {form.season}</div>}
              </div>
              <div>
                <label className="flabel">{t.month}</label>
                <select className="finput" value={form.month} onChange={e=>set("month",e.target.value)}>
                  <option value="">{t.selectMonth}</option>
                  {MONTHS.map(m=><option key={m}>{m}</option>)}
                </select>
                {form.month && <div className="hint-gray">{lang==="en"?"Auto-filled from date":"Yuzuzwa bwite"}</div>}
              </div>
            </div>

            {/* Soil Type */}
            <div className="fgrp">
              <label className="flabel">{t.soilType}</label>
              <select className="finput" value={form.soil} onChange={e=>set("soil",e.target.value)}>
                {SOILS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Live Climate Preview */}
            <ClimateCard climate={autoClimate} month={form.month} season={form.season} lang={lang}/>

            {/* Fertilizer */}
            <div className="fgrp">
              <label className="flabel">{t.fertilizerUsed}</label>
              <div className="toggle-group">
                <button className={`toggle-opt ${form.fertilizer?"sel":""}`} onClick={()=>set("fertilizer",true)}>{t.yes}</button>
                <button className={`toggle-opt ${!form.fertilizer?"sel":""}`} onClick={()=>set("fertilizer",false)}>{t.no}</button>
              </div>
            </div>

            {/* Irrigation */}
            <div className="fgrp">
              <label className="flabel">{t.irrigationUsed}</label>
              <div className="toggle-group">
                <button className={`toggle-opt ${form.irrigation?"sel":""}`} onClick={()=>set("irrigation",true)}>{t.yes}</button>
                <button className={`toggle-opt ${!form.irrigation?"sel":""}`} onClick={()=>set("irrigation",false)}>{t.no}</button>
              </div>
            </div>

            <button className="btn btn-primary" onClick={()=>setStep(2)} disabled={!step1Valid}>{t.continueStep2}</button>
            <div style={{textAlign:"center",fontSize:11,color:"var(--s400)",marginTop:8}}>{t.requiredFields}</div>
          </>
        ) : (
          <>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:800,color:"var(--s900)"}}>{t.reviewPredict}</div>
              <div style={{fontSize:13,color:"var(--s500)",marginTop:3}}>{t.stepOf} 2/2 — {t.summary}</div>
            </div>

            {/* Summary Card */}
            <div className="card" style={{background:"var(--g50)",borderColor:"var(--g300)",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontWeight:800,fontSize:13,color:"var(--g800)"}}>📋 {t.summary}</div>
                <button onClick={()=>setStep(1)} style={{fontSize:12,color:"var(--g700)",fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>{t.edit}</button>
              </div>
              {[
                [t.cropType,       `${CROP_ICON[form.crop]} ${form.crop}`],
                [t.farmSizeHa.replace(" *",""), `${form.farmSizeHa} ha = ${Math.round(parseFloat(form.farmSizeHa)*100)} are`],
                [t.areaPlantedHa.replace(" *",""), form.areaPlantedHa?`${form.areaPlantedHa} ha = ${Math.round(parseFloat(form.areaPlantedHa)*100)} are`:`${Math.round(parseFloat(form.farmSizeHa)*90)} are (90%)`],
                [t.plantingDate.replace(" *",""), form.plantingDate||"–"],
                [t.location,       `Bugesera · ${form.sector}`],
                [t.season.replace(" *",""), form.season],
                [t.month.replace(" (auto)",""), form.month],
                [t.soilType,       form.soil],
                [t.fertilizer,     form.fertilizer?"Yes":"No"],
                [t.irrigation,     form.irrigation?"Yes":"No"],
                [t.farmerCategory, form.farmerCategory],
              ].map(([k,v])=>(
                <div key={k} className="summary-row">
                  <span className="summary-key">{k}</span>
                  <span className="summary-val">{v}</span>
                </div>
              ))}
            </div>

            {/* Climate Preview */}
            <ClimateCard climate={autoClimate} month={form.month} season={form.season} lang={lang}/>

            <div style={{background:"var(--g50)",border:"1px solid var(--g300)",borderRadius:"var(--radius-sm)",padding:12,marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{fontSize:20}}>ℹ️</div>
              <div style={{fontSize:12,color:"var(--g800)",lineHeight:1.6}}>
                <strong>{lang==="en"?"Climate data auto-loaded":"Amakuru y'ibihe yashyizwe bwite"}</strong><br/>
                {lang==="en"
                  ?`Based on ${form.month} historical averages for Bugesera District.`
                  :`Bikoreshwa hagamijwe ${form.month} muri Bugesera District.`}
              </div>
            </div>

            <button className="btn btn-primary" onClick={handlePredict} disabled={loading}>
              {loading?<><div className="spin"/>{t.runningModel}</>:t.getHarvestPrediction}
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ── RESULT ────────────────────────────────────────────────────────────────────
function ResultScreen({result,onNavigate,onSave,lang,setLang}) {
  const t = T[lang];
  if (!result) return null;
  const pct = ((result.yield_per_are_kg-(result.district_avg_kg_are||20))/(result.district_avg_kg_are||20)*100);

  return (
    <>
      <Topbar title={lang==="en"?"Prediction Result":"Ibisobanuro"} sub={`ID: ${result.id}`}
        onBack={()=>onNavigate("dashboard")} lang={lang} setLang={setLang}
        actions={<button className="tb-btn">📤</button>}/>
      <div className="scroll fade-up">
        <div className="result-hero">
          <div style={{fontSize:13,opacity:.75,marginBottom:4}}>{t.expectedHarvest}</div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>{t.predictionComplete}</div>
          <div style={{fontSize:30,marginBottom:6}}>{CROP_ICON[result.crop]||"🌾"}</div>
          <div className="result-big">{result.yield_range}</div>
          <div className="result-unit">{t.perAreEst}</div>
          <div className="result-meta">
            <div className="result-meta-item">
              <div className="result-meta-val">{result.total_yield_kg}kg</div>
              <div className="result-meta-lbl">{t.total} ({result.area_planted_are||result.farm_size_are}a)</div>
            </div>
            <div className="result-meta-item">
              <div className="result-meta-val">{result.confidence_pct}%</div>
              <div className="result-meta-lbl">{t.confidence}</div>
            </div>
            <div className="result-meta-item">
              <div className="result-meta-val">ML</div>
              <div className="result-meta-lbl">{t.modelUsed}</div>
            </div>
          </div>
        </div>

        {/* Key Numbers */}
        <div className="stat-grid">
          {[
            ["🌾",`${result.yield_per_are_kg} kg/are`,"Yield per Are"],
            ["🏡",`${result.yield_per_ha_kg} kg/ha`,"Yield per Ha"],
            ["📦",`${result.total_yield_kg} kg`,"Total Harvest"],
            ["📐",`${result.farm_size_are}a/${result.farm_size_ha}ha`,"Farm Size"],
          ].map(([icon,val,lbl])=>(
            <div key={lbl} className="stat-box">
              <div style={{fontSize:22}}>{icon}</div>
              <div className="stat-val" style={{fontSize:15}}>{val}</div>
              <div className="stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="card" style={{marginBottom:14}}>
          <div className="sec-hd" style={{marginBottom:10}}>📊 {t.comparison}</div>
          {[[t.avgYieldArea,`${result.district_avg_kg_are||20} kg/are`],
            [t.yourPrediction,`${result.yield_per_are_kg} kg/are`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--s100)"}}>
              <span style={{fontSize:13,color:"var(--s500)"}}>{k}</span>
              <span style={{fontWeight:800,fontSize:14,color:"var(--g700)"}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:10,padding:8,background:pct>=0?"var(--g50)":"var(--amber-l)",borderRadius:8,textAlign:"center",fontSize:13,fontWeight:700,color:pct>=0?"var(--g800)":"var(--amber-d)"}}>
            {pct>=0?"✅":"⚠️"} {pct>=0?"+"}{pct.toFixed(1)}% vs district average
          </div>
        </div>

        {/* Climate inputs */}
        <div className="stat-grid">
          {[["🌡️",`${result.inputs?.temperature||"–"}°C`,t.temperature],
            ["🌧️",`${result.inputs?.rainfall||"–"}mm`,t.rainfall],
            ["💧",`${result.inputs?.humidity||"–"}%`,t.humidity],
            ["☀️",`${result.inputs?.sunshine||"–"}h`,t.sunshine]].map(([icon,val,lbl])=>(
            <div key={lbl} className="stat-box">
              <div style={{fontSize:22}}>{icon}</div>
              <div className="stat-val" style={{fontSize:18}}>{val}</div>
              <div className="stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Soil info if available */}
        {result.soil_data && Object.keys(result.soil_data).length>0 && (
          <div className="card" style={{marginBottom:14}}>
            <div className="sec-hd" style={{marginBottom:10}}>🌱 {t.soilInfo} — {result.sector}</div>
            {[["pH Level",result.soil_data.pH_Level],
              ["Nitrogen (ppm)",result.soil_data.Nitrogen_ppm],
              ["Phosphorus (ppm)",result.soil_data.Phosphorus_ppm],
              ["Potassium (ppm)",result.soil_data.Potassium_ppm]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--s100)"}}>
                <span style={{fontSize:13,color:"var(--s500)"}}>{k}</span>
                <span style={{fontWeight:700,fontSize:13}}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div className="sec-hd">📋 {t.recommendations}</div>
        {result.recommendations?.map((r,i)=>(
          <div key={i} className={`rec rec-${r.type}`}>
            <div className="rec-cat">{r.icon} {r.category}</div>
            <div className="rec-text">{r.message}</div>
          </div>
        ))}

        <button className="btn btn-primary" style={{marginTop:10}} onClick={()=>{onSave(result);onNavigate("predict");}}>
          {t.makeAnother}
        </button>
      </div>
    </>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
function HistoryScreen({predictions,onNavigate,lang,setLang}) {
  const t = T[lang];
  const [crop,setCrop]   = useState("All");
  const [search,setSearch] = useState("");
  const filtered = predictions.filter(p=>
    (crop==="All"||p.crop===crop)&&
    (!search||p.crop?.toLowerCase().includes(search.toLowerCase())||
     p.sector?.toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <Topbar title={t.predHistory} onBack={()=>onNavigate("dashboard")} lang={lang} setLang={setLang}/>
      <div className="scroll fade-up">
        <input className="finput" placeholder={t.searchCrop} value={search}
          onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}}/>
        <div className="frow" style={{marginBottom:14}}>
          <select className="finput" value={crop} onChange={e=>setCrop(e.target.value)}>
            <option value="All">{t.allCrops}</option>
            {CROPS.map(c=><option key={c}>{c}</option>)}
          </select>
          <select className="finput"><option>2024</option><option>2023</option></select>
        </div>

        <div className="card card-hero" style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:12,opacity:.8,marginBottom:4}}>📊 {t.overallStats}</div>
              <div style={{fontSize:38,fontWeight:800,fontFamily:"JetBrains Mono,monospace"}}>{predictions.length}</div>
              <div style={{fontSize:12,opacity:.75}}>{t.totalPredictions}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:38,fontWeight:800,fontFamily:"JetBrains Mono,monospace"}}>84.8%</div>
              <div style={{fontSize:12,opacity:.75}}>{t.avgAccuracy}</div>
            </div>
          </div>
        </div>

        {filtered.length===0 && (
          <div style={{textAlign:"center",padding:"30px",color:"var(--s400)",fontSize:13}}>
            No predictions found. Make a new prediction!
          </div>
        )}

        {filtered.map((p,i)=>(
          <div key={i} className="hitem">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div className="hitem-icon">{CROP_ICON[p.crop]||"🌱"}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div style={{fontWeight:700,fontSize:15}}>{p.crop}</div>
                  <span className="badge bg-green">✅ {p.confidence_pct}%</span>
                </div>
                <div style={{fontSize:12,color:"var(--s500)",marginTop:2}}>
                  📅 {new Date(p.timestamp||Date.now()).toLocaleDateString()} · {p.sector}
                </div>
              </div>
              <div className="hitem-yield">{p.yield_per_are_kg}<span style={{fontSize:11}}>kg</span></div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,paddingTop:8,borderTop:"1px solid var(--s100)"}}>
              <div style={{fontSize:12,color:"var(--s500)"}}>{t.predicted} <strong>{p.yield_per_are_kg} kg/are</strong></div>
              <div style={{fontSize:12,color:"var(--s500)"}}>{t.total2} <strong style={{color:"var(--g700)"}}>{p.total_yield_kg} kg</strong></div>
            </div>
            <div style={{fontSize:12,color:"var(--s500)",marginTop:4}}>
              📐 {p.farm_size_ha}ha = {p.farm_size_are}are · 🌱 Planted: {p.area_planted_are}are
            </div>
          </div>
        ))}
      </div>
      <BottomNav current="history" onNavigate={onNavigate} lang={lang}/>
    </>
  );
}

// ── WEATHER ───────────────────────────────────────────────────────────────────
function WeatherScreen({onNavigate,lang,setLang}) {
  const t = T[lang];
  const monthly = Object.entries(CLIMATE).map(([m,d])=>({m:m.slice(0,3),rain:d.rainfall,temp:d.temperature}));
  const maxR = Math.max(...monthly.map(d=>d.rain));
  return (
    <>
      <Topbar title={`🌦️ ${t.weatherTitle}`} sub="Bugesera District" onBack={()=>onNavigate("dashboard")} lang={lang} setLang={setLang}/>
      <div className="scroll fade-up">
        <div className="card card-blue" style={{marginBottom:14}}>
          <div style={{fontSize:12,opacity:.8,marginBottom:4}}>🌍 Bugesera · {t.currentSeason}</div>
          <div style={{fontSize:32,fontWeight:800,margin:"6px 0"}}>23.2°C ☀️</div>
          <div style={{display:"flex",gap:18,marginTop:12,flexWrap:"wrap",fontSize:13}}>
            <div>💧 74% Humidity</div><div>🌧️ 78mm Rainfall</div><div>☀️ 7.6h Sunshine</div>
          </div>
        </div>
        <div className="sec-hd">📊 {t.monthlyRainfall}</div>
        <div className="card">
          {monthly.map(d=>(
            <div key={d.m} className="bar-row">
              <div className="bar-lbl">{d.m}</div>
              <div className="bar-track"><div className="bar-fill" style={{width:`${(d.rain/maxR)*100}%`}}/></div>
              <div className="bar-val">{d.rain}mm</div>
            </div>
          ))}
        </div>
        <div className="sec-hd">🌡️ {t.monthlyTemp}</div>
        <div className="card">
          {monthly.map(d=>(
            <div key={d.m} className="bar-row">
              <div className="bar-lbl">{d.m}</div>
              <div className="bar-track"><div className="bar-fill" style={{width:`${((d.temp-20)/8)*100}%`,background:"linear-gradient(90deg,#3b82f6,#f97316)"}}/></div>
              <div className="bar-val">{d.temp}°C</div>
            </div>
          ))}
        </div>
        <div className="card" style={{background:"var(--g50)",borderColor:"var(--g300)"}}>
          <div style={{fontWeight:800,fontSize:13,color:"var(--g800)",marginBottom:10}}>🌱 {t.plantingCalendar}</div>
          {[["Season A (Oct–Jan)","Maize, Rice — main season, +10% yields"],
            ["Season B (Mar–Jul)","Beans, Vegetables — secondary season"],
            ["Best planting","Oct–Nov (Season A) · Mar–Apr (Season B)"]].map(([title,desc])=>(
            <div key={title} style={{padding:"7px 0",borderBottom:"1px solid var(--g200)"}}>
              <div style={{fontWeight:700,fontSize:12,color:"var(--g800)"}}>{title}</div>
              <div style={{fontSize:12,color:"var(--s600)",marginTop:2}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav current="weather" onNavigate={onNavigate} lang={lang}/>
    </>
  );
}

// ── TIPS ──────────────────────────────────────────────────────────────────────
function TipsScreen({onNavigate,lang,setLang}) {
  const t = T[lang];
  const [open,setOpen] = useState(null);
  const tips = [
    {icon:"🌱",title:lang==="en"?"Soil Preparation":"Gutegura Ubutaka",bg:"var(--g50)",bc:"var(--g300)",tc:"var(--g800)",
     items:lang==="en"
       ?["Test soil pH every season — optimal 5.8–7.0 for Bugesera crops",
         "Add compost (20 kg/are) 2 weeks before planting",
         "Deep plow to 20–25cm to break hardpan",
         "Apply lime if pH < 5.5 (2 kg lime/are)"]
       :["Suzuma pH buri gihe — Bugesera: 5.8–7.0",
         "Ongeraho imborera (20 kg/are) ibyumweru 2 mbere yo gutera",
         "Hinga bugufi 20–25cm","Koresha lime niba pH < 5.5"]},
    {icon:"💧",title:lang==="en"?"Water Management":"Gucunga Amazi",bg:"var(--blue-l)",bc:"#93c5fd",tc:"var(--blue-d)",
     items:lang==="en"
       ?["Furrow or drip irrigation saves 30–40% water",
         "Water early morning (6–8am) to minimize evaporation",
         "Apply 4–6cm mulch to retain soil moisture",
         "Monitor at 15cm depth — irrigate when dry"]
       :["Kuhira mu mirwamo bigabanya amazi 30–40%",
         "Hira mu gitondo (6–8am)","Shyira imfuro (4–6cm)",
         "Suzuma ubuhehere 15cm munsi"]},
    {icon:"🌽",title:lang==="en"?"Maize Agronomy":"Ubuhinzi bwa Ikigori",bg:"#fffbeb",bc:"#fde68a",tc:"var(--amber-d)",
     items:lang==="en"
       ?["Spacing: 75cm × 25cm (~53,000 plants/ha)",
         "Apply DAP 0.5kg/are at planting; top-dress CAN at knee-height",
         "Scout weekly for Fall Armyworm",
         "Harvest at grain moisture ≤25%; dry to ≤13% before storage"]
       :["Intambuko: 75cm × 25cm","Koresha DAP 50kg/akaro",
         "Shakisha Fall Armyworm buri cyumweru",
         "Geze ubushyuhe ≤25%"]},
    {icon:"🫘",title:lang==="en"?"Beans Agronomy":"Ubuhinzi bwa Ibishyimbo",bg:"var(--g50)",bc:"var(--g300)",tc:"var(--g800)",
     items:lang==="en"
       ?["Inoculate seeds with Rhizobium before planting",
         "Spacing: 40cm × 15cm; seed 3–4cm deep",
         "Weed at 2 and 4 weeks after germination",
         "Harvest when 90% of pods are dry"]
       :["Sugira imbuto na Rhizobium mbere yo gutera",
         "Intambuko: 40cm × 15cm","Kuraho ibyatsi mu cyumweru 2 no 4",
         "Geze uduke 90% w'indabo umeze"]},
    {icon:"🌾",title:lang==="en"?"Rice Agronomy":"Ubuhinzi bwa Umuceri",bg:"var(--purple-l)",bc:"#c4b5fd",tc:"#5b21b6",
     items:lang==="en"
       ?["Use certified flood-tolerant varieties (JASMINE 85 or NERICA)",
         "Transplant at 20×20cm spacing",
         "Keep paddy flooded 5cm during vegetative stage",
         "Apply urea 0.5kg/are at tillering"]
       :["Koresha ubwoko bwemewe (JASMINE 85 cyangwa NERICA)",
         "Tera inzuri 20×20cm","Bika amazi 5cm",
         "Koresha urea 50kg/akaro"]},
    {icon:"🐛",title:lang==="en"?"Pest Management":"Kurwanya Udukoko",bg:"var(--red-l)",bc:"#fca5a5",tc:"var(--red-d)",
     items:lang==="en"
       ?["Scout every 7 days during growing season",
         "Report Fall Armyworm to RAB extension",
         "Use neem oil (5ml/L) as first-line control",
         "Rotate crops each season"]
       :["Suzuma buri minsi 7","Menyesha RAB Fall Armyworm ubibonye",
         "Koresha amavuta ya neem (5ml/L)",
         "Hindura ibihingwa buri gihe"]},
  ];

  return (
    <>
      <Topbar title={`📚 ${t.tipsTitle}`} sub={t.tipsSubtitle} onBack={()=>onNavigate("dashboard")} lang={lang} setLang={setLang}/>
      <div className="scroll fade-up">
        <div style={{fontSize:12,color:"var(--s500)",marginBottom:14}}>📋 {t.tailoredTips}</div>
        {tips.map((tip,i)=>(
          <div key={i} style={{background:tip.bg,border:`1.5px solid ${tip.bc}`,borderRadius:"var(--radius)",padding:16,marginBottom:12,cursor:"pointer"}}
            onClick={()=>setOpen(open===i?null:i)}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:26}}>{tip.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14,color:tip.tc}}>{tip.title}</div>
                <div style={{fontSize:11,color:"var(--s500)",marginTop:2}}>{tip.items.length} {lang==="en"?"tips":"inama"}</div>
              </div>
              <span style={{fontSize:18,color:tip.tc}}>{open===i?"▲":"▼"}</span>
            </div>
            {open===i && (
              <div className="tip-body">
                {tip.items.map((item,j)=>(
                  <div key={j} style={{display:"flex",gap:8,marginBottom:7,fontSize:13,color:"var(--s700)",lineHeight:1.5}}>
                    <span style={{fontSize:10,marginTop:4,color:tip.tc,flexShrink:0}}>●</span>{item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomNav current="tips" onNavigate={onNavigate} lang={lang}/>
    </>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function ProfileScreen({user,onNavigate,onLogout,lang,setLang}) {
  const t = T[lang];
  return (
    <>
      <Topbar title={`👤 ${t.myProfile}`} onBack={()=>onNavigate("dashboard")} lang={lang} setLang={setLang}/>
      <div className="scroll fade-up">
        <div className="profile-avatar">👨‍🌾</div>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:20,fontWeight:800,color:"var(--s900)"}}>{user.name}</div>
          <span className="badge bg-green" style={{marginTop:6}}>🌱 {t.farmer} · {user.id}</span>
        </div>
        <div className="card">
          <div className="sec-hd" style={{marginBottom:12}}>{t.personalInfo}</div>
          {[[t.name,user.name],[t.id,user.id],[t.phoneLabel,user.phone],
            [t.sector,user.sector],
            [t.farmSizeHa.replace(" *",""),`${user.farm_size_ha||0} ha = ${user.farm_size_are||0} are`],
            [t.activeCrops,user.crops?.join(", ")||"–"]
          ].map(([k,v])=>(
            <div key={k} className="info-row">
              <span className="info-key">{k}</span>
              <span className="info-val">{v}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="sec-hd" style={{marginBottom:12}}>{t.settings}</div>
          {[t.editProfile,t.changePassword,`${t.language} (${lang==="en"?"English":"Kinyarwanda"})`,t.aboutApp].map(item=>(
            <div key={item} className="info-row" style={{cursor:"pointer"}}>
              <span style={{fontSize:14,fontWeight:600,color:"var(--s700)"}}>{item}</span>
              <span style={{color:"var(--s400)"}}>→</span>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={onLogout} style={{borderColor:"var(--red-d)",color:"var(--red-d)"}}>
          🚪 {t.logout}
        </button>
      </div>
      <BottomNav current="profile" onNavigate={onNavigate} lang={lang}/>
    </>
  );
}

// ── OFFICER DASHBOARD ─────────────────────────────────────────────────────────
function OfficerApp({user,onLogout,lang,setLang}) {
  const t = T[lang];
  const [tab,setTab]         = useState("overview");
  const [dashData,setDashData] = useState(null);
  const [loading,setLoading]   = useState(true);

  useEffect(()=>{
    fetch(`${API_BASE}/api/officer-dashboard`)
      .then(r=>r.json())
      .then(d=>{ setDashData(d); setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  const CROP_YIELDS = {Maize:23.22,Beans:11.91,Rice:36.36};
  const sectorYields = [487,423,511,398,456,512,389,443];
  const maxY = Math.max(...sectorYields);

  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <div className="topbar-brand">🏛️ {t.districtDash}</div>
          <div className="topbar-sub">{t.officerView}</div>
        </div>
        <div className="topbar-actions">
          <LangBtn lang={lang} setLang={setLang}/>
          <button className="tb-btn" onClick={onLogout} title={t.logout}>🚪</button>
        </div>
      </div>

      <div style={{padding:"10px 16px 0",flexShrink:0}}>
        <div className="officer-chip">🏛️ {t.officer} · {user.name}</div>
        <div className="pill-tabs">
          {[[t.overview,"overview"],[t.sectorsTab,"sectors"],[t.farmersTab,"farmers"],[t.reportsTab,"reports"]].map(([label,key])=>(
            <button key={key} className={`pill-tab ${tab===key?"act":""}`} onClick={()=>setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="scroll fade-up" style={{padding:"0 16px 20px"}}>
        {tab==="overview" && (
          <>
            {/* Live API stats */}
            <div className="stat-grid">
              {[["👨‍🌾", dashData?.summary?.total_farmers||"–","Registered Farmers","var(--g600)"],
                ["🌾",  dashData?.summary?.total_predictions||"0","Predictions Made","#7c3aed"],
                ["📈",  dashData?.summary?.model_accuracy||"84.8%","Model Accuracy","var(--blue)"],
                ["🏘️",  "15","Sectors","var(--amber)"]].map(([icon,val,lbl,clr])=>(
                <div key={lbl} className="stat-box">
                  <div style={{fontSize:24,marginBottom:4}}>{icon}</div>
                  <div className="stat-val" style={{color:clr,fontSize:20}}>{val}</div>
                  <div className="stat-lbl">{lbl}</div>
                </div>
              ))}
            </div>

            <div className="sec-hd">🌾 {t.districtYield}</div>
            <div className="card">
              {Object.entries(dashData?.crop_data||CROP_YIELDS).map(([crop,data])=>{
                const val = typeof data==="object"?data.avg_yield_kg_are:data;
                const col = {Maize:"#f59e0b",Beans:"#22c55e",Rice:"#8b5cf6"}[crop]||"#22c55e";
                return (
                  <div key={crop} className="bar-row">
                    <div className="bar-lbl">{CROP_ICON[crop]} {crop}</div>
                    <div className="bar-track"><div className="bar-fill" style={{width:`${(val/50)*100}%`,background:col}}/></div>
                    <div className="bar-val">{val?.toFixed?.(1)||val} kg/a</div>
                  </div>
                );
              })}
            </div>

            {/* Recent predictions from actual farmers */}
            {dashData?.recent_preds?.length>0 && (
              <>
                <div className="sec-hd">📋 Recent Predictions</div>
                {dashData.recent_preds.slice(0,5).map((p,i)=>(
                  <div key={i} className="farmer-row">
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="avatar-sm">{CROP_ICON[p.crop]}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{p.farmer_id} — {p.crop}</div>
                        <div style={{fontSize:11,color:"var(--s500)"}}>{p.sector} · {new Date(p.timestamp).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:800,color:"var(--g700)",fontFamily:"JetBrains Mono,monospace",fontSize:14}}>{p.yield_per_are_kg} kg/are</div>
                      <div style={{fontSize:11,color:"var(--s500)"}}>{p.total_yield_kg} kg total</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="sec-hd">🗓️ {t.seasonPerf}</div>
            <div className="card">
              {[["Season A (Oct–Jan)",92,487,"Main season — higher yields"],
                ["Season B (Mar–Jul)",85,423,"Secondary season"]].map(([s,acc,yld,note])=>(
                <div key={s} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div><div style={{fontWeight:700,fontSize:13}}>{s}</div><div style={{fontSize:11,color:"var(--s500)"}}>{note}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:13,color:"var(--g700)"}}>{yld} kg/are</div><div style={{fontSize:11,color:"var(--s500)"}}>{acc}% accuracy</div></div>
                  </div>
                  <div className="prog-track"><div className="prog-fill" style={{width:`${acc}%`}}/></div>
                </div>
              ))}
            </div>

            <div className="sec-hd">⚠️ {t.districtAlerts}</div>
            {[["high","🔴","Drought risk in Rweru & Musenyi — rainfall <35mm for 21 days"],
              ["med","🟡","Fall Armyworm alert — 3 Gashora farms report infestation"],
              ["low","🔵","Rice blast disease risk in Ntarama wetlands"]].map(([sev,icon,msg],i)=>(
              <div key={i} className="alert" style={{background:sev==="high"?"var(--red-l)":sev==="med"?"var(--amber-l)":"var(--blue-l)",color:sev==="high"?"var(--red-d)":sev==="med"?"var(--amber-d)":"var(--blue-d)",borderLeft:`3px solid ${sev==="high"?"var(--red)":sev==="med"?"var(--amber)":"var(--blue)"}`}}>
                {icon} {msg}
              </div>
            ))}
          </>
        )}

        {tab==="sectors" && (
          <>
            <div className="sec-hd">📊 {t.sectorYield}</div>
            <div className="card">
              {SECTORS.slice(0,8).map((sec,i)=>(
                <div key={sec} className="bar-row">
                  <div className="bar-lbl">{sec}</div>
                  <div className="bar-track"><div className="bar-fill" style={{width:`${(sectorYields[i]/maxY)*100}%`}}/></div>
                  <div className="bar-val">{sectorYields[i]} kg</div>
                </div>
              ))}
            </div>
            <div className="sec-hd">🚦 {t.sectorRisk}</div>
            {[["Nyamata","Low","bg-green","Good rainfall & optimal temp"],
              ["Gashora","Medium","bg-amber","Pest alert — Fall Armyworm"],
              ["Rweru","High","bg-red","Drought risk — rainfall <35mm"],
              ["Ntarama","Medium","bg-amber","Rice blast risk in wetland areas"],
              ["Rilima","Low","bg-green","Normal conditions"],
              ["Ruhuha","Low","bg-green","Above average yields"]].map(([sec,risk,cls,note])=>(
              <div key={sec} className="farmer-row">
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>📍 {sec}</div>
                  <div style={{fontSize:12,color:"var(--s500)",marginTop:2}}>{note}</div>
                </div>
                <span className={`badge ${cls}`}>{risk} Risk</span>
              </div>
            ))}
          </>
        )}

        {tab==="farmers" && (
          <>
            <input className="finput" placeholder={`🔍 ${t.searchFarmers}`} style={{marginBottom:12}}/>
            {loading ? (
              <div style={{textAlign:"center",padding:20,color:"var(--s400)"}}>Loading farmers…</div>
            ) : (
              (dashData?.farmers||[]).map(f=>(
                <div key={f.id} className="farmer-row" style={{cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div className="avatar-sm">👨‍🌾</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{f.name}</div>
                      <div style={{fontSize:11,color:"var(--s500)"}}>{f.id} · {f.sector} · {f.farm_size_ha}ha/{f.farm_size_are}are</div>
                    </div>
                  </div>
                  <span className="badge bg-green">Active</span>
                </div>
              ))
            )}
            <div className="card card-blue" style={{marginTop:14}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>📊 {t.farmerStats}</div>
              {[["Total Registered",dashData?.summary?.total_farmers||3],
                ["Total Predictions",dashData?.summary?.total_predictions||0],
                ["Model Accuracy",dashData?.summary?.model_accuracy||"84.8%"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.15)"}}>
                  <span style={{fontSize:12,opacity:.9}}>{k}</span>
                  <span style={{fontWeight:800,fontSize:13}}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="reports" && (
          <>
            <div className="sec-hd">📄 {t.generateReport}</div>
            <div className="card">
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Report Configuration</div>
              {[["Report Type",["Season Summary","Crop Performance","Risk Assessment","Farmer Statistics"]],
                ["Period",["Season A 2024","Season B 2024","Full Year 2024"]],
                ["Sectors",["All Sectors","Selected Sectors"]]].map(([lbl,opts])=>(
                <div key={lbl} className="fgrp">
                  <label className="flabel">{lbl}</label>
                  <select className="finput"><option value="">Select…</option>{opts.map(o=><option key={o}>{o}</option>)}</select>
                </div>
              ))}
              <button className="btn btn-primary">{t.generatePDF}</button>
            </div>
            <div className="sec-hd" style={{marginTop:6}}>🌾 {t.sendAdvice}</div>
            <div className="card" style={{background:"var(--g50)",borderColor:"var(--g300)"}}>
              <div style={{fontWeight:700,color:"var(--g800)",marginBottom:10}}>{t.sendAdvice}</div>
              <div className="fgrp">
                <label className="flabel">{t.targetGroup}</label>
                <select className="finput">
                  <option>All Farmers</option>
                  <option>Maize Farmers</option>
                  <option>Beans Farmers</option>
                  <option>Rice Farmers</option>
                </select>
              </div>
              <div className="fgrp">
                <label className="flabel">{t.adviceMessage}</label>
                <textarea className="finput" rows={3} placeholder="Type farming advice…" style={{resize:"vertical"}}/>
              </div>
              <button className="btn btn-primary">{t.sendToFarmers}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]     = useState(null);
  const [screen,setScreen] = useState("dashboard");
  const [history,setHist]  = useState([]);
  const [result,setResult] = useState(null);
  const [lang,setLang]     = useState("en");

  const nav     = s=>setScreen(s);
  const saveRes = r=>setHist(prev=>[r,...prev]);
  const logout  = ()=>{ setUser(null); setScreen("dashboard"); setHist([]); setResult(null); };

  if (!user) return <><GlobalStyle/><AuthScreen onLogin={u=>{setUser(u);setScreen("dashboard");}} lang={lang} setLang={setLang}/></>;
  if (user.role==="officer") return <><GlobalStyle/><OfficerApp user={user} onLogout={logout} lang={lang} setLang={setLang}/></>;

  const sh = {lang,setLang};
  return (
    <>
      <GlobalStyle/>
      <div className="shell">
        {screen==="dashboard" && <DashboardScreen user={user} onNavigate={nav} history={history} {...sh}/>}
        {screen==="predict"   && <PredictScreen   user={user} onNavigate={nav} onResult={setResult} {...sh}/>}
        {screen==="result"    && <ResultScreen    result={result} onNavigate={nav} onSave={saveRes} {...sh}/>}
        {screen==="history"   && <HistoryScreen   predictions={history} onNavigate={nav} {...sh}/>}
        {screen==="weather"   && <WeatherScreen   onNavigate={nav} {...sh}/>}
        {screen==="tips"      && <TipsScreen      onNavigate={nav} {...sh}/>}
        {screen==="profile"   && <ProfileScreen   user={user} onNavigate={nav} onLogout={logout} {...sh}/>}
      </div>
    </>
  );
}
