// Map Initialization (Default view: World)
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker; // To store the single marker

async function fetchData() {
    try {
        // 1. Fetch data from YOUR existing Vercel API
        const response = await fetch('/api/location'); 
        const data = await response.json();

        if (!data || data.length === 0) {
            document.getElementById('status-indicator').innerText = "No Data Yet";
            return;
        }

        const latest = data[0]; // The most recent log

        // 2. Update Stats Panel
        document.getElementById('deviceId').innerText = latest.deviceId || "Unknown";
        document.getElementById('batteryLevel').innerText = (latest.batteryLevel || "--") + "%";
        document.getElementById('isCharging').innerText = latest.isCharging ? "⚡ Yes" : "No";
        
        // Format Date
        const date = new Date(latest.timestamp);
        document.getElementById('lastSeen').innerText = date.toLocaleString();

        // 3. Update Status Indicator (Online if seen < 5 mins ago)
        const now = new Date();
        const diffMinutes = (now - date) / 1000 / 60;
        const statusEl = document.getElementById('status-indicator');
        if (diffMinutes < 5) {
            statusEl.className = "status online";
            statusEl.innerText = "Online";
        } else {
            statusEl.className = "status offline";
            statusEl.innerText = "Offline (" + Math.round(diffMinutes) + "m ago)";
        }

        // 4. Update Map
        const lat = latest.latitude;
        const lng = latest.longitude;

        if (lat && lng) {
            // Update Google Maps Link
            document.getElementById('gmaps-link').href = `https://www.google.com/maps?q=${lat},${lng}`;

            // Move Marker
            if (marker) {
                marker.setLatLng([lat, lng]);
            } else {
                marker = L.marker([lat, lng]).addTo(map);
            }
            
            // Only center map on the very first load to avoid annoying the user
            // if (firstLoad) { map.setView([lat, lng], 15); firstLoad = false; }
        }

        // 5. Update History Table
        const tableBody = document.getElementById('history-table-body');
        tableBody.innerHTML = ''; // Clear old data
        
        data.forEach(log => {
            const row = `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td>${log.batteryLevel}%</td>
                    <td>${log.latitude.toFixed(5)}, ${log.longitude.toFixed(5)}</td>
                    <td><a href="https://www.google.com/maps?q=${log.latitude},${log.longitude}" target="_blank">View</a></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Center map button logic
function centerMap() {
    if (marker) {
        map.setView(marker.getLatLng(), 15);
    }
}

// Auto-refresh every 5 seconds
setInterval(fetchData, 5000);
fetchData(); // Run immediately on load