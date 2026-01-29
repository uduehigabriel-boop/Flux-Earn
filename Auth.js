// Firebase config
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

// AUTH VARIABLES
let isSignUp = true;

// ELEMENTS
const formTitle = document.getElementById("formTitle");
const authBtn = document.getElementById("authBtn");
const switchMode = document.getElementById("switchMode");

const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

// CREATE ERROR POPUP
const errorPopup = document.createElement("div");
errorPopup.id = "errorPopup";
errorPopup.style.position = "fixed";
errorPopup.style.top = "20px";
errorPopup.style.left = "50%";
errorPopup.style.transform = "translateX(-50%)";
errorPopup.style.background = "#ffb3b3";
errorPopup.style.color = "#000";
errorPopup.style.padding = "12px 25px";
errorPopup.style.borderRadius = "8px";
errorPopup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
errorPopup.style.display = "none";
errorPopup.style.zIndex = "9999";
document.body.appendChild(errorPopup);

// Function to show error popup
function showError(message) {
  errorPopup.textContent = message;
  errorPopup.style.display = "block";

  setTimeout(() => {
    errorPopup.style.display = "none";
  }, 4000);
}

// TOGGLE LOGIN/SIGNUP
switchMode.addEventListener("click", () => {
  isSignUp = !isSignUp;

  if (isSignUp) {
    formTitle.textContent = "Create Account";
    authBtn.textContent = "Sign Up";
    fullNameInput.style.display = "block";
    usernameInput.style.display = "block";
    confirmPasswordInput.style.display = "block";
    switchMode.textContent = "Login";
  } else {
    formTitle.textContent = "Login";
    authBtn.textContent = "Login";
    fullNameInput.style.display = "none";
    usernameInput.style.display = "none";
    confirmPasswordInput.style.display = "none";
    switchMode.textContent = "Sign Up";
  }
});

// 🔹 REFERRAL POPUP FUNCTION
function showReferralPopup(referrerName) {
  const popup = document.createElement("div");
  popup.id = "referralPopup";
  popup.style.position = "fixed";
  popup.style.top = "-120px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.background = "#ff8c00"; // orange
  popup.style.color = "#111"; // black text
  popup.style.padding = "16px 24px";
  popup.style.borderRadius = "14px";
  popup.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
  popup.style.zIndex = "9999";
  popup.style.display = "flex";
  popup.style.alignItems = "center";
  popup.style.justifyContent = "space-between";
  popup.style.minWidth = "300px";
  popup.style.maxWidth = "90%";
  popup.style.gap = "15px";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.fontSize = "14px";
  popup.style.fontWeight = "500";
  popup.style.transition = "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)";

  popup.innerHTML = `
    <div style="flex:1; line-height:1.4;">
      🎉 <strong>You were invited!</strong><br>
      Sign up using <strong>${referrerName}</strong>'s referral to receive a bonus!
    </div>
    <button id="closeReferralPopup" style="
      background:#111;
      border:none;
      border-radius:50%;
      width:24px;
      height:24px;
      font-weight:bold;
      font-size:14px;
      cursor:pointer;
      color:#ff8c00;
      display:flex;
      align-items:center;
      justify-content:center;
    ">✖</button>
  `;

  document.body.appendChild(popup);

  // Slide down
  setTimeout(() => { popup.style.top = "20px"; }, 100);

  // Close button
  document.getElementById("closeReferralPopup").onclick = () => {
    popup.style.top = "-120px";
    setTimeout(() => popup.remove(), 600);
  };

  // Auto hide after 7s
  setTimeout(() => {
    if (document.getElementById("referralPopup")) {
      popup.style.top = "-120px";
      setTimeout(() => popup.remove(), 600);
    }
  }, 7000);
}

// 🔹 CHECK URL FOR REFERRAL CODE
const params = new URLSearchParams(window.location.search);
const referralCode = params.get("ref");

if (referralCode) {
  db.collection("users")
    .where("referralCode", "==", referralCode)
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const referrer = snapshot.docs[0].data();
        showReferralPopup(referrer.fullName || referrer.username);
      }
    })
    .catch(err => console.error("Referral popup error:", err));
}

// AUTH BUTTON CLICK
authBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return showError("Please fill in email and password.");

  if (isSignUp) {
    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const confirmPass = confirmPasswordInput.value.trim();

    if (!fullName || !username || !confirmPass) {
      return showError("Please fill in all fields.");
    }

    if (password !== confirmPass) return showError("Passwords do not match!");

    try {
      // Create account
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Generate unique referral code
      const myReferralCode = Math.random().toString(36).substring(2, 7).toUpperCase(); // like X0QV3

      // Save user to Firestore
      await db.collection("users").doc(user.uid).set({
        fullName,
        username,
        email,
        balance: 0,
        totalEarnings: 0,
        referralCode: myReferralCode,
        referredBy: referralCode || null,
        referralsCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Reward referrer if any
      if (referralCode) {
        const snap = await db.collection("users").where("referralCode", "==", referralCode).get();
        snap.forEach(doc => {
          db.collection("users").doc(doc.id).update({
            balance: firebase.firestore.FieldValue.increment(200),
            totalEarnings: firebase.firestore.FieldValue.increment(200),
            referralsCount: firebase.firestore.FieldValue.increment(1)
          });
        });
      }

      // Redirect
      window.location.href = "dashboard.html";

    } catch (err) {
      switch(err.code) {
        case "auth/email-already-in-use": showError("This email is already registered."); break;
        case "auth/invalid-email": showError("Please enter a valid email address."); break;
        case "auth/weak-password": showError("Password should be at least 6 characters."); break;
        default: showError("Error: " + err.message);
      }
    }

  } else {
    // LOGIN
    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      switch(err.code) {
        case "auth/wrong-password": showError("Incorrect password."); break;
        case "auth/user-not-found": showError("Account does not exist."); break;
        case "auth/invalid-email": showError("Please enter a valid email address."); break;
        default: showError("Error: " + err.message);
      }
    }
  }
});
