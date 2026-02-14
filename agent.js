const API = "http://localhost:3000/api";
const token = localStorage.getItem("agentToken");

if (!token) {
    alert("Agent login required");
    location.href = "index.html";
}

function authFetch(url) {
    return fetch(url, {
        headers: {
            Authorization: "Bearer " + token
        }
    }).then(r => r.json());
}

function loadTree() {
    authFetch(`${API}/agent/downlines`).then(list => {
        const box = document.getElementById("downlineContainer");
        box.innerHTML = "";

        if (!list.length) {
            box.innerHTML = "<p>No downlines yet</p>";
            return;
        }

        list.forEach(d => {
            const active = d.totalBet > 0;

            const div = document.createElement("div");
            div.className = "node downline";
            div.innerHTML = `
        <h4>${d.maskedId}</h4>
        <p>Bet: ₹${d.totalBet}</p>
        <p>Commission: ₹${d.commission}</p>
        <p style="color:${active ? '#00ff99' : '#ff4d4d'}">
          ${active ? 'Active' : 'Inactive'}
        </p>
      `;
            box.appendChild(div);
        });
    });
}

function logout() {
    localStorage.removeItem("agentToken");
    location.href = "index.html";
}

// Auto-load
loadTree();
