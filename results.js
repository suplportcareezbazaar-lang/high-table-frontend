const API_BASE = "https://high-table-backend.onrender.com";
const API = API_BASE + "/api";

async function loadResults(sport) {

    try {

        const res = await fetch(`${API}/results/global?sport=${sport}`);

        const data = await res.json();

        const container = document.getElementById("resultsContainer");

        if (!data.length) {
            container.innerHTML = "<p class='no-data'>No results available.</p>";
            return;
        }

        container.innerHTML = `
            <table>
                <tr>
                    <th>Match</th>
                    <th>Winner</th>
                    <th>Date</th>
                </tr>

                ${data.map(r => `
                    <tr>
                        <td>${r.match}</td>
                        <td class="winner">${r.winner}</td>
                        <td>${r.date}</td>
                    </tr>
                `).join("")}

            </table>
        `;

    } catch (err) {

        console.error(err);

    }

}

loadResults();
