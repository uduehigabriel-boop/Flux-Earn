// ================= FIREBASE CONFIG =================
firebase.initializeApp({
  apiKey: "AIzaSyDkCvEEgks_sCqkxV40nD-xGRm2Ul8LAPY",
  authDomain: "green-earn-1a638.firebaseapp.com",
  projectId: "green-earn-1a638",
  storageBucket: "green-earn-1a638.firebasestorage.app",
  messagingSenderId: "182317117552",
  appId: "1:182317117552:web:a4e4491e099de2434e44b5"
});

const auth = firebase.auth();
const db = firebase.firestore();

const balanceEl = document.getElementById("balance");
const totalEarnedEl = document.getElementById("totalEarned");
const refCountEl = document.getElementById("refCount");

let unsubscribeUser;
let unsubscribeReferrals;

// ================= TELEGRAM PROMO POPUP (ONCE PER SESSION) =================
function showTelegramPromo() {
  // Only show if not already seen this session
  if (sessionStorage.getItem("telegramPromoShown")) return;

  const overlay = document.createElement("div");
  overlay.id = "promoOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";
  overlay.style.color = "#fff";
  overlay.style.fontFamily = "Arial, sans-serif";

  overlay.innerHTML = `
    <div style="background:#111;border:2px solid #ff8c00;border-radius:16px;padding:25px;text-align:center;max-width:350px;">
      <h2 style="color:#ff8c00;margin-bottom:15px;">🎉 Join Our Telegram!</h2>
      <p style="margin-bottom:20px;">Join our Telegram channel to get updates and bonuses!</p>
      <a href="https://t.me/YOUR_TELEGRAM_CHANNEL" target="_blank" style="
        display:inline-block;
        text-decoration:none;
        background:#ff8c00;color:#111;font-weight:bold;
        border:none;padding:10px 20px;border-radius:12px;
        cursor:pointer;font-size:16px;
      ">Join Telegram</a>
      <button id="closePromo" style="
        margin-top:12px;background:none;color:#ff8c00;
        border:none;cursor:pointer;font-size:14px;
      ">✖ Close</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close popup
  document.getElementById("closePromo").onclick = () => overlay.remove();

  // Mark as shown for this session
  sessionStorage.setItem("telegramPromoShown", "true");
}

// Show promo popup after 1 second on dashboard load
auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "login.html";

  const userRef = db.collection("users").doc(user.uid);

  setTimeout(() => showTelegramPromo(), 1000);

  // 🔴 LIVE USER BALANCE
  unsubscribeUser = userRef.onSnapshot(doc => {
    if (!doc.exists) return;
    const data = doc.data();

    balanceEl.textContent = data.balance || 0;
    totalEarnedEl.textContent = data.totalEarnings || 0;

    // 🔴 LIVE REFERRAL COUNT
    if (unsubscribeReferrals) unsubscribeReferrals();

    unsubscribeReferrals = db.collection("users")
      .where("referredBy", "==", data.referralCode)
      .onSnapshot(snapshot => {
        refCountEl.textContent = snapshot.size;
      });
  });
});
// ================= LOGOUT =================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "login.html";
});

// ================= NAVIGATION =================
function goTasks() { window.location.href = "task.html"; }
function goInvite() { window.location.href = "invite.html"; }
function goWithdrawal() { window.location.href = "withdrawal.html"; }