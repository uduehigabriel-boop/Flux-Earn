// 🔥 FIREBASE INIT
firebase.initializeApp({
  apiKey: "AIzaSyDkCvEEgks_sCqkxV40nD-xGRm2Ul8LAPY",
  authDomain: "green-earn-1a638.firebaseapp.com",
  projectId: "green-earn-1a638",
});

const auth = firebase.auth();
const db = firebase.firestore();

// 🔐 ADMIN UID
const ADMIN_UID = "XWORozeuWtTCPd1EvIRypDhLVr32";

// 📌 ELEMENTS
const logoutBtn = document.getElementById("logoutBtn");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskTitle = document.getElementById("taskTitle");
const taskLink = document.getElementById("taskLink");
const taskMsg = document.getElementById("taskMsg");
const taskList = document.getElementById("taskList");
const submissionList = document.getElementById("submissionList");
const withdrawalList = document.getElementById("withdrawalList");


// 🔓 LOGOUT
logoutBtn.onclick = async () => {
  await auth.signOut();
  window.location.href = "login.html";
};


// 🔒 ADMIN AUTH CHECK
auth.onAuthStateChanged(user => {
  if (!user) return window.location.href = "login.html";
  if (user.uid !== ADMIN_UID) return alert("Access denied");

  loadTasks();
  listenSubmissions();   // 🔥 realtime
  loadWithdrawals();
});


// =======================
// 🟢 TASK MANAGEMENT
// =======================

addTaskBtn.onclick = async () => {
  const title = taskTitle.value.trim();
  const link = taskLink.value.trim();
  taskMsg.textContent = "";

  if (!title || !link) {
    taskMsg.style.color = "red";
    taskMsg.textContent = "Fill all fields!";
    return;
  }

  await db.collection("tasks").add({
    title,
    link,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  taskMsg.style.color = "lime";
  taskMsg.textContent = "Task added!";
  taskTitle.value = "";
  taskLink.value = "";
  loadTasks();
};


async function loadTasks() {
  taskList.innerHTML = "Loading tasks...";
  const snap = await db.collection("tasks").orderBy("createdAt","desc").get();

  taskList.innerHTML = snap.empty ? "<p>No tasks</p>" : "";

  snap.forEach(doc => {
    const t = doc.data();
    taskList.innerHTML += `
      <div class="task-card">
        <b>${t.title}</b> - <a href="${t.link}" target="_blank">Open</a>
        <button onclick="deleteTask('${doc.id}')">Remove</button>
      </div>
    `;
  });
}

async function deleteTask(id) {
  await db.collection("tasks").doc(id).delete();
  loadTasks();
}



// =======================
// 🟠 TASK SUBMISSIONS (REALTIME)
// =======================

function listenSubmissions() {
  submissionList.innerHTML = "Loading submissions...";

  db.collection("submissions")
    .where("status","==","pending")
    .onSnapshot(snapshot => {

      submissionList.innerHTML = "";

      if (snapshot.empty) {
        submissionList.innerHTML = "<p>No pending submissions</p>";
        return;
      }

      snapshot.forEach(doc => {
        const s = doc.data();

        submissionList.innerHTML += `
          <div class="submission-card">
            <p><b>User:</b> ${s.userId}</p>
            <p><b>Task:</b> ${s.taskTitle}</p>
            <img src="${s.screenshotURL}" width="150"/>
            <p><b>Reward:</b> ₦${s.reward}</p>
            <button onclick="approveSubmission('${doc.id}','${s.userId}',${s.reward})">Approve</button>
            <button onclick="rejectSubmission('${doc.id}')">Reject</button>
          </div>
        `;
      });

    }, error => {
      console.error("Submission Error:", error.message);
      submissionList.innerHTML = "<p style='color:red'>Create Firestore index for submissions!</p>";
    });
}


// ✅ APPROVE
async function approveSubmission(id, userId, reward) {
  await db.collection("users").doc(userId).update({
    balance: firebase.firestore.FieldValue.increment(reward),
    totalEarnings: firebase.firestore.FieldValue.increment(reward),
    completedTasks: firebase.firestore.FieldValue.increment(1)
  });

  await db.collection("submissions").doc(id).update({ status: "approved" });
}


// ❌ REJECT
async function rejectSubmission(id) {
  await db.collection("submissions").doc(id).update({ status: "rejected" });
}



// =======================
// 🔵 WITHDRAWALS
// =======================

async function loadWithdrawals() {
  withdrawalList.innerHTML = "Loading withdrawals...";

  const snap = await db.collection("withdrawals")
    .where("status","==","pending")
    .get();

  withdrawalList.innerHTML = snap.empty ? "<p>No pending withdrawals.</p>" : "";

  snap.forEach(doc => {
    const w = doc.data();
    withdrawalList.innerHTML += `
      <div class="task-card">
        <p>User: ${w.userId}</p>
        <p>Amount: ₦${w.amount}</p>
        <p>Wallet: ${w.wallet}</p>
        <button onclick="approveWithdrawal('${doc.id}')">Approve</button>
        <button onclick="rejectWithdrawal('${doc.id}','${w.userId}',${w.amount})">Reject</button>
      </div>
    `;
  });
}


async function approveWithdrawal(id) {
  await db.collection("withdrawals").doc(id).update({ status: "approved" });
  loadWithdrawals();
}

async function rejectWithdrawal(id, uid, amount) {
  await db.collection("users").doc(uid).update({
    balance: firebase.firestore.FieldValue.increment(amount)
  });

  await db.collection("withdrawals").doc(id).update({ status: "rejected" });
  loadWithdrawals();
}