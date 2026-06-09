// ========== دالة safeParse المعدلة ==========
function safeParse(data, defaultValue = []) {
    if (data === null || data === undefined || data === 'null' || data === 'undefined') {
        return defaultValue;
    }
    try {
        const parsed = JSON.parse(data);
        // إذا كانت القيمة المُرجعة ليست مصفوفة، نرجع defaultValue
        if (Array.isArray(parsed)) {
            return parsed;
        } else {
            console.warn('safeParse: parsed value is not an array, returning default', parsed);
            return defaultValue;
        }
    } catch (e) {
        console.warn("JSON parse error:", e);
        return defaultValue;
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.style.position = "fixed";
        container.style.bottom = "20px";
        container.style.right = "20px";
        container.style.zIndex = "9999";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    // ✅ عرض النص مباشرة بدون أيقونات
    toast.textContent = message;
    
    let bgColor, textColor;
    switch(type) {
        case "success":
            bgColor = "#dcfce7";
            textColor = "#166534";
            break;
        case "warning":
            bgColor = "#fef3c7";
            textColor = "#92400e";
            break;
        case "error":
            bgColor = "#fee2e2";
            textColor = "#991b1b";
            break;
        case "salat":
            bgColor = "#d1fae5";
            textColor = "#064e3b";
            break;
        default: // info
            bgColor = "#dbeafe";
            textColor = "#1e40af";
    }
    toast.style.backgroundColor = bgColor;
    toast.style.color = textColor;
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
    toast.style.fontWeight = "bold";
    toast.style.border = "1px solid";
    toast.style.borderColor = type === "success" ? "#c3e6cb" : type === "warning" ? "#ffeeba" : type === "error" ? "#f5c6cb" : "#d6d8db";
    toast.style.fontSize = "14px";
    toast.style.minWidth = "200px";
    toast.style.padding = "8px 12px";   // إضافة padding لتحسين المظهر
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function withLoading(button, callback) {
    if (!button) return callback();
    // منع التنفيذ المتزامن المتكرر
    if (button.disabled === true && button.getAttribute('data-calculating') === 'true') {
        showToast('يُرجى الانتظار حتى اكتمال الحساب الحالي', 'info');
        return;
    }
    const originalText = button.innerHTML;
    button.disabled = true;
    button.setAttribute('data-calculating', 'true');
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحساب...';
    
    // إعطاء فرصة للمتصفح لتحديث الواجهة قبل بدء الحساب الثقيل
    await new Promise(resolve => setTimeout(resolve, 10));
    
    try {
        return await callback();
    } catch (err) {
        console.error(err);
        showToast('خطأ في الحساب: ' + err.message, 'error');
        throw err; // لالتقاطه من الأعلى إذا لزم الأمر
    } finally {
        button.disabled = false;
        button.removeAttribute('data-calculating');
        button.innerHTML = originalText;
    }
}
function bindEnterToCalculate(container, calcBtn) {
    if (!container || !calcBtn) return;
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input._enterHandler) {
            input.removeEventListener('keypress', input._enterHandler);
        }
        const handler = (e) => {
            if (e.key === 'Enter' && e.tagName !== 'TEXTAREA') {
                e.preventDefault();
                calcBtn.click();
            }
        };
        input.addEventListener('keypress', handler);
        input._enterHandler = handler;
    });
}
// ---------- الثوابت العامة ----------
const AD_URL = 'https://omg10.com/4/10598715';
const AD_COOLDOWN_MS = 3 * 60 * 1000;

const CONV_DB = {
  "التبريد (Cooling)": {
    "وحدة حرارية بريطانية (btu)": 1,
    "حصان تبريد (hp)": 8000,
    "طن تبريد (ton)": 12000,
    "كيلوواط تبريد (kw_t)": 10723.86058981,
    "سعر حراري في الساعة (kcal_h)": 3.96832,
    "واط تبريد (w_t)": 10.72386058981,
    "مليون وحدة حرارية في الساعة (MBH)": 1000,
    "ميجاواط تبريد (MW_t)": 10723860.58981
  },
  "الطول (Length)": {
    "متر (m)": 1,
    "سنتيمتر (cm)": 0.01,
    "مليمتر (mm)": 0.001,
    "كيلومتر (km)": 1000,
    "بوصة (in)": 0.0254,
    "قدم (ft)": 0.3048,
    "ياردة (yd)": 0.9144,
    "ميل (mi)": 1609.344,
    "ميل بحري (nmi)": 1852,
    "ميل (mil)": 0.0000254,
    "ميكرومتر (µm)": 0.000001,
    "نانومتر (nm)": 1e-9,
    "ديسيمتر (dm)": 0.1,
    "شبر (hand)": 0.1016,
    "فرسخ (league)": 4828.032,
    "أنغستروم (Å)": 1e-10
  },
  "المساحة (Area)": {
    "متر² (m2)": 1,
    "سنتيمتر² (cm²)": 0.0001,
    "مليمتر² (mm²)": 0.000001,
    "كيلومتر² (km²)": 1000000,
    "بوصة² (in²)": 0.00064516,
    "قدم² (ft²)": 0.09290304,
    "ياردة² (yd²)": 0.83612736,
    "آكر (ac)": 4046.856,
    "هكتار (ha)": 10000,
    "فدان (f)": 4200,
    "قيراط (k)": 175,
    "سهم (s)": 7.29166667,
    "دونم (dunam)": 1000,
    "ميل² (mi2)": 2589988.11,
    "سنتيار (ca)": 1
  },
  "الحجم (Volume)": {
    "متر³ (m³)": 1,
    "لتر (l)": 0.001,
    "ميليلتر (ml)": 0.000001,
    "سنتيمتر³ (cm³)": 0.000001,
    "غالون أمريكي (gal_us)": 0.00378541,
    "غالون بريطاني (gal_uk)": 0.00454609,
    "قدم³ (ft³)": 0.0283168,
    "بوصة³ (in³)": 0.000016387,
    "برميل (bbl)": 0.158987,
    "كوارت أمريكي (qt_us)": 0.000946353,
    "باينت أمريكي (pt_us)": 0.000473176,
    "كوب أمريكي (cup_us)": 0.000236588,
    "ملعقة كبيرة (tbsp)": 0.0000147868,
    "ملعقة صغيرة (tsp)": 0.00000492892
  },
  "الكتلة (Mass)": {
    "كيلوجرام (kg)": 1,
    "جرام (g)": 0.001,
    "ميليجرام (mg)": 0.000001,
    "باوند (lb)": 0.45359237,
    "أونصة (oz)": 0.02834952,
    "طن متري (ton_metric)": 1000,
    "طن أمريكي (ton_us)": 907.1847,
    "طن بريطاني (ton_uk)": 1016.047,
    "قيراط (ct)": 0.0002,
    "حبة (gr)": 0.0000647989,
    "سلاج (slug)": 14.5939
  },
  "الزمن (Time)": {
    "ثانية (s)": 1,
    "دقيقة (min)": 60,
    "ساعة (h)": 3600,
    "يوم (day)": 86400,
    "أسبوع (week)": 604800,
    "سنة (year)": 31536000,
    "ميلي ثانية (ms)": 0.001,
    "ميكروثانية (µs)": 0.000001,
    "نانوثانية (ns)": 1e-9,
    "شهر (month)": 2628000,
    "عقد (decade)": 315360000
  },
  "السرعة (Velocity)": {
    "متر / ثانية (m/s)": 1,
    "كيلومتر / ساعة (km/h)": 0.277778,
    "قدم / ثانية (ft/s)": 0.3048,
    "ميل / ساعة (mph)": 0.44704,
    "عقدة (knot)": 0.514444,
    "سنتيمتر / ثانية (cm/s)": 0.01,
    "ماخ (mach)": 340.3
  },
  "التسارع (Acceleration)": {
    "متر / ثانية مربع (m/s2)": 1,
    "قدم / ثانية مربع (ft/s2)": 0.3048,
    "جاذبية أرضية (g_force)": 9.80665,
    "جال (gal)": 0.01
  },
  "القوة (Force)": {
    "نيوتن (n)": 1,
    "كيلونيوتن (kn)": 1000,
    "باوند قوة (lbf)": 4.44822,
    "كيلوجرام قوة (kgf)": 9.80665,
    "داين (dyn)": 0.00001,
    "ستين (sn)": 1000,
    "ميجانيوتن (MN)": 1000000
  },
 
  "الضغط (Pressure)": {
    "باسكال (pa)": 1,
    "كيلوباسكال (kpa)": 1000,
    "ميجاباسكال (mpa)": 1000000,
    "بار (bar)": 100000,
    "مليبار (mbar)": 100,
    "رطل لكل بوصة مربعة (psi)": 6894.76,
    "ضغط جوي (atm)": 101325,
    "تور (torr)": 133.322,
    "مليمتر زئبق (mmhg)": 133.322,
    "بوصة زئبق (inhg)": 3386.39,
    "بوصة ماء (inw.c)": 248.84,
    "قدم ماء (ftH2O)": 2989.07,
    "كيلوجرام قوة لكل سنتيمتر مربع (kgf/cm2)": 98066.5
  },
  "الطاقة (Energy)": {
    "جول (j)": 1,
    "كيلوجول (kj)": 1000,
    "ميجاجول (mj)": 1000000,
    "سعرة حرارية (cal)": 4.184,
    "كيلوسعرة (kcal)": 4184,
    "وحدة حرارية بريطانية (btu)": 1055.056,
    "كيلوواط ساعي (kwh)": 3600000,
    "إلكترون فولت (ev)": 1.60218e-19,
    "قدم-باوند (ft-lb)": 1.355818,
    "ثيرم (therm)": 105505600,
    "طن نفط مكافئ (toe)": 41868000000,
    "حصان-ساعة (hp·h)": 2684519.5
  },
  "القدرة (Power)": {
    "واط (w)": 1,
    "كيلوواط (kw)": 1000,
    "ميجاواط (mw)": 1000000,
    "حصان متري (hp_metric)": 735.499,
    "حصان إمبراطوري (hp_imperial)": 745.7,
    "وحدة حرارية بريطانية لكل ساعة (btu/h)": 0.293071,
    "طن تبريد (ton_refrig)": 3516.85,
    "سعرة حرارية لكل ساعة (kcal/h)": 1.16222,
    "قدم-باوند لكل ثانية (ft·lb/s)": 1.35582
  },
  "الزخم (Momentum)": {
    "كيلوجرام.متر لكل ثانية (kg.m/s)": 1,
    "باوند.قدم لكل ثانية (lb.ft/s)": 0.138255,
    "نيوتن.ثانية (N·s)": 1
  },
  "الكثافة (Density)": {
    "كيلوجرام لكل متر مكعب (kg/m3)": 1,
    "جرام لكل سنتيمتر مكعب (g/cm3)": 1000,
    "باوند لكل قدم مكعب (lb/ft3)": 16.01846,
    "باوند لكل بوصة مكعبة (lb/in3)": 27679.9,
    "سلاج لكل قدم مكعب (slug/ft3)": 515.379,
    "طن لكل متر مكعب (t/m3)": 1000
  },
  "التردد (Frequency)": {
    "هرتز (hz)": 1,
    "كيلوهرتز (khz)": 1000,
    "ميجاهرتز (mhz)": 1000000,
    "جيجاهرتز (ghz)": 1000000000,
    "دورة لكل دقيقة (rpm)": 0.0166667,
    "دورة لكل ثانية (cps)": 1,
    "مليهرتز (mhz)": 0.001
  },
  "الشحنة الكهربائية (Charge)": {
    "كولوم (c)": 1,
    "أمبير-ساعة (ah)": 3600,
    "ملي أمبير-ساعة (mah)": 3.6,
    "فاراداي (F)": 96485,
    "ستات كولوم (statC)": 3.33564e-10
  },
  "التيار الكهربائي (Current)": {
    "أمبير (a)": 1,
    "ملي أمبير (ma)": 0.001,
    "كيلو أمبير (ka)": 1000,
    "ميكرو أمبير (µa)": 0.000001,
    "نانوأمبير (na)": 1e-9
  },
  "الجهد الكهربائي (Voltage)": {
    "فولت (v)": 1,
    "ملي فولت (mv)": 0.001,
    "كيلوفولت (kv)": 1000,
    "ميكروفولت (µv)": 0.000001,
    "ميجافولت (mv)": 1000000
  },
  "المقاومة (Resistance)": {
    "أوم (ohm)": 1,
    "كيلوأوم (kohm)": 1000,
    "ميجاأوم (mohm)": 1000000,
    "ملي أوم (mΩ)": 0.001,
    "ميكروأوم (µΩ)": 0.000001
  },
  "السعة الكهربائية (Capacitance)": {
    "فاراد (f)": 1,
    "ميكروفاراد (uf)": 0.000001,
    "نانوفاراد (nf)": 1e-9,
    "بيكوفاراد (pf)": 1e-12,
    "ملي فاراد (mf)": 0.001,
    "كيلوفاراد (kf)": 1000
  }
};

// ---------- متغيرات الحالة العامة ----------
let state = {
    saved: safeParse(localStorage.getItem('hvac_complete_saved'), []),
    settings: { roomFactorBase: 300, wireResistivity: 0.0172, voltageDropPerc: 3 },
    geminiApiKey: localStorage.getItem('gemini_api_key') || '',
    selectedGeminiModel: localStorage.getItem('selected_gemini_model') || 'gemini-2.0-flash',
    aiHistory: safeParse(localStorage.getItem('ai_history'), [])
};
let currentToolId = null;
let aiManager = null;

// ---------- الدوال العامة المشتركة ----------
async function checkInternet() {
    if (!navigator.onLine) return false;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
    } catch {
        return false;
    }
}

function roundUpHP(hp) {
    if (hp <= 0.5) return 0.5;
    if (hp <= 0.75) return 0.75;
    if (hp <= 1) return 1;
    if (hp <= 1.5) return 1.5;
    if (hp <= 2) return 2;
    if (hp <= 2.5) return 2.5;
    if (hp <= 3) return 3;
    if (hp <= 4) return 4;
    if (hp <= 5) return 5;
    return Math.ceil(hp);
}

// ---------- دوال التقريب العامة ----------
function round0(v) { return Math.round(v); }
function round1(v) { return Math.round(v * 10) / 10; }
function round2(v) { return Math.round(v * 100) / 100; }
function round3(v) { return Math.round(v * 1000) / 1000; }
function round4(v) { return Math.round(v * 10000) / 10000; }

// ---------- ثوابت ودوال التبريد المتقدمة ----------
const DENSITY_TABLE = {
    'R22': {
        liquid: { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [1250, 1235, 1220, 1205, 1190, 1175, 1160, 1145, 1130, 1115] },
        vapor:  { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [7.5, 9.2, 11.2, 13.5, 16.1, 19.0, 22.3, 26.0, 30.1, 34.6] }
    },
    'R410A': {
        liquid: { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [1150, 1135, 1120, 1105, 1090, 1075, 1060, 1045, 1030, 1015] },
        vapor:  { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [10.5, 12.8, 15.5, 18.6, 22.2, 26.3, 31.0, 36.2, 42.0, 48.5] }
    },
    'R134a': {
        liquid: { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [1280, 1265, 1250, 1235, 1220, 1205, 1190, 1175, 1160, 1145] },
        vapor:  { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [6.2, 7.8, 9.7, 12.0, 14.7, 17.8, 21.4, 25.5, 30.2, 35.6] }
    },
    'R404A': {
        liquid: { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [1120, 1105, 1090, 1075, 1060, 1045, 1030, 1015, 1000, 985] },
        vapor:  { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [11.0, 13.5, 16.4, 19.8, 23.7, 28.2, 33.3, 39.2, 45.9, 53.5] }
    },
    'R407C': {
        liquid: { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [1190, 1175, 1160, 1145, 1130, 1115, 1100, 1085, 1070, 1055] },
        vapor:  { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [8.2, 10.0, 12.2, 14.8, 17.9, 21.4, 25.5, 30.2, 35.6, 41.8] }
    },
    'R32': {
        liquid: { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [1020, 1005, 990, 975, 960, 945, 930, 915, 900, 885] },
        vapor:  { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [12.0, 15.0, 18.6, 22.9, 27.9, 33.8, 40.6, 48.5, 57.7, 68.3] }
    },
    'R290': {
        liquid: { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [540, 530, 520, 510, 500, 490, 480, 470, 460, 450] },
        vapor:  { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [4.5, 5.8, 7.4, 9.4, 11.8, 14.7, 18.2, 22.4, 27.4, 33.3] }
    },
    'R600a': {
        liquid: { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [600, 590, 580, 570, 560, 550, 540, 530, 520, 510] },
        vapor:  { temps: [-30, -20, -10, 0, 10, 20, 30, 40, 50, 60], values: [2.2, 3.0, 4.0, 5.3, 6.9, 8.9, 11.4, 14.5, 18.3, 22.9] }
    }
};

function getDensityFromTemp(refrigerant, tempC, phase = 'liquid') {
    const table = DENSITY_TABLE[refrigerant]?.[phase];
    if (!table) return (phase === 'liquid' ? 1000 : 5);
    const { temps, values } = table;
    if (tempC <= temps[0]) return values[0];
    if (tempC >= temps[temps.length-1]) return values[temps.length-1];
    for (let i = 0; i < temps.length-1; i++) {
        if (tempC >= temps[i] && tempC <= temps[i+1]) {
            return values[i] + (tempC - temps[i]) * (values[i+1] - values[i]) / (temps[i+1] - temps[i]);
        }
    }
    return values[values.length-1];
}

const CAPILLARY_SIZES = [
    { inch:0.026, maxFlow:0.002 }, { inch:0.028, maxFlow:0.003 }, { inch:0.031, maxFlow:0.005 },
    { inch:0.036, maxFlow:0.008 }, { inch:0.040, maxFlow:0.010 }, { inch:0.042, maxFlow:0.012 },
    { inch:0.050, maxFlow:0.018 }, { inch:0.055, maxFlow:0.022 }, { inch:0.064, maxFlow:0.028 },
    { inch:0.070, maxFlow:0.035 }
];

const REFRIGERANT_PROPS = {
    'R22':   { viscL:0.00023, viscG:0.000013, CpL: 1200, CpG: 800, h_fg: 200000 },
    'R410A': { viscL:0.00022, viscG:0.000014, CpL: 1500, CpG: 900, h_fg: 260000 },
    'R134a': { viscL:0.00028, viscG:0.000012, CpL: 1400, CpG: 750, h_fg: 217000 },
    'R404A': { viscL:0.00024, viscG:0.000013, CpL: 1300, CpG: 800, h_fg: 200000 },
    'R407C': { viscL:0.00025, viscG:0.000013, CpL: 1450, CpG: 850, h_fg: 250000 },
    'R32':   { viscL:0.00020, viscG:0.000011, CpL: 1700, CpG: 1000, h_fg: 320000 },
    'R290':  { viscL:0.00012, viscG:0.000008, CpL: 2300, CpG: 1500, h_fg: 425000 },
    'R600a': { viscL:0.00018, viscG:0.000009, CpL: 2200, CpG: 1400, h_fg: 360000 }
};

const REFRIGERANT_PROPS_QUICK = {
    'R22':   { density:1190, viscosity:0.00023, h_liquid:200, h_vapor:400 },
    'R410A': { density:1090, viscosity:0.00022, h_liquid:220, h_vapor:480 },
    'R134a': { density:1207, viscosity:0.00028, h_liquid:180, h_vapor:397 },
    'R404A': { density:1040, viscosity:0.00024, h_liquid:190, h_vapor:390 },
    'R407C': { density:1130, viscosity:0.00025, h_liquid:210, h_vapor:460 },
    'R32':   { density:960,  viscosity:0.00020, h_liquid:240, h_vapor:560 },
    'R290':  { density:500,  viscosity:0.00012, h_liquid:280, h_vapor:705 },
    'R600a': { density:550,  viscosity:0.00018, h_liquid:260, h_vapor:620 }
};

// ---------- دوال الحسابات الكهربائية العامة ----------
function seriesCalc(arr, type = 'resistor') {
    if (type === 'capacitor') return 1 / arr.reduce((a, b) => a + 1 / b, 0);
    return arr.reduce((a, b) => a + b, 0);
}

function parallelCalc(arr, type = 'resistor') {
    if (type === 'capacitor') return arr.reduce((a, b) => a + b, 0);
    return 1 / arr.reduce((a, b) => a + 1 / b, 0);
}

function genSimpleInputs(count, containerId, prefix, unit) {
    let html = '';
    for (let i = 1; i <= count; i++) html += `<input type="number" step="any" id="${prefix}${i}" placeholder="${prefix.toUpperCase()}${i} ${unit}" class="mb-2">`;
    document.getElementById(containerId).innerHTML = `<div class="grid grid-cols-2 gap-2">${html}</div>`;
}



// =================== Class AIManager المعدل ===================
class AIManager {
    constructor() {
        this.elements = {};
        this.models = {
            'gemini-2.5-flash': { name: 'Gemini 2.5 Flash', maxTokens: 6092 },
            'gemini-1.5-flash': { name: 'Gemini 1.5 Flash', maxTokens: 6092 },
            'gemini-1.5-pro': { name: 'Gemini 1.5 Pro', maxTokens: 6092 },
            'gemini-2.0-flash': { name: 'Gemini 2.0 Flash', maxTokens: 6092 }
        };
        this.apiKey = state?.geminiApiKey || '';
        this.selectedModel = state?.selectedGeminiModel || 'gemini-2.0-flash';
        this.conversations = this.loadConversations();
        this.activeConversationId = localStorage.getItem('activeConvId') || this.createNewConversation();
        this.isStreaming = false;
        this.abortController = null;
        this.isSending = false;
        this.eventCleanup = null;
        this.selectedImages = [];
        this.recognition = null;
        this.sendButton = null;
        this.sendHandler = null;
        this.stopHandler = null;
        this.currentStreamingAssistantMsgId = null; // لتتبع رسالة المساعد الجاري كتابتها
        if (!this.activeConversationId) {
        this.activeConversationId = this.createNewConversation(true); // تمرير skipRender=true
    }
 }

    loadConversations() {
        const saved = localStorage.getItem('ai_conversations');
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return parsed.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg => ({
                ...msg,
                role: msg.role === 'model' ? 'assistant' : (msg.role === 'user' ? 'user' : 'assistant')
            }))
        }));
    }

    saveConversations() {
        localStorage.setItem('ai_conversations', JSON.stringify(this.conversations));
    }

    createNewConversation(skipRender = false) {
    const id = Date.now().toString();
    this.conversations.unshift({
        id,
        title: 'محادثة جديدة',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    this.saveConversations();
    if (!skipRender) this.render();   // ← فقط إذا لم نطلب تخطي الـ render
    return id;
}

    getActiveConversation() {
        let conv = this.conversations.find(c => c.id === this.activeConversationId);
        if (!conv) {
            this.activeConversationId = this.createNewConversation();
            conv = this.conversations.find(c => c.id === this.activeConversationId);
        }
        return conv;
    }

    addMessage(role, content, images = [], isError = false, isSuccess = false) {
        const conv = this.getActiveConversation();
        const msg = { role, content, timestamp: new Date().toISOString(), isError, isSuccess };
        if (images && images.length) msg.images = images.map(f => f.name);
        conv.messages.push(msg);
        conv.updatedAt = new Date().toISOString();
        if (conv.messages.length === 1 && role === 'user') {
            let short = content.substring(0, 40);
            conv.title = short + (content.length > 40 ? '...' : '');
        }
        this.saveConversations();
        localStorage.setItem('activeConvId', this.activeConversationId);
        return msg; // إرجاع الرسالة المضافة
    }

    updateLastAssistantMessage(content, isError = false, isSuccess = true) {
        const conv = this.getActiveConversation();
        // البحث عن آخر رسالة role === 'assistant'
        for (let i = conv.messages.length - 1; i >= 0; i--) {
            if (conv.messages[i].role === 'assistant') {
                conv.messages[i].content = content;
                conv.messages[i].isError = isError;
                conv.messages[i].isSuccess = isSuccess;
                conv.messages[i].timestamp = new Date().toISOString();
                this.saveConversations();
                this.render();
                return true;
            }
        }
        // إذا لم توجد رسالة مساعد (نادرًا)، نضيف واحدة جديدة
        this.addMessage('assistant', content, [], isError, isSuccess);
        this.render();
        return false;
    }

    async fileToInlineData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                const mimeType = file.type;
                resolve({ inlineData: { mimeType, data: base64 } });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async sendMessageStream(prompt, imageFiles = [], onChunk, onComplete, onError, skipAddUserMessage = false, temporaryAssistantMsgId = null) {
        const currentModel = state?.selectedGeminiModel || this.selectedModel || 'gemini-2.0-flash';
        const currentApiKey = state?.geminiApiKey || this.apiKey;

        if (!currentApiKey) {
            onError('مطلوب مفتاح Gemini API من الإعدادات');
            return false;
        }
        if (this.isStreaming) {
            onError('هناك طلب قيد التنفيذ، انتظر قليلاً');
            return false;
        }

        const parts = [{ text: prompt }];
        for (const file of imageFiles) {
            try {
                const inlineData = await this.fileToInlineData(file);
                parts.push(inlineData);
            } catch (err) {
                onError('فشل تحميل إحدى الصور');
                return false;
            }
        }

        if (!skipAddUserMessage) {
            this.addMessage('user', prompt, imageFiles);
        }

        const conv = this.getActiveConversation();
        // بناء history من آخر 10 رسائل (نستثني أي رسائل مساعد خطأ لأنها جزء من المحادثة)
        const history = conv.messages.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const requestBody = {
            contents: [
                ...history,
                { role: 'user', parts }
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192, topP: 0.95, topK: 40 },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:streamGenerateContent?alt=sse&key=${currentApiKey}`;
        this.isStreaming = true;
        this.abortController = new AbortController();

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: this.abortController.signal
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMsg = `HTTP ${response.status}`;
                if (response.status === 429) errorMsg = 'النموذج مزدحم جداً، حاول بعد دقائق أو غيّر النموذج';
                else if (response.status === 404) errorMsg = `النموذج "${currentModel}" غير متوفر، غيّر النموذج في الإعدادات`;
                else if (errorData.error?.message) errorMsg = errorData.error.message;
                throw new Error(errorMsg);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '', fullResponse = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(jsonStr);
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                fullResponse += text;
                                if (onChunk) onChunk(text, fullResponse);
                            }
                        } catch (e) { console.warn('JSON parse error', e); }
                    }
                }
            }
            if (fullResponse) {
                if (onComplete) onComplete(fullResponse);
                return true;
            } else throw new Error('استجابة فارغة من النموذج');
        } catch (err) {
            if (err.name === 'AbortError') onError('تم إلغاء الطلب بواسطة المستخدم');
            else onError(err.message);
            return false;
        } finally {
            this.isStreaming = false;
            this.abortController = null;
        }
    }

    async sendMessage(prompt, images = []) {
        return new Promise((resolve, reject) => {
            this.sendMessageStream(prompt, images, () => {}, resolve, reject);
        });
    }

    stopStreaming() {
        if (this.abortController) {
            this.abortController.abort();
            this.isStreaming = false;
        }
    }

    switchConversation(convId) {
        if (this.conversations.find(c => c.id === convId)) {
            this.activeConversationId = convId;
            localStorage.setItem('activeConvId', convId);
            this.render();
            return true;
        }
        return false;
    }

    deleteConversation(convId) {
        const index = this.conversations.findIndex(c => c.id === convId);
        if (index !== -1) {
            this.conversations.splice(index, 1);
            if (this.activeConversationId === convId) {
                this.activeConversationId = this.conversations[0]?.id || this.createNewConversation();
            }
            this.saveConversations();
            this.render();
            return true;
        }
        return false;
    }

    clearCurrentConversation() {
        const conv = this.getActiveConversation();
        conv.messages = [];
        conv.title = 'محادثة جديدة';
        conv.updatedAt = new Date().toISOString();
        this.saveConversations();
        this.render();
    }

    initUI(containerElement) {
    this.elements.container = containerElement;
    this.conversations = this.loadConversations();
    // إذا لم توجد محادثة نشطة بعد التحميل، أنشئ واحدة
    if (!this.activeConversationId || !this.conversations.find(c => c.id === this.activeConversationId)) {
        this.activeConversationId = this.createNewConversation(true);
    }
    this.render();
}

    autoResizeTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        let newHeight = textarea.scrollHeight;
        const maxHeight = 250;
        if (newHeight > maxHeight) {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.height = newHeight + 'px';
            textarea.style.overflowY = 'hidden';
        }
    }
    
    copyMessageContent(content) {
        if (!content) return;
        const now = Date.now();
        if (window._lastCopyTime && (now - window._lastCopyTime) < 800) return;
        window._lastCopyTime = now;
        navigator.clipboard.writeText(content).then(() => {
            showToast('تم نسخ الرسالة', 'success');
        }).catch(() => {
            showToast('فشل النسخ', 'error');
        });
    }

    updateSendButton(mode) {
        const sendBtn = this.sendButton;
        if (!sendBtn) return;
        if (mode === 'send') {
            sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            sendBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            sendBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            sendBtn.onclick = this.sendHandler;
        } else {
            sendBtn.innerHTML = '<i class="fas fa-stop-circle fa-spin"></i>';
            sendBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            sendBtn.classList.add('bg-red-600', 'hover:bg-red-700');
            sendBtn.onclick = this.stopHandler;
        }
    }

    render() {
        if (!this.elements.container) return;
        const conv = this.getActiveConversation();
        const messages = conv.messages;
        
        let html = `
            <div class="ai-chat-container flex flex-col h-full bg-gray-100 rounded-lg" style="min-height: 500px;">
                <div class="flex flex-wrap justify-between items-center gap-2 p-3 bg-white rounded-t-lg">
                    <div class="flex flex-wrap gap-2">
                        <button id="aiNewChatBtn" class="bg-green-600 hover:bg-green-700 h-7 text-white px-3 py-1.5 rounded-lg text-sm transition"><i class="fas fa-plus ml-1"></i> جديد</button>
                        <button id="aiHistoryBtn" class="bg-purple-600 hover:bg-purple-700 h-7 text-white px-3 py-1.5 rounded-lg text-sm transition"><i class="fas fa-history ml-1"></i> السجل (${this.conversations.length})</button>
                        <button id="aiClearBtn" class="bg-orange-500 hover:bg-orange-600 h-7 text-white px-3 py-1.5 rounded-lg text-sm transition" title="مسح المحادثة الحالية"><i class="fas fa-trash-alt ml-1"></i></button>
                    </div>
                    <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"><i class="fas fa-microchip ml-1"></i> النموذج: ${this.models[this.selectedModel]?.name || this.selectedModel}</div>
                </div>
                <div id="aiMessagesArea" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100" style="min-height: 0;">`;
        
        if (messages.length === 0) {
            html += `<div class="flex flex-col items-center justify-center text-center text-gray-400 py-16"><i class="fas fa-comment-dots text-6xl mb-3 opacity-50"></i><p class="text-lg font-medium">مرحباً بك في المساعد التقني</p><p class="text-sm">أنا متخصص في التبريد والتكييف، اسألني أي شيء</p></div>`;
        } else {
            for (let msg of messages) {
                const isUser = msg.role === 'user';
                const isError = msg.isError === true;
                const isSuccess = msg.isSuccess === true;
                let formatted;
                if (isUser) {
                    formatted = escapeHtml(msg.content);
                } else {
                    formatted = this.formatGeminiMessage(msg.content);
                }
                const plainText = msg.content;
                
                
                
          let bgClass, textColorClass, borderClass;
if (isUser) {
    bgClass = 'bg-green-700';
    textColorClass = 'text-white';
    borderClass = 'rounded-br-none';
} else {
    // كل رسائل المساعد (بغض النظر عن الخطأ أو النجاح) بنفس اللون
    bgClass = 'bg-white';
    textColorClass = 'text-gray-800';
    borderClass = 'border border-gray-200 rounded-bl-none';
}
                
                html += `<div class="flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group">
                    <div class="${bgClass} ${borderClass} rounded-2xl p-3 max-w-[80%] shadow-sm relative">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <div class="flex items-center gap-2">
                                ${isUser ? '<i class="fas fa-user-circle text-white text-sm"></i>' : '<i class="fas fa-robot text-sm text-blue-600"></i>'}
                                <div class="font-bold text-xs ${isUser ? 'text-white' : 'text-blue-600'}">${isUser ? 'أنت' : 'المساعد'}</div>                            </div>
                            <button class="copy-msg-btn text-xs transition ${isUser ? 'text-white hover:text-gray-200' : (isError ? 'text-red-600 hover:text-red-800' : 'text-gray-500 hover:text-blue-600')}" data-content="${escapeHtml(plainText)}" title="نسخ الرسالة">
                                <i class="far fa-copy"></i>
                            </button>
                        </div>
                        <div class="message-content text-sm leading-relaxed ${textColorClass}">${formatted}</div>
                        ${msg.images ? `<div class="text-[10px] text-gray-400 mt-1">📷 ${msg.images.length} صورة/صور</div>` : ''}
                        <div class="text-[10px] ${isUser ? 'text-blue-100' : (isError ? 'text-red-600' : (isSuccess ? 'text-green-700' : 'text-gray-400'))} mt-2 text-left">${new Date(msg.timestamp).toLocaleTimeString('ar-EG')}</div>
                    </div>
                </div>`;
            }
        }
        
        html += `
                </div>
                <div class="p-3 bg-white rounded-b-lg">
                    <div id="imagePreviewArea" class="flex flex-wrap gap-2 mb-2"></div>
                    <div class="flex flex-row items-end gap-2">
                        <div class="flex flex-col gap-2">
                            <button id="aiAttachImageBtn" class="p-2 rounded-full hover:bg-gray-100 transition-colors" title="إرفاق صورة">
                                <i class="fas fa-image text-gray-600"></i>
                            </button>
                            <button id="aiVoiceBtn" class="p-2 rounded-full hover:bg-gray-100 transition-colors" title="إرسال صوتي">
                                <i class="fas fa-microphone text-gray-600"></i>
                            </button>
                            <button id="aiSendBtn" class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition shrink-0">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                        </div>
                        <textarea id="aiPromptInput" rows="1" placeholder="اكتب مشكلتك الفنية هنا..." 
                            class="flex-1 bg-gray-50 outline-none text-sm resize-y min-h-[40px] max-h-[150px] px-3 py-2 rounded-xl focus:border-blue-400 transition"></textarea>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.container.innerHTML = html;
        this.bindEvents();
        const area = document.getElementById('aiMessagesArea');
        if (area) area.scrollTop = area.scrollHeight;
        this.updateImagePreview();
        const textarea = document.getElementById('aiPromptInput');
        if (textarea) {
            this.autoResizeTextarea(textarea);
            if (textarea.value) this.autoResizeTextarea(textarea);
        }
    }

    updateImagePreview() {
        const previewArea = document.getElementById('imagePreviewArea');
        if (!previewArea) return;
        if (!this.selectedImages.length) {
            previewArea.innerHTML = '';
            return;
        }
        previewArea.innerHTML = this.selectedImages.map((file, idx) => `
            <div class="relative inline-block">
                <img src="${URL.createObjectURL(file)}" class="w-16 h-16 object-cover rounded border" />
                <button class="remove-image-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs" data-index="${idx}">✕</button>
            </div>
        `).join('');
        previewArea.querySelectorAll('.remove-image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.index);
                this.selectedImages.splice(idx, 1);
                this.updateImagePreview();
            });
        });
    }

    bindEvents() {
        if (this.eventCleanup) this.eventCleanup();
        
        const textarea = document.getElementById('aiPromptInput');
        let inputHandler = null;
        if (textarea) {
            this.autoResizeTextarea(textarea);
            inputHandler = () => { this.autoResizeTextarea(textarea); };
            textarea.addEventListener('input', inputHandler);
        }
        
        this.eventCleanup = () => {
            if (textarea && inputHandler) {
                textarea.removeEventListener('input', inputHandler);
            }
        };
        
        const sendBtn = document.getElementById('aiSendBtn');
        const inputArea = document.getElementById('aiPromptInput');
        const newBtn = document.getElementById('aiNewChatBtn');
        const historyBtn = document.getElementById('aiHistoryBtn');
        const clearBtn = document.getElementById('aiClearBtn');
        const attachBtn = document.getElementById('aiAttachImageBtn');
        const voiceBtn = document.getElementById('aiVoiceBtn');
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.multiple = true;
        imageInput.style.display = 'none';
        document.body.appendChild(imageInput);

        if (attachBtn) {
            attachBtn.onclick = () => imageInput.click();
            imageInput.onchange = (e) => {
                const files = Array.from(e.target.files);
                this.selectedImages.push(...files);
                this.updateImagePreview();
                imageInput.value = '';
            };
        }

        if (voiceBtn && 'webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.lang = 'ar-EG';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            voiceBtn.onclick = () => {
                if (this.recognition) {
                    this.recognition.start();
                    voiceBtn.classList.add('text-red-600');
                }
            };
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (inputArea) {
                    inputArea.value = transcript;
                    this.autoResizeTextarea(inputArea);
                }
                voiceBtn.classList.remove('text-red-600');
            };
            this.recognition.onerror = () => voiceBtn.classList.remove('text-red-600');
            this.recognition.onend = () => voiceBtn.classList.remove('text-red-600');
        } else if (voiceBtn) {
            voiceBtn.style.display = 'none';
        }

        if (inputArea) {
            const resizeHandler = () => this.autoResizeTextarea(inputArea);
            inputArea.addEventListener('input', resizeHandler);
            inputArea._resizeHandler = resizeHandler;
        }

        const container = this.elements.container;
        if (container) {
            container.addEventListener('click', (e) => {
                const copyBtn = e.target.closest('.copy-msg-btn');
                if (copyBtn) {
                    const content = copyBtn.getAttribute('data-content');
                    if (content) this.copyMessageContent(content);
                }
            });
        }

        const sendHandler = () => this.handleSend();
        const stopHandler = () => {
            if (this.isStreaming) {
                this.stopStreaming();
                this.updateSendButton('send');
                this.isSending = false;
                const typingIndicator = document.getElementById('aiTypingIndicator');
                if (typingIndicator) typingIndicator.classList.add('hidden');
                showToast('تم إلغاء الطلب', 'info');
            }
        };

        if (sendBtn) {
            this.sendButton = sendBtn;
            this.sendHandler = sendHandler;
            this.stopHandler = stopHandler;
            sendBtn.onclick = sendHandler;
        }

        const keyHandler = (e) => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); this.handleSend(); } };
        const newHandler = () => { this.createNewConversation(); this.render(); showToast('محادثة جديدة', 'success'); };
        const historyHandler = () => this.showHistoryModal();
        const clearHandler = () => { if (confirm('مسح جميع رسائل المحادثة الحالية؟')) { this.clearCurrentConversation(); this.render(); showToast('تم مسح المحادثة', 'success'); } };

        if (inputArea) inputArea.addEventListener('keydown', keyHandler);
        if (newBtn) newBtn.addEventListener('click', newHandler);
        if (historyBtn) historyBtn.addEventListener('click', historyHandler);
        if (clearBtn) clearBtn.addEventListener('click', clearHandler);

        this.eventCleanup = () => {
            if (sendBtn) sendBtn.onclick = null;
            if (inputArea) {
                inputArea.removeEventListener('keydown', keyHandler);
                if (inputArea._resizeHandler) inputArea.removeEventListener('input', inputArea._resizeHandler);
            }
            if (newBtn) newBtn.removeEventListener('click', newHandler);
            if (historyBtn) historyBtn.removeEventListener('click', historyHandler);
            if (clearBtn) clearBtn.removeEventListener('click', clearHandler);
            if (attachBtn) attachBtn.onclick = null;
            if (voiceBtn) voiceBtn.onclick = null;
            if (imageInput) imageInput.remove();
            if (container) container.removeEventListener('click', this._copyDelegate);
            this.eventCleanup = null;
        };
    }

    async handleSend() {
        if (this.isSending) {
            showToast('الرجاء الانتظار حتى اكتمال الرد الحالي أو قم بالإلغاء', 'warning');
            return;
        }
        const input = document.getElementById('aiPromptInput');
        const prompt = input?.value.trim();
        if (!prompt && this.selectedImages.length === 0) {
            showToast('الرجاء إدخال نص أو رفع صورة', 'warning');
            return;
        }
        const finalPrompt = prompt || "قم بتحليل الصورة/الصور المرفقة وتقديم معلومات تقنية عنها.";
        const imagesToSend = [...this.selectedImages];
        this.selectedImages = [];
        this.updateImagePreview();

        // ✅ إضافة رسالة المستخدم فورًا وتحديث الواجهة
        this.addMessage('user', finalPrompt, imagesToSend);
        this.render(); // عرض رسالة المستخدم فورًا

        // ✅ إضافة رسالة مساعد فارغة مؤقتة (ستتحديث لاحقًا)
        this.addMessage('assistant', '... جاري الكتابة ...', [], false, false);
        this.render(); // عرض رسالة "جاري الكتابة"

        if (input) {
            input.value = '';
            input.style.height = 'auto';
            this.autoResizeTextarea(input);
        }

        this.isSending = true;
        this.updateSendButton('stop');

        const typingIndicator = document.getElementById('aiTypingIndicator');
        if (typingIndicator) typingIndicator.classList.add('hidden'); // سنستخدم رسالة "جاري الكتابة" بديلاً

        const area = document.getElementById('aiMessagesArea');
        if (area) area.scrollTop = area.scrollHeight;

        let finalResponse = '';
        
        const onChunk = (chunk, full) => {
            finalResponse = full;
            // تحديث آخر رسالة مساعد (المؤقتة) بالمحتوى الجزئي
            this.updateLastAssistantMessage(full + '...', false, false);
        };
        
        const onComplete = (final) => {
            this.updateLastAssistantMessage(final, false, true); // أخضر للنجاح
            this.updateSendButton('send');
            this.isSending = false;
            showToast('تم الرد بنجاح', 'success');
        };
        
        const onError = (errMsg) => {
            // تحديث رسالة المساعد لتصبح حمراء
            this.updateLastAssistantMessage(`⚠️ **فشل**: ${errMsg}`, true, false);
            this.updateSendButton('send');
            this.isSending = false;
            showToast(errMsg, 'error');
        };
        
        await this.sendMessageStream(finalPrompt, imagesToSend, onChunk, onComplete, onError, true);
    }

    formatGeminiMessage(text) {
        if (!text) return '';
        let safe = escapeHtml(text);
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                   .replace(/\*(.*?)\*/g, '<em>$1</em>')
                   .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
                   .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto"><code>$2</code></pre>')
                   .replace(/\n/g, '<br>');
        return safe;
    }

    showHistoryModal() {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
        modalDiv.style.zIndex = '10000';
        modalDiv.style.position = 'fixed';
        modalDiv.style.backdropFilter = 'blur(3px)';

        const renderHistory = () => {
            let html = `<div class="bg-white rounded-xl w-11/12 max-w-2xl h-5/6 flex flex-col shadow-2xl">
                <div class="flex justify-between items-center p-4 border-b"><h3 class="text-xl font-bold text-blue-700"> سجل المحادثات</h3><button class="close-history text-gray-600 hover:text-red-600 text-2xl">&times;</button></div>
                <div class="flex-1 overflow-y-auto p-4 space-y-2" id="historyList">`;
            if (this.conversations.length === 0) html += '<p class="text-center text-gray-500">لا توجد محادثات سابقة</p>';
            else {
                for (let conv of this.conversations) {
                    const activeClass = conv.id === this.activeConversationId ? 'bg-blue-100 border-blue-400' : 'bg-white';
                    const msgCount = conv.messages.length;
                    const lastMsg = conv.messages[msgCount-1]?.content.substring(0, 50) || '';
                    html += `<div class="history-conv-item p-3 rounded-lg border cursor-pointer ${activeClass}" data-id="${conv.id}">
                        <div class="font-bold"> ${escapeHtml(conv.title)}</div>
                        <div class="text-xs text-gray-500">${new Date(conv.updatedAt).toLocaleString('ar-EG')} - ${msgCount} رسالة</div>
                        <div class="text-sm text-gray-600 mt-1">${escapeHtml(lastMsg)}${lastMsg.length>=50?'...':''}</div>
                        <button class="delete-conv-btn text-red-500 text-xs mt-2" data-id="${conv.id}"><i class="fas fa-trash"></i> حذف</button>
                    </div>`;
                }
            }
            html += `</div></div>`;
            modalDiv.innerHTML = html;

            modalDiv.querySelectorAll('.history-conv-item').forEach(el => {
                const convId = el.dataset.id;
                el.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-conv-btn')) return;
                    if (this.switchConversation(convId)) { this.render(); modalDiv.remove(); showToast('تم التبديل', 'success'); }
                    else showToast('فشل التبديل', 'error');
                });
            });
            modalDiv.querySelectorAll('.delete-conv-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    if (confirm('حذف هذه المحادثة نهائياً؟')) {
                        if (this.deleteConversation(id)) { 
                            renderHistory(); 
                            this.render();
                            showToast('تم الحذف', 'success'); 
                        }
                        else showToast('فشل الحذف', 'error');
                    }
                });
            });
            const closeBtn = modalDiv.querySelector('.close-history');
            if (closeBtn) closeBtn.onclick = () => modalDiv.remove();
        };
        renderHistory();
        modalDiv.onclick = (e) => { if (e.target === modalDiv) modalDiv.remove(); };
        document.body.appendChild(modalDiv);
    }
}
// تثبيت PWA
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    // منع ظهور النافذة المنبثقة التلقائية للمتصفح
    e.preventDefault();
    // حفظ الحدث لاستخدامه لاحقاً عند الطلب
    deferredPrompt = e;
    console.log('PWA ready: يمكن تثبيت التطبيق عبر أداة التثبيت');
});

// الاستماع لحدث اكتمال التثبيت (للمعلومات فقط)
window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log(' التطبيق تم تثبيته بنجاح');
});
// ------------------- ثوابت الأدوات الثابتة (المصدر الوحيد) -------------------
const TOOL_CONSTANTS = {
    room: { factorNormal: 250, factorSunny: 300, factorKitchen: 350, factorHigh: 400, btuPerHp: 8000, ampPerHp: 4, voltage: 220 },
    capillary: { baseFactor: 0.22, maxEvapTemp: 20, minEvapTemp: -30, maxCondTemp: 70, minCondTemp: 20 },
    evap_cond: { const1: 12, const2: 2, condMultiplier: 1.3, evapU: 0.8, condU: 0.6, areaFactor: 1.2 },
    ntc: { 
        types: { 
            "10k_3950": { R0: 10000, B: 3950, name: '10KΩ (حساس الغرفة و الملف الداخلي)' },
            "5k_3470": { R0: 5000, B: 3470, name: '5KΩ (حساس الملف الخارجى)' },
            "15k_3977": { R0: 15000, B: 3977, name: '15KΩ (بعض الموديلات)' }
        } 
    },
    ptcalc: {},
    heat: { sh_normal_min: 5, sh_normal_max: 12, sc_normal_min: 5, sc_normal_max: 10 },
    flow: { cfmPerTon: 400, m3hFactor: 1.699 },
    wire: { resistivityCu: 0.0172, resistivityAl: 0.0282, voltageSingle: 220, voltageThree: 380, phaseFactorThree: 1.732, voltageDropPerc: 3 },
    elec_laws: { powerFactor: 0.8, phaseFactorSingle: 1, phaseFactorThree: 1.732 },
    cap_calc: { frequency: 50, pi: 3.141592653589793 },
    energy: { defaultPrice: 1.5 },
    universal_conv: {},
    comp_search: {},
    ai_assistant: {},
    ref_table: {  tableData: {
    "R22": { suction: "60-70", discharge: "250-300", stop: "150-155" },
    "R410A": { suction: "120-130", discharge: "450-500", stop: "225-230" },
    "R134a": { suction: "12-15", discharge: "150", stop: "85-95" },
    "R404A": { suction: "80-90", discharge: "275-300", stop: "180-185" },
    "R32": { suction: "110-115", discharge: "175-375", stop: "240-245" },
    "R407C": { suction: "75-80", discharge: "275-300", stop: "180-185" },
    "R600a": { suction: "0-1", discharge: "150", stop: "40-50" },
    "R290": { suction: "65-70", discharge: "275-300", stop: "125-130" }
  }
},    
    pipe_length_table: {
  lengths: {
    "1":   { maxLen: 20, maxHighIn: 8,  maxHighOut: 8 },
    "1.5": { maxLen: 25, maxHighIn: 10, maxHighOut: 10 },
    "2.25":{ maxLen: 30, maxHighIn: 12, maxHighOut: 12 },
    "3":   { maxLen: 35, maxHighIn: 15, maxHighOut: 15 },
    "4":   { maxLen: 45, maxHighIn: 20, maxHighOut: 20 },
    "5":   { maxLen: 55, maxHighIn: 25, maxHighOut: 25 },
    "6":   { maxLen: 65, maxHighIn: 30, maxHighOut: 30 },
    "7.5": { maxLen: 70, maxHighIn: 30, maxHighOut: 30 },
    "10":  { maxLen: 80, maxHighIn: 35, maxHighOut: 35 }
  }
},
    pipe_sizing_table: {  sizes: [
    { hp: 1.5, ton: 1, btu: 12000, liquid: "1/4", suction: "3/8" },
    { hp: 2.25, ton: 1.5, btu: 18000, liquid: "1/4", suction: "1/2" },
    { hp: 3, ton: 2, btu: 24000, liquid: "3/8", suction: "5/8" },
    { hp: 3.75, ton: 2.5, btu: 30000, liquid: "3/8", suction: "5/8" },
    { hp: 4.5, ton: 3, btu: 36000, liquid: "3/8", suction: "3/4" },
    { hp: 5.25, ton: 3.5, btu: 42000, liquid: "3/8", suction: "3/4" },
    { hp: 6, ton: 4, btu: 48000, liquid: "3/8", suction: "3/4" },
    { hp: 7.5, ton: 5, btu: 60000, liquid: "1/2", suction: "7/8" }
  ]
},
    wire_current_table: { cuAlData: [ { mm2: 1.5, cuA: 19, alA: 15 }, { mm2: 2.5, cuA: 26, alA: 21 }, { mm2: 4, cuA: 34, alA: 27 }, { mm2: 6, cuA: 44, alA: 35 }, { mm2: 10, cuA: 61, alA: 48 }, { mm2: 16, cuA: 82, alA: 65 }, { mm2: 25, cuA: 108, alA: 85 }, { mm2: 35, cuA: 135, alA: 105 }, { mm2: 50, cuA: 168, alA: 130 } ] },
    capacitor_table: { motorCaps: [ { power: "370 W", runCap: 12, startCap: "-" }, { power: "550 W", runCap: 20, startCap: 80 }, { power: "750 W", runCap: 20, startCap: 80 }, { power: "1.1 KW", runCap: 25, startCap: 100 }, { power: "1.5 KW", runCap: 30, startCap: 250 }, { power: "2.2 KW", runCap: 40, startCap: 300 } ] },
    capacitors: {},
    refrigerant_charge: { defaultBaseCharge: 1.2, defaultExtraPerMeter: 0.02, densities: { R410A: 1100, R32: 960, R22: 1250, R134a: 1200, R404A: 1050, R407C: 1130, R290: 500, R600a: 550 }, innerDiameters: { "1/4": 6.35, "5/16": 7.94, "3/8": 9.52, "1/2": 12.7, "5/8": 15.88, "3/4": 19.05, "7/8": 22.23 }, defaultBaseLength: 5 },
    voltage_drop: { resistivityCu: 0.0172, resistivityAl: 0.0282, maxAllowedPercent: 5 },
    air_velocity: { cfmToM3s: 0.000471947 },
    pressure_diagnosis: {}
};

// -------------------  جداول PT -------------------
const refPTData = {
R22:{temps:[-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45,50,55,60,65,70],pressures:[7.1,9.2,11.8,14.6,17.8,21.4,25.5,30.0,35.0,40.6,46.9,54.0,62.0,71.0,81.0,92.0,104.0,118.0,134.0,152.0,171.0,193.0,217.0]},
R134a:{temps:[-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45,50,55,60,65,70],pressures:[1.8,3.0,4.7,6.8,9.6,13.0,17.2,22.2,28.0,34.7,42.4,51.2,61.3,72.7,85.5,100.0,116.0,134.0,154.0,176.0,201.0,229.0,260.0]},
R410A:{temps:[-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45,50,55,60,65,70],pressures:[29,40,54,72,95,123,155,193,236,286,342,405,475,553,639,735,840,955,1080,1215,1360,1515,1680]},
R404A:{temps:[-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45,50,55,60],pressures:[7.5,10.2,13.6,17.7,22.8,29.0,36.6,45.6,56.2,68.7,83.2,100.0,119.4,141.7,167.1,196.0,228.6,265.0,305.6,350.7,400.8]},
R407C:{temps:[-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45,50,55,60],pressures:[6.8,9.2,12.2,15.9,20.4,25.8,32.2,39.8,48.8,59.2,71.2,84.9,100.5,118.2,138.2,160.7,185.9,213.9,244.9,279.1,316.8]},
R32:{temps:[-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45,50,55,60],pressures:[35,48,64,84,108,137,171,211,257,310,371,440,518,605,702,810,930,1063,1210,1370,1545]},
R290:{temps:[-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40,45,50,55,60],pressures:[3.4,5.3,7.9,11.4,15.9,21.7,28.9,37.8,48.7,61.7,77.1,95.1,116.0,140.1,167.6,198.8,233.8,272.8,316.0,363.7,416.1]},
R600a:{temps:[-40,-35,-30,-25,-20,-15,-10,-5,0,5,10,15,20,25,30,35,40],pressures:[0.5,0.9,1.6,2.6,4.1,6.2,9.0,12.7,17.5,23.7,31.6,41.5,53.7,68.6,86.6,108.1,133.5]}

};

function initAIManager(containerId) {
    const container = document.getElementById(containerId);
    if (!container) { console.warn('Container not found for AI'); return; }
    if (aiManager) {
        // تحديث القيم الحالية من state قبل إعادة العرض
        aiManager.selectedModel = state.selectedGeminiModel;
        aiManager.apiKey = state.geminiApiKey;
        aiManager.elements.container = container;
        aiManager.initUI(container);
    } else {
        aiManager = new AIManager();
        aiManager.selectedModel = state.selectedGeminiModel;
        aiManager.apiKey = state.geminiApiKey;
        aiManager.initUI(container);
    }
    return aiManager;
}
// دوال الاستيفاء (محسنة قليلاً للأداء)
function interpolatePressure(data, tempC) {
    const temps = data.temps;
    const pressures = data.pressures;
    if (tempC <= temps[0]) return pressures[0];
    if (tempC >= temps[temps.length - 1]) return pressures[pressures.length - 1];
    for (let i = 0; i < temps.length - 1; i++) {
        if (tempC >= temps[i] && tempC <= temps[i + 1]) {
            return pressures[i] + (tempC - temps[i]) * (pressures[i + 1] - pressures[i]) / (temps[i + 1] - temps[i]);
        }
    }
    return pressures[pressures.length - 1];
}

function interpolateTemp(data, pressurePSI) {
    const temps = data.temps;
    const pressures = data.pressures;
    if (pressurePSI <= pressures[0]) return temps[0];
    if (pressurePSI >= pressures[pressures.length - 1]) return temps[temps.length - 1];
    for (let i = 0; i < pressures.length - 1; i++) {
        if (pressurePSI >= pressures[i] && pressurePSI <= pressures[i + 1]) {
            return temps[i] + (pressurePSI - pressures[i]) * (temps[i + 1] - temps[i]) / (pressures[i + 1] - pressures[i]);
        }
    }
    return temps[temps.length - 1];
}

function interpolate(x, x0, y0, x1, y1) { 
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0); 
}

function getPressureFromTemp(refrigerant, tempC) { 
    const data = refPTData[refrigerant]; 
    if (!data) return NaN; 
    return interpolatePressure(data, tempC);
}


// دوال العرض والحفظ (محسنة)
function showFullRes(name, data, extraHTML = '') {
    const div = document.getElementById('resultDisplay');
    if (!div) return;
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const saveId = `saveBtn_${uniqueId}`;
    const copyId = `copyBtn_${uniqueId}`;

    let html = `<div id="captureArea"><h4 class="font-bold text-lg mb-2"> ${escapeHtml(name)}</h4>`;
    for (let k in data) {
        let value = data[k];
        let safeValue = escapeHtml(String(value));
        html += `
        <div class="flex justify-between border-b py-2">
            <span class="font-semibold text-gray-700">${escapeHtml(k)}</span>
            <span class="text-blue-600 font-bold">${safeValue}</span>
        </div>`;
    }
    
    if (extraHTML) {
        html += `<div class="mt-3">${extraHTML}</div>`;
    }
    
    html += `</div><div class="mt-4 flex justify-center gap-6">
        <button id="${saveId}" class="text-green-600 font-bold hover:underline"><i class="fas fa-save"></i> حفظ</button>
        <button id="${copyId}" class="text-gray-800 font-bold hover:underline"><i class="fas fa-copy"></i> نسخ</button>
    </div>`;

    div.innerHTML = html;
    div.classList.remove('hidden');

    const saveBtn = document.getElementById(saveId);
    const copyBtn = document.getElementById(copyId);
    if (saveBtn) saveBtn.onclick = () => saveCurrent(name, data, currentToolId);
    if (copyBtn) copyBtn.onclick = () => copyRes(data, name);
}
// نسخ النتيجة إلى الحافظة بطريقة موثوقة
async function copyRes(data, name = 'النتيجة') {
    // تنسيق النص بشكل جميل
    let text = `نتيجة حساب "${name}":\n`;
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    for (let k in data) {
        text += `▪️ ${k}: ${data[k]}\n`;
    }
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    text += ` ${new Date().toLocaleString('ar-EG')}`;

    try {
        // المحاولة باستخدام Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showToast(' تم نسخ النتيجة', 'success');
            return;
        }
        // طريقة بديلة باستخدام textarea
        fallbackCopy(text);
    } catch (err) {
        console.warn(err);
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error(err);
    }
    document.body.removeChild(textarea);
    if (success) {
        showToast(' تم النسخ (طريقة احتياطية)', 'success');
    } else {
        showToast('فشل النسخ، حاول يدوياً', 'error');
    }
}



// ========== دالة updateStats المعدلة ==========
function updateStats() {
    // التأكد من أن state.saved موجود ومصفوفة
    if (!state) {
        console.warn('updateStats: state is undefined');
        return;
    }
    if (!Array.isArray(state.saved)) {
        console.warn('updateStats: state.saved is not an array, resetting');
        state.saved = [];
    }
    const countSpan = document.getElementById('savedCount');
    if (countSpan) countSpan.innerText = state.saved.length;
}

function formatGeminiResponse(text, questionText = '', options = {}) {
    // الخطوة 1: تحويل أي قيمة مدخلة إلى سلسلة نصية آمنة
    if (text === undefined || text === null) text = '';
    if (typeof text !== 'string') text = String(text); // حول الأرقام والكائنات إلى نص
    
    // الخطوة 2: التحقق من وجود نص فعلي بعد التحويل
    if (text.trim() === '') return '<div class="text-red-600"> لا توجد بيانات</div>';
    
    // دالة مساعدة لهروب HTML (آمنة)
    const escapeHtmlBasic = (str) => {
        if (str === undefined || str === null) return '';
        const s = String(str);
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
    
    // إزالة أي علامات HTML ضارة
    const stripHtml = (s) => s.replace(/<[^>]*>/g, '');
    const cleanText = stripHtml(text);
    
    // تحويل Markdown إلى HTML
    let formatted = cleanText;
    
    // كتل الكود
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const escapedCode = escapeHtmlBasic(code);
        const langLabel = lang ? `<span class="text-xs bg-gray-700 text-white px-2 py-0.5 rounded">${escapeHtmlBasic(lang)}</span>` : '';
        return `<pre class="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-3"><code class="block" dir="ltr">${langLabel}\n${escapedCode}</code></pre>`;
    });
    
    // كود مضمّن `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-200 text-red-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // عناوين
    formatted = formatted.replace(/^# (.*?)$/gm, '<h3 class="text-lg font-black text-blue-800 mt-4 mb-2">$1</h3>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h4 class="text-md font-bold text-blue-700 mt-3 mb-1">$1</h4>');
    
    // Bold و italic
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');
    
    // قوائم نقطية
    formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-green-600">•</span><span class="flex-1">$1</span></div>');
    
    // قوائم مرقمة مع معالجة آمنة للأسطر
    let inOrderedList = false;
    let orderedListHtml = '';
    const lines = formatted.split('\n');
    const outputLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\d+)\.\s+(.*)$/);
        if (match) {
            if (!inOrderedList) {
                inOrderedList = true;
                orderedListHtml = '<ol class="list-decimal pr-6 space-y-1 my-2">';
            }
            orderedListHtml += `<li class="text-gray-800">${match[2]}</li>`;
        } else {
            if (inOrderedList) {
                inOrderedList = false;
                outputLines.push(orderedListHtml + '</ol>');
                orderedListHtml = '';
            }
            outputLines.push(line);
        }
    }
    if (inOrderedList) outputLines.push(orderedListHtml + '</ol>');
    formatted = outputLines.join('\n');
    
    // الروابط
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>');
    
    // تحويل الأسطر الفارغة إلى فقرات
    formatted = formatted.replace(/\n\s*\n/g, '</p><p class="my-2">');
    formatted = '<p class="my-2">' + formatted.replace(/\n/g, '<br>') + '</p>';
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');
    
    // الآن أصبحت text سلسلة نصية قطعاً، يمكن استخدام length بأمان
    const isLikelyTruncated = text.length > 4000 && !/[.!?…"']\s*$/.test(text);
    const truncWarning = isLikelyTruncated ? 
        '<div class="bg-yellow-100 border-r-4 border-yellow-600 p-2 my-2 text-sm"><i class="fas fa-cut"></i>  الرد قد يكون غير مكتمل بسبب طوله. حاول تقصير السؤال.</div>' : '';
    
    return `
        <div class="gemini-response-card bg-gradient-to-br from-white to-blue-50 rounded-xl border-r-4 border-primary shadow-md p-5 mt-3">
            <div class="flex justify-between items-center mb-3 border-b border-blue-200 pb-2">
                <div class="flex items-center gap-2">
                    <i class="fab fa-google text-blue-600 text-xl"></i>
                    <span class="font-black text-gray-800"> رد Gemini AI</span>
                </div>
                <button onclick="window.copyGeminiResponse()" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full transition">
                    <i class="far fa-copy ml-1"></i> نسخ
                </button>
            </div>
            <div class="prose prose-sm max-w-none text-gray-800 leading-relaxed" dir="rtl">
                ${truncWarning}
                ${formatted}
            </div>
        </div>
    `;
}
function closeModal() { 
    const modal = document.getElementById('toolModal');
    if (modal) modal.style.display = 'none';
}

function showSalatToast() { 
    showToast('اللهم صلِّ على سيدنا محمد ﷺ', 'salat'); 
}

function filterTools(cat, btn) { 
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); 
    document.querySelectorAll('.tool-btn').forEach(t => { 
        t.style.display = (cat === 'all' || t.dataset.cat === cat) ? 'flex' : 'none'; 
    }); 
    showSalatToast(); 
}

// دوال الجداول (بدون تغيير)
function showStaticTable(title, htmlContent) {
    const modal = document.getElementById('toolModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalBody').innerHTML = `<div class="data-table-wrapper">${htmlContent}</div><p class="text-xs text-gray-600 mt-2 font-bold">* قيم تقريبية</p>`;
    document.getElementById('calculateBtn').style.display = 'none';
    document.getElementById('settingsToolHeaderBtn').style.display = 'none';
    document.getElementById('resultDisplay').classList.add('hidden');
    modal.style.display = 'block';
}

function showRefTable() { 
    const tableData = TOOL_CONSTANTS.ref_table.tableData;
    const html = `<table class="data-table"><thead><tr><th>الفريون</th><th>سحب PSI</th><th>طرد PSI</th><th>توقف PSI</th></tr></thead><tbody>${Object.entries(tableData).map(([ref, vals]) => `<tr><td>${ref}</td><td>${vals.suction}</td><td>${vals.discharge}</td><td>${vals.stop}</td></tr>`).join('')}</tbody></table>`;
    showStaticTable('جدول ضغوط الفريونات', html);
}

function showPipeLengthTable() { 
    const lengths = TOOL_CONSTANTS.pipe_length_table.lengths;
    const html = `<table class="data-table"><thead><tr><th>HP</th><th>أقصى طول المواسير (م)</th><th>أقصى ارتفاع (الوحدة الداخلية أعلى) م</th><th>أقصى ارتفاع (الوحدة الداخلية أسفل) م</th></tr></thead><tbody>${Object.entries(lengths).map(([hp, vals]) => `<tr><td>${hp}</td><td>${vals.maxLen}</td><td>${vals.maxHighIn}</td><td>${vals.maxHighOut}</td></tr>`).join('')}</tbody></table><p class="table-note">القيم تقريبية لمكيفات السبليت القياسية قد تختلف حسب نوع الفريون وطراز الجهاز وتعليمات الشركة المصنعة</p>`;
    showStaticTable(' أقصى طول للمواسير', html);
}

function showPipeSizingTable() { 
    const sizes = TOOL_CONSTANTS.pipe_sizing_table.sizes;
    const html = `<table class="data-table"><thead><tr><th>HP</th><th>طن</th><th>BTU</th><th>ماسورة الطرد (Liquid)</th><th>ماسورة السحب (Suction)</th></tr></thead><tbody>${sizes.map(s => `<tr><td>${s.hp}</td><td>${s.ton}</td><td>${s.btu}</td><td>${s.liquid}</td><td>${s.suction}</td></tr>`).join('')}</tbody></table><p class="table-note">القيم تمثل الأقطار الشائعة لمكيفات السبليت والتجاري الخفيف قد تختلف الأقطار حسب نوع الفريون وطول المواسير وفرق الارتفاع وتعليمات الشركة المصنعة</p>`;
    showStaticTable('أقطار المواسير', html);
}

function showWireCurrentTable() { 
    const data = TOOL_CONSTANTS.wire_current_table.cuAlData;
    const html = `<table class="data-table"><thead><tr><th>مقطع الكابل (mm²)</th><th>تيار نحاس (A)</th><th>تيار ألمنيوم (A)</th></tr></thead><tbody>${data.map(d => `<tr><td>${d.mm2}</td><td>${d.cuA}</td><td>${d.alA}</td></tr>`).join('')}</tbody></table><p class="table-note">القيم تقريبية لكابلات PVC عند درجة حرارة 30 درجة سيلسيوس وعند التمديد داخل مواسير أو جدران قد تختلف القيم حسب طريقة التمديد ودرجة الحرارة وعدد الكابلات في نفس المسار</p>`;
    showStaticTable(' أحمال الأسلاك', html);
}

function showCapacitorTable() { 
    const caps = TOOL_CONSTANTS.capacitor_table.motorCaps;
    const html = `<table class="data-table"><thead><tr><th>قدرة المحرك</th><th>مكثف تشغيل (µF)</th><th>مكثف بدء (µF)</th></tr></thead><tbody>${caps.map(m => `<tr><td>${m.power}</td><td>${m.runCap}</td><td>${m.startCap}</td></tr>`).join('')}</tbody></table>`;
    showStaticTable(' مكثفات المحركات', html);
}

function showToolsDesc() {
    const tools = [
    { name: "أحمال الغرف", input: "الطول، العرض، الارتفاع، المعامل الحراري (أو وضع متقدم: نوع الغرفة، العزل، عدد الأشخاص، الإضاءة، الأجهزة، ACH، وزن المنتج، درجة حرارة الدخول، زمن التبريد)", output: "BTU/h، حصان (HP)، طن تبريد، أمبير، تفاصيل الأحمال (الجدران، الأشخاص، الإضاءة، الأجهزة، تسريب الهواء، المنتج)", law: "الحجم (م³) × المعامل (BTU/m³) أو Σ الأحمال (الجدران + الأشخاص + الإضاءة + الأجهزة + تسريب الهواء + المنتج) × 1.15", description: "حساب حمل التبريد للغرفة بطريقة تقليدية أو متقدمة تشمل العزل، الأشخاص، الأجهزة، البضائع، وتسلل الهواء مع إضافة احتياطي 15% وتقريب القدرة لأقرب 0.5 حصان." },
    { name: "الكابلري (الأنبوب الشعري)", input: "الفريون، القدرة (HP/BTU/Watt)، حرارة التبخير (°C)، حرارة التكثيف (°C)، Subcooling، Superheat، طول خط السائل (م)، وضع الحساب (سريع/متقدم)", output: "القطر الموصى به (بوصة)، الطول التقريبي (متر)، فرق الضغط (bar)، معدل التدفق (كجم/ث)، رقم رينولدز، تحذيرات وتوصيات", law: "ΔP = P_cond – P_evap، وحساب الطول بناءً على معادلات ديناميكا الموائع ثنائية الطور (Segmented) أو تقريبي باستخدام معامل الاحتكاك", description: "تقدير طول أنبوب الشعيرة المناسب بناءً على فرق الضغط والقدرة ونوع الفريون، مع وضع متقدم يحلل التدفق ثنائي الطور ويقدم نطاقات تشغيل آمنة." },
    { name: "مبخر / مكثف", input: "القدرة (HP/BTU/Watt)، نوع التطبيق (تكييف عادي/غرفة تبريد/غرفة تجميد)، الفريون، حرارة التبخير (°C)، حرارة التكثيف (°C)، سرعة الهواء (م/ث)، نوع الزعانف، أقطار الأنابيب (بوصة) مع خيار القطر التلقائي", output: "طول المبخر (م)، طول المكثف (م)، LMTD، معامل انتقال الحرارة الكلي U (W/m²·K)، سرعة الفريون (م/ث)، تدفق الهواء (CFM)، أبعاد الملف (سم)، عدد اللفات التقريبي، تحذيرات", law: "Q = U × A × LMTD، مع حساب h_air = 10 + 12 × v^0.8، و h_ref ثابتة (1200 للمبخر، 2000 للمكثف)، ومقاومة الأنبوب والزعانف", description: "تصميم أولي للمبخر والمكثف باستخدام طريقة LMTD ومعاملات انتقال حرارة حقيقية، مع وضع سريع تقديري ودعم اختيار القطر المناسب تلقائياً لتحقيق سرعة فريون مثالية." },
    { name: "حساس NTC", input: "نوع الحساس (10K/5K/15K/مخصص)، نوع المعادلة (Beta أو Steinhart-Hart)، إما المقاومة (Ω) أو درجة الحرارة (°C)، ومعاملات مخصصة إن لزم", output: "درجة الحرارة (°C) أو المقاومة (Ω) مع تشخيص قراءة الحساس (طبيعي/مرتفع/منخفض)", law: "Beta: 1/T = 1/T0 + (1/B) ln(R/R0) ، Steinhart-Hart: 1/T = A + B ln(R) + C (ln(R))³", description: "تحويل بين المقاومة ودرجة الحرارة للحساسات NTC من نوع 10K (B=3950)، 5K (B=3470)، 15K (B=3977) أو حساسات مخصصة مع دعم معادلة Beta أو Steinhart-Hart عالية الدقة." },
    { name: "حاسبة PT (الضغط - الحرارة)", input: "نوع الفريون، إما درجة الحرارة (°C) أو الضغط (PSI)", output: "ضغط التشبع (PSI) أو درجة حرارة التشبع (°C)", law: "استيفاء خطي (أو تكعيبي) من جداول الضغط والحرارة المدمجة (R22, R134a, R410A, R404A, R407C, R32, R290, R600a)", description: "حساب ضغط التشبع لغاز التبريد من درجة الحرارة أو العكس باستخدام جداول PT مدمكة ومحسنة لثمانية فريونات شائعة." },
    { name: "Superheat / Subcool", input: "نوع الحساب (Superheat أو Subcooling)، الفريون، نوع النظام (كابلري/TXV/إنفرتر)، الضغط (PSI)، درجة حرارة الخط المقاسة (°C)", output: "درجة حرارة التشبع (°C)، قيمة SH أو SC (°C)، تشخيص الحالة مع تحليل الأسباب والحلول المقترحة حسب نوع النظام", law: "SH = T_suction – T_sat ، SC = T_sat – T_liquid ، مع استخراج T_sat من جداول PT", description: "حساب الحرارة المحمصة (Superheat) أو التبريد تحت التبريد (Subcooling) لتشخيص شحن الفريون وأعطال النظام، مع دعم التشخيص الذكي والمتكامل حسب نوع أداة التمدد." },
    { name: "معدل تدفق الهواء (AHU)", input: "وضعان: (الطن، CFM/طن، SHR) أو (الحمل BTU/h، ΔT (°C)، SHR)", output: "معدل التدفق بـ CFM و m³/h، CFM/طن المقدرة، ونوع التطبيق", law: "CFM = طن × CFM_per_ton أو CFM = (الحمل × SHR) / (1.08 × ΔT_F)", description: "حساب معدل تدفق الهواء المطلوب لوحدة مناولة الهواء (AHU) حسب قاعدة 400 CFM/طن للراحة، أو من الحمل الحراري وفرق الحرارة مع مراعاة نسبة الحمل المحسوس (SHR)." },
    { name: "مقطع السلك الكهربائي", input: "التيار (A)، طول الكابل (م)، الجهد (V)، درجة الحرارة (°C)، طريقة التمديد (هواء/ماسورة/مدفون)، نسبة هبوط الجهد المسموحة (%)، نوع النظام (فاز واحد/ثلاثة)، مادة السلك (نحاس/ألمنيوم)", output: "المقطع المحسوب من هبوط الجهد (mm²)، المقطع المطلوب لتحمل التيار (Ampacity)، المقطع النهائي الموصى به (mm²)، هبوط الجهد الفعلي (V و%)، تحذيرات وتوصيات", law: "VD (1φ) = 2×L×I×ρ/A ، VD (3φ) = √3×L×I×ρ/A ، مع تصحيح درجة الحرارة وأخذ جداول Ampacity من NEC", description: "حساب مقطع السلك المناسب مع مراعاة هبوط الجهد وتحمل التيار (Ampacity) حسب NEC، واختيار أقرب مقطع قياسي للنحاس أو الألمنيوم مع تحذيرات ذكية." },
    { name: "قوانين الكهرباء", input: "قيمتان على الأقل من (P, V, I, R) ونوع النظام (فاز واحد/ثلاثة فاز)", output: "القيم المفقودة (P, V, I, R) مع توضيح القانون المستخدم", law: "قوانين أوم (V = I×R) وقدرة التيار المتردد (P = V×I×√3×PF للثلاثة فاز أو P = V×I×PF للفاز الواحد) بمعامل قدرة 0.8", description: "آلة حاسبة ذكية تكمل القيم الناقصة في دائرة كهربائية باستخدام قانون أوم وقانون القدرة، وتدعم الأنظمة أحادية وثلاثية الطور." },
    { name: "حساب المكثف الكهربائي", input: "وضعان: (حساب السعة من التيار) أو (حساب التيار من السعة)، الجهد (V)، التردد (50/60 Hz)، النظام (فاز واحد/ثلاثة)، معامل القدرة المستهدف، والتيار أو السعة حسب الوضع", output: "السعة (µF) أو التيار (A)، المفاعلة السعوية (Xc)، القدرة التفاعلية (kVAR)، والمعادلة المستخدمة مع توصيات", law: "C (µF) = (I × 10⁶) / (2πf × V) للفاز الواحد، وC = (I × 10⁶) / (2πf × V × √3) للثلاثة فاز", description: "حساب سعة مكثف التشغيل المناسب للمحركات أحادية أو ثلاثية الطور باستخدام التيار والجهد، أو حساب التيار من سعة معروفة، مع دعم التردد 50/60 هرتز وتحسين معامل القدرة." },
    { name: "تيار المحرك من الحصان", input: "القدرة (HP)، الجهد (V)، نوع الفاز (فاز واحد/ثلاثة فاز)", output: "التيار التقريبي (A) مع ذكر الكفاءة الافتراضية (0.9) ومعامل القدرة (0.85)", law: "I(1φ) = (HP × 746) / (V × η × PF) ، I(3φ) = (HP × 746) / (√3 × V × η × PF)", description: "تقدير التيار الكهربائي للمحرك بناءً على القدرة الحصانية والجهد ونوع الفاز، مع افتراض كفاءة 0.9 ومعامل قدرة 0.85 (قيم تقريبية للمحركات القياسية)." },
    { name: "توصيل المكثفات ", input: "وضعان: حساب التوصيل (توازي/توالي/مختلط) ، قيم المكثفات (µF)، عدد المكثفات، عدد الفروع والأعمدة للمختلط، السعة المطلوبة", output: "السعة المكافئة (µF) أو قائمة بالتركيبات المقترحة (مفرد، توازي، توالي، مختلط) مرتبة حسب الأفضلية", law: "C_parallel = Σ C_i ، C_series = 1 / Σ (1/C_i) ، والمختلط حسب الترتيب (توالي ثم توازي أو العكس)", description: "حساب السعة المكافئة لتوصيلات التوازي والتسلسل والمختلط" },
    { name: "توصيل المقاومات",  input: "وضعان: حساب التوصيل (توازي/توالي/مختلط)، قيم المقاومات (Ω)، عدد المقاومات، عدد الفروع والأعمدة للمختلط، المقاومة المطلوبة", output: "المقاومة المكافئة (Ω) أو قائمة بالتركيبات المقترحة (مفرد، توازي، توالي، مختلط) مرتبة حسب الأفضلية",  law: "R_series = Σ R_i ، R_parallel = 1 / Σ (1/R_i) ، والمختلط حسب الترتيب (توالي ثم توازي أو العكس)",  description: "حساب المقاومة المكافئة لتوصيلات التوالي والتوازي والمختلط"},
    { name: "تكلفة الطاقة الكهربائية", input: "طريقة الإدخال (اختيار جهاز من قائمة أو إدخال قدرة يدوي)، القدرة (W/kW/HP)، ساعات التشغيل (يومياً/أسبوعياً/شهرياً)، سعر الكهرباء (ثابت أو شرائح مصر)، فترة الحساب (يومي/شهري/سنوي)", output: "الاستهلاك اليومي/الشهري/السنوي (kWh)، التكلفة، تكلفة الساعة، البصمة الكربونية (كجم CO₂)، عدد الأشجار اللازمة للتعويض، ونصائح توفير الطاقة", law: "التكلفة = (القدرة kW × ساعات التشغيل × عدد الأيام) × سعر kWh، مع دعم شرائح الكهرباء المصرية", description: "حساب تكلفة استهلاك الكهرباء للجهاز بالجنيه المصري أو أي عملة، مع دعم أكثر من 50 جهازاً منزلياً وشرائح الكهرباء المصرية، وحساب البصمة الكربونية ونصائح الترشيد." },
    { name: "محول الوحدات الشامل", input: "الفئة (20+ فئة فيزيائية وكهربائية)، القيمة، وحدة المصدر، وحدة الهدف", output: "القيمة المحولة مع الوحدة بدقة 4 منازل عشرية", law: "معاملات تحويل دقيقة لكل فئة (طول، مساحة، حجم، كتلة، ضغط، طاقة، قدرة، حرارة، كهرباء، إلخ)", description: "تحويل الوحدات في جميع المجالات الفيزيائية والكهربائية والحرارية، مع دعم خاص لتحويل درجات الحرارة بين Celsius, Fahrenheit, Kelvin, Rankine." },
    { name: "بحث ضواغط التبريد (AI)", input: "موديل الضاغط و/أو صورة للوحة البيانات (رفع صورة)", output: "مواصفات فنية كاملة (الشركة، HP، الواط، الفريون، الجهد، نوع الضاغط، LRA، RLA، الإزاحة، نوع الزيت، الضغوط النموذجية، المكثفات، التطبيق الشائع، إلخ)", law: "الذكاء الاصطناعي Gemini API (نموذج Gemini 2.0 Flash أو ما تم اختياره في الإعدادات)", description: "استخدام Gemini للحصول على معلومات تقنية عن ضواغط التبريد مثل Copeland، Maneurop، Tecumseh، Embraco، وغيرها، مع دعم رفع صورة لوحة البيانات لاستخراج البيانات تلقائياً." },
    { name: "جدول ضغوط الفريونات المرجعي", input: "نوع الفريون (يتم اختياره من الجدول)", output: "ضغوط السحب، الطرد، والتوقف التقريبية (PSI) لثمانية فريونات (R22, R410A, R134a, R404A, R32, R407C, R290, R600a)", law: "جداول خبرة عملية مدمجة في التطبيق", description: "عرض جدول تفاعلي بضغوط التشغيل التقريبية لأشهر الفريونات في أنظمة التبريد والتكييف." },
    { name: "أطوال مواسير التبريد القصوى", input: "قدرة الضاغط بالحصان (HP) من 1 إلى 10", output: "أقصى طول للمواسير (م)، أقصى ارتفاع للوحدة الداخلية (م)، أقصى ارتفاع للوحدة الخارجية (م)", law: "مواصفات قياسية مبنية على جداول الخبرة والشركات المصنعة", description: "تحديد أقصى طول لمواسير التبريد وأقصى فرق ارتفاع مسموح به بين الوحدتين حسب قدرة النظام، لفئات من 1 HP إلى 10 HP." },
    { name: "أقطار مواسير النحاس", input: "القدرة بالحصان (من 1.5 إلى 7.5) أو الطن أو BTU", output: "قطر ماسورة الطرد (Liquid) والسحب (Suction) بالبوصة (1/4, 3/8, 1/2, 5/8, 3/4, 7/8)", law: "جداول هندسية من ممارسات التركيب الشائعة لمكيفات السبليت والتجاري الخفيف", description: "توصية بأقطار مواسير النحاس لخطي الطرد والسحب لقدرات تتراوح من 1.5 HP إلى 7.5 HP." },
    { name: "جدول أحمال الأسلاك (Ampacity)", input: "مقطع السلك (mm²) ونوع المادة (نحاس/ألمنيوم)", output: "التيار المسموح به (A) حسب جداول NEC", law: "جداول NEC القياسية للأسلاك النحاسية والألمنيوم عند درجة حرارة 30°C وطريقة التمديد في الهواء", description: "جدول بقدرة تحمل التيار (Ampacity) للأسلاك النحاسية والألمنيوم حسب المقطع العرضي من 1.5 mm² إلى 50 mm² وفقًا لمعايير NEC." },
    { name: "جدول مكثفات المحركات", input: "قدرة المحرك (واط أو كيلوواط) من 370 W إلى 2.2 KW", output: "قيمة مكثف التشغيل (µF) وقيمة مكثف البدء (µF) إن وجد", law: "جداول قياسية مستمدة من ورش الصيانة والخبرة العملية", description: "جدول تقريبي لقيم مكثفات التشغيل والبدء للمحركات أحادية الطور للمساعدة في الصيانة والاستبدال." },
    { name: "المساعد الذكي (AI)", input: "سؤال فني أو وصف عطل (نصي) مع إمكانية رفع صور", output: "إجابة تحليلية مقسمة إلى أسباب، فحص، وحلول، مع دعم Markdown والكود", law: "نموذج Gemini AI (2.0 Flash، 1.5 Pro، إلخ) مع محادثة كاملة ودعم السياق والصور", description: "مساعد متخصص في التبريد والتكييف يحلل الأعطال ويقترح خطوات الصيانة والحلول عبر الذكاء الاصطناعي، مع دعم المحادثات المتعددة وسجل الأسئلة." },
    { name: "شحنة الفريون الإضافية", input: "ثلاثة أوضاع: تقريبي (الشحنة الأساسية، الأطوال، الزيادة لكل متر)، دقيق (نوع الفريون، القطر، نوع النظام، درجة حرارة التكثيف، الأطوال، الشحنة الأساسية)، كامل (نوع الفريون، أقطار السائل والغاز، الأطوال، درجة حرارة التكثيف، هل الماسورة الغازية مليئة سائل؟، الشحنة الأساسية)", output: "الشحنة الكلية الموصى بها (جرام) مع تفصيل الشحنة الإضافية وتحذيرات", law: "التقريبي: الإجمالي = الأساسية + (الطول الإضافي × الجرام/م)؛ الدقيق: استخدام جداول حقيقية ومعامل تصحيح؛ الكامل: حساب حجم المواسير × الكثافة", description: "تقدير كمية الفريون المطلوبة عند زيادة طول المواسير عن الطول القياسي، مع ثلاثة أوضاع تتناسب مع دقة البيانات المتاحة، وتنبيهات ذكية للشحن الزائد أو الناقص." },
    { name: "هبوط الجهد في الكابلات", input: "التيار (A)، طول الكابل (م)، جهد المصدر (V)، مقطع السلك (mm²)، معامل القدرة (cosφ)، نوع النظام (فاز واحد/ثلاثة)، مادة السلك (نحاس/ألمنيوم)، الحد الأقصى المسموح (%)", output: "هبوط الجهد (V)، النسبة (%)، الحالة (مقبول/غير مقبول)، واقتراح مقطع أكبر إذا لزم الأمر", law: "VD (1φ) = 2 × L × I × ρ / A ، VD (3φ) = √3 × L × I × ρ / A ، مع تصحيح المقاومة لدرجة حرارة 70°C", description: "حساب هبوط الجهد في الكابل الكهربائي والتأكد من كفاءة التغذية، مع دعم معامل القدرة ومقارنة بالحد المسموح (2%، 3%، 5%)." },
    { name: "سرعة الهواء وتصميم المجاري", input: "وضعان: (حساب السرعة من الأبعاد أو حساب المقاس من السرعة)، معدل التدفق (CFM أو m³/h)، نوع المشروع (سكني/تجاري/صناعي)، نوع الهواء (Supply/Return/Exhaust)، شكل الدكت (مستطيل/دائري)، الأبعاد أو السرعة المستهدفة", output: "السرعة (م/ث وقدم/دقيقة)، المساحة (م²)، أبعاد مقترحة (مستطيل أو دائري)، تحذيرات الضوضاء وفقد الضغط، توصيات بالحجم المناسب", law: "V = Q / A ، مع حدود سرعة مثالية لكل تطبيق (سكني: 2.5-4 م/ث، تجاري: 4-6 م/ث، صناعي: 5-8 م/ث)", description: "تستخدم في تصميم مجاري الهواء (الدكتات) وضبط مخارج الهواء، مع حساب السرعة من التدفق والمساحة أو حساب المساحة المطلوبة لتحقيق سرعة معينة، مع تقديم توصيات حسب نوع المشروع." },
    { name: "تشخيص أعطال الضغوط والكهرباء", input: "الفريون، نوع أداة التمدد (كابلري/TXV)، ضغط السحب (PSI)، ضغط الطرد (PSI)، حرارة الجو (°C)، حرارة خط السحب (°C)، حرارة خط السائل (°C)، تيار الضاغط (A)، RLA (اختياري)", output: "تقرير تشخيصي كامل يتضمن: درجات حرارة التشبع، Superheat، Subcooling، فرق حرارة التكثيف، نسبة الضغط، التشخيص الرئيسي (نص)، الأسباب المحتملة، الإجراءات والحلول، وتشخيصات أخرى محتملة", law: "منطق خبرة مدمج مع جداول PT وتحليل نسبة الضغط، الحرارة المحمصة، التبريد تحت التبريد، فرق حرارة المكثف، التيار، مع قواعد لكل عطل (نقص شحن، زيادة شحن، انسداد، تلف ضاغط، إلخ)", description: "يساعد الفني في تشخيص أعطال نظام التبريد أو التكييف بناءً على قراءات الضغوط، الحرارة، التيار، ونوع أداة التمدد، مع اقتراح خطوات الإصلاح." },
    { name: "التهوية وتحديد سعة المراوح", input: "أبعاد المكان (طول، عرض، ارتفاع) أو الحجم المباشر، نوع المكان (سكني، مكتب، مطبخ، حمام، ورشة، مخزن، جراج...)، عدد مرات تغيير الهواء (ACH) تلقائي أو يدوي، معامل أمان (1.0-1.5)، معاملات متقدمة (طول الدكت، قطره، نوعه، عدد الأكواع، نوع الفلتر، درجة الحرارة المحيطة).", output: "معدل التدفق المطلوب (m³/h و CFM)، سعة المروحة بعد الأمان، الضغط الاستاتيكي الكلي (Pa)، القدرة التقريبية للمروحة (واط)، نوع المروحة الموصى به، تحذيرات وتوصيات لتحسين التصميم.", law: "Q (m³/h) = الحجم × ACH، مع تطبيق معامل الأمان على التدفق فقط، وحساب الفواقد (الاحتكاك، الأكواع، الفلتر) باستخدام معادلات دارسي-وايسباخ ومبادئ الميكانيكا.", description: "حساب متطلبات التهوية للمساحات المختلفة وتحديد سعة المروحة المناسبة، مع وضع سريع (ACH فقط) ووضع متقدم يأخذ في الاعتبار خسائر المجاري والأكواع والفلاتر، وحساب الضغط الاستاتيكي والقدرة، وتقديم توصيات بنوع المروحة." },
    { name: "المحفوظات", input: "لا يوجد (عرض الحسابات السابقة المخزنة محلياً)", output: "قائمة بجميع العمليات الحسابية المحفوظة (الاسم، التاريخ، البيانات، معرف الأداة) مع إمكانية نسخ كل نتيجة، حذف عنصر، تصدير كملف text أو حذف الكل", law: "تخزين محلي (localStorage) بسعة قصوى 100 عنصر", description: "عرض جميع العمليات الحسابية التي تم حفظها مسبقاً، مع إمكانية إدارة المحفوظات (نسخ، حذف، تصدير) لاستخدامها لاحقاً." }
];
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    tools.forEach(t => { html += `<div class="guide-card p-4 rounded-xl"><h4 class="font-black text-primary">${t.name}</h4><div class="text-xs space-y-1"><p><b>المدخلات:</b> ${t.input}</p><p><b>الناتج:</b> ${t.output}</p><p><b>القانون:</b> ${t.law}</p></div></div>`; });
    html += '</div>';
    const modal = document.getElementById('toolModal');
    document.getElementById('modalTitle').innerText = ' دليل الأدوات الشامل';
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('calculateBtn').style.display = 'none';
    document.getElementById('settingsToolHeaderBtn').style.display = 'none';
    document.getElementById('resultDisplay').classList.add('hidden');
    modal.style.display = 'block';
}

// دالة مساعدة لمسح النتيجة
function clearResult() {
    const resDiv = document.getElementById('resultDisplay');
    if (resDiv) {
        resDiv.classList.add('hidden');
        resDiv.innerHTML = '';
    }
}

// دالة ربط مستمعات التغيير لمسح النتيجة لأي أداة (محسنة: منع التكرار)
function bindClearResultOnChange(containerElement) {
    if (!containerElement) return;
    const inputs = containerElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // إزالة المستمعات القديمة أولاً لتجنب التكرار
        input.removeEventListener('change', clearResult);
        input.removeEventListener('input', clearResult);
        input.addEventListener('change', clearResult);
        input.addEventListener('input', clearResult);
    });
}

// ======================= الجزء الثاني: openTool وجميع الأدوات المحسنة =======================

//فى ملف tools.j

// ======================= الجزء الرابع: الدوال المساعدة وتحميل الصفحة =======================

// دوال الحساب المساعدة (محسنة)
function smartElectricCalc() {
    const p = parseFloat(document.getElementById('el_p')?.value);
    const v = parseFloat(document.getElementById('el_v')?.value);
    const i = parseFloat(document.getElementById('el_i')?.value);
    const r = parseFloat(document.getElementById('el_r')?.value);
    const phaseElem = document.querySelector('#modalBody .phase-option.selected');
    const consts = TOOL_CONSTANTS.elec_laws;
    const phaseFactor = (phaseElem && phaseElem.innerText.includes('ثلاثة')) ? consts.phaseFactorThree : consts.phaseFactorSingle;
    const pf = consts.powerFactor;
    let results = {};
    let count = [p, v, i, r].filter(x => !isNaN(x)).length;
    if (count < 2) { 
        showToast('أدخل قيمتين على الأقل (P, V, I, R)', 'warning');
        document.getElementById('resultDisplay').classList.add('hidden'); 
        return; 
    }
    
    // حساب القدرة (P)
    if (!isNaN(v) && !isNaN(i) && isNaN(p)) results['الواط (P)'] = (v * i * phaseFactor * pf).toFixed(2) + ' W';
    
    // حساب الجهد (V)
    if (!isNaN(i) && !isNaN(r) && isNaN(v)) results['الفولت (V)'] = (i * r * phaseFactor).toFixed(2) + ' V';
    if (!isNaN(p) && !isNaN(i) && isNaN(v)) results['الفولت (V)'] = (p / (i * phaseFactor * pf)).toFixed(2) + ' V';
    
    // حساب التيار (I)
    if (!isNaN(v) && !isNaN(r) && isNaN(i)) results['التيار (I)'] = (v / (r * phaseFactor)).toFixed(2) + ' A';
    if (!isNaN(p) && !isNaN(v) && isNaN(i)) results['التيار (I)'] = (p / (v * phaseFactor * pf)).toFixed(2) + ' A';
    
    // حساب المقاومة (R)
    if (!isNaN(v) && !isNaN(i) && isNaN(r)) results['المقاومة (R)'] = (v / (i * phaseFactor)).toFixed(2) + ' Ω';
    if (!isNaN(p) && !isNaN(v) && isNaN(r)) results['المقاومة (R)'] = ((v * v * phaseFactor * pf) / p).toFixed(2) + ' Ω';
    if (!isNaN(p) && !isNaN(i) && isNaN(r)) results['المقاومة (R)'] = (p / (i * i * phaseFactor * pf)).toFixed(2) + ' Ω';
    
    // حالات معقدة (P, R معطاة)
    if (!isNaN(p) && !isNaN(r) && isNaN(v) && isNaN(i)) {
        let calcV = Math.sqrt(p * r * phaseFactor / pf);
        results['الفولت (V)'] = calcV.toFixed(2) + ' V';
        results['التيار (I)'] = (p / (calcV * phaseFactor * pf)).toFixed(2) + ' A';
    }
    
    results['القانون المستخدم'] = 'أوم & القدرة (معامل قدرة ' + pf + ')';
    showFullRes('قوانين الكهرباء الذكية', results);
}

// دوال عرض المحفوظات (محسنة)
function renderSaved() {
    const resDiv = document.getElementById('resultDisplay');
    if (resDiv) resDiv.classList.add('hidden');
    
    const body = document.getElementById('modalBody');
    if (!body) {
        console.error('modalBody element not found');
        showToast('حدث خطأ في عرض المحفوظات', 'error');
        return;
    }
    
    // ✅ التأكد من وجود state وسلامة saved
    if (!state) {
        console.error('state is undefined in renderSaved');
        return;
    }
    if (!Array.isArray(state.saved)) {
        state.saved = [];   // فقط أعد تعيين saved، وليس state كله
    }
    
    if (state.saved.length === 0) {
        body.innerHTML = '<div class="text-center py-10 text-gray-500"><i class="fas fa-folder-open text-4xl mb-3"></i><p class="font-bold">لا توجد محفوظات</p><p class="text-sm">قم بحساب أي أداة واضغط على زر "حفظ"</p></div>';
        return;
    }


    let   html = `
    <div class="flex gap-3 mb-4 items-center">
    
    <button id="exportSavedBtn"
        class="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 rounded-xl text-sm flex items-center justify-center gap-2">
        <i class="fas fa-download"></i> تصدير
    </button>


    <button id="clearAllSavedBtn"
        class="flex-1 bg-red-600 hover:bg-red-700 text-white h-8 rounded-xl text-sm flex items-center justify-center gap-2">
        <i class="fas fa-trash-alt"></i> حذف الكل
    </button>

</div>
    <div id="savesList" class="space-y-3 max-h-[60vh] overflow-y-auto"></div>
`;
    body.innerHTML = html;

    const refreshList = () => {
        const listDiv = document.getElementById('savesList');
        if (!listDiv) return;
        if (state.saved.length === 0) {
            listDiv.innerHTML = '<div class="text-center py-8 text-gray-500">لا توجد محفوظات</div>';
            return;
        }
        
        // حفظ حالة التوسع لكل عنصر (مبدئياً كلها مطوية)
        if (!window._expandedStates) window._expandedStates = {};
        
        listDiv.innerHTML = state.saved.map(item => {
            const isExpanded = window._expandedStates[item.id] || false;
            const entries = Object.entries(item.data);
            const hasMore = entries.length > 5;
            const visibleEntries = isExpanded ? entries : entries.slice(0, 5);
            
            const entriesHtml = visibleEntries.map(([k, v]) => `
                <div class="flex justify-between gap-2 border-b pb-1">
                    <span class="font-semibold">${escapeHtml(k)}:</span>
                    <span class="text-gray-700">${escapeHtml(String(v))}</span>
                </div>
            `).join('');
            
            const moreButton = (!isExpanded && hasMore) 
                ? `<div class="text-blue-500 text-xs mt-1 cursor-pointer hover:underline more-btn" data-id="${item.id}" style="display:inline-block;">... المزيد <i class="fas fa-chevron-down"></i></div>`
                : (isExpanded && hasMore ? `<div class="text-blue-500 text-xs mt-1 cursor-pointer hover:underline less-btn" data-id="${item.id}" style="display:inline-block;">... عرض أقل <i class="fas fa-chevron-up"></i></div>` : '');
            
            return `
                <div class="border rounded-lg p-3 bg-white shadow-sm hover:shadow transition" data-id="${item.id}">
                    <div class="flex justify-between items-start gap-2 flex-wrap">
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-primary flex items-center gap-2 flex-wrap">
                                <span> ${escapeHtml(item.name)}</span>
                                <span class="text-xs bg-gray-100 px-2 py-0.5 rounded-full">${escapeHtml(item.toolId)}</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1"> ${escapeHtml(item.date)}</div>
                            <div class="mt-2 text-sm space-y-1">
                                ${entriesHtml}
                                ${moreButton}
                            </div>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button class="copy-single text-blue-600 hover:text-blue-800 p-2" data-id="${item.id}" title="نسخ"><i class="fas fa-copy"></i></button>
                            <button class="delete-single text-red-600 hover:text-red-800 p-2" data-id="${item.id}" title="حذف"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // ربط أزرار النسخ والحذف
        document.querySelectorAll('.copy-single').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const item = state.saved.find(s => s.id === id);
                if (item) copyRes(item.data);
            };
        });
        
        document.querySelectorAll('.delete-single').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('هل تريد حذف هذه النتيجة؟')) {
                    state.saved = state.saved.filter(s => s.id !== id);
                    localStorage.setItem('hvac_complete_saved', JSON.stringify(state.saved));
                    updateStats();
                    renderSaved();
                }
            };
        });
        
        // ربط أزرار "المزيد" و "عرض أقل"
        document.querySelectorAll('.more-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                window._expandedStates[id] = true;
                renderSaved(); // إعادة رسم القائمة مع الحفاظ على حالة التوسع
            };
        });
        
        document.querySelectorAll('.less-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                window._expandedStates[id] = false;
                renderSaved();
            };
        });
    };

    refreshList();

    // ربط الأزرار العامة
    document.getElementById('exportSavedBtn')?.addEventListener('click', exportSaved);
    document.getElementById('clearAllSavedBtn')?.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من حذف جميع المحفوظات؟')) {
            state.saved = [];
            localStorage.setItem('hvac_complete_saved', '[]');
            updateStats();
            renderSaved();
            showToast('تم حذف الكل', 'success');
        }
    });
    
    
}
// دوال الإعدادات الرئيسية (محسنة)
function openMainSettings() {
    let html = `<div class="max-h-[70vh] overflow-y-auto px-2">
        <div class="settings-group mt-2">
            <label class="font-black"> مفتاح Gemini API (للذكاء الاصطناعي)</label>
            <input type="password" id="mainGeminiKey" value="${state.geminiApiKey}" class="font-bold">
            <div class="settings-field mt-4">
                <label class="font-black"> نموذج Gemini المستخدم</label>
                <select id="geminiModelSelect">
                    <option value="gemini-2.5-flash" ${state.selectedGeminiModel === 'gemini-2.5-flash' ? 'selected' : ''}> Gemini 2.5 Flash (مستحسن)</option>
                    <option value="gemini-1.5-flash" ${state.selectedGeminiModel === 'gemini-1.5-flash' ? 'selected' : ''}> Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro" ${state.selectedGeminiModel === 'gemini-1.5-pro' ? 'selected' : ''}>Gemini 1.5 Pro </option>
                    <option value="gemini-2.0-flash" ${state.selectedGeminiModel === 'gemini-2.0-flash' ? 'selected' : ''}> Gemini 2.0 Flash</option>
                </select>
            </div>
            <div id="keyStatus" class="text-xs mt-1 font-black"></div>
            <div class="instruction-box p-3 rounded-lg mt-2 text-xs">
                <p class="font-black mb-1">تعليمات الحصول على المفتاح:</p>
                <ol class="list-decimal pr-4 space-y-1">
                    <li>ادخل <a href="https://aistudio.google.com/" target="_blank" class="underline font-black text-blue-800">Google AI Studio</a></li>
                    <li>سجّل الدخول بحساب Google الخاص بك</li>
                    <li>أنشئ <strong>API Key</strong> جديدًا وانسخه</li>
                    <li>الصق المفتاح في الخانة أعلاه ثم اضغط على حفظ</li>
                </ol>
                <div class="text-gray-900 space-y-2">
                    <p> <b>خصوصية المفتاح:</b></p>
                    <p>يتم حفظ مفتاح <b>Gemini API</b> على جهازك فقط باستخدام <b>localStorage</b> ولا يتم إرساله إلى أي سيرفر خارجي</p>
                    <p class="font-black"> لا تشارك مفتاح API مع أي شخص</p>
                </div>
            </div>
        </div>
        <div class="flex flex-col gap-2 mt-3">
            <button id="saveMainSettingsBtn" class="primary-btn text-sm py-2"> حفظ الإعدادات</button>
            <button id="resetDataBtn" class="close-btn text-sm py-2" style="background:#dc2626;"> حذف جميع البيانات </button>                      
        </div>
    </div>`;

    const modal = document.getElementById('toolModal');
    document.getElementById('modalTitle').innerText = ' الإعدادات الرئيسية للبرنامج';
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('calculateBtn').style.display = 'none';
    document.getElementById('settingsToolHeaderBtn').style.display = 'none';
    document.getElementById('resultDisplay').classList.add('hidden');
    modal.style.display = 'block';

    document.getElementById('saveMainSettingsBtn').onclick = async () => {
        const newKey = document.getElementById('mainGeminiKey').value;
        const statusDiv = document.getElementById('keyStatus');
        const newModel = document.getElementById('geminiModelSelect').value;
        
        if (newModel) { 
            state.selectedGeminiModel = newModel; 
            localStorage.setItem('selected_gemini_model', newModel);
            // ✅ تحديث aiManager
            if (typeof aiManager !== 'undefined' && aiManager) {
                aiManager.selectedModel = newModel;
            }
        }
        
        if (newKey && newKey !== state.geminiApiKey) {
            statusDiv.innerHTML = '<span class="text-blue-600"><i class="fas fa-spinner fa-spin"></i> جاري التحقق...</span>';
            const isValid = await validateApiKey(newKey);
            if (!isValid) { 
                statusDiv.innerHTML = '<span class="text-red-700 font-black"> مفتاح API غير صحيح.</span>'; 
                return; 
            } else {
                statusDiv.innerHTML = '<span class="text-green-700 font-black">مفتاح صالح</span>';
            }
        }
        
        if (newKey) state.geminiApiKey = newKey;
        localStorage.setItem('gemini_api_key', newKey || '');
        // ✅ تحديث aiManager
        if (typeof aiManager !== 'undefined' && aiManager) {
            aiManager.apiKey = newKey;
        }
        showToast(' تم حفظ الإعدادات العامة', 'success');
        closeModal();
    };
    
    
document.getElementById('resetDataBtn').onclick = () => {
    if (confirm('هل أنت متأكد؟ سيتم حذف جميع الإعدادات والبيانات عدا المحفوظات وسجل الدردشة')) {
        // قائمة المفاتيح المراد الاحتفاظ بها
        const keepKeys = ['hvac_complete_saved', 'ai_conversations', 'ai_history', 'activeConvId'];
        
        // حفظ القيم المراد الاحتفاظ بها
        const keepData = {};
        keepKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) keepData[key] = value;
        });
        
        // مسح localStorage بالكامل
        localStorage.clear();
        
        // استعادة القيم المحفوظة
        Object.entries(keepData).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
        
        // إعادة تحميل state من localStorage الجديد
        state.saved = safeParse(localStorage.getItem('hvac_complete_saved'), []);
        state.aiHistory = safeParse(localStorage.getItem('ai_history'), []);
        state.geminiApiKey = '';  // تم مسح المفتاح
        state.selectedGeminiModel = 'gemini-2.0-flash';  // القيمة الافتراضية
        
        // تحديث aiManager إذا كان موجوداً
        if (aiManager) {
            aiManager.apiKey = '';
            aiManager.selectedModel = state.selectedGeminiModel;
        }
        
        updateStats();
        showToast('تم حذف جميع الإعدادات مع الاحتفاظ بالمحفوظات وسجل الدردشة', 'success');
        closeModal();
    }
};
}

async function validateApiKey(key) {
    if (!key || key.trim() === '') return false;
    const trimmedKey = key.trim();
    
    // قائمة النماذج التي يمكن تجربتها (الأكثر توافقاً أولاً)
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    
    for (const model of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "test" }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 5 },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            });
            
            const data = await response.json();
            
            // تحقق من نجاح HTTP
            if (!response.ok) {
                let errorMsg = data.error?.message || `HTTP ${response.status}`;
                console.warn(`❌ النموذج ${model} فشل: ${errorMsg}`);
                continue; // جرب النموذج التالي
            }
            
            // إذا وصلنا هنا ولم يكن هناك error، المفتاح صالح
            if (!data.error) {
                console.log(`✅ مفتاح API صالح للنموذج ${model}`);
                return true;
            }
        } catch (err) {
            console.warn(`❌ استثناء مع النموذج ${model}:`, err.message);
            // استمر للتجربة التالية
        }
    }
    
    // إذا فشلت كل المحاولات
    const errorDiv = document.getElementById('keyStatus');
    if (errorDiv) {
        errorDiv.innerHTML = '<span class="text-red-700">❌ المفتاح غير صالح أو لا يملك صلاحية الوصول. تأكد من:</span><ul class="text-xs list-disc pr-5"><li>تفعيل الفوترة (حتى لو حساب مجاني) في <a href="https://console.cloud.google.com/billing" target="_blank">Google Cloud Billing</a></li><li>تمكين Gemini API في <a href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" target="_blank">Library</a></li><li>استخدام مفتاح API صحيح (بدون مسافات)</li><li>تجربة نموذج مختلف مثل gemini-1.5-flash</li></ul>';
    }
    return false;
}
function showApiKeyWarning() {
    if (localStorage.getItem("hideGeminiWarning") === "true") return;
    const modal = document.getElementById('toolModal');
    document.getElementById('modalTitle').innerText = ' تنبيه: نظام الذكاء الاصطناعي';
    document.getElementById('modalBody').innerHTML = `
        <div class="p-4 instruction-box rounded-lg mb-4">
            <p class="font-bold mb-2">لم يتم العثور على مفتاح Gemini API!</p>
            <p class="text-sm font-bold">لن تتمكن من استخدام الميزات التالية بدون المفتاح:</p>
            <ul class="list-disc pr-5 text-sm mt-2 font-bold">
                <li>المساعد الذكي (تحليل الأعطال والاستشارات)</li>
                <li>البحث المتطور عن معلومات الضواغط</li>
            </ul>
        </div>
        <div class="text-sm space-y-3 font-bold">
            <hr class="border-gray-400">
            <p class="font-black text-primary"> خطوات تفعيل الذكاء الاصطناعي:</p>
            <ol class="list-decimal pr-5 space-y-2 text-gray-900">
                <li>الدخول إلى موقع <a href="https://aistudio.google.com/" target="_blank" class="text-blue-700 underline font-black">Google AI Studio</a></li>
                <li>تسجيل الدخول بحساب Google الخاص بك</li>
                <li>إنشاء <b>API Key</b> جديد ونسخه</li>
                <li>فتح <b>الإعدادات</b> في هذا التطبيق</li>
                <li>لصق المفتاح في خانة <b>Gemini API</b> ثم الضغط على <b>حفظ</b></li>
            </ol>
            <div class="text-gray-900 space-y-2">
                <p> <b>خصوصية المفتاح:</b></p>
                <p>يتم حفظ مفتاح <b>Gemini API</b> على جهازك فقط باستخدام <b>localStorage</b> ولا يتم إرساله إلى أي سيرفر خارجي</p>
                <ul class="list-disc pr-5">
                    <li>احذف المفتاح من البرنامج</li>
                    <li>احذف المفتاح من صفحة مفاتيح API في Google AI Studio</li>
                    <li>تأكد من أن جهازك غير مخترق</li>
                </ul>
                <p class="font-black"> لا تشارك مفتاح API مع أي شخص</p>
            </div>
        </div>
        <div class="mt-4 flex items-center  gap-3 text-sm font-bold">
            <input type="checkbox" id="dontShowAgain" class="w-5 h-5 accent-blue-600 inpchk cursor-pointer">
            <label for="dontShowAgain" class="cursor-pointer">لا تظهر هذه الرسالة مرة أخرى</label>
</div>
    `;
    document.getElementById('calculateBtn').style.display = 'none';
    document.getElementById('settingsToolHeaderBtn').style.display = 'none';
    document.getElementById('resultDisplay').classList.add('hidden');
    modal.style.display = 'block';
    setTimeout(() => {
        const checkbox = document.getElementById("dontShowAgain");
        if (checkbox) {
            checkbox.addEventListener("change", function () { 
                if (this.checked) localStorage.setItem("hideGeminiWarning", "true"); 
                else localStorage.removeItem("hideGeminiWarning"); 
            });
        }
    }, 100);
}

function saveCurrent(name, data, toolId = currentToolId) {
    try {
        if (!data || Object.keys(data).length === 0) {
            showToast('لا توجد بيانات للحفظ', 'warning');
            return null;
        }

        // 1. تحويل البيانات إلى كائن آمن للـ JSON
        const safeData = {};
        for (let [key, value] of Object.entries(data)) {
            // تجاهل القيم غير الصالحة
            if (value === undefined || typeof value === 'function') continue;

            // تحويل الكائنات المتداخلة إلى نص (لتجنب المراجع الدائرية)
            if (value && typeof value === 'object') {
                try {
                    safeData[key] = JSON.stringify(value);
                } catch (e) {
                    safeData[key] = String(value);
                }
            } else {
                safeData[key] = value;
            }
        }

        // 2. التحقق من سلامة state.saved
        if (!Array.isArray(state.saved)) {
            state.saved = [];
        }

        // 3. إضافة العنصر الجديد
        const id = Date.now() + Math.floor(Math.random() * 10000);
        const savedItem = {
            id: id,
            name: name,
            data: safeData,
            date: new Date().toLocaleString('ar-EG'),
            toolId: toolId || 'unknown'
        };
        state.saved.unshift(savedItem);
        if (state.saved.length > 100) state.saved.pop();

        // 4. حفظ في localStorage مع معالجة خطأ السعة
        try {
            localStorage.setItem('hvac_complete_saved', JSON.stringify(state.saved));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                // حذف أقدم 10 محفوظات ومحاولة مرة أخرى
                state.saved = state.saved.slice(0, 90);
                localStorage.setItem('hvac_complete_saved', JSON.stringify(state.saved));
                showToast(' تم حذف أقدم المحفوظات لتوفير مساحة', 'warning');
            } else {
                throw e;
            }
        }

        updateStats();
        showToast(' تم حفظ النتيجة', 'success');
        return id;

    } catch (error) {
        console.error(' فشل الحفظ:', error);
        let msg = ' فشل حفظ النتيجة';
        if (error.name === 'QuotaExceededError') {
            msg = ' المساحة ممتلئة، احذف بعض المحفوظات يدوياً';
        } else if (error.message.includes('circular')) {
            msg = 'بيانات معقدة جداً للحفظ، حاول حفظها كنص يدوياً';
        }
        showToast(msg, 'error');
        return null;
    }
}
function exportSaved() {
    if (!state.saved.length) {
        showToast('لا توجد محفوظات لتصديرها', 'warning');
        return;
    }

    const now = new Date();
    let content = `تصدير المحفوظات - تطبيق أدوات التبريد\n`;
    content += `تاريخ التصدير: ${now.toLocaleString('ar-EG')}\n`;
    content += `عدد العناصر: ${state.saved.length}\n`;
    content += `${'='.repeat(60)}\n\n`;

    state.saved.forEach((item, idx) => {
        content += `[${idx + 1}] ${item.name}\n`;
        content += `المعرف: ${item.id}\n`;
        content += `التاريخ: ${item.date}\n`;
        content += `الأداة: ${item.toolId}\n`;
        content += `البيانات:\n`;
        Object.entries(item.data).forEach(([key, val]) => {
            content += `  - ${key}: ${val}\n`;
        });
        content += `\n${'-'.repeat(40)}\n\n`;
    });

    // إضافة الجملة المطلوبة في نهاية الملف
    content += `\n${'='.repeat(60)}\n`;
    content += `اللهم صلِّ على سيدنا محمد ﷺ\n`;
    content += `إعداد وتطوير: م/ سيف الدين محسن ريحان\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hvac_saved_${now.toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(' تم تصدير المحفوظات كملف نصي', 'success');
}



function showUpdateNotification() {
    const div = document.createElement("div");
    div.innerHTML = `<div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2563eb;color:white;padding:15px;border-radius:10px;z-index:9999;font-weight:bold;"> يوجد تحديث جديد<button onclick="location.reload()" style="margin-right:10px;background:white;color:black;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">تحديث</button></div>`;
    document.body.appendChild(div);
}

// دوال حفظ سجل الذكاء الاصطناعي (محسنة)
function saveToAiHistory(question, answer) {
    if (!state.aiHistory) state.aiHistory = [];
    // إزالة الأقدم إذا تجاوز 50
    while (state.aiHistory.length >= 50) state.aiHistory.pop();
    state.aiHistory.unshift({ 
        id: Date.now(), 
        question: question, 
        answer: answer, 
        date: new Date().toLocaleString('ar-EG') 
    });
    localStorage.setItem('ai_history', JSON.stringify(state.aiHistory));
}


function saveAiResponse(question, answer) {
    saveToAiHistory(question, answer);
    showToast(' تم حفظ الرد في سجل الذكاء الاصطناعي', 'success');
}
/**
 * حساب درجة حرارة التشبع من الضغط لنوع فريون معين
 * @param {string} refrigerant - رمز الفريون (مثل 'R22', 'R410A')
 * @param {number} pressurePSI - الضغط بوحدة PSI
 * @returns {number} درجة الحرارة المئوية (°C) أو NaN إذا كانت القيم خارج النطاق أو البيانات غير موجودة
 */
function getTempFromPressure(refrigerant, pressurePSI) {
    // 1. التحقق من وجود بيانات الفريون
    const data = refPTData[refrigerant];
    if (!data) {
        console.warn(`لا توجد بيانات للفريون: ${refrigerant}`);
        return NaN;
    }

    const temps = data.temps;
    const pressures = data.pressures;

    // 2. التحقق من صحة الضغط المدخل
    if (!isFinite(pressurePSI) || pressurePSI <= 0) {
        console.warn(` ضغط غير صالح: ${pressurePSI}`);
        return NaN;
    }

    // 3. التعامل مع الحالات الحدودية (أقل من أقل ضغط أو أكبر من أكبر ضغط)
    if (pressurePSI <= pressures[0]) {
        console.warn(` الضغط (${pressurePSI} PSI) أقل من أقل قيمة مسجلة (${pressures[0]} PSI) - إرجاع أدنى حرارة`);
        return temps[0];
    }
    if (pressurePSI >= pressures[pressures.length - 1]) {
        console.warn(` الضغط (${pressurePSI} PSI) أكبر من أعلى قيمة مسجلة (${pressures[pressures.length - 1]} PSI) - إرجاع أعلى حرارة`);
        return temps[temps.length - 1];
    }

    // 4. البحث عن تطابق تام (مع تسامح 0.001)
    for (let i = 0; i < pressures.length; i++) {
        if (Math.abs(pressurePSI - pressures[i]) < 0.001) {
            return temps[i];
        }
    }

    // 5. الاستيفاء الخطي بين نقطتين متجاورتين باستخدام دالة interpolate العامة
    for (let i = 0; i < pressures.length - 1; i++) {
        if (pressurePSI >= pressures[i] && pressurePSI <= pressures[i + 1]) {
            // استخدام دالة interpolate الموجودة مسبقاً في الكود
            // تأكد من أن الدالة معرفة قبل هذه الدالة (يفضل وضعها في نطاق عام)
            if (typeof interpolate === 'function') {
                return interpolate(pressurePSI, pressures[i], temps[i], pressures[i + 1], temps[i + 1]);
            } else {
                // في حال عدم وجود interpolate، نقوم بالحساب مباشرة (نسخة احتياطية)
                const t = temps[i] + (pressurePSI - pressures[i]) * (temps[i + 1] - temps[i]) / (pressures[i + 1] - pressures[i]);
                return isFinite(t) ? t : NaN;
            }
        }
    }

    // 6. في حالة عدم العثور على فاصل (لا يجب أن يحدث)
    console.warn(` لم يتم العثور على فاصل للضغط ${pressurePSI} في بيانات ${refrigerant}`);
    return NaN;
}

function smartDiagnosis(sh, sc) {
    // لا توجد بيانات كافية
    if (sh == null && sc == null) return 'لا توجد قراءات كافية للتشخيص';

    // فحص القيم السالبة (أخطاء قياس)
    if (sh != null && sh < 0) return ' Superheat سالب → رجوع سائل خطر على الكمبروسر';
    if (sc != null && sc < 0) return 'Subcooling سالب → خطأ في القياس أو الضغط';

    // الحالة المثالية (تعمل أولاً لأنها الأهم)
    if (sh != null && sc != null) {
        if (sh >= 5 && sh <= 12 && sc >= 5 && sc <= 10)
            return ' النظام يعمل بكفاءة';
    }

    // باقي التشخيصات (تستمر كما هي)
    if (sh != null && sc != null) {
        if (sh > 15 && sc < 5) return 'نقص فريون (مؤكد تقريبًا)';
        if (sh < 5 && sc > 15) return ' زيادة شحن (خطر رجوع سائل)';
        if (sh >= 10 && sc > 15) return 'ضعف في المكثف أو مروحة ضعيفة';
        if (sh < 5 && sc < 5) return 'TXV مفتوح أو قياس غير دقيق';
    }

    // تشخيص فردي (عند توفر قيمة واحدة فقط)
    if (sh != null) {
        if (sh > 15) return ' احتمال نقص فريون أو ضعف هواء';
        if (sh < 5) return ' احتمال زيادة شحن أو TXV مفتوح';
    }
    if (sc != null) {
        if (sc < 3) return ' احتمال نقص شحن';
        if (sc > 15) return ' احتمال زيادة شحن أو ضعف تبريد المكثف';
    }

    return ' الحالة غير واضحة - تحقق من القياسات';
}
function showHistoryModal() {
    const history = state.aiHistory || [];
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.style.backdropFilter = 'blur(3px)';
    let html = `<div class="bg-white rounded-xl w-11/12 max-w-2xl h-5/6 flex flex-col shadow-2xl">
        <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-xl font-bold text-blue-700"> سجل أسئلة المساعد الذكي</h3>
            <button class="close-history text-gray-600 hover:text-red-600 text-2xl">&times;</button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-3" id="historyList">`;
    if (history.length === 0) {
        html += '<p class="text-center text-gray-500 py-10">لا توجد أسئلة سابقة</p>';
    } else {
        history.forEach(item => {
            //  حماية ضد null أو undefined
            let questionText = '';
            if (item.question && typeof item.question === 'string') {
                questionText = item.question;
            } else {
                questionText = 'سؤال غير معروف';
            }
            const preview = questionText.length > 70 ? questionText.substring(0,70) + '...' : questionText;
            html += `<div class="history-item border rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition" data-id="${item.id}">
                <div class="font-bold text-primary"> ${escapeHtml(preview)}</div>
                <div class="text-xs text-gray-500 mt-1"> ${escapeHtml(item.date || 'تاريخ غير معروف')}</div>
            </div>`;
        });
    }
    html += `</div></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    modal.querySelector('.close-history').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.querySelectorAll('.history-item').forEach(el => {
        el.onclick = () => {
            const id = parseInt(el.dataset.id);
            const found = history.find(h => h.id === id);
            if (found) {
                const aiResultDiv = document.getElementById('aiResult');
                if (aiResultDiv) {
                    // تأمين المرور للـ formatGeminiResponse
                    const answer = found.answer || '';
                    const question = found.question || '';
                    aiResultDiv.innerHTML = formatGeminiResponse(answer, question);
                }
                modal.remove();
                showToast('تم تحميل الإجابة المخزنة', 'success');
            }
        };
    });
}

window.copyGeminiResponse = function() {
    const responseDiv = document.querySelector('.gemini-response-card .prose');
    if (responseDiv) {
        navigator.clipboard.writeText(responseDiv.innerText);
        showToast(' تم نسخ الرد بنجاح', 'success');
    } else {
        showToast('لا يوجد رد لنسخه', 'warning');
    }
};

// تعريف ToolHelpers بشكل نهائي
if (!window.ToolHelpers) window.ToolHelpers = {};
Object.assign(window.ToolHelpers, {
    setPhase: function(btn, phase) { 
        document.querySelectorAll('#modalBody .phase-option').forEach(b => b.classList.remove('selected')); 
        btn.classList.add('selected'); 
        clearResult(); 
    },
    selectAllSaves: function() { 
        document.querySelectorAll('.save-checkbox').forEach(c => c.checked = true); 
    },
    deleteAllSaves: function() { 
        if (confirm('حذف الكل؟')) { 
            state.saved = []; 
            localStorage.setItem('hvac_complete_saved', '[]'); 
            updateStats(); 
            renderSaved(); 
        } 
    },
    deleteSave: function(id) { 
        state.saved = state.saved.filter(s => s.id !== id); 
        localStorage.setItem('hvac_complete_saved', JSON.stringify(state.saved)); 
        updateStats(); 
        renderSaved(); 
    },
    ntcToggleCustom: function() { 
        const type = document.getElementById('ntc_type'); 
        const box = document.getElementById('ntc_custom'); 
        if (!type || !box) return; 
        if (type.value === 'custom') { 
            box.style.display = 'block'; 
        } else { 
            box.style.display = 'none'; 
        } 
        clearResult(); 
    },
    setWirePhase: function(btn, phase) { 
        document.querySelectorAll('#modalBody .phase-option[data-wire-phase]').forEach(b => b.classList.remove('selected')); 
        btn.classList.add('selected'); 
        clearResult(); 
    },
    setWireMaterial: function(btn, mat) { 
        document.querySelectorAll('#modalBody .phase-option[data-wire-material]').forEach(b => b.classList.remove('selected')); 
        btn.classList.add('selected'); 
        clearResult(); 
    },
    setVdPhase: function(btn, phase) { 
        document.querySelectorAll('#modalBody .phase-option[data-vd-phase]').forEach(b => b.classList.remove('selected')); 
        btn.classList.add('selected'); 
        clearResult(); 
    },
    setVdMaterial: function(btn, mat) { 
        document.querySelectorAll('#modalBody .phase-option[data-vd-material]').forEach(b => b.classList.remove('selected')); 
        btn.classList.add('selected'); 
        clearResult(); 
    },
    setMotorPhase: function(btn, phase) {
        document.querySelectorAll('#modalBody .phase-option[data-ma-phase]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        clearResult();
    }
});

// دالة calcPT (تم الاحتفاظ بها للتوافق، ولكنها غير مستخدمة في openTool حالياً)
function calcPT() {
    const mode = document.getElementById('pt_mode').value;
    const ref = document.getElementById('pt_ref').value;
    const data = refPTData[ref];
    if (!data) { showToast('لا توجد بيانات للفريون', 'warning'); return; }

    if (mode === 't2p') {
        const t = parseFloat(document.getElementById('pt_t').value);
        if (isNaN(t)) { showToast('أدخل درجة حرارة صحيحة', 'warning'); return; }
        const p = interpolatePressure(data, t);
        showFullRes('الضغط مقابل الحرارة', {
            'الفريون': ref,
            'درجة الحرارة': t + ' °C',
            'ضغط التشبع': p.toFixed(1) + ' PSI'
        });
    } else {
        const p = parseFloat(document.getElementById('pt_p').value);
        if (isNaN(p)) { showToast('أدخل ضغط صحيح', 'warning'); return; }
        const t = interpolateTemp(data, p);
        showFullRes('الحرارة مقابل الضغط', {
            'الفريون': ref,
            'الضغط': p + ' PSI',
            'درجة الحرارة': t.toFixed(1) + ' °C'
        });
    }
}



window.saveCurrent = saveCurrent;
// ======================= مستمع تحميل الصفحة والإغلاق النهائي =======================
window.addEventListener("load", () => {
    state.saved = safeParse(localStorage.getItem('hvac_complete_saved'), []);
    state.aiHistory = safeParse(localStorage.getItem('ai_history'), []);
    updateStats();
    if (!state.geminiApiKey || state.geminiApiKey.trim() === "") { 
        showApiKeyWarning(); 
    }
    
    // تحقق من وجود عنصر installBtn قبل التعامل معه
    const installBtnElement = document.getElementById('installBtn');
    if (installBtnElement) {
        // تم التعامل مع beforeinstallprompt في بداية الكود
        // نضمن فقط أن الزر مخفي افتراضياً
        installBtnElement.style.display = 'none';
    }

});