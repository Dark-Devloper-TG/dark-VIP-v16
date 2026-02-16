/* =============================================
   DARK VIP SYSTEM - LOGIC CORE
   Separated for Security and Performance
   ============================================= */

// 1. FIREBASE CONFIGURATION
// Ye logic ab external file me hai, HTML source me nahi dikhega easily
const firebaseConfig = {
    apiKey: "AIzaSyCXmlxcZ79hkycqnD_ZIuDBLtOI1zCHRaw",
    authDomain: "dark-vip-prediction.firebaseapp.com",
    databaseURL: "https://dark-vip-prediction-default-rtdb.firebaseio.com",
    projectId: "dark-vip-prediction",
    storageBucket: "dark-vip-prediction.firebasestorage.app",
    messagingSenderId: "682755216649",
    appId: "1:682755216649:web:b54cf89a4537db1e29afd8"
};

// Initialize Firebase
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
        page.style.display = 'none'; // Ensure strictly hidden
    });
    const p = document.getElementById(pageId);
    p.style.display = 'block'; // Ensure strictly visible
    setTimeout(() => p.classList.add('active'), 10);
    window.scrollTo(0, 0);
}

// 4. GAME SELECTION LOGIC
const selectGameBtn = document.getElementById('selectGameBtn');
const gameModal = document.getElementById('gameModal');

if(selectGameBtn) {
    selectGameBtn.onclick = () => {
        gameModal.style.display = 'flex';
    };
}

// Make this global so HTML onclick works
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
if(backBtn) {
    backBtn.onclick = () => showPage('page1');
}

// 5. PAYMENT & VIP UNLOCK
const payNowBtn = document.getElementById('payNowBtn');
const qrModal = document.getElementById('qrModal');

if(payNowBtn) {
    payNowBtn.onclick = () => {
        qrModal.style.display = 'flex';
    };
}

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
            // Check in active_vip_codes
            const activeSnapshot = await db.ref('active_vip_codes/' + vipCode).once('value');
            let granted = false;

            if (activeSnapshot.exists()) {
                const codeData = activeSnapshot.val();
                if (codeData.status !== "deactivated" && codeData.is_active !== false) {
                    granted = true;
                }
            } else {
                // Check old table
                const oldSnapshot = await db.ref('vip_codes/' + vipCode).once('value');
                if (oldSnapshot.exists() && oldSnapshot.val() !== false) {
                    granted = true;
                }
            }

            if (granted) {
                isVIPUnlocked = true;
                alert("✅ VIP ACCESS UNLOCKED!");
                showPage('page3');
            } else {
                alert("❌ Invalid or Expired Code");
            }
        } catch (error) {
            console.error("DB Error:", error);
            alert("Connection Error. Try again.");
        } finally {
            btn.innerHTML = '<i class="fas fa-unlock"></i> UNLOCK VIP ACCESS';
            btn.disabled = false;
        }
    };
}

// 6. DASHBOARD & PREDICTION LOGIC
const dashboardModal = document.getElementById('dashboardModal');

window.openModal = function(name, link, icon) {
    if (!isVIPUnlocked) {
        alert("⚠️ Security Alert: Please Unlock VIP First!");
        showPage('page2');
        return;
    }
    
    document.getElementById('dialogTitle').textContent = name + ' • Prediction';
    document.getElementById('dIcon').src = icon;
    document.getElementById('frame').src = link;
    dashboardModal.classList.add('show');
    dashboardModal.style.pointerEvents = "auto"; // Fix click issue
}

window.closeDashboardModal = function() {
    dashboardModal.classList.remove('show');
}

window.predictResult = function() {
    const resEl = document.getElementById('result');
    const wordEl = document.getElementById('word');
    
    resEl.style.opacity = '0';
    wordEl.innerText = "ANALYZING...";
    resEl.classList.add('show');

    setTimeout(() => {
        const outcomes = ['BIG 🟢', 'SMALL 🔴', 'BIG 🟢', 'SMALL 🔴', 'GREEN 🟢', 'RED 🔴'];
        const random = outcomes[Math.floor(Math.random() * outcomes.length)];
        wordEl.innerText = random;
        resEl.style.opacity = '1';
    }, 1500);
}

// Timer Logic
setInterval(() => {
    const now = new Date();
    const period = `${now.getUTCFullYear()}${now.getUTCMonth()+1}${now.getUTCDate()}1000${10001 + (now.getUTCHours()*60 + now.getUTCMinutes())}`;
    document.getElementById('period').innerText = 'Period: ' + period;
    
    const sec = 60 - now.getUTCSeconds();
    document.getElementById('timer').innerText = `00:${sec < 10 ? '0'+sec : sec}`;
}, 1000);