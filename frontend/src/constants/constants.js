// constants.js — pure JS, no JSX

export const API_BASE = "http://localhost:5000";

export const CLIMATE = {
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

export const MONTHS  = Object.keys(CLIMATE);
export const SEASONS = ["Season A","Season B"];
export const SECTORS = ["Gashora"]; // Restricted to Gashora Sector only
export const CROPS   = ["Maize","Rice"]; // Beans removed per requirements
export const SOILS   = ["Clay","Sandy-Clay","Loam"];

// Gashora Sector cells (5 cells)
export const GASHORA_CELLS = ["Biryogo", "Kabuye", "Kagomasi", "Mwendo", "Ramiro"];

// Gashora villages by cell (35 total villages)
export const GASHORA_LOCATIONS = {
  "Biryogo": ["Cyahinda", "Gasharu", "Karambi", "Kinyana", "Munanira", "Muvumu", "Rugarama"],
  "Kabuye": ["Gako", "Kabuye", "Munini", "Murama", "Nyarutovu", "Rugazi", "Ruhunde"],
  "Kagomasi": ["Gahama", "Kagomasi", "Kayovu", "Kibumbwe", "Mpanda", "Nyagasambu", "Rwimbogo"],
  "Mwendo": ["Akabungo", "Cyinzovu", "Gashikiri", "Kabuga", "Mwendo", "Nyamirama", "Rwamagana"],
  "Ramiro": ["Bihembe", "Gashenyi", "Kabeza", "Kamubuga", "Karenge", "Ruhanga", "Rurambi"]
};

export const CROP_ICON = {Maize:"bi-flower3",Rice:"bi-flower2"};

// CropIcon is defined as a JSX component in individual .jsx files that import CROP_ICON
export const getCropIconClass = (name) => `bi ${CROP_ICON[name] || 'bi-flower2'}`;

export const CROP_BENCH = {Maize:23.22,Rice:36.36};

export const SECTOR_SOIL_TYPE = {
  Gashora   :"Loam",       // pH 6.5 — Good
  Juru      :"Sandy Loam", // pH 6.9 — Good
  Kamabuye  :"Clay Soil",  // pH 7.1 — Fair
  Mareba    :"Sandy Loam", // pH 7.1 — Good
  Mayange   :"Sandy Loam", // pH 6.0 — Good
  Musenyi   :"Loam",       // pH 7.1 — Good
  Mwogo     :"Sandy Soil", // pH 6.0 — Poor
  Ngeruka   :"Loam",       // pH 7.0 — Good
  Ntarama   :"Sandy Soil", // pH 7.1 — Poor
  Nyamata   :"Clay Soil",  // pH 7.1 — Fair
  Nyarugenge:"Clay Soil",  // pH 6.2 — Fair
  Rilima    :"Sandy Soil", // pH 6.1 — Poor
  Ruhuha    :"Sandy Loam", // pH 7.0 — Good
  Rweru     :"Clay Soil",  // pH 7.0 — Fair
  Shyara    :"Sandy Loam", // pH 6.1 — Good
};

export const SECTOR_SOIL = {
  Gashora:    {soil:"Loam",       ph:6.5, health:"Good", om:"2.1%", n:"49 ppm", p:"24 ppm", k:"192 ppm"},
  Juru:       {soil:"Sandy Loam", ph:6.9, health:"Good", om:"2.6%", n:"48 ppm", p:"24 ppm", k:"176 ppm"},
  Kamabuye:   {soil:"Clay Soil",  ph:7.1, health:"Fair", om:"2.3%", n:"41 ppm", p:"19 ppm", k:"207 ppm"},
  Mareba:     {soil:"Sandy Loam", ph:7.1, health:"Good", om:"3.0%", n:"62 ppm", p:"12 ppm", k:"236 ppm"},
  Mayange:    {soil:"Sandy Loam", ph:6.0, health:"Good", om:"2.8%", n:"65 ppm", p:"12 ppm", k:"205 ppm"},
  Musenyi:    {soil:"Loam",       ph:7.1, health:"Good", om:"2.4%", n:"41 ppm", p:"14 ppm", k:"255 ppm"},
  Mwogo:      {soil:"Sandy Soil", ph:6.0, health:"Poor", om:"2.0%", n:"68 ppm", p:"21 ppm", k:"163 ppm"},
  Ngeruka:    {soil:"Loam",       ph:7.0, health:"Good", om:"2.7%", n:"74 ppm", p:"20 ppm", k:"196 ppm"},
  Ntarama:    {soil:"Sandy Soil", ph:7.1, health:"Poor", om:"2.9%", n:"62 ppm", p:"11 ppm", k:"245 ppm"},
  Nyamata:    {soil:"Clay Soil",  ph:7.1, health:"Fair", om:"3.2%", n:"77 ppm", p:"24 ppm", k:"253 ppm"},
  Nyarugenge: {soil:"Clay Soil",  ph:6.2, health:"Fair", om:"2.2%", n:"40 ppm", p:"22 ppm", k:"195 ppm"},
  Rilima:     {soil:"Sandy Soil", ph:6.1, health:"Poor", om:"1.8%", n:"43 ppm", p:"16 ppm", k:"213 ppm"},
  Ruhuha:     {soil:"Sandy Loam", ph:7.0, health:"Good", om:"2.5%", n:"62 ppm", p:"18 ppm", k:"186 ppm"},
  Rweru:      {soil:"Clay Soil",  ph:7.0, health:"Fair", om:"2.6%", n:"65 ppm", p:"12 ppm", k:"188 ppm"},
  Shyara:     {soil:"Sandy Loam", ph:6.1, health:"Good", om:"2.3%", n:"56 ppm", p:"21 ppm", k:"268 ppm"},
};

export const SOIL_DISPLAY = {
  "Loam"      : {health:"Good", icon:"bi bi-check-circle-fill", color:"var(--g600)",  bg:"var(--g100)"},
  "Sandy Loam": {health:"Good", icon:"bi bi-check-circle-fill", color:"var(--g600)",  bg:"var(--g100)"},
  "Clay Soil" : {health:"Fair", icon:"bi bi-exclamation-circle-fill", color:"var(--s600)", bg:"var(--s100)"},
  "Sandy Soil": {health:"Poor", icon:"bi bi-x-circle-fill", color:"var(--s500)",  bg:"var(--s100)"},
};

export const SEASON_BENCH = {
  "Season A": {Maize:23.86, Beans:12.17, Rice:37.96},
  "Season B": {Maize:22.59, Beans:11.65, Rice:34.77},
};

export const YIELD_THRESHOLDS = {
  Maize: {poor:20.54, avg:23.05, good:25.52, excellent:28.0},
  Beans: {poor:10.42, avg:11.90, good:13.51, excellent:15.0},
  Rice : {poor:31.49, avg:35.82, good:40.87, excellent:45.0},
};

export const PEST_BY_MONTH = {
  January:"Medium",   // 77mm — moderate risk
  February:"Medium",  // 81mm — moderate risk
  March:"High",       // 142mm — high rainfall = high pest risk
  April:"High",       // 141mm — long rains = high pest risk
  May:"High",         // 146mm — long rains peak = high pest risk
  June:"Low",         // 18mm — dry season = low pest risk
  July:"Low",         // 18mm — dry season = low pest risk
  August:"Low",       // 17mm — dry season = low pest risk
  September:"Medium", // 61mm — short rains starting = medium risk
  October:"Medium",   // 108mm — short rains = medium risk
  November:"High",    // 110mm — short rains peak = high pest risk
  December:"Medium",  // 61mm — tapering rains = medium risk
};

export function getClimate(month, season) {
  const b = CLIMATE[month]; if (!b) return null;
  const m = season==="Season A"?{rb:1.05,ta:0.2}:{rb:0.95,ta:-0.1};
  return {temperature:+(b.temperature+m.ta).toFixed(1),rainfall:+(b.rainfall*m.rb).toFixed(1),
          humidity:b.humidity,sunshine:b.sunshine,windSpeed:b.windSpeed,evapotranspiration:b.evapotranspiration};
}

export function getSeasonFromMonth(month) {
  const m = MONTHS.indexOf(month)+1;
  return (m>=10||m<=1)?"Season A":"Season B";
}

export const DEMO_USERS = {
  "F001":{id:"F001",name:"Cesalie Uwimpuhwe",phone:"+250782001001",sector:"Gashora",farm_size_ha:0.25,farm_size_are:25,crops:["Maize","Rice"],role:"farmer",password:"harvest2024",email:"cesalie@gmail.com"},
  "F002":{id:"F002",name:"Jean Pierre Habimana",phone:"+250782002002",sector:"Gashora",farm_size_ha:1.8,farm_size_are:180,crops:["Rice"],role:"farmer",password:"harvest2024"},
  "F003":{id:"F003",name:"Vestine Mukamana",phone:"+250782003003",sector:"Gashora",farm_size_ha:3.2,farm_size_are:320,crops:["Maize","Rice"],role:"farmer",password:"harvest2024"},
  "A001":{id:"A001",name:"Dr. Pascal Nkurunziza",phone:"+250788100100",sector:"Gashora",department:"Crop Production",role:"officer",password:"harvest2024"},
  "A100":{id:"A100",name:"District Agri Officer",phone:"+250788000000",sector:"Gashora",department:"Administration",role:"district",password:"harvest2024"},
  "S001":{id:"S001",name:"Marie Mukaso",phone:"+250788222333",sector:"Gashora",department:"Extension Services",role:"sector",password:"harvest2024",email:"marie@sector.gov.rw"},
};

export function simulateOffline({crop,month,season,farmSizeAre,areaPlantedAre,fertilizer,irrigation,soil}) {
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

export function buildRecs(crop, yieldPA, inputs={}) {
  const base       = CROP_BENCH[crop] || 20;
  const pct        = (yieldPA - base) / base * 100;
  const totalKg    = Math.round(yieldPA * (inputs.area_are || 100));
  const fertilizer = inputs.fertilizer;
  const irrigation = inputs.irrigation;
  const soil       = inputs.soil || "Clay";
  const season     = inputs.season || "Season A";
  const month      = inputs.month || "October";
  const pestLevel  = inputs.pest || "Low";
  const prevCrop   = inputs.prevCrop || "Beans";
  const sector     = inputs.sector || "";
  const areaAre    = inputs.area_are || 100;
  const laborAvail = inputs.labor || "Adequate";
  const credit     = inputs.credit || "No";
  const extension  = inputs.extension || "Yes";

  // Harvest timing — days to harvest from planting per crop
  const DAYS = {Maize:90, Beans:75, Rice:120};
  const plantDate = inputs.plantingDate ? new Date(inputs.plantingDate) : new Date();
  const harvestDate = new Date(plantDate);
  harvestDate.setDate(harvestDate.getDate() + (DAYS[crop]||90));
  const harvestStr = harvestDate.toLocaleDateString("en-RW",{day:"numeric",month:"long",year:"numeric"});
  const harvestStr_rw = harvestDate.toLocaleDateString("rw-RW",{day:"numeric",month:"long",year:"numeric"});

  // Estimated revenue (Bugesera avg market prices kg)
  const PRICE = {Maize:300, Beans:600, Rice:500}; // RWF per kg
  const revenue = Math.round(totalKg * (PRICE[crop]||400));
  const revenueStr = revenue.toLocaleString();

  // Next season recommendation
  const NEXT_CROP = {Maize:"Beans", Beans:"Maize", Rice:"Rice"};
  const nextCrop = NEXT_CROP[crop];
  const nextCrop_rw = crop==="Maize"?"Ibigori":crop==="Beans"?"Ibishyimbo":"Umuceri";

  // Fertilizer amount recommendation
  const FERT_REC = {Maize:"DAP 0.5 kg/are at planting + CAN 0.3 kg/are at knee height",
                    Beans:"DAP 0.3 kg/are at planting (avoid excess N)",
                    Rice:"Urea 0.5 kg/are at tillering + DAP 0.4 kg/are at transplanting"};
  const FERT_REC_RW = {Maize:"DAP 0.5 kg/are itewe + CAN 0.3 kg/are igihe ibigori bigeze ku mavi",
                       Beans:"DAP 0.3 kg/are itewe (irinda azote nyinshi)",
                       Rice:"Urea 0.5 kg/are igihe byatangiye gushyira amashami + DAP 0.4 kg/are igihe byimurwa"};

  // Build recs array
  const recs = [];

  // ── 1. YIELD SUMMARY ──
  const seasonBench = (SEASON_BENCH[season]||SEASON_BENCH["Season A"])[crop] || base;
  const thresh      = YIELD_THRESHOLDS[crop] || YIELD_THRESHOLDS.Maize;
  
  let grade, grade_rw, gradeType, gradeMsg, gradeMsg_rw;
  if (yieldPA >= thresh.excellent) {
    grade="Excellent"; grade_rw="Myiza Cyane"; gradeType="success";
    gradeMsg=`Your yield of ${yieldPA} kg/are is in the TOP 10% of ${crop} farmers in Bugesera this ${season}. Outstanding!`;
    gradeMsg_rw=`Umusaruro wawe wa ${yieldPA} kg/are uri muri 10% by'imbere ku bahinzi ba ${crop} muri Bugesera uyu ${season}. Byiza cyane!`;
  } else if (yieldPA >= thresh.good) {
    grade="Good"; grade_rw="Myiza"; gradeType="success";
    gradeMsg=`Your yield of ${yieldPA} kg/are is ABOVE AVERAGE for ${crop} in ${season}. Better than 75% of farmers.`;
    gradeMsg_rw=`Umusaruro wawe wa ${yieldPA} kg/are uri HEJURU Y'IMPUZANDENGO kuri ${crop} uyu ${season}. Urusha 75% by'abahinzi.`;
  } else if (yieldPA >= thresh.avg) {
    grade="Average"; grade_rw="Igiranye n'Impuzandengo"; gradeType="info";
    gradeMsg=`Your yield of ${yieldPA} kg/are is at the DISTRICT AVERAGE for ${crop} in ${season} (${seasonBench.toFixed(1)} kg/are).`;
    gradeMsg_rw=`Umusaruro wawe wa ${yieldPA} kg/are uri KURI MPUZANDENGO y'akarere kuri ${crop} uyu ${season} (${seasonBench.toFixed(1)} kg/are).`;
  } else {
    grade="Below Average"; grade_rw="Iri Munsi y'Impuzandengo"; gradeType="warning";
    gradeMsg=`Your yield of ${yieldPA} kg/are is BELOW the ${season} average of ${seasonBench.toFixed(1)} kg/are.`;
    gradeMsg_rw=`Umusaruro wawe wa ${yieldPA} kg/are uri MUNSI YA MPUZANDENGO ya ${season} yo kuri ${seasonBench.toFixed(1)} kg/are.`;
  }

  recs.push({
    type:gradeType, 
    icon: gradeType==="success"?"bi-trophy":"bi-bar-chart-line",
    category:`${grade} Harvest / Isarura ${grade_rw} — ${season}`,
    message: gradeMsg,
    message_rw: gradeMsg_rw,
    goal: "Evaluates your performance against district benchmarks.",
    goal_rw: "Gupima umusaruro wawe ugereranyije n'impuzandengo y'akarere."
  });

  // ── 2. HARVEST DATE ──
  recs.push({
    type:"info", 
    icon: "bi-calendar-event",
    category:"Estimated Harvest Date / Itariki yo Gusarura",
    message:`Based on your planting date, your ${crop} should be ready around ${harvestStr} (${DAYS[crop]||90} days).`,
    message_rw:`Ugereranyije n'itariki wateyeho, ${crop} yawe izaba yejeje hafi ya ${harvestStr_rw} (iminsi ${DAYS[crop]||90}).`,
    goal: "Helps you plan labor and tools for harvest time.",
    goal_rw: "Gugufasha guteganya abakozi n'ibikoresho igihe cy'isarura kimaze kuregera."
  });

  // ── 3. FERTILIZER ──
  if (!fertilizer) {
    recs.push({
      type:"warning", 
      icon: "bi-exclamation-octagon",
      category:"Fertilizer Not Applied / Nta Fumbire Yakoreshejwe",
      message:`You did not apply fertilizer. Applying ${FERT_REC[crop]} next season could increase yield by 15–25%.`,
      message_rw:`Ntagufumbire mwakoresheje. Gukoresha ${FERT_REC_RW[crop]} igihe kizaza byongera umusaruro ku kigero cya 15-25%.`,
      goal: "Explains the yield-boosting potential of correct fertilizer application.",
      goal_rw: "Gusobanura akamaro k'ifumbire mu kongera umusaruro."
    });
  } else {
    recs.push({
      type:"success", 
      icon: "bi-check-circle",
      category:"Fertilizer Applied / Ifumbire Yakoreshejwe",
      message:`Good — fertilizer was applied. For ${crop}, the optimal rate is ${FERT_REC[crop]}.`,
      message_rw:`Byiza — mwakoresheje ifumbire. Kuri ${crop}, uburyo bwiza ni ${FERT_REC_RW[crop]}.`,
      goal: "Confirms correct input use and guides on optimal dosages.",
      goal_rw: "Kwemeza ikoreshwa ryiza ry'ifumbire no gutanga inama ku kigero gikwiye."
    });
  }

  // ── 4. IRRIGATION ──
  if (!irrigation && (month==="June"||month==="July"||month==="August")) {
    recs.push({
      type:"warning", 
      icon: "bi-droplet-half",
      category:"Irrigation Needed / Kuhira Birakenewe",
      message:`You planted in ${month} (dry season). Without irrigation, ${crop} faces moisture stress. Apply 4–6cm water per week.`,
      message_rw:`Mwateye mu kwezi kwa ${month} (igihe cy'izuba). Ntagukuhira, ${crop} izahura n'ikibazo cy'amazi. Kuhira 4-6cm buri cyumweru.`,
      goal: "Prevents crop death during dry months through irrigation advice.",
      goal_rw: "Kukumira ko imyaka yumira mu gihe cy'izuba binyuze mu kuhira."
    });
  } else if (!irrigation) {
    recs.push({
      type:"info", 
      icon: "bi-droplet",
      category:"Irrigation Status / Imiterere yo Kuhira",
      message:`You are relying on rainfall. If rain is insufficient during flowering, supplemental watering can recover 20% yield.`,
      message_rw:`Muri gutegereza imvura gusa. Imvura yaba nke igihe cy'uburabyo, kuhira inshuro imwe byagarura 20% by'umusaruro.`,
      goal: "Suggests risk mitigation when rainfall is the only water source.",
      goal_rw: "Gutanga inama zo kugabanya ibyago mu gihe imvura yabaye nke."
    });
  }

  // ── 5. PEST PRESSURE ──
  const pIcon = pestLevel==="High"?"bi-bug-fill":"bi-bug";
  if (pestLevel === "High") {
    recs.push({
      type:"warning", 
      icon: pIcon,
      category:`High Pest Risk — ${month} / Ibyago by'Udukoko — ${month}`,
      message:`${month} has high pest pressure. Scout your ${crop} field every 5 days. Watch for pests and apply neem oil.`,
      message_rw:`Mu kwezi kwa ${month} haba udukoko twinshi. Genya umurima wawe wa ${crop} buri minsi 5. Reba udukoko kandi ukoreshe neem oil.`,
      goal: "Reduces crop loss by encouraging frequent pest monitoring.",
      goal_rw: "Kugabanya igihombo binyuze mu kugenzura udukoko kenshi."
    });
  }

  // ── 6. SOIL ──
  recs.push({
    type: soil==="Loam"?"success":"info", 
    icon: "bi-flower2",
    category:`Soil Quality — ${soil} / Imiterere y'Ubutaka — ${soil}`,
    message: soil==="Loam"?`Loam soil is ideal for ${crop}. Maintain organic matter.`:`Add 20-30 kg/are of compost to improve ${soil} fertility next season.`,
    message_rw: soil==="Loam"?`Ubutaka bwa Loam ni bwiza kuri ${crop}. Komeza gushyiramo ifumbire y'imborera.`:`Ongeramo 20-30 kg/are za kompositi kugira ngo wongere uburyohe bw'ubutaka bwa ${soil} igihe kizaza.`,
    goal: "Provides long-term soil health management advice.",
    goal_rw: "Gutanga inama zo gukurikirana ubutaka mu buryo burambye."
  });

  // ── 7. STORAGE & MARKET ──
  recs.push({
    type:"info", 
    icon: "bi-box-seam",
    category:"Storage & Market / Ububiko n'Isoko",
    message:`Dry grain below 13% moisture. Expected revenue: RWF ${revenueStr} from ${totalKg} kg.`,
    message_rw:`Yubika imyaka munsi ya 13% y'ubumidure. Inyungu iteganyijwe: RWF ${revenueStr} kuri ${totalKg} kg.`,
    goal: "Optimizes financial return and prevents post-harvest loss.",
    goal_rw: "Kugabanya igihombo nyuma yo gusarura no kongera inyungu."
  });

  return recs;
}

export function fmtDate(dStr) {
  if(!dStr) return "";
  try {
    const d = new Date(dStr);
    return d.toLocaleDateString("en-RW", {month:"short", day:"numeric", year:"numeric"});
  } catch(_) { return dStr; }
}

export const T = {
  en: {
    appName:"Harvest Predictor",appSub:"Gashora Sector · Bugesera District · Smart Farming",
    login:"Login",register:"Farmer Registration",logout:"Logout",
    farmer:"Farmer",officer:"Agri Officer",
    phone:"Phone / Farmer ID",phoneReg:"Phone Number",password:"Password",confirmPw:"Confirm Password",
    fullName:"Full Name",sector:"Sector",
    farmSizeHa:"Farm Size (ha)",
    areaPlantedHa:"Area Planted (ha) *",
    plantingDate:"Planting Date *",
    signingIn:"Signing in…",creatingAccount:"Creating account…",
    loginBtn:"→ Login",registerBtn:"Register as Farmer",
    alreadyHave:"Already have an account?",noAccount:"Don't have an account?",
    signInHere:"Sign in",createHere:"Create one",
    demoTitle:"Demo Credentials (click to fill)",
    forgotPw:"Forgot Password?",forgotTitle:"Reset Password",
    forgotSub:"Enter your registered Email, Phone, or ID to reset your password",
    newPwLabel:"New Password",confirmNewPw:"Confirm New Password",
    resetBtn:"Reset Password",resetSuccess:"Password reset successfully!",
    backToLogin:"← Back to Login",userNotFound:"No account found with that email, phone, or ID.",
    resetDone:"Password updated! You can now login.",
    invalidCreds:"Invalid credentials.",pwMismatch:"Passwords do not match.",
    allRequired:"Please fill all required fields.",phoneTaken:"Phone already registered.",
    notValidPhone:"Phone number is not valid (10 digits required)",
    invalidRwPhone:"Only Rwandan MTN or Airtel numbers are allowed (078... or 072...)",
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
    yes:"Yes",no:"No",continueStep2:"Continue to Step 2 →",
    requiredFields:"* Required fields",
    reviewPredict:"Review & Predict",summary:"Summary",edit:"Edit",
    cropType:"Crop Type",location:"Location",fertilizer:"Fertilizer",irrigation:"Irrigation",
    autoClimateTitle:"Auto-Detected Climate",autoClimateNote:"Based on Bugesera historical averages",
    saveFarm:"Save for future use",
    getHarvestPrediction:"Get Harvest Prediction",runningModel:"Running AI Model…",
    expectedHarvest:"EXPECTED HARVEST",predictionComplete:"Prediction Complete!",
    perAreEst:"per are (a) estimated",total:"Total",confidence:"Confidence",modelUsed:"Model",
    comparison:"Comparison",avgYieldArea:"District average:",yourPrediction:"Your prediction:",
    recommendations:"Recommendations",makeAnother:"New Prediction",
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
    name:"Name",id:"ID",phoneLabel:"Phone",emailLabel:"Email",settings:"Settings",
    editProfile:"Edit Profile",changePassword:"Change Password",
    language:"Language",aboutApp:"About App",
    districtDash:"District Level Dashboard",officerView:"District Administration — Bugesera",
    overview:"Overview",
    sectorsTab:"Sectors",
    farmersTab:"Farmers",
    reportsTab:"Reports",
    districtYield:"District Yield by Crop (kg/are avg)",
    seasonPerf:"Season Performance",districtAlerts:"Notifications",
    sectorYield:"Predicted Yield by Sector",sectorRisk:"Sector Risk Assessment",
    searchFarmers:"Search farmers…",farmerStats:"Farmer Statistics",
    generateReport:"Generate District Report",generatePDF:"Generate PDF",
    sendAdvice:"Send Advice to Farmers",targetGroup:"Target Group",
    adviceMessage:"Advice Message",sendToFarmers:"Send",
    temperature:"Temperature",rainfall:"Rainfall",humidity:"Humidity",sunshine:"Sunshine",
    selectLocation:"Select location…",selectSeason:"Select season…",selectMonth:"Select month…",
    selectMonthFirst:"← Select planting date to load climate",
    offlineMode:"Offline mode — using local simulation",
    soilInfo:"Soil Info",
    emailGmailRequired:"Farmer registration requires a valid Gmail account (ending in @gmail.com) to receive your password.",
    agreeTerms: "I agree to the Terms and Conditions and Data Privacy policy.",
    mustAgree: "Please agree to the Terms and Conditions to proceed.",
    invalidEmail: "Invalid email format. Please use a real email address (e.g., user@example.com).",
    noCapsEmail: "Email cannot contain capital letters. Please use small letters and numbers.",
    registerTab: "Register",
    registerOfficer: "Register New Agri Officer",
    officerRole: "Officer Role",
    assignedSector: "Assigned Sector",
    existingOfficers: "Existing Officers",
    deptLabel: "Department",
    officerRegistered: "Officer registered! Password sent to email.",
  },
  rw: {
    appName:"Sisitemu y'Imyaka",appSub:"Segiteri ya Gashora · Akarere ka Bugesera · Ubuhinzi Bw'Ikoranabuhanga",
    login:"Injira",register:"Kwiyandikisha nk'Umuhinzi",logout:"Sohoka",
    farmer:"Umuhinzi",officer:"Ofisiye w'Ubuhinzi",
    phone:"Telefone / ID",phoneReg:"Telefone",password:"Ijambo ry'Ibanga",confirmPw:"Emeza Ijambo ry'Ibanga",
    fullName:"Amazina Yose",sector:"Segiteri",
    farmSizeHa:"Ubuso bw'Akarima (ha)",
    areaPlantedHa:"Akarima Gatewe (ha) *",
    plantingDate:"Itariki yo Gutera *",
    signingIn:"Injira…",creatingAccount:"Fungura konti…",
    loginBtn:"→ Injira",registerBtn:"Iyandikishe nk'Umuhinzi",
    alreadyHave:"Usanzwe ufite konti?",noAccount:"Nta konti ufite?",
    signInHere:"Injira hano",createHere:"Fungura hano",
    demoTitle:"Amakuru yo Gerageza",
    forgotPw:"Wibagiwe Ijambo ry'Ibanga?",forgotTitle:"Hindura Ijambo ry'Ibanga",
    forgotSub:"Injiza email, telefone, cyangwa ID yawe kugirango uhindure ijambo ry'ibanga",
    newPwLabel:"Ijambo ry'Ibanga Rishya",confirmNewPw:"Emeza Ijambo ry'Ibanga Rishya",
    resetBtn:"Hindura",resetSuccess:"Byahinduwe neza!",
    backToLogin:"← Garuka ku kwinjira",userNotFound:"Nta konti iboneka kuri iyo email, nimero, cyangwa ID.",
    resetDone:"Ijambo ry'ibanga ryahinduwe! Injira ubu.",
    invalidCreds:"Amakuru atari yo.",pwMismatch:"Amagambo ntahura.",
    allRequired:"Uzuza ibisabwa.",phoneTaken:"Iyo nimero isanzwe iyanditswe.",
    notValidPhone:"Nimero ya telefone ntayo (igomba kuba imvure 10)",
    invalidRwPhone:"Nimero ya telefone yemewe ni iy'u Rwanda gusa (MTN cyangwa Airtel)",
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
    fertilizerUsed:"Mwakokesheje Ifumbire?",irrigationUsed:"Mwakoresheje Kuhira?",
    yes:"Yego",no:"Oya",continueStep2:"Komeza ku Ntambwe ya 2 →",
    requiredFields:"* Birasabwa",
    reviewPredict:"Reba Hanyuma Usobanure",summary:"Incamake",edit:"Hindura",
    cropType:"Igihingwa",location:"Aho Biherereye",fertilizer:"Ifumbire",irrigation:"Kuhira",
    autoClimateTitle:"Amakuru y'Ibihe Bwite",autoClimateNote:"Bikoreshwa muri Bugesera",
    saveFarm:"Bika Akarima",
    getHarvestPrediction:"Bona Ibisobanuro by'Imyaka",runningModel:"Koresha Modeli…",
    expectedHarvest:"IMYAKA ITEGANYIJWE",predictionComplete:"Birakozwe!",
    perAreEst:"kuri are imwe biteganyijwe",total:"Igiteganyo",confidence:"Inyemeza",modelUsed:"Modeli",
    comparison:"Igereranya",avgYieldArea:"Hagati ya zone:",yourPrediction:"Ibisobanuro byawe:",
    recommendations:"Inama",makeAnother:"Sobanura Ukundi",
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
    name:"Amazina",id:"Indangamuntu",phoneLabel:"Telefone",emailLabel:"Email",settings:"Igenamiterere",
    editProfile:"Hindura Umwirondoro",changePassword:"Hindura Ijambo ry'Ibanga",
    language:"Ururimi",aboutApp:"Ibyerekeye App",
    districtDash:"Ikibaho cy'Ubuhinzi",officerView:"Akarere ka Bugesera — Ofisiye",
    overview:"Incamake",
    sectorsTab:"Inzego",
    farmersTab:"Abahinzi",
    reportsTab:"Raporo",
    districtYield:"Umusaruro w'Akarere (kg/are)",
    seasonPerf:"Imikorere y'Ibihe",districtAlerts:"Ubutumwa",
    sectorYield:"Umusaruro kuri Segiteri",sectorRisk:"Ingorane kuri Segiteri",
    searchFarmers:"Shakisha abahinzi…",farmerStats:"Ibarurishamibare",
    generateReport:"Kora Raporo",generatePDF:"Kora PDF",
    sendAdvice:"Ohereza Inama",targetGroup:"Ishyirahamwe",
    adviceMessage:"Ubutumwa",sendToFarmers:"Ohereza",
    temperature:"Ubushyuhe",rainfall:"Imvura",humidity:"Ubuhehere",sunshine:"Izuba",
    selectLocation:"Hitamo aho biherereye…",selectSeason:"Hitamo igihe…",selectMonth:"Hitamo ukwezi…",
    selectMonthFirst:"← Injiza itariki yo gutera",
    offlineMode:"Offline — gukoresha simulation",
    soilInfo:"Amakuru y'Ubutaka",
    emailGmailRequired:"Kwiyandikisha nk'umuhinzi bisaba konti ya Gmail (irangira na @gmail.com) kugira ngo uone ijambo ry'ibanga ryawe.",
    agreeTerms: "Nemeye Amategeko n'Amabwiriza agenga iyi sisitemu.",
    mustAgree: "Wibagiwe kwemera amategeko n'amabwiriza.",
    invalidEmail: "Email wanditse ntabwo yujuje ibisabwa.",
    noCapsEmail: "Email ntigomba kuba irimo inyuguti nkuru. Koresha inyuguti nto n'imibare gusa.",
    registerTab: "Iyandikishe",
    registerOfficer: "Iyandikishe Ofisiye Mushya",
    officerRole: "Inshingano za Ofisiye",
    assignedSector: "Segiteri yashyizwemo",
    existingOfficers: "Abakozi Basanzwe",
    deptLabel: "Ishami",
    officerRegistered: "Ofisiye yanditswe! Ijambo ry'ibanga ryoherejwe kuri email.",
  }
};
