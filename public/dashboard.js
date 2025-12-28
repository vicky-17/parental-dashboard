const USER_ID = localStorage.getItem('g4_userId');
if(!USER_ID) window.location.href = '/index.html';

let map = L.map('map').setView([0,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let markers = L.layerGroup().addTo(map);

// 1. Load Device List
async function loadDevices() {
    const res = await fetch(`/api/devices?action=list&userId=${USER_ID}`);
    const devices = await res.json();
    
    const select = document.getElementById('deviceSelect');
    select.innerHTML = '<option value="">Select a Child...</option>';
    
    devices.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d._id;
        opt.innerText = d.name;
        select.appendChild(opt);
    });
}

// 2. Generate Pairing Code
async function openPairingModal() {
    const name = prompt("Name for this device (e.g. John's Phone):");
    if(!name) return;

    const res = await fetch(`/api/devices?action=generate_code`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: USER_ID, name: name })
    });
    const data = await res.json();
    
    document.getElementById('generatedCode').innerText = data.code;
    document.getElementById('pairingModal').style.display = 'flex';
    
    // Refresh list after closing to see new device
}

function closeModal() {
    document.getElementById('pairingModal').style.display = 'none';
    loadDevices();
}


// 1. LOAD SETTINGS
async function switchDevice() {
    currentDeviceId = document.getElementById('deviceSelect').value;
    if(!currentDeviceId) return;

    // A. Load App List (Rules)
    const resApps = await fetch(`/api/apps?deviceId=${currentDeviceId}`);
    const apps = await resApps.json();
    renderAppList(apps);

    // B. Load Global Settings (Intervals)
    const resSettings = await fetch(`/api/settings?deviceId=${currentDeviceId}`);
    const data = await resSettings.json();
    
    // Update the UI inputs with current database values
    if (data.settings) {
        document.getElementById('locInterval').value = data.settings.locationInterval || 60000;
        document.getElementById('appInterval').value = data.settings.appSyncInterval || 300000;
        currentSettings = data.settings;
    }
}

// 2. SAVE SETTINGS (The Time Gaps)
async function saveGlobalSettings() {
    if(!currentDeviceId) return;

    const locInt = document.getElementById('locInterval').value;
    const appInt = document.getElementById('appInterval').value;
    const btn = document.getElementById('btnSaveSettings');

    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        await fetch(`/api/settings?deviceId=${currentDeviceId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                locationInterval: locInt,
                appSyncInterval: appInt
            })
        });
        alert("✅ Intervals Updated! Phone will sync shortly.");
    } catch (e) {
        alert("❌ Error: " + e.message);
    } finally {
        btn.innerText = "Save Intervals";
        btn.disabled = false;
    }
}

function updateMap(logs) {
    markers.clearLayers();
    if(logs.length === 0) return;

    const latest = logs[0];
    document.getElementById('battery').innerText = latest.batteryLevel;
    document.getElementById('lastSeen').innerText = new Date(latest.timestamp).toLocaleTimeString();

    const latlng = [latest.latitude, latest.longitude];
    L.marker(latlng).addTo(markers);
    map.setView(latlng, 15);
}

function logout() {
    localStorage.removeItem('g4_userId');
    window.location.href = '/index.html';
}

loadDevices();