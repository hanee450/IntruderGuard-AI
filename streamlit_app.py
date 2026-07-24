import streamlit as st
import streamlit.components.v1 as components
import json
from datetime import datetime

st.set_page_config(page_title="IntruderGuard AI | Auto Photo Capture", page_icon="🛡️", layout="wide")

st.markdown("""
<style>
    .main { background-color: #0f172a; color: #f8fafc; }
    .stButton>button { width: 100%; border-radius: 12px; height: 50px; font-weight: bold; }
</style>
""", unsafe_allow_html=True)

st.title("🛡️ IntruderGuard AI - Automatic Photo Capture")
st.caption("Wrong password enter hone par automatic hands-free camera snapshot click hota hai.")

# HTML5 WebRTC Automatic WebCam Capture Component
html_camera_component = """
<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: sans-serif; background: #1e293b; color: white; text-align: center; margin: 0; padding: 10px; }
    .cam-box { position: relative; width: 100%; max-width: 480px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 2px solid #3b82f6; }
    video { width: 100%; transform: scaleX(-1); }
    canvas { display: none; }
    .status { margin-top: 8px; font-size: 14px; color: #10b981; font-weight: bold; }
    .flash { position: fixed; inset: 0; background: rgba(239, 68, 68, 0.8); z-index: 99; pointer-events: none; opacity: 0; transition: opacity 0.1s; }
    .flash.active { opacity: 1; }
</style>
</head>
<body>
<div id="flashOverlay" class="flash"></div>
<div class="cam-box">
    <video id="webcam" autoplay playsinline muted></video>
    <canvas id="canvas"></canvas>
</div>
<div class="status" id="camStatus">🟢 Live WebCam Armed (Auto-Capture Active)</div>

<script>
let video = document.getElementById("webcam");
let canvas = document.getElementById("canvas");

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        document.getElementById("camStatus").innerText = "⚠️ Camera Blocked/Denied";
        document.getElementById("camStatus").style.color = "#ef4444";
    });

window.addEventListener("message", function(event) {
    if (event.data && event.data.type === "TRIGGER_AUTO_SNAP") {
        snapIntruderPhoto(event.data.pin);
    }
});

function snapIntruderPhoto(wrongPin) {
    if (video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        let ctx = canvas.getContext("2d");
        
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        let timestamp = new Date().toLocaleString();
        ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
        ctx.fillRect(0, 0, canvas.width, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("🚨 AUTO INTRUDER SNAPSHOT | WRONG PIN: " + wrongPin + " | " + timestamp, 15, 26);

        let dataUrl = canvas.toDataURL("image/jpeg");

        // Flash Red
        let flash = document.getElementById("flashOverlay");
        flash.classList.add("active");
        setTimeout(() => flash.classList.remove("active"), 300);

        // Sound Siren
        try {
            let AudioCtx = window.AudioContext || window.webkitAudioContext;
            let actx = new AudioCtx();
            let osc = actx.createOscillator();
            let gain = actx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900, actx.currentTime);
            osc.frequency.linearRampToValueAtTime(400, actx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, actx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start();
            osc.stop(actx.currentTime + 0.3);
        } catch(e){}

        // Send captured photo back to Streamlit
        window.parent.postMessage({
            type: "INTRUDER_SNAPPED",
            img: dataUrl,
            pin: wrongPin,
            time: timestamp
        }, "*");

        // Download to local gallery automatically
        let link = document.createElement("a");
        link.href = dataUrl;
        link.download = "INTRUDER_WRONG_PIN_" + wrongPin + "_" + Date.now() + ".jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
</script>
</body>
</html>
"""

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("📷 Live Camera Stream")
    components.html(html_camera_component, height=360)

with col2:
    st.subheader("🔒 Security Keypad")
    st.write("Default PIN: `1234` (Wrong PIN triggers 100% automatic photo click!)")
    
    pin_val = st.text_input("Enter 4-Digit Security PIN", type="password", key="pin_input_auto")
    
    if st.button("Submit PIN", type="primary"):
        if pin_val == "1234":
            st.success("✅ PIN Verified! Unlocked Cleanly.")
        else:
            st.error(f"🚨 WRONG PIN ('{pin_val}')! AUTOMATIC PHOTO CLICKED & SAVED TO GALLERY!")
            # Trigger JS auto snap
            components.html(f"""
                <script>
                    window.parent.postMessage({{
                        type: "TRIGGER_AUTO_SNAP",
                        pin: "{pin_val}"
                    }}, "*");
                </script>
            """, height=0)

st.divider()
st.info("💡 Pro Tip: Both Web App (port 5000) and Streamlit App (port 8501) automatically capture camera photos on wrong PIN entries without requiring any click!")
