const API = "https://high-table-backend.onrender.com/api";
const token = localStorage.getItem("adminToken");

if (!token) {
    alert("Admin login required");
    location.href = "index.html";
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

/* ================= USERS ================= */

async function loadUsers() {
    const data = await authFetch(`${API}/admin/users`);

    const table = document.getElementById("userTable");
    table.innerHTML = "";

    data.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>${u.mobile}</td>
            <td>${u.role}</td>
            <td>${u.userId || "-"}</td>
            <td>${u.blocked ? "❌ Banned" : "✅ Active"}</td>
            <td>
                <button class="ban" onclick="toggleUser('${u._id}', ${u.blocked})">
                    ${u.blocked ? "Unban" : "Ban"}
                </button>
            </td>
        `;

        table.appendChild(tr);
    });
}

async function toggleUser(userId, blocked) {
    await authFetch(`${API}/admin/user/ban`, {
        method: "POST",
        body: JSON.stringify({ userId, blocked: !blocked })
    });

    loadUsers();
}

/* ================= BANK ================= */

async function loadBanks() {
    const data = await authFetch(`${API}/admin/banks`);

    const table = document.getElementById("bankTable");
    table.innerHTML = "";

    data.forEach(b => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${b.username}</td>
            <td>${b.userId}</td>
            <td>${b.bankName}</td>
            <td>${b.number}</td>
        `;

        table.appendChild(tr);
    });
}

/* ================= BETS ================= */

async function loadBets() {
    const data = await authFetch(`${API}/admin/bets`);

    const table = document.getElementById("betTable");
    table.innerHTML = "";

    data.forEach(b => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${b.username}</td>
            <td>${b.userId}</td>
            <td>${b.matchName}</td>
            <td>${b.amount}</td>
        `;

        table.appendChild(tr);
    });
}

/* ================= DEPOSITS ================= */

async function loadDeposits() {
    const data = await authFetch(`${API}/admin/deposits`);

    const table = document.getElementById("depositTable");
    table.innerHTML = "";

    data.forEach(d => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${d.username}</td>
            <td>${d.userId}</td>
            <td>${d.amount}</td>
            <td>${new Date(d.createdAt).toLocaleString()}</td>
        `;

        table.appendChild(tr);
    });
}

/* ================= WITHDRAW ================= */

async function loadWithdrawals(status = "") {
    const data = await authFetch(
        `${API}/admin/withdrawals${status ? `?status=${status}` : ""}`
    );

    const tbody = document.querySelector("#withdrawTable tbody");
    tbody.innerHTML = "";

    data.forEach(w => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${w.userId}</td>
            <td>${w.amount}</td>
            <td>${w.status}</td>
            <td>${w.bankSnapshot?.bankName || "-"}</td>
            <td>
                ${w.status === "PENDING"
                ? `<button onclick="approveWithdraw('${w._id}')">Approve</button>
                   <button class="reject" onclick="rejectWithdraw('${w._id}')">Reject</button>`
                : ""}
            </td>
        `;

        tbody.appendChild(tr);
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

/* ================= SPORTS CONTROL ================= */

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

/* ================= TAB AUTO LOAD ================= */

document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {

        const tab = btn.dataset.tab;

        if (tab === "users") loadUsers();
        if (tab === "banks") loadBanks();
        if (tab === "bets") loadBets();
        if (tab === "deposits") loadDeposits();
        if (tab === "withdraw") loadWithdrawals();
        if (tab === "sports") loadSportsControl();
    });
});

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    loadWithdrawals("PENDING");
});
