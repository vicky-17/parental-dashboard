// Initialize Map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker;
let firstZoom = true; // To track if we should zoom in initially

async function fetchData() {
    try {
        const response = await fetch('/api/location');
        const data = await response.json();

        if (!data || data.length === 0) {
            document.getElementById('status-indicator').innerText = "Waiting for data...";
            return;
        }

        const latest = data[0];

        // 1. Update Basic Stats (Real Battery)
        document.getElementById('deviceId').innerText = latest.deviceId || "Unknown";
        document.getElementById('batteryLevel').innerText = latest.batteryLevel + "%";
        document.getElementById('lastSeen').innerText = new Date(latest.timestamp).toLocaleTimeString();

        // 2. Map & Location Logic
        const lat = latest.latitude;
        const lng = latest.longitude;

        if (lat && lng) {
            // Update Marker
            if (marker) {
                marker.setLatLng([lat, lng]);
            } else {
                marker = L.marker([lat, lng]).addTo(map);
            }

            // ZOOM to location (Auto-center)
            // If it's the first load, or if you want it to always follow the child:
            map.setView([lat, lng], 16); // 16 is a high zoom level (street view)

            // 3. Get Human Readable Address (Reverse Geocoding)
            // We use OpenStreetMap Nominatim API (Free)
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(res => res.json())
                .then(addressData => {
                    const address = addressData.display_name || "Unknown Location";
                    // Display this address in the UI (You need to add an element with ID 'addressField' in index.html)
                    if(document.getElementById('addressField')) {
                        document.getElementById('addressField').innerText = address;
                    }
                });
        }

        // 4. Update App Usage List
        const appListContainer = document.getElementById('appList');
        if (latest.appUsage && latest.appUsage.length > 0) {
            appListContainer.innerHTML = latest.appUsage
                .map(app => `<div class="app-item">${app}</div>`)
                .join('');
        } else {
            appListContainer.innerHTML = "<div class='app-item'>No usage data yet</div>";
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

// Refresh every 10 seconds (Dashboard doesn't need to ping as fast as the phone sends)
setInterval(fetchData, 10000);
fetchData();