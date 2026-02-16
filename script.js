/* =============================================
   DARK VIP SYSTEM - LOGIC CORE
   Separated for Security and Performance
   ============================================= */

// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyCXmlxcZ79hkycqnD_ZIuDBLtOI1zCHRaw",
    authDomain: "dark-vip-prediction.firebaseapp.com",
    databaseURL: "https://dark-vip-prediction-default-rtdb.firebaseio.com",
    projectId: "dark-vip-prediction",
    storageBucket: "dark-vip-prediction.firebasestorage.app",
    messagingSenderId: "682755216649",
    appId: "1:682755216649:web:b54cf89a4537db1e29afd8"
};

try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.database();
} catch (e) {
    console.error("Firebase Error:", e);
}

// 2. GLOBAL VARIABLES
let selectedGame = null;
let isVIPUnlocked = false;

// 3. PAGE NAVIGATION
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    const p = document.getElementById(pageId);
    p.style.display = 'block';
    setTimeout(() => p.classList.add('active'), 10);
    window.scrollTo(0, 0);
}

// 4. UTILITIES (Sound & Vibrate)
function vibrate(ms) { 
    if (navigator.vibrate) navigator.vibrate(ms); 
}

function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 740;
        gain.gain.value = .08;
        osc.start();
        setTimeout(() => {
            osc.stop();
            ctx.close();
        }, 130);
    } catch (e) {}
}

function toastMsg(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
}

// 5. GAME SELECTION LOGIC
const selectGameBtn = document.getElementById('selectGameBtn');
const gameModal = document.getElementById('gameModal');

if(selectGameBtn) {
    selectGameBtn.onclick = () => { gameModal.style.display = 'flex'; };
}

window.selectGame = function(gameName) {
    selectedGame = gameName;
    document.getElementById('selectedGameText').innerHTML = 
        `<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Selected: <strong>${gameName}</strong>`;
    gameModal.style.display = 'none';
}

const startNowBtn = document.getElementById('startNowBtn');
if(startNowBtn) {
    startNowBtn.onclick = () => {
        if (!selectedGame) {
            alert("Please select a game first!");
            return;
        }
        showPage('page2');
    };
}

const backBtn = document.getElementById('backBtn');
if(backBtn) backBtn.onclick = () => showPage('page1');

// 6. VIP UNLOCK LOGIC
const payNowBtn = document.getElementById('payNowBtn');
const qrModal = document.getElementById('qrModal');

if(payNowBtn) payNowBtn.onclick = () => qrModal.style.display = 'flex';

const unlockVipBtn = document.getElementById('unlockVipBtn');
if(unlockVipBtn) {
    unlockVipBtn.onclick = async () => {
        const vipCode = document.getElementById('vipCode').value.trim();
        if (vipCode.length !== 6) {
            alert("Please enter a valid 6-digit VIP code!");
            return;
        }
        const btn = unlockVipBtn;
        btn.innerHTML = "Checking...";
        btn.disabled = true;

        try {
            const activeSnapshot = await db.ref('active_vip_codes/' + vipCode).once('value');
            let granted = false;

            if (activeSnapshot.exists()) {
                const codeData = activeSnapshot.val();
                if (codeData.status !== "deactivated" && codeData.is_active !== false) {
                    granted = true;
                }
            } else {
                const oldSnapshot = await db.ref('vip_codes/' + vipCode).once('value');
                if (oldSnapshot.exists() && oldSnapshot.val() !== false) granted = true;
            }

            if (granted) {
                isVIPUnlocked = true;
                alert("✅ VIP ACCESS UNLOCKED!");
                showPage('page3');
            } else {
                alert("❌ Invalid or Expired Code");
            }
        } catch (error) {
            alert("Connection Error");
        } finally {
            btn.innerHTML = '<i class="fas fa-unlock"></i> UNLOCK VIP ACCESS';
            btn.disabled = false;
        }
    };
}

// 7. DASHBOARD & ORIGINAL PREDICTION LOGIC
const dashboardModal = document.getElementById('dashboardModal');
const periodEl = document.getElementById('period');
const timerEl = document.getElementById('timer');
const resultEl = document.getElementById('result');
const wordEl = document.getElementById('word');

window.openModal = function(name, link, icon) {
    if (!isVIPUnlocked) {
        alert("⚠️ Security Alert: Unlock VIP First!");
        showPage('page2');
        return;
    }
    document.getElementById('dialogTitle').textContent = name + ' • Prediction';
    document.getElementById('dIcon').src = icon;
    document.getElementById('frame').src = link;
    dashboardModal.classList.add('show');
    dashboardModal.style.pointerEvents = "auto";
    vibrate(15);
    toastMsg('Opened ' + name);
}

window.closeDashboardModal = function() {
    dashboardModal.classList.remove('show');
    vibrate(10);
}

// === ORIGINAL CALCULATION LOGIC ===
function updatePeriod() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    // Standard Period Formula
    const period = `${y}${m}${d}1000${10001 + minutes}`;
    periodEl.textContent = 'Period: ' + period;

    // The Logic: Sum of last two digits
    const lastTwo = period.slice(-2);
    let sum = [...lastTwo].reduce((a, b) => a + parseInt(b), 0);
    if (sum > 9) sum = [...String(sum)].reduce((a, b) => a + parseInt(b), 0);

    const word = sum >= 5 ? 'BIG' : 'SMALL';
    wordEl.textContent = word;
    
    // Timer
    const sec = now.getUTCSeconds();
    const remaining = 60 - sec;
    timerEl.textContent = 'Next in 00:' + String(remaining).padStart(2, '0');
    
    // Result Visuals
    resultEl.classList.add('show');
    wordEl.classList.add('pulse');
}

// Run logic loop
setInterval(updatePeriod, 1000);
updatePeriod(); // Run immediately

window.predictResult = function() {
    vibrate(120);
    beep();
    toastMsg('Prediction triggered');
    const b = document.getElementById('predictBtn');
    b.style.transform = 'scale(.98)';
    setTimeout(() => b.style.transform = '', 140);
           }
