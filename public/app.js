// Initialize Map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker;

async function fetchData() {
    try {
        const response = await fetch('/api/location');
        const data = await response.json();

        if (!data || data.length === 0) {
            document.getElementById('status-indicator').innerText = "Waiting for data...";
            return;
        }

        const latest = data[0];

        // 1. Update Basic Stats with 12-Hour Format
        document.getElementById('deviceId').innerText = latest.deviceId || "Unknown";
        document.getElementById('batteryLevel').innerText = latest.batteryLevel + "%";
        
        // Time Formatting (12h format)
        const dateObj = new Date(latest.timestamp);
        const timeString = dateObj.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        document.getElementById('lastSeen').innerText = timeString;

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

            // Update View
            map.setView([lat, lng], 16);

            // Update "Open in Google Maps" Button
            const googleMapsBtn = document.getElementById('googleMapsBtn');
            googleMapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

            // Reverse Geocoding
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(res => res.json())
                .then(addressData => {
                    const address = addressData.display_name || "Unknown Location";
                    if(document.getElementById('addressField')) {
                        document.getElementById('addressField').innerText = address;
                    }
                });
        }

        // 3. Update App Usage List (Sorted by Time)
        const appListContainer = document.getElementById('appList');
        
        if (latest.appUsage && latest.appUsage.length > 0) {
            // Sort by 'minutes' descending
            const sortedApps = latest.appUsage.sort((a, b) => b.minutes - a.minutes);
            
            appListContainer.innerHTML = sortedApps
                .map(app => `
                    <div class="app-item">
                        <span class="app-name">${app.name}</span>
                        <span class="app-time">${app.duration}</span>
                    </div>
                `)
                .join('');
        } else {
            appListContainer.innerHTML = "<div class='app-item'>No usage data yet</div>";
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

// Refresh every 10 seconds
setInterval(fetchData, 10000);
fetchData();