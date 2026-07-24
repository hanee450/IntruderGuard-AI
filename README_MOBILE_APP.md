# 📱 Mobile App Guide - Wrong Password Intruder Capture

Aap is project ko kisi bhi **Android smartphone** ya **iPhone (iOS)** me LIVE app ki tarah chala sakte hain!

---

## 🚀 METHOD 1: Live Mobile PWA Web App (Sabse Aasan & Direct)

1. Apne PC par `RUN_MOBILE_SERVER.bat` file par double click karein.
2. Console me aapko ek **Mobile URL** dikhega (jaise `http://192.168.1.15:5000`).
3. Apne Phone me Chrome (Android) ya Safari (iPhone) browser kholein aur wahi URL daalein.
4. Browser menu me jaakar **"Add to Home Screen"** ya **"Install App"** par click karein.
5. Ab aapke phone ki home screen par **IntruderGuard** appicon ban jayega!
6. Open karein, Camera permission **Allow** karein.
7. Jab bhi koi wrong PIN (sahi PIN `1234` ke ilawa) submit karega, front selfie camera se **instant photo click** hogi aur sound alarm bajega!

---

## 🛠️ METHOD 2: Native Android APK Code (`/android_kotlin`)

Agar aap real Android System lockscreen (Phone standard lockscreen) par galat pattern/PIN daalne par photo capture chahte hain:

- Android System security ke liye `DeviceAdminReceiver` API ka upayog karti hai (`onPasswordFailed()`).
- Folder `android_kotlin/IntruderAdminReceiver.kt` me source code included hai jise Android Studio me compile karke `.apk` banaya ja sakta hai.
