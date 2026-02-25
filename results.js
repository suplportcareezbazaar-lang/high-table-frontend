const API_BASE = "https://high-table-backend.onrender.com";
const API = API_BASE + "/api";

async function loadResults() {
    try {
        const res = await fetch(`${API}/results/global`);
        const data = await res.json();

        const container = document.getElementById("resultsContainer");

        if (!data.length) {
            container.innerHTML = "<p>No results available.</p>";
            return;
        }

        container.innerHTML = `
            <table style="width:100%;border-collapse:collapse">
                <tr>
                    <th>Match</th>
                    <th>Winner</th>
                    <th>Date</th>
                </tr>
                ${data.map(r => `
                    <tr>
                        <td>${r.matchName || r._id}</td>
                        <td style="color:lime">${r.winnerTeam}</td>
                        <td>${r.settledAt ? new Date(r.settledAt).toLocaleString() : "-"}</td>
                    </tr>
                `).join("")}
            </table>
        `;

    } catch (err) {
        console.error(err);
    }
}

loadResults();
