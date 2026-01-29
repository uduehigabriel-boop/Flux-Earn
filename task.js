// 🔹 FIREBASE INIT
firebase.initializeApp({
  apiKey: "AIzaSyDkCvEEgks_sCqkxV40nD-xGRm2Ul8LAPY",
  authDomain: "green-earn-1a638.firebaseapp.com",
  projectId: "green-earn-1a638",
});

const auth = firebase.auth();
const db = firebase.firestore();

// 🔹 NAVIGATION HELPER
function go(page) { window.location.href = page; }

// 🔹 AUTH CHECK
auth.onAuthStateChanged(async user => {
  if (!user) return location.href = "login.html";

  const userRef = db.collection("users").doc(user.uid);
  const snap = await userRef.get();

  // ⚡ Create missing fields if not exist
  if (!snap.exists || snap.data().totalEarnings === undefined) {
    await userRef.set({
      totalEarnings: 0,
      completedTasks: 0,
      balance: 0
    }, { merge: true });
  }

  // 🔴 LIVE STATS UPDATE (Dashboard)
  userRef.onSnapshot(doc => {
    const data = doc.data();
    const earnedEl = document.getElementById("totalEarned");
    const completedEl = document.getElementById("completedTasks");
    if (earnedEl) earnedEl.textContent = "₦" + (data.totalEarnings || 0);
    if (completedEl) completedEl.textContent = data.completedTasks || 0;
  });

  loadTasks(user.uid);
});

// 🔹 LOAD TASKS
async function loadTasks(uid) {
  const container = document.getElementById("taskList");
  container.innerHTML = "";

  const tasksSnap = await db.collection("tasks").orderBy("createdAt", "desc").get();
  if (tasksSnap.empty) {
    container.innerHTML = "<p>No tasks available yet.</p>";
    return;
  }

  tasksSnap.forEach(doc => {
    const task = doc.data();
    const card = document.createElement("div");
    card.className = "task-card";
    card.innerHTML = `
      <h3>${task.title}</h3>
      <a href="${task.link}" target="_blank">Open Task</a>
      <div id="status-${doc.id}"></div>
      <button id="btn-${doc.id}">Submit Screenshot</button>
    `;
    container.appendChild(card);

    // Check if already submitted
    checkSubmission(uid, doc.id);

    // Submit handler
    document.getElementById(`btn-${doc.id}`).onclick = () =>
      submitTask(uid, doc.id, task.title);
  });
}

// 🔹 CHECK SUBMISSION
async function checkSubmission(uid, taskId) {
  const snap = await db.collection("submissions")
    .where("taskId", "==", taskId)
    .where("userId", "==", uid)
    .get();

  if (!snap.empty) {
    const status = snap.docs[0].data().status;
    document.getElementById(`btn-${taskId}`).style.display = "none";
    document.getElementById(`status-${taskId}`).innerHTML =
      `<p class="completed">${status.toUpperCase()}</p>`;
  }
}

// 🔹 PREVENT MULTIPLE SUBMISSIONS
async function alreadySubmitted(uid, taskId){
  const snap = await db.collection("submissions")
    .where("taskId","==",taskId)
    .where("userId","==",uid)
    .get();
  return !snap.empty;
}

// 🔹 SUBMIT TASK
async function submitTask(uid, taskId, title) {
  if (await alreadySubmitted(uid, taskId)) {
    alert("You already submitted this task.");
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    alert("Uploading screenshot...");

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];

      try {
        // 🔹 Upload to ImgBB
        const res = await fetch(
          "https://api.imgbb.com/1/upload?key=b8b73c67de0ca3e017f14dc2261670f3",
          { method: "POST", body: new URLSearchParams({ image: base64 }) }
        );
        const data = await res.json();
        const imageURL = data.data.url;

        // 🔹 Save submission
        await db.collection("submissions").add({
          taskId,
          taskTitle: title,
          userId: uid,
          screenshotURL: imageURL,
          status: "pending",
          reward: 200,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Submitted for approval!");
        loadTasks(uid);

      } catch (err) {
        alert("Upload failed!");
        console.error(err);
      }
    };
  };

  input.click();
}