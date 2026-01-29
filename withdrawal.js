firebase.initializeApp({
  apiKey: "AIzaSyDkCvEEgks_sCqkxV40nD-xGRm2Ul8LAPY",
  authDomain: "green-earn-1a638.firebaseapp.com",
  projectId: "green-earn-1a638",
});

const auth = firebase.auth();
const db = firebase.firestore();

let currentBalance = 0;

function go(page) {
  window.location.href = page;
}

// 🔹 Live balance
auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "login.html";

  db.collection("users").doc(user.uid)
    .onSnapshot(doc => {
      const data = doc.data();
      currentBalance = data.balance || 0;
      document.getElementById("balance").innerText = "₦" + currentBalance;
    });
});

// 🔹 Withdraw button
document.getElementById("withdrawBtn").addEventListener("click", async () => {
  const user = auth.currentUser;
  const amount = parseInt(document.getElementById("amount").value);
  const wallet = document.getElementById("wallet").value.trim();
  const msg = document.getElementById("msg");

  msg.className = "";
  msg.innerText = "";

  const pending = await db.collection("withdrawals")
  .where("userId","==",user.uid)
  .where("status","==","pending")
  .get();

if (!pending.empty) {
  msg.className = "error";
  msg.innerText = "You already have a pending withdrawal";
  return;
}
  
  if (!amount || amount <= 0 || !wallet) {
    msg.className = "error";
    msg.innerText = "Enter valid amount and wallet address";
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.data();

    // ✅ Must complete 2 tasks
    if ((userData.completedTasks || 0) < 2) {
      msg.className = "error";
      msg.innerText = "Complete at least 2 tasks first";
      return;
    }

    // ✅ Check balance
    if (userData.balance < amount) {
      msg.className = "error";
      msg.innerText = "Insufficient balance";
      return;
    }

    // 🔹 Create withdrawal
    await db.collection("withdrawals").add({
      userId: user.uid,
      amount,
      wallet,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 🔹 Deduct balance
    await db.collection("users").doc(user.uid).update({
      balance: firebase.firestore.FieldValue.increment(-amount)
    });

    msg.className = "success";
    msg.innerText = "Withdrawal request sent!";

  } catch (err) {
    console.error(err);
    msg.className = "error";
    msg.innerText = "Something went wrong";
  }
});