const API_BASE = "https://high-table-backend.onrender.com";
const API = API_BASE + "/api";

async function loadResults(sport = "cricket") {

    try {

        const res = await fetch(`${API}/results/global?sport=${sport}`);
        const data = await res.json();

        const container = document.getElementById("resultsContainer");

        if (!data.length) {
            container.innerHTML = "<p class='no-data'>No results available.</p>";
            return;
        }

        /* ===== FILTER LAST 7 DAYS ===== */

        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);

        const filtered = data.filter(r => {
            const matchDate = new Date(r.date);
            return matchDate >= weekAgo && matchDate <= now;
        });

        if (!filtered.length) {
            container.innerHTML = "<p class='no-data'>No results in last 7 days.</p>";
            return;
        }

        container.innerHTML = `
            <table>
                <tr>
                    <th>Match</th>
                    <th>Winner</th>
                    <th>Date</th>
                </tr>

                ${filtered.map(r => `
                    <tr>
                        <td>${r.match}</td>
                        <td class="winner">${r.winner || "-"}</td>
                        <td>${new Date(r.date).toLocaleString()}</td>
                    </tr>
                `).join("")}

            </table>
        `;

    } catch (err) {

        console.error(err);

    }

}

/* default load */
loadResults("cricket");
