// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ================= BACKEND URL =================
const API_BASE_URL =
  window.location.hostname.includes("localhost")
    ? "http://localhost:3000"
    : "https://mental-health-assistance-ppru.onrender.com";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBo2z3a__-RSjUXzjELJMXcc0c-BTdJkr0",
  authDomain: "mental-health-assistance-44093.firebaseapp.com",
  projectId: "mental-health-assistance-44093",
  storageBucket: "mental-health-assistance-44093.appspot.com",
  messagingSenderId: "139489377631",
  appId: "1:139489377631:web:42cc3264f167d2fbdd0aea"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ================= DOM ELEMENTS =================
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const googleSignupBtn = document.getElementById("google-signup-btn");
const googleLoginBtn = document.getElementById("google-login-btn");
const logoutBtn = document.getElementById("logout-btn");

const mentalHealthForm = document.getElementById("mental-health-form");
const suggestionsBox = document.getElementById("suggestions-box");
const suggestionsText = document.getElementById("suggestions-text");
const hospitalBox = document.getElementById("hospital-suggestion");

const darkModeToggle = document.getElementById("darkModeToggle");
const viewProfileBtn = document.getElementById("view-profile-btn");
const goBackBtn = document.getElementById("go-back-btn");

// ================= INPUTS =================
const signupName = document.getElementById("signup-name");
const signupAge = document.getElementById("signup-age");
const signupPhone = document.getElementById("signup-phone");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupConfirmPassword = document.getElementById("signup-confirm-password");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

const problemSelect = document.getElementById("problem");
const descriptionInput = document.getElementById("description");
const locationSelect = document.getElementById("location");

// ================= PROFILE =================
const userNameSpan = document.getElementById("user-name");
const userAgeSpan = document.getElementById("user-age");
const userPhoneSpan = document.getElementById("user-ph");
const responseList = document.getElementById("response-list");

// ================= EDIT PROFILE =================
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileForm = document.getElementById("editProfileForm");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const editNameInput = document.getElementById("editName");
const editAgeInput = document.getElementById("editAge");
const editPhoneInput = document.getElementById("editPhone");

// ================= AUTH GUARD =================
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;

  if (!user && (path.endsWith("home.html") || path.endsWith("profile.html"))) {
    window.location.href = "index.html";
    return;
  }

  if (user && path.endsWith("home.html")) {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      document.getElementById("form-greeting").textContent =
        `Hey ${snap.data().name}!`;
    }
  }
});

// ================= SIGNUP =================
signupBtn?.addEventListener("click", async () => {
  if (signupPassword.value !== signupConfirmPassword.value)
    return alert("Passwords do not match");

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      signupEmail.value,
      signupPassword.value
    );

    await setDoc(doc(db, "users", cred.user.uid), {
      name: signupName.value,
      age: signupAge.value,
      phone: signupPhone.value,
      email: signupEmail.value
    });

    window.location.href = "index.html";
  } catch (e) {
    alert(e.message);
  }
});

// ================= LOGIN =================
loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    window.location.href = "home.html";
  } catch (e) {
    alert(e.message);
  }
});

// ================= GOOGLE AUTH =================
async function googleAuth() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        name: user.displayName,
        email: user.email,
        phone: user.phoneNumber || "N/A",
        age: "N/A"
      });
    }

    window.location.href = "home.html";
  } catch (err) {
    alert("Google sign-in failed. Please allow popups.");
  }
}

googleSignupBtn?.addEventListener("click", googleAuth);
googleLoginBtn?.addEventListener("click", googleAuth);

// ================= LOGOUT =================
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ================= DARK MODE =================
window.addEventListener("load", () => {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "🌞";
  }
});

darkModeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const enabled = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", enabled ? "enabled" : "disabled");
  darkModeToggle.textContent = enabled ? "🌞" : "🌙";
});

// ================= AI FORM =================
mentalHealthForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  suggestionsBox.style.display = "block";
  suggestionsText.textContent = "Analyzing…";
  hospitalBox.innerHTML = "";

  const user = auth.currentUser;
  if (!user) return alert("Login required");

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const age = userDoc.exists() ? userDoc.data().age : "Unknown";

  let data;

  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        problem: problemSelect.value,
        description: descriptionInput.value,
        age
      })
    });

    if (!res.ok) throw new Error("AI failed");

    data = await res.json();
    suggestionsText.innerHTML = data.response;
  } catch {
    suggestionsText.textContent =
      "⚠️ Unable to get AI response right now. Please try again later.";
    return;
  }

  await addDoc(collection(db, "users", user.uid, "responses"), {
    problem: problemSelect.value,
    description: descriptionInput.value,
    location: locationSelect.value,
    aiResponse: data.response,
    timestamp: new Date()
  });

  const location = locationSelect.value;
  if (!location) return;

  if (location === "Current Location") {
    hospitalBox.innerHTML = "📍 Detecting your location…";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl =
          `https://www.google.com/maps/search/mental+health+hospital/@${latitude},${longitude},14z`;

        hospitalBox.innerHTML = `
          <hr/>
          <h6>🏥 Nearby Mental Health Support</h6>
          <a href="${mapsUrl}" target="_blank" class="btn btn-outline-success">
            Find Mental Health Hospitals Near You
          </a>
        `;
      },
      () => {
        hospitalBox.innerHTML = "❌ Location permission denied.";
      }
    );
  } else {
    const mapsUrl =
      `https://www.google.com/maps/search/mental+health+hospital+in+${encodeURIComponent(location)}`;

    hospitalBox.innerHTML = `
      <hr/>
      <h6>🏥 Mental Health Support in ${location}</h6>
      <a href="${mapsUrl}" target="_blank" class="btn btn-outline-success">
        Find Mental Health Hospitals in ${location}
      </a>
    `;
  }
});

// ================= PROFILE + EDIT PROFILE =================
if (window.location.pathname.endsWith("profile.html")) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const d = snap.data();

    // ---------- DISPLAY PROFILE ----------
    userNameSpan.textContent = d.name;
    userAgeSpan.textContent = d.age;
    userPhoneSpan.textContent = d.phone;

    // ---------- LOAD RESPONSES ----------
    responseList.innerHTML = "";
    const qs = await getDocs(collection(db, "users", user.uid, "responses"));
    qs.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = `${r.data().problem} — ${r.data().aiResponse}`;
      responseList.appendChild(li);
    });

    // ---------- EDIT PROFILE ----------
    editProfileBtn?.addEventListener("click", () => {
      editProfileForm.style.display = "block";

      editNameInput.value = d.name || "";
      editAgeInput.value = d.age || "";
      editPhoneInput.value = d.phone || "";
    });

    saveProfileBtn?.addEventListener("click", async () => {
      const name = editNameInput.value.trim();
      const age = editAgeInput.value.trim();
      const phone = editPhoneInput.value.trim();

      // 🔐 HARD VALIDATION (NO GARBAGE DATA)
      if (!name || !age || !phone) {
        alert("All fields are required");
        return;
      }

      if (age <= 0 || age > 120) {
        alert("Invalid age");
        return;
      }

      if (!/^\d{10}$/.test(phone)) {
        alert("Phone number must be 10 digits");
        return;
      }

      await setDoc(
        userRef,
        { name, age, phone },
        { merge: true }
      );

      // Update UI instantly
      userNameSpan.textContent = name;
      userAgeSpan.textContent = age;
      userPhoneSpan.textContent = phone;

      editProfileForm.style.display = "none";
      alert("Profile updated successfully ✅");
    });
  });
}

// ================= NAV =================
viewProfileBtn?.addEventListener("click", () => {
  window.location.href = "profile.html";
});

goBackBtn?.addEventListener("click", () => {
  window.location.href = "home.html";
});
