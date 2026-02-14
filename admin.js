const API = "http://localhost:3000/api";
const token = localStorage.getItem("token"); // single token system

if (!token) {
    alert("Admin login required");
    location.href = "index.html";
}

/* ================= SAFE AUTH FETCH ================= */

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

/* ================= AGENT SECTION ================= */

function loadAgents() {
    authFetch(`${API}/admin/users`)
        .then(users => {
            const agents = users.filter(u => u.role === "agent");
            const table = document.getElementById("agentTable");
            table.innerHTML = "";

            agents.forEach(a => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${a.id}</td>
                    <td>${a.username}</td>
                    <td class="${a.approved ? "approved" : "pending"}">
                        ${a.approved ? "Approved" : "Pending"}
                    </td>
                    <td>
                        ${a.approved
                        ? `<button class="approve" onclick="settleAgent(${a.id})">Settle</button>`
                        : `<button class="approve" onclick="approveAgent(${a.id})">Approve</button>`
                    }
                    </td>
                    <td>-</td>
                    <td>-</td>
                `;
                table.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("AGENT LOAD ERROR:", err.message);
            alert("Failed to load agents");
        });
}

function approveAgent(agentId) {
    if (!confirm("Approve this agent?")) return;

    authFetch(`${API}/admin/agent/approve`, {
        method: "POST",
        body: JSON.stringify({ agentId })
    })
        .then(res => {
            alert(res.message);
            loadAgents();
        })
        .catch(err => alert(err.message));
}

function settleAgent(agentId) {
    if (!confirm("Settle agent commission?")) return;

    authFetch(`${API}/admin/agent/payout`, {
        method: "POST",
        body: JSON.stringify({ agentId })
    })
        .then(res => {
            alert(`Paid ₹${res.amount}`);
            loadAgents();
        })
        .catch(err => alert(err.message));
}

/* ================= WITHDRAWAL SECTION ================= */

async function loadWithdrawals(status = "") {
    try {
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
                    ? `<button onclick="approveWithdraw('${w.id}')">Approve</button>`
                    : ""
                }
                    ${w.status === "FAILED"
                    ? `<button onclick="retryWithdraw('${w.id}')">Retry</button>`
                    : ""
                }
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("WITHDRAW LOAD ERROR:", err.message);
        alert("Failed to load withdrawals");
    }
}

async function approveWithdraw(id) {
    if (!confirm("Approve this withdrawal?")) return;

    try {
        await authFetch(`${API}/admin/withdraw/approve`, {
            method: "POST",
            body: JSON.stringify({ withdrawalId: id })
        });
        loadWithdrawals("PENDING");
    } catch (err) {
        alert(err.message);
    }
}

async function retryWithdraw(id) {
    try {
        await authFetch(`${API}/admin/withdraw/retry`, {
            method: "POST",
            body: JSON.stringify({ withdrawalId: id })
        });
        loadWithdrawals("PENDING");
    } catch (err) {
        alert(err.message);
    }
}

/* ================= FILTER ================= */

document.getElementById("withdrawFilter").onchange = e => {
    loadWithdrawals(e.target.value);
};

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    loadAgents();
    loadWithdrawals("PENDING");
});
