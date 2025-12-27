// Initialize Map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Layer Groups to manage markers easier
const historyLayer = L.layerGroup().addTo(map);
let latestMarker;
let pathPolyline;

// We assume a fixed Device ID for now (as per your Android code)
const DEVICE_ID = "child-phone-1";

// --- CORE FUNCTIONS ---

async function fetchData() {
    try {
        const response = await fetch('/api/location'); // Returns last 20 logs
        const data = await response.json();

        if (!data || data.length === 0) {
            document.getElementById('status-indicator').innerText = "No Data";
            document.getElementById('status-indicator').className = "status offline";
            return;
        }

        document.getElementById('status-indicator').innerText = "Online";
        document.getElementById('status-indicator').className = "status online";

        const latest = data[0]; // The most recent log

        // 1. Update Basic Stats
        document.getElementById('deviceId').innerText = latest.deviceId || "Unknown";
        document.getElementById('batteryLevel').innerText = latest.batteryLevel + "%";
        
        const dateObj = new Date(latest.timestamp);
        document.getElementById('lastSeen').innerText = dateObj.toLocaleTimeString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
        });

        // 2. Map & History Logic
        updateMap(data);

        // 3. Update App Usage
        // Since the new Android code sends 'apps' as null in some requests, 
        // we look for the most recent log that actually HAS app usage.
        const logWithApps = data.find(log => log.appUsage && log.appUsage.length > 0);
        updateAppList(logWithApps ? logWithApps.appUsage : null);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function updateMap(logs) {
    // Clear old history lines/dots
    historyLayer.clearLayers();
    if (pathPolyline) map.removeLayer(pathPolyline);

    const latlngs = [];

    // Process logs in reverse (oldest -> newest) for correct line drawing
    const historyLogs = [...logs].reverse(); 

    historyLogs.forEach(log => {
        if (log.latitude && log.longitude) {
            latlngs.push([log.latitude, log.longitude]);
            
            // Add small dots for history
            L.circleMarker([log.latitude, log.longitude], {
                radius: 4,
                color: '#6b7280',
                fillColor: '#9ca3af',
                fillOpacity: 0.7
            }).addTo(historyLayer);
        }
    });

    if (latlngs.length > 0) {
        const latestPos = latlngs[latlngs.length - 1];

        // 1. Draw Red Path Line
        pathPolyline = L.polyline(latlngs, { color: 'red', weight: 3, opacity: 0.6, dashArray: '5, 10' }).addTo(map);

        // 2. Update Main Marker (Latest)
        if (latestMarker) {
            latestMarker.setLatLng(latestPos);
        } else {
            latestMarker = L.marker(latestPos).addTo(map);
            map.setView(latestPos, 16); // Center only on first load
        }

        // 3. Update Google Maps Link
        document.getElementById('googleMapsBtn').href = `https://www.google.com/maps/search/?api=1&query=${latestPos[0]},${latestPos[1]}`;

        // 4. Reverse Geocode (Address)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latestPos[0]}&lon=${latestPos[1]}`)
            .then(res => res.json())
            .then(addr => {
                document.getElementById('addressField').innerText = addr.display_name || "Unknown Address";
            });
    }
}

function updateAppList(apps) {
    const container = document.getElementById('appList');
    
    if (!apps || apps.length === 0) {
        // Don't clear if we just have a missing packet, only if genuinely no data ever
        if(container.innerHTML.includes("Waiting")) container.innerHTML = "<div class='app-item'>No usage data found recently</div>";
        return; 
    }

    const sortedApps = apps.sort((a, b) => b.minutes - a.minutes);
    container.innerHTML = sortedApps
        .map(app => `
            <div class="app-item">
                <span class="app-name">${app.name}</span>
                <span class="app-time">${app.duration}</span>
            </div>
        `).join('');
}

// --- SETTINGS FUNCTIONS ---

async function loadSettings() {
    try {
        const res = await fetch(`/api/settings?deviceId=${DEVICE_ID}`);
        const settings = await res.json();
        
        if (settings && settings.locationInterval) {
            document.getElementById('intervalSelect').value = settings.locationInterval;
        }
    } catch (e) {
        console.error("Error loading settings", e);
    }
}

async function saveSettings() {
    const interval = document.getElementById('intervalSelect').value;
    const btn = document.getElementById('saveBtn');
    const status = document.getElementById('saveStatus');

    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
        await fetch(`/api/settings?deviceId=${DEVICE_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locationInterval: parseInt(interval) })
        });
        
        status.innerText = "✅ Saved! Phone will update on next wake.";
        status.style.color = "green";
    } catch (e) {
        status.innerText = "❌ Error saving.";
        status.style.color = "red";
    } finally {
        btn.disabled = false;
        btn.innerText = "Save Settings";
        setTimeout(() => status.innerText = "", 5000);
    }
}

// Init
setInterval(fetchData, 10000); // Refresh data every 10s
fetchData();
loadSettings(); // Load settings once on startup