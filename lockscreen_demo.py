import cv2
import tkinter as tk
from tkinter import messagebox
import os
import sys
import time
import subprocess
import winsound
from datetime import datetime

# Setup Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT_DIR = os.path.join(BASE_DIR, "snapshots")
if not os.path.exists(SNAPSHOT_DIR):
    os.makedirs(SNAPSHOT_DIR)

CORRECT_PIN = "1234"

def show_windows_notification(title, message):
    try:
        ps_script = f"""
        [void] [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Warning
        $notify.BalloonTipIcon = 'Warning'
        $notify.BalloonTipText = '{message}'
        $notify.BalloonTipTitle = '{title}'
        $notify.Visible = $true
        $notify.ShowBalloonTip(5000)
        """
        subprocess.Popen(["powershell", "-Command", ps_script], creationflags=subprocess.CREATE_NO_WINDOW)
    except Exception:
        pass

def capture_intruder_photo(entered_pin):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Camera not found.")
        return None

    # Warm up camera for high quality capture
    for _ in range(5):
        ret, frame = cap.read()

    ret, frame = cap.read()
    cap.release()

    if ret and frame is not None:
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape

        # Add Intruder Warning Stamp
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.rectangle(frame, (0, 0), (w, 50), (0, 0, 180), -1)
        cv2.putText(frame, f"INTRUDER PHOTO - WRONG PIN: {entered_pin} | {timestamp_str}", (15, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        file_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        snapshot_filename = f"wrong_pin_intruder_{file_timestamp}.jpg"
        snapshot_path = os.path.join(SNAPSHOT_DIR, snapshot_filename)

        cv2.imwrite(snapshot_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return snapshot_path
    return None

class LockscreenDemoApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Security Lockscreen Demo")
        self.root.geometry("400x520")
        self.root.configure(bg="#0f172a")
        self.root.resizable(False, False)

        self.entered_pin = ""

        # UI Components
        title_label = tk.Label(root, text="🔒 DEVICE LOCKED", font=("Helvetica", 18, "bold"), fg="#f8fafc", bg="#0f172a")
        title_label.pack(pady=(30, 5))

        subtitle_label = tk.Label(root, text="Enter PIN (Correct: 1234)\nWrong PIN will capture intruder photo!", font=("Helvetica", 10), fg="#94a3b8", bg="#0f172a")
        subtitle_label.pack(pady=(0, 20))

        # PIN Display Dots
        self.pin_display = tk.Label(root, text="◯  ◯  ◯  ◯", font=("Helvetica", 24), fg="#3b82f6", bg="#0f172a")
        self.pin_display.pack(pady=10)

        self.status_label = tk.Label(root, text="Ready", font=("Helvetica", 11), fg="#cbd5e1", bg="#0f172a")
        self.status_label.pack(pady=10)

        # PIN Keypad
        pad_frame = tk.Frame(root, bg="#0f172a")
        pad_frame.pack(pady=10)

        buttons = [
            ('1', 0, 0), ('2', 0, 1), ('3', 0, 2),
            ('4', 1, 0), ('5', 1, 1), ('6', 1, 2),
            ('7', 2, 0), ('8', 2, 1), ('9', 2, 2),
            ('C', 3, 0), ('0', 3, 1), ('✓', 3, 2)
        ]

        for (text, row, col) in buttons:
            btn = tk.Button(
                pad_frame, text=text, font=("Helvetica", 14, "bold"),
                width=5, height=2, bg="#1e293b", fg="#f8fafc", activebackground="#334155", activeforeground="#ffffff",
                bd=0, relief="flat", command=lambda t=text: self.on_button_click(t)
            )
            btn.grid(row=row, column=col, padx=8, pady=8)

    def on_button_click(self, char):
        if char == 'C':
            self.entered_pin = ""
            self.update_dots()
            self.status_label.config(text="PIN Cleared", fg="#cbd5e1")
        elif char == '✓':
            self.verify_pin()
        else:
            if len(self.entered_pin) < 4:
                self.entered_pin += char
                self.update_dots()
                if len(self.entered_pin) == 4:
                    self.root.after(200, self.verify_pin)

    def update_dots(self):
        dots = ""
        for i in range(4):
            if i < len(self.entered_pin):
                dots += "⬤  "
            else:
                dots += "◯  "
        self.pin_display.config(text=dots.strip(), fg="#3b82f6")

    def verify_pin(self):
        if self.entered_pin == CORRECT_PIN:
            # 🟢 CORRECT PIN ENTERED -> UNLOCK CLEANLY (NO PHOTO CLICKED!)
            self.pin_display.config(fg="#10b981")
            self.status_label.config(text="✅ SUCCESS! Device Unlocked. (No Photo Taken)", fg="#10b981")
            try:
                winsound.Beep(1200, 200)
            except Exception:
                pass
            messagebox.showinfo("Unlocked", "Correct PIN entered!\nDevice unlocked cleanly without taking any photo.")
            self.entered_pin = ""
            self.update_dots()

        else:
            # 🔴 WRONG PIN ENTERED -> CAPTURE INTRUDER SELFIE IMMEDIATELY!
            wrong_pin = self.entered_pin
            self.pin_display.config(fg="#ef4444")
            self.status_label.config(text=f"⚠️ WRONG PIN ('{wrong_pin}')! Capturing Photo...", fg="#ef4444")
            self.root.update()

            try:
                winsound.Beep(800, 300)
            except Exception:
                pass

            # Snap Intruder Photo
            snap_path = capture_intruder_photo(wrong_pin)

            if snap_path:
                show_windows_notification("INTRUDER PHOTO CAPTURED!", f"Wrong PIN '{wrong_pin}' entered at lockscreen.")
                try:
                    os.startfile(snap_path)
                except Exception:
                    pass

            messagebox.showwarning("Intruder Alert", f"WRONG PIN ENTERED ('{wrong_pin}')!\n\nWebcam snapped intruder photo and saved it to:\n{snap_path}")

            self.entered_pin = ""
            self.update_dots()
            self.status_label.config(text="Try again (Correct PIN: 1234)", fg="#cbd5e1")

def main():
    root = tk.Tk()
    app = LockscreenDemoApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
