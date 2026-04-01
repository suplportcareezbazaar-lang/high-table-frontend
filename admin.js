const API = "https://high-table-backend.onrender.com/api";
const token = localStorage.getItem("adminToken");

if (!token) {
  alert("Admin login required");
  location.href = "index.html";
} else {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.role !== "admin") {
      alert("Access denied");
      localStorage.clear();
      location.href = "index.html";
    }
  } catch {
    localStorage.clear();
    location.href = "index.html";
  }
}

/* ================= AUTH ================= */

async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

/* ================= PAGINATION ================= */

const PAGE_SIZE = 10;

function paginate(data, page) {
  const start = (page - 1) * PAGE_SIZE;
  return data.slice(start, start + PAGE_SIZE);
}

function renderPagination(containerId, data, currentPage, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPage) {
      btn.style.background = "#00e5ff";
      btn.style.color = "#000";
    }

    btn.onclick = () => onPageChange(i);
    container.appendChild(btn);
  }
}

/* ================= DASHBOARD ================= */

async function loadDashboard() {
  const data = await authFetch(`${API}/admin/dashboard`);

  document.getElementById("totalUsers").innerText = data.totalUsers;
  document.getElementById("totalBets").innerText = data.totalBets;
  document.getElementById("totalDeposits").innerText = data.totalDeposits;
  document.getElementById("totalWithdrawals").innerText = data.totalWithdrawals;
  document.getElementById("totalProfit").innerText = data.profit;
}

async function loadLiveBets() {
  const data = await authFetch(`${API}/admin/live-bets`);

  const table = document.getElementById("liveBets");
  table.innerHTML = "";

  data.forEach(b => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${b.username}</td>
      <td>${b.match}</td>
      <td>${b.team}</td>
      <td>${b.amount}</td>
      <td>${new Date(b.time).toLocaleTimeString()}</td>
    `;

    table.appendChild(tr);
  });
}

/* ================= USERS ================= */

let allUsers = [];
let userPage = 1;

async function loadUsers() {
  allUsers = await authFetch(`${API}/admin/users`);
  userPage = 1;
  renderUsers();
}

function renderUsers() {
  const search = document.getElementById("userSearch")?.value.toLowerCase() || "";

  const filtered = allUsers.filter(u =>
    u.username.toLowerCase().includes(search) ||
    u.email.toLowerCase().includes(search)
  );

  const pageData = paginate(filtered, userPage);

  const table = document.getElementById("userTable");
  table.innerHTML = "";

  pageData.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.username}</td>
      <td>${u.email}</td>
      <td>${u.mobile}</td>
      <td>${u.role}</td>
      <td>${u._id}</td>
      <td>${u.blocked ? "❌ Banned" : "✅ Active"}</td>
      <td>
        <button onclick="toggleUser('${u._id}', ${u.blocked})">
          ${u.blocked ? "Unban" : "Ban"}
        </button>
      </td>
    `;

    table.appendChild(tr);
  });

  renderPagination("userPagination", filtered, userPage, (p) => {
    userPage = p;
    renderUsers();
  });
}

document.addEventListener("input", (e) => {
  if (e.target.id === "userSearch") {
    userPage = 1;
    renderUsers();
  }
});

async function toggleUser(userId, blocked) {
  await authFetch(`${API}/admin/user/ban`, {
    method: "POST",
    body: JSON.stringify({ userId, blocked: !blocked })
  });

  loadUsers();
}

/* ================= BANK ================= */

let allBanks = [];
let bankPage = 1;

async function loadBanks() {
  allBanks = await authFetch(`${API}/admin/banks`);
  bankPage = 1;
  renderBanks();
}

function renderBanks() {
  const search = document.getElementById("bankSearch")?.value.toLowerCase() || "";

  const filtered = allBanks.filter(b =>
    b.username.toLowerCase().includes(search)
  );

  const pageData = paginate(filtered, bankPage);

  const table = document.getElementById("bankTable");
  table.innerHTML = "";

  pageData.forEach(b => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${b.username}</td>
      <td>${b.userId}</td>
      <td>${b.bankName}</td>
      <td>${b.number}</td>
    `;

    table.appendChild(tr);
  });

  renderPagination("bankPagination", filtered, bankPage, (p) => {
    bankPage = p;
    renderBanks();
  });
}

/* ================= BETS ================= */

let allBets = [];
let betPage = 1;

async function loadBets() {
  allBets = await authFetch(`${API}/admin/bets`);
  betPage = 1;
  renderBets();
}

function renderBets() {
  const search = document.getElementById("betSearch")?.value.toLowerCase() || "";

  const filtered = allBets.filter(b =>
    b.username.toLowerCase().includes(search) ||
    b.matchName.toLowerCase().includes(search)
  );

  const pageData = paginate(filtered, betPage);

  const table = document.getElementById("betTable");
  table.innerHTML = "";

  pageData.forEach(b => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${b.username}</td>
      <td>${b.userId}</td>
      <td>${b.matchName}</td>
      <td>${b.amount}</td>
    `;

    table.appendChild(tr);
  });

  renderPagination("betPagination", filtered, betPage, (p) => {
    betPage = p;
    renderBets();
  });
}

/* ================= DEPOSITS ================= */

let allDeposits = [];
let depositPage = 1;

async function loadDeposits() {
  allDeposits = await authFetch(`${API}/admin/deposits`);
  depositPage = 1;
  renderDeposits();
}

function renderDeposits() {
  const search = document.getElementById("depositSearch")?.value.toLowerCase() || "";

  const filtered = allDeposits.filter(d =>
    d.username.toLowerCase().includes(search)
  );

  const pageData = paginate(filtered, depositPage);

  const table = document.getElementById("depositTable");
  table.innerHTML = "";

  pageData.forEach(d => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${d.username}</td>
      <td>${d.userId}</td>
      <td>${d.amount}</td>
      <td>${new Date(d.createdAt).toLocaleString()}</td>
    `;

    table.appendChild(tr);
  });

  renderPagination("depositPagination", filtered, depositPage, (p) => {
    depositPage = p;
    renderDeposits();
  });
}

/* ================= WITHDRAW ================= */

async function loadWithdrawals(status = "") {
  const data = await authFetch(
    `${API}/admin/withdrawals${status ? `?status=${status}` : ""}`
  );

  const table = document.getElementById("withdrawTable");
  table.innerHTML = "";

  data.forEach(w => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${w.userId}</td>
      <td>${w.amount}</td>
      <td>${w.status}</td>
      <td>${w.bankSnapshot?.bankName || "-"}</td>
      <td>
        ${w.status === "PENDING"
        ? `<button onclick="approveWithdraw('${w.withdrawalId}')">Approve</button>
           <button onclick="rejectWithdraw('${w.withdrawalId}')">Reject</button>`
        : ""}
      </td>
    `;

    table.appendChild(tr);
  });
}

async function approveWithdraw(id) {
  await authFetch(`${API}/admin/withdraw/approve`, {
    method: "POST",
    body: JSON.stringify({ withdrawalId: id })
  });

  loadWithdrawals("PENDING");
}

async function rejectWithdraw(id) {
  await authFetch(`${API}/admin/withdraw/reject`, {
    method: "POST",
    body: JSON.stringify({ withdrawalId: id })
  });

  loadWithdrawals("PENDING");
}

/* ================= SPORTS ================= */

const sports = ["cricket", "football", "basketball", "volleyball"];

async function loadSportsControl() {
  const container = document.getElementById("sportsControls");
  container.innerHTML = "";

  const data = await authFetch(`${API}/admin/sports/status`);

  sports.forEach(sport => {
    const isStopped = data[sport];

    const btn = document.createElement("button");
    btn.className = isStopped ? "start" : "stop";

    btn.innerText = isStopped
      ? `Start ${sport}`
      : `Stop ${sport}`;

    btn.onclick = () => toggleSport(sport);

    container.appendChild(btn);
  });
}

async function toggleSport(sport) {
  await authFetch(`${API}/admin/sports/toggle`, {
    method: "POST",
    body: JSON.stringify({ sport })
  });

  loadSportsControl();
}

async function loadFraudAlerts() {

    const data = await authFetch(`${API}/admin/fraud-alerts`);

    const table = document.getElementById("fraudAlerts");
    table.innerHTML = "";

    // 🚨 BIG BETS
    data.bigBets.forEach(b => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${b.userId}</td>
            <td style="color:red">BIG BET</td>
            <td>₹${b.amount}</td>
        `;

        table.appendChild(tr);
    });

    // 🚨 SPAM USERS
    data.spamUsers.forEach(u => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u._id}</td>
            <td style="color:orange">SPAM BETTING</td>
            <td>${u.count} bets in 5 min</td>
        `;

        table.appendChild(tr);
    });

}

/* ================= TAB ================= */

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    if (tab === "dashboard") {
      loadDashboard();
      loadLiveBets();
      loadFraudAlerts();
    }

    if (tab === "users") loadUsers();
    if (tab === "banks") loadBanks();
    if (tab === "bets") loadBets();
    if (tab === "deposits") loadDeposits();
    if (tab === "withdraw") loadWithdrawals();
    if (tab === "sports") loadSportsControl();
  });
});

/* ================= AUTO REFRESH ================= */

setInterval(() => {
  loadLiveBets();
  loadDashboard();
  loadFraudAlerts();
}, 5000);

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadLiveBets();
  loadUsers();
  loadFraudAlerts();
  loadWithdrawals("PENDING");
});
