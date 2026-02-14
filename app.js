/* ================== CONFIG ================== */
const API_BASE = "http://localhost:3000";
const API = API_BASE + "/api";

/* ================== DOM ================== */
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const walletBtn = document.getElementById("walletBtn");
const historyBtn = document.getElementById("historyBtn");
const matchList = document.getElementById("matchList");
const walletHistoryTab = document.getElementById("walletHistoryTab");
const betHistoryTab = document.getElementById("betHistoryTab");
const walletHistory = document.getElementById("walletHistory");
const betHistory = document.getElementById("betHistory");
const historyContent = document.getElementById("historyContent");
// ===== MOBILE MENU =====
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");

menuBtn.onclick = () => mobileMenu.classList.remove("hidden");
closeMenu.onclick = () => mobileMenu.classList.add("hidden");

const hedgeReturnText = document.getElementById("hedgeReturnText");

// Sync mobile menu buttons with desktop actions
document.getElementById("mLogin").onclick = () => loginBtn.click();
document.getElementById("mRegister").onclick = () => registerBtn.click();
document.getElementById("mWallet").onclick = () => walletBtn.click();
document.getElementById("mHistory").onclick = () => historyBtn.click();
document.getElementById("mLogout").onclick = () => logoutBtn.click();

/* ================== STATE ================== */
let matches = [];
let selectedMatch = null;
let selectedTeam = null;
let currentSport = "cricket";
let currentFilter = "all";

/* ================= HELPERS ================= */

function isBettingOpen(match) {
    const now = new Date();
    const start = new Date(match.startTime);

    // close betting 30 minutes before start
    const closeTime = new Date(start.getTime() - 30 * 60 * 1000);

    return now < closeTime;
}

function getCountdown(startTime) {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;

    if (diff <= 0) return "LIVE";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    return `${h}h ${m}m ${s}s`;
}

function getAuthToken() {
    return (
        localStorage.getItem("userToken") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("agentToken")
    );
}

function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    const overlay = document.getElementById("menuOverlay");

    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}

function showLoading() {
    matchList.innerHTML = `
        <div style="padding:30px;text-align:center;opacity:0.7">
            ⏳ Loading matches…
        </div>
    `;
}

/* ================== UI HELPERS ================== */
function showError(message) {
    if (!matchList) return;
    matchList.innerHTML = `
        <div style="padding:20px;color:#ffcc00;text-align:center;font-weight:600">
            ⚠️ ${message}
        </div>
    `;
}

function getInitials(name = "") {
    return name
        .split(" ")
        .map(w => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

function formatMatchTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* ================== MODALS ================== */
function openModal(id) {
    document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
}
function closeModal(id) {
    document.getElementById(id)?.classList.remove("active");
}

/* ================== AUTH ================== */
loginBtn.onclick = () => openModal("loginModal");
registerBtn.onclick = () => openModal("registerModal");
logoutBtn.onclick = logout;

walletBtn.onclick = () => {
    if (!localStorage.getItem("userToken")) {
        alert("Please login first");
        return;
    }
    openModal("walletModal");
    loadWallet();
};

historyBtn.onclick = () => {
    openModal("historyModal");
    loadWalletHistory();
};

async function register() {
    const username = regUser.value.trim();
    const email = regEmail.value.trim();
    const mobile = regMobile.value.trim();
    const password = regPass.value;
    const password2 = regPass2.value;

    if (!username || !email || !mobile || !password) {
        alert("All fields are required");
        return;
    }

    if (password !== password2) {
        alert("Passwords do not match");
        return;
    }

    const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            email,
            mobile,
            password
        })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    localStorage.setItem("userId", data.userId);

    alert(`Registered successfully!\nYour User ID: ${data.userId}`);
    closeModal("registerModal");
}

async function login() {
    const username = loginUser.value.trim();
    const password = loginPass.value;

    const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    const payload = JSON.parse(atob(data.token.split(".")[1]));

    localStorage.setItem("userId", payload.id);

    if (payload.role === "admin") {
        localStorage.setItem("adminToken", data.token);
        location.href = "admin.html";
        return;
    }

    if (payload.role === "agent") {
        localStorage.setItem("agentToken", data.token);
        location.href = "agent.html";
        return;
    }

    localStorage.setItem("userToken", data.token);
    closeModal("loginModal");
    updateAuthUI();
}

async function requestPasswordReset() {
    const email = forgotEmail.value.trim();
    if (!email) return alert("Enter your email");

    const res = await fetch(`${API}/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    alert("Password reset link sent to your email");
    closeModal("forgotModal");
}

function logout() {
    localStorage.clear();
    updateAuthUI();
}

function updateAuthUI() {
    const token = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");

    loginBtn.classList.toggle("hidden", !!token);
    registerBtn.classList.toggle("hidden", !!token);
    logoutBtn.classList.toggle("hidden", !token);
    walletBtn.classList.toggle("hidden", !token);
    historyBtn.classList.toggle("hidden", !token);

    const userIdLabel = document.getElementById("userIdLabel");
    const userIdText = document.getElementById("userIdText");

    if (token && userId) {
        userIdText.innerText = userId;
        userIdLabel.classList.remove("hidden");
    } else {
        userIdLabel.classList.add("hidden");
    }
}

/* ================== WALLET ================== */

async function loadWallet() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const res = await fetch(`${API}/wallet`, {
            headers: { Authorization: "Bearer " + token }
        });

        const data = await res.json();
        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById("walletUserId").innerText =
            localStorage.getItem("userId") || "-";


        document.getElementById("tokenBalance").innerText =
            Number(data.balance || 0).toFixed(2);

        await checkBankStatus();
    } catch (err) {
        alert("Failed to load wallet");
        console.error(err);
    }
}

async function buyTokens(e) {
    e.preventDefault();

    const input = document.getElementById("add-amount");
    if (!input) {
        console.error("add-amount input missing");
        return;
    }

    const amount = Number(input.value);
    if (!amount || amount < 100) {
        alert("Minimum deposit is 100");
        return;
    }

    const token = localStorage.getItem("userToken");

    const res = await fetch(`${API}/deposit/init`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify({ amount })
    });

    const data = await res.json();
    console.log("DEPOSIT RESPONSE:", data);

    if (data.payment_url) {
        // Redirect to IMB checkout
        window.location.href = data.payment_url;
    } else {
        alert("Payment URL not returned");
    }
}

async function withdrawTokens() {
    const amount = Number(withdrawAmount.value);
    const password = withdrawPassword.value;

    if (amount < 500) return alert("Minimum withdrawal is 500");
    if (!password) return alert("Enter login password");

    const btn = event.target;
    btn.disabled = true;
    btn.innerText = "Submitting...";

    try {
        const token = localStorage.getItem("userToken");

        const res = await fetch(`${API}/wallet/withdraw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({ amount, password })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        alert("Withdrawal requested (processing up to 24h)");
        withdrawAmount.value = "";
        withdrawPassword.value = "";

        loadWallet();
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Convert & Withdraw";
    }
}

async function saveBank() {
    const token = localStorage.getItem("userToken");

    const body = {
        holder: accHolder.value,
        number: accNumber.value,
        bankName: bankName.value,
        mobile: bankMobile.value,
        email: bankEmail.value,
        code: bankCode.value
    };

    const res = await fetch(`${API}/bank/save`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    alert("Bank details saved");
    checkBankStatus();
}

async function checkBankStatus() {
    const token = localStorage.getItem("userToken");

    const res = await fetch(`${API}/bank/status`, {
        headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();
    const el = document.getElementById("bankStatus");

    if (data.linked) {
        el.innerText = "Linked";
        el.classList.remove("not-linked");
        el.classList.add("linked");
    } else {
        el.innerText = "Not Linked";
        el.classList.remove("linked");
        el.classList.add("not-linked");
    }
}

function renderTeamLogo(teamName, logoUrl) {
    if (logoUrl) {
        return `<img src="${logoUrl}" alt="${teamName}" class="team-logo-img">`;
    }
    return `<div class="team-logo">${getInitials(teamName)}</div>`;
}

/* ================== MATCH FILTER UI ================== */
document.querySelectorAll(".sport").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".sport").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentSport = btn.dataset.sport;
        renderMatches();
    };
});

document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentFilter = tab.dataset.filter;
        renderMatches();
    };
});

/* ================== LOAD MATCHES ================== */
async function loadMatches() {
    showLoading();
    try {
        //console.log("📡 Fetching matches from:", `${API}/matches`);

        const res = await fetch(`${API}/matches`);

        if (!res.ok) {
            showError("Server error. Please refresh.");
            return;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
            console.error("❌ Invalid data format:", data);
            return;
        }

        matches = data
            .filter(m => m.team1 && m.team2 && m.startTime)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        renderMatches();

    } catch (err) {
        console.error("❌ FETCH FAILED:", err);
        showError("Unable to load matches. Please try again.");
    }
}

function renderMatches() {
    const list = document.getElementById("matchList");
    list.innerHTML = "";

    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const filtered = matches
        .filter(m => m.sport === currentSport)
        .filter(m => {
            if (currentFilter === "live") {
                return m.status === "live";
            }

            if (currentFilter === "upcoming") {
                return m.status === "upcoming";
            }

            return true;
        });

    if (!filtered.length) {
        list.innerHTML = `<div class="no-data">No matches available</div>`;
        return;
    }

    filtered.forEach(match => {
        const isLive = new Date(match.startTime) <= new Date();
        const timerText = isLive ? "LIVE" : getCountdown(match.startTime);

        const card = document.createElement("div");
        card.className = "match-card";

        if (!isBettingOpen(match)) {
            card.classList.add("closed");
        }

        // 🔥 attach match object directly
        card.matchData = match;

        card.innerHTML = `
            <div class="match-header">
                <span class="league">${match.league}</span>
                <span class="timer ${isLive ? "live" : "upcoming"}">
                    ${timerText}
                </span>
            </div>

            <div class="match-body">
                <div class="team">
                    ${renderTeamLogo(match.team1, match.team1Logo)}
                    <div class="team-name">${match.team1}</div>
                </div>

                <div class="vs">VS</div>

                <div class="team">
                    ${renderTeamLogo(match.team2, match.team2Logo)}
                    <div class="team-name">${match.team2}</div>
                </div>
            </div>

            <div class="match-time">
                <span class="timer">${getCountdown(match.startTime)}</span>
            </div>
        `;

        card.onclick = () => {
            //console.log("🖱️ Match clicked:", match.team1, "vs", match.team2);
            openBetModal(match);
        };

        list.appendChild(card);
    });

}

/* ================== BET POPUP ================== */
/*document.addEventListener("click", e => {
    const card = e.target.closest(".match-card");
    if (!card) return;

    if (!localStorage.getItem("userToken")) {
        alert("Please login to place bet");
        return;
    }

    selectedMatch = matches[card.dataset.index];

    if (!selectedMatch.bettingOpen) {
        alert("Betting closed");
        return;
    }

    betMatchTitle.innerText =
        `${selectedMatch.team1} vs ${selectedMatch.team2}`;

    selectedTeam = null;
    betAmount.value = "";
    updateBetPreview();
    openModal("betModal");
});*/

teamABox.onclick = () => selectTeam("A");
teamBBox.onclick = () => selectTeam("B");
betAmount.oninput = updateBetPreview;

function selectTeam(team) {
    selectedTeam = team;
    teamABox.classList.toggle("active", team === "A");
    teamBBox.classList.toggle("active", team === "B");
    updateBetPreview();
}

function updateBetPreview() {
    const total = Number(betAmount.value) || 0;
    const main = total * 0.75;
    const hedge = total * 0.25;

    mainBetText.innerText = main.toFixed(2);
    hedgeBetText.innerText = hedge.toFixed(2);
    potentialWinText.innerText = (main * 2).toFixed(2);
    hedgeReturnText.innerText = (hedge * 2).toFixed(2);
}

function openBetModal(match) {
    //console.log("🎯 openBetModal called", match);

    if (!match || !match.id) return;

    if (!localStorage.getItem("userToken")) {
        alert("Please login to place bet");
        return;
    }

    if (!isBettingOpen(match)) {
        alert("Betting closed for this match");
        return;
    }

    selectedMatch = match;
    selectedTeam = null;

    betMatchTitle.innerText = `${match.team1} vs ${match.team2}`;
    teamAName.innerText = match.team1;
    teamBName.innerText = match.team2;

    teamABox.classList.remove("active");
    teamBBox.classList.remove("active");
    betAmount.value = "";

    updateBetPreview();
    openModal("BetModal");
}

/* ================== PLACE BET ================== */
placeBetBtn.onclick = async () => {
    if (!selectedMatch || !selectedMatch.id)
        return alert("Invalid match");

    if (!selectedTeam)
        return alert("Select a team");

    const amount = Number(betAmount.value);
    if (amount < 20)
        return alert("Minimum bet is 20");

    placeBetBtn.disabled = true;
    placeBetBtn.innerText = "Placing...";

    try {
        const res = await fetch(`${API}/bet/place`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken")
            },
            body: JSON.stringify({
                matchId: selectedMatch.id,
                team: selectedTeam === "A"
                    ? selectedMatch.team1
                    : selectedMatch.team2,
                amount
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        alert("Bet placed successfully");
        closeModal("BetModal");

    } catch (err) {
        alert(err.message);
    } finally {
        placeBetBtn.disabled = false;
        placeBetBtn.innerText = "Place Bet";
    }
};

walletHistoryTab.onclick = () => {
    walletHistoryTab.classList.add("active");
    betHistoryTab.classList.remove("active");
    walletHistory.classList.remove("hidden");
    betHistory.classList.add("hidden");
    loadWalletHistory();
};

betHistoryTab.onclick = () => {
    betHistoryTab.classList.add("active");
    walletHistoryTab.classList.remove("active");
    betHistory.classList.remove("hidden");
    walletHistory.classList.add("hidden");
    loadBetHistory();
};

async function loadWalletHistory() {
    const token = getAuthToken();
    if (!token) return;

    if (!historyContent) {
        console.error("historyContent element missing");
        return;
    }

    const res = await fetch(`${API}/wallet/history`, {
        headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();

    historyContent.innerHTML = `
        <table>
            <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Time</th>
            </tr>
            ${data.map(h => `
                <tr>
                    <td>${h.type}</td>
                    <td style="color:${h.amount < 0 ? 'red' : 'green'}">
                        ${h.amount}
                    </td>
                    <td>${new Date(h.time).toLocaleString()}</td>
                </tr>
            `).join("")}
        </table>
    `;
}

async function loadBetHistory() {
    const token = getAuthToken();
    if (!token) return;

    if (!historyContent) {
        console.error("historyContent element missing");
        return;
    }

    const res = await fetch(`${API}/bet/history`, {
        headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();

    historyContent.innerHTML = `
        <table>
            <tr>
                <th>Match</th>
                <th>Team</th>
                <th>Amount</th>
                <th>Status</th>
            </tr>
            ${data.map(b => `
                <tr>
                    <td>${b.matchId}</td>
                    <td>${b.selectedTeam}</td>
                    <td>${b.mainBet + b.hedgeBet}</td>
                    <td>${b.status}</td>
                </tr>
            `).join("")}
        </table>
    `;
}

setInterval(() => {
    document.querySelectorAll(".match-card").forEach(card => {
        const match = card.matchData;
        if (!match) return;

        const timerEl = card._timerEl || (card._timerEl = card.querySelector(".timer"));
        if (!timerEl) return;

        const now = new Date();
        const start = new Date(match.startTime);

        if (start <= now) {
            timerEl.innerText = "LIVE";
            timerEl.classList.add("live");
        } else {
            timerEl.innerText = getCountdown(match.startTime);
        }
    });
}, 1000);

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    loadMatches();
    setInterval(loadMatches, 60000); // refresh every 60s
});
