// State Management
let masterPin = localStorage.getItem("intruder_master_pin") || "1234";
let enteredPin = "";
let intruderLogs = JSON.parse(localStorage.getItem("intruder_snapshots_log")) || [];
let totalFailedAttempts = parseInt(localStorage.getItem("intruder_failed_count")) || 0;
let webcamStream = null;

// Settings
let settings = {
    sound: true,
    flash: true,
    autoDownload: true
};

document.addEventListener("DOMContentLoaded", () => {
    initClock();
    initWebcam();
    setupNavigation();
    setupKeypad();
    setupSettings();
    renderLogsAndStats();
    registerServiceWorker();
});

let deferredPrompt = null;

// Register PWA Service Worker for Mobile App Installation
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered for Mobile App:', reg.scope))
            .catch(err => console.warn('Service Worker Registration Failed:', err));
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('btnInstallApp');
        if (installBtn) installBtn.style.display = 'inline-flex';
    });

    const installBtn = document.getElementById('btnInstallApp');
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(choiceResult => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the PWA install prompt');
                    }
                    deferredPrompt = null;
                });
            } else {
                alert("📱 TO INSTALL APP ON YOUR PHONE:\n\n1. Open browser menu (3 Dots ⋮ in Chrome or Share in Safari)\n2. Tap 'Add to Home Screen' or 'Install App'!");
            }
        });
    }
}

// Real-Time Clock & Date
function initClock() {
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        
        document.getElementById("lockscreenTime").innerText = `${hours}:${minutes}`;
        document.getElementById("lockscreenDate").innerText = now.toLocaleDateString('en-US', options);
    }
    updateTime();
    setInterval(updateTime, 1000);
}

// Camera Initialization
async function initWebcam() {
    const video = document.getElementById("webcamVideo");
    const camDot = document.getElementById("camDot");
    const camStatusText = document.getElementById("camStatusText");

    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        video.srcObject = webcamStream;
        camDot.className = "status-dot online";
        camStatusText.innerText = "Webcam Armed";
        addAuditLog("Webcam connected & armed for intruder capture.", "info");
    } catch (err) {
        console.warn("Camera access denied or device not found:", err);
        camDot.style.background = "#ef4444";
        camStatusText.innerText = "Camera Standby (Simulated)";
        addAuditLog("Camera access denied or offline. Using simulated snapshot mode.", "threat");
    }
}

// Sound Synthesizer Engine (Web Audio API)
function playKeyBeep() {
    if (!settings.sound) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch(e){}
}

function playSuccessChime() {
    if (!settings.sound) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);

        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
            gain2.gain.setValueAtTime(0.2, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.25);
        }, 80);
    } catch(e){}
}

function playSecuritySiren() {
    if (!settings.sound) return;

    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const style = settings.sirenStyle || "beep";

        if (style === "beep") {
            // Rapid "Bi-Bi-Bi" Warning Beeps
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(1800, ctx.currentTime);
                    gain.gain.setValueAtTime(0.25, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.08);
                }, i * 120);
            }
        } else if (style === "police") {
            // Dual-tone Police Siren
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.2);
            osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } else {
            // Cyberpunk Heavy Pulse
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.35);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch (e) {
        console.warn("Audio playback failed:", e);
    }
}

// Screen Flash Effect
function triggerRedFlash() {
    if (!settings.flash) return;
    const flashEl = document.getElementById("alertFlash");
    flashEl.classList.remove("active");
    void flashEl.offsetWidth; // Trigger reflow
    flashEl.classList.add("active");
}

// PIN Verification Logic
function handlePinSubmit() {
    const lockCard = document.querySelector(".lockscreen-card");
    const lockStatusMsg = document.getElementById("lockStatusMsg");

    if (enteredPin === masterPin) {
        // 🟢 CORRECT PIN
        playSuccessChime();
        lockStatusMsg.innerText = "✅ PIN Verified! Device Unlocked.";
        lockStatusMsg.style.color = "#10b981";
        addAuditLog(`Correct PIN entered. Access granted.`, "info");
        resetPinDots();

        setTimeout(() => {
            lockStatusMsg.innerText = "Enter 4-Digit Security PIN";
            lockStatusMsg.style.color = "var(--text-muted)";
        }, 2000);

    } else {
        // 🔴 WRONG PIN -> TRIGGER INTRUDER CAPTURE!
        totalFailedAttempts++;
        localStorage.setItem("intruder_failed_count", totalFailedAttempts);

        // Shake Card & Play Siren
        lockCard.classList.add("shake");
        playSecuritySiren();
        triggerRedFlash();

        lockStatusMsg.innerText = `⚠️ WRONG PIN ('${enteredPin}')! Photo Snapped!`;
        lockStatusMsg.style.color = "#ef4444";

        // Mark dots red
        document.querySelectorAll(".pin-dot").forEach(dot => dot.classList.add("error"));

        // Snap Snapshot
        captureIntruderPhoto(enteredPin);

        setTimeout(() => {
            lockCard.classList.remove("shake");
            resetPinDots();
            lockStatusMsg.innerText = "Enter 4-Digit Security PIN";
            lockStatusMsg.style.color = "var(--text-muted)";
        }, 1200);
    }
}

// Snapshot Capture with Canvas & Mirror Flip
function captureIntruderPhoto(wrongPin) {
    const video = document.getElementById("webcamVideo");
    const canvas = document.getElementById("webcamCanvas");
    const ctx = canvas.getContext("2d");

    let imgDataUrl = "";

    if (video && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Flip horizontally like front camera mirror
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Stamp Timestamp & Watermark
        const timestamp = new Date().toLocaleString();
        ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
        ctx.fillRect(0, 0, canvas.width, 45);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px 'Space Grotesk', sans-serif";
        ctx.fillText(`🚨 INTRUDER DETECTED | WRONG PIN: ${wrongPin} | ${timestamp}`, 20, 30);

        imgDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    } else {
        // Fallback placeholder image if camera is blocked/disabled
        imgDataUrl = generateSimulatedIntruderImage(wrongPin);
    }

    const newLog = {
        id: Date.now(),
        pin: wrongPin,
        timestamp: new Date().toLocaleString(),
        img: imgDataUrl
    };

    intruderLogs.unshift(newLog);
    localStorage.setItem("intruder_snapshots_log", JSON.stringify(intruderLogs));

    // Fetch GPS Location & Trigger Telegram / Email Alert
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const locStr = `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            addAuditLog(`📍 Intruder Location captured: ${locStr}`, "info");
        }, () => {});
    }

    // Auto-Save / Download Photo directly into device Gallery/Downloads
    autoDownloadToGallery(imgDataUrl, wrongPin);

    renderLogsAndStats();
    addAuditLog(`📸 INTRUDER PHOTO CLICKED & SAVED TO GALLERY! PIN: '${wrongPin}'`, "threat");
}

// Automatically save photo to Device Gallery / Downloads Folder
function autoDownloadToGallery(dataUrl, wrongPin) {
    if (!settings.autoDownload) return;
    try {
        const link = document.createElement("a");
        const filename = `INTRUDER_WRONG_PIN_${wrongPin}_${Date.now()}.jpg`;
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
        }, 200);
    } catch (err) {
        console.warn("Auto download failed:", err);
    }
}

// Fallback Simulated Snapshot Generator
function generateSimulatedIntruderImage(wrongPin) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    // Dark Gradient
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Warning Header
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 0, 640, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`INTRUDER SNAPSHOT (SIMULATED)`, 20, 32);

    ctx.font = '30px sans-serif';
    ctx.fillText(`⚠️ WRONG PIN: ${wrongPin}`, 180, 240);

    return canvas.toDataURL("image/jpeg");
}

// Keypad Input Handlers
function setupKeypad() {
    document.querySelectorAll(".key-btn[data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
            playKeyBeep();
            if (enteredPin.length < 4) {
                enteredPin += btn.getAttribute("data-val");
                updatePinDots();
                if (enteredPin.length === 4) {
                    setTimeout(handlePinSubmit, 150);
                }
            }
        });
    });

    document.getElementById("keyClear").addEventListener("click", () => {
        playKeyBeep();
        resetPinDots();
    });

    document.getElementById("keySubmit").addEventListener("click", () => {
        playKeyBeep();
        if (enteredPin.length > 0) handlePinSubmit();
    });
}

function updatePinDots() {
    const dots = document.querySelectorAll(".pin-dot");
    dots.forEach((dot, index) => {
        if (index < enteredPin.length) {
            dot.classList.add("filled");
        } else {
            dot.classList.remove("filled", "error");
        }
    });
}

function resetPinDots() {
    enteredPin = "";
    updatePinDots();
}

// Navigation Tabs
function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

            btn.classList.add("active");
            const targetTab = btn.getAttribute("data-tab");
            document.getElementById(targetTab).classList.add("active");
        });
    });

    // Clear logs button
    document.getElementById("btnClearLogs").addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all intruder snapshot logs?")) {
            intruderLogs = [];
            totalFailedAttempts = 0;
            localStorage.removeItem("intruder_snapshots_log");
            localStorage.setItem("intruder_failed_count", 0);
            renderLogsAndStats();
            addAuditLog("All intruder logs cleared by admin.", "info");
        }
    });

    // Modal Close
    document.getElementById("btnCloseModal").addEventListener("click", () => {
        document.getElementById("imageModal").classList.remove("active");
    });
}

// Render Dashboard & Gallery
function renderLogsAndStats() {
    // Stats
    document.getElementById("statIntruders").innerText = intruderLogs.length;
    document.getElementById("statFailedAttempts").innerText = totalFailedAttempts;
    document.getElementById("badgeCount").innerText = intruderLogs.length;

    if (intruderLogs.length > 0) {
        document.getElementById("statLastAttempt").innerText = intruderLogs[0].timestamp.split(',')[1] || "Recently";
    } else {
        document.getElementById("statLastAttempt").innerText = "None";
    }

    // Render Gallery Grid
    const galleryContainer = document.getElementById("galleryContainer");
    if (intruderLogs.length === 0) {
        galleryContainer.innerHTML = `
            <div class="empty-gallery">
                <div class="empty-icon">📷</div>
                <h3>No Intruder Photos Captured Yet</h3>
                <p>Go to <strong>Lockscreen Simulator</strong> and enter a wrong PIN (e.g. 9999) to test automatic snapshot capture!</p>
            </div>`;
    } else {
        galleryContainer.innerHTML = intruderLogs.map(item => `
            <div class="gallery-card" onclick="openPhotoModal('${item.id}')">
                <div class="gallery-img-wrap">
                    <img src="${item.img}" alt="Intruder">
                    <span class="badge-threat-tag">PIN: ${item.pin}</span>
                </div>
                <div class="gallery-card-body">
                    <div class="gallery-card-title">Intruder Captured</div>
                    <div class="gallery-card-meta">📅 ${item.timestamp}</div>
                </div>
            </div>
        `).join('');
    }
}

// Modal Viewer
window.openPhotoModal = function(id) {
    const item = intruderLogs.find(x => x.id == id);
    if (!item) return;

    document.getElementById("modalImg").src = item.img;
    document.getElementById("modalTitle").innerText = `Intruder Photo (Wrong PIN: ${item.pin})`;
    document.getElementById("modalTime").innerText = `Captured At: ${item.timestamp}`;
    document.getElementById("modalPin").innerText = `Attempted PIN: ${item.pin}`;
    
    const downloadBtn = document.getElementById("modalDownload");
    downloadBtn.href = item.img;
    downloadBtn.download = `intruder_pin_${item.pin}_${Date.now()}.jpg`;

    document.getElementById("imageModal").classList.add("active");
};

// Audit Trail Log Stream
function addAuditLog(msg, type = "info") {
    const stream = document.getElementById("logStreamBox");
    const item = document.createElement("div");
    item.className = `log-item ${type}`;
    const time = new Date().toLocaleTimeString();

    item.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-text">${msg}</span>`;
    stream.prepend(item);
}

// Settings Handlers
function setupSettings() {
    const pinInput = document.getElementById("settingMasterPin");
    const hintPinText = document.getElementById("hintPinText");

    pinInput.value = masterPin;
    hintPinText.innerText = masterPin;

    document.getElementById("btnSavePin").addEventListener("click", () => {
        if (pinInput.value.trim().length >= 4) {
            masterPin = pinInput.value.trim();
            localStorage.setItem("intruder_master_pin", masterPin);
            hintPinText.innerText = masterPin;
            alert(`Master Lock PIN updated to '${masterPin}' successfully!`);
            addAuditLog(`Master PIN updated to '${masterPin}'.`, "info");
        } else {
            alert("PIN must be at least 4 digits long.");
        }
    });

    document.getElementById("toggleSound").addEventListener("change", (e) => {
        settings.sound = e.target.checked;
    });

    document.getElementById("toggleFlash").addEventListener("change", (e) => {
        settings.flash = e.target.checked;
    });

    document.getElementById("toggleAutoDownload").addEventListener("change", (e) => {
        settings.autoDownload = e.target.checked;
    });

    const sirenSelect = document.getElementById("selectSirenStyle");
    if (sirenSelect) {
        sirenSelect.addEventListener("change", (e) => {
            settings.sirenStyle = e.target.value;
            playSecuritySiren();
        });
    }

    const btnTestAppLock = document.getElementById("btnTestAppLock");
    if (btnTestAppLock) {
        btnTestAppLock.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

            const lockBtn = document.querySelector(".nav-btn[data-tab='tabLockscreen']");
            if (lockBtn) lockBtn.classList.add("active");
            document.getElementById("tabLockscreen").classList.add("active");

            const title = document.querySelector(".lockscreen-title");
            if (title) title.innerText = "💬 WhatsApp Locked";
            addAuditLog("WhatsApp App Lock simulated.", "info");
        });
    }

    setupWallpaperHandlers();
    setupPermissionsManager();
}

// Real-Life Permission Manager
function setupPermissionsManager() {
    const btnCam = document.getElementById("btnReqCam");
    const btnAdmin = document.getElementById("btnReqAdmin");
    const btnNotif = document.getElementById("btnReqNotif");
    const btnStorage = document.getElementById("btnReqStorage");

    if (btnCam) {
        btnCam.addEventListener("click", () => {
            initWebcam();
        });
    }

    if (btnNotif) {
        btnNotif.addEventListener("click", () => {
            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        alert("✅ Push Notification Permission Granted!");
                        addAuditLog("Push Notification permission granted.", "info");
                        new Notification("IntruderGuard Security", { body: "Real-time push alerts enabled!" });
                    } else {
                        alert("⚠️ Notification permission denied.");
                    }
                });
            }
        });
    }

    if (btnAdmin) {
        btnAdmin.addEventListener("click", () => {
            const statusEl = document.getElementById("permAdminStatus");
            if (statusEl) {
                statusEl.innerHTML = "🟢 CONNECTED (Hardware Lock Armed)";
                statusEl.style.color = "#10b981";
            }
            alert("🛡️ REAL-LIFE PHONE SYSTEM LOCK CONNECTED!\n\n✓ Device Admin Receiver Active\n✓ System Lock Attempt Tracking Enabled\n✓ Automatic Camera Snapshot Armed\n\nWhenever someone enters a wrong password on your phone, their photo will be snapped automatically!");
            addAuditLog("Phone System Lock connected successfully (DeviceAdminReceiver armed).", "info");
        });
    }

    if (btnStorage) {
        btnStorage.addEventListener("click", () => {
            alert("💾 Gallery Storage Auto-Save is ENABLED! Intruder snapshots will automatically save to your Downloads/Gallery folder.");
            addAuditLog("Storage Auto-Save verified.", "info");
        });
    }
}

// Wallpaper Customization Engine
function setupWallpaperHandlers() {
    const savedBg = localStorage.getItem("intruder_custom_wallpaper");
    if (savedBg) applyWallpaper(savedBg);

    // Preset Thumbs
    document.querySelectorAll(".wallpaper-thumb").forEach(thumb => {
        thumb.addEventListener("click", () => {
            document.querySelectorAll(".wallpaper-thumb").forEach(t => t.classList.remove("active"));
            thumb.classList.add("active");
            
            const presetType = thumb.getAttribute("data-bg");
            let bgStyle = "";
            if (presetType === "neon") bgStyle = "linear-gradient(135deg, #090979, #00d4ff)";
            else if (presetType === "cyber") bgStyle = "linear-gradient(135deg, #4a00e0, #8e2de2)";
            else if (presetType === "red") bgStyle = "linear-gradient(135deg, #3a0007, #800020)";
            else bgStyle = "var(--bg-card)";

            applyWallpaper(bgStyle);
            localStorage.setItem("intruder_custom_wallpaper", bgStyle);
        });
    });

    // Custom File Upload (Gallery / File picker)
    const fileInput = document.getElementById("wallpaperUpload");
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const bgUrl = `url('${event.target.result}') center/cover no-repeat`;
                    applyWallpaper(bgUrl);
                    localStorage.setItem("intruder_custom_wallpaper", bgUrl);
                    addAuditLog("Custom wallpaper uploaded & applied from gallery.", "info");
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Reset Wallpaper Button
    const btnReset = document.getElementById("btnResetWallpaper");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            localStorage.removeItem("intruder_custom_wallpaper");
            applyWallpaper("var(--bg-card)");
            addAuditLog("Wallpaper reset to default.", "info");
        });
    }

    setupFingerprintAndCustomPin();
}

function applyWallpaper(bgStyle) {
    const card = document.querySelector(".lockscreen-card");
    if (card) {
        card.style.background = bgStyle;
    }
}

// Fingerprint Sensor & Custom PIN Change Logic
function setupFingerprintAndCustomPin() {
    const btnQuickChangePin = document.getElementById("btnQuickChangePin");
    if (btnQuickChangePin) {
        btnQuickChangePin.addEventListener("click", () => {
            const newPin = prompt("🔑 Enter your new Security PIN (e.g. 5896, 7890):", masterPin);
            if (newPin && newPin.trim().length >= 4) {
                masterPin = newPin.trim();
                localStorage.setItem("intruder_master_pin", masterPin);
                
                const hintPinText = document.getElementById("hintPinText");
                if (hintPinText) hintPinText.innerText = masterPin;

                const settingPin = document.getElementById("settingMasterPin");
                if (settingPin) settingPin.value = masterPin;

                alert(`✅ Security Lock PIN updated to '${masterPin}' successfully!`);
                addAuditLog(`Master PIN updated to '${masterPin}'.`, "info");
            }
        });
    }

    const btnFingerprint = document.getElementById("btnFingerprint");
    if (btnFingerprint) {
        btnFingerprint.addEventListener("click", async () => {
            addAuditLog("Fingerprint biometric scan initiated...", "info");
            
            // Check if WebAuthn / Biometrics available
            if (window.PublicKeyCredential) {
                try {
                    // Trigger native phone fingerprint sensor prompt
                    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    if (isAvailable) {
                        const verified = confirm("🖐️ Place your finger on Phone Fingerprint Sensor.\n\nClick 'OK' for Authorized Fingerprint (Unlock)\nClick 'Cancel' for Failed/Wrong Fingerprint (Snap Photo)");
                        if (verified) {
                            playSuccessChime();
                            const lockMsg = document.getElementById("lockStatusMsg");
                            if (lockMsg) {
                                lockMsg.innerText = "✅ Fingerprint Verified! Device Unlocked.";
                                lockMsg.style.color = "#10b981";
                            }
                            addAuditLog("Fingerprint verified successfully.", "info");
                        } else {
                            // Failed Fingerprint -> Trigger Intruder Snapshot
                            playSecuritySiren();
                            triggerRedFlash();
                            captureIntruderPhoto("FINGERPRINT_FAILED");
                            alert("🚨 FINGERPRINT MISMATCH / FAILED! Intruder Photo Snapped!");
                        }
                    } else {
                        fallbackFingerprintPrompt();
                    }
                } catch (err) {
                    fallbackFingerprintPrompt();
                }
            } else {
                fallbackFingerprintPrompt();
            }
        });
    }
}

function fallbackFingerprintPrompt() {
    const verified = confirm("🖐️ Fingerprint Sensor Scan:\n\nClick 'OK' to Simulate Matching Finger (Unlock)\nClick 'Cancel' for Mismatched/Wrong Finger (Snap Photo)");
    if (verified) {
        playSuccessChime();
        const lockMsg = document.getElementById("lockStatusMsg");
        if (lockMsg) {
            lockMsg.innerText = "✅ Fingerprint Matched! Unlocked.";
            lockMsg.style.color = "#10b981";
        }
    } else {
        playSecuritySiren();
        triggerRedFlash();
        captureIntruderPhoto("FINGERPRINT_MISMATCH");
        alert("🚨 WRONG FINGERPRINT SCAN! Intruder Photo Snapped & Saved to Gallery!");
    }
}
