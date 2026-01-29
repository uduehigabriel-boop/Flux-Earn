// Firebase config (copy your own)
firebase.initializeApp({
  apiKey: "AIzaSyDkCvEEgks_sCqkxV40nD-xGRm2Ul8LAPY",
  authDomain: "green-earn-1a638.firebaseapp.com",
  projectId: "green-earn-1a638",
});

const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const refLink = document.getElementById("refLink");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");
const totalReferrals = document.getElementById("totalReferrals");
const activeReferrals = document.getElementById("activeReferrals");
const referralList = document.getElementById("referralList");

// Navigation helper
function go(page) { window.location.href = page; }

// Wait for login
auth.onAuthStateChanged(async user => {
  if (!user) return location.href = "login.html";

  // Set referral link
  refLink.value = `${window.location.origin}/auth.php?ref=${user.uid}`;

  // Load referrals
  loadReferrals(user.uid);
});

// Copy referral link
copyBtn.addEventListener("click", () => {
  refLink.select();
  document.execCommand("copy");
  alert("Referral link copied!");
});

// Share referral link
shareBtn.addEventListener("click", async () => {
  if (navigator.share) {
    try {
      await navigator.share({ title: "Join Flux Earn", url: refLink.value });
    } catch (err) { console.error(err); }
  } else {
    alert("Share not supported, copy the link manually.");
  }
});

// Load referrals
function loadReferrals(uid) {
  referralList.innerHTML = '<p class="loading">Loading referrals...</p>';

  db.collection("users")
    .where("referredBy", "==", uid)
    .orderBy("createdAt", "asc")
    .onSnapshot(snapshot => {
      referralList.innerHTML = "";
      let total = 0, active = 0;

      if (snapshot.empty) {
        referralList.innerHTML = "<p>No referrals yet</p>";
        return;
      }

      snapshot.forEach(doc => {
        const r = doc.data();
        total++;
        if (r.balance > 0) active++;

        const div = document.createElement("div");
        div.className = "referral-card-item";
        div.textContent = `${total}. ${r.fullName || r.username} (${r.email})`;
        referralList.appendChild(div);
      });

      totalReferrals.textContent = total;
      activeReferrals.textContent = active;
    });
}