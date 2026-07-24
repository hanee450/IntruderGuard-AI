import streamlit as st
import cv2
import numpy as np
from datetime import datetime
from PIL import Image
import os

st.set_page_config(page_title="IntruderGuard AI | Security Portal", page_icon="🛡️", layout="centered")

st.title("🛡️ IntruderGuard AI Security Portal")
st.caption("Wrong Password Intruder Photo Capture System")

if "intruder_photos" not in st.session_state:
    st.session_state["intruder_photos"] = []

st.sidebar.header("🔑 Master Security Controls")
master_pin = st.sidebar.text_input("Set Master Lock PIN", value="1234", type="password")

st.markdown("### 🔒 System Locked")
st.write("Enter 4-Digit Security PIN below to unlock.")

pin_input = st.text_input("Enter Security PIN", type="password", key="pin_key")

if st.button("Unlock Device", type="primary"):
    if pin_input == master_pin:
        st.success("✅ Access Granted! Device Unlocked Cleanly.")
    else:
        st.error(f"🚨 WRONG PIN ENTERED ('{pin_input}')! Snaphot Captured!")
        
        # Capture Camera Frame via WebRTC / Camera Input
        img_file = st.camera_input("Intruder Selfie Verification")
        if img_file is not None:
            image = Image.open(img_file)
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            st.session_state["intruder_photos"].append({
                "time": timestamp,
                "pin": pin_input,
                "img": image
            })
            st.warning(f"📸 Intruder Photo Captured at {timestamp}")

st.divider()
st.subheader("📷 Captured Intruder Snapshots Log")

if len(st.session_state["intruder_photos"]) == 0:
    st.info("No wrong password attempts recorded yet.")
else:
    for idx, item in enumerate(st.session_state["intruder_photos"]):
        cols = st.columns([1, 2])
        with cols[0]:
            st.image(item["img"], use_column_width=True)
        with cols[1]:
            st.error(f"**Intruder #{idx+1}**")
            st.write(f"**Attempted PIN:** `{item['pin']}`")
            st.write(f"**Timestamp:** `{item['time']}`")
