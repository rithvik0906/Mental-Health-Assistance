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
const mentalHealthForm = document.getElementById("mental-health-form");
const suggestionsBox = document.getElementById("suggestions-box");
const suggestionsText = document.getElementById("suggestions-text");
const hospitalBox = document.getElementById("hospital-suggestion");
const logoutBtn = document.getElementById("logout-btn");
const darkModeToggle = document.getElementById("darkModeToggle");
const viewProfileBtn = document.getElementById("view-profile-btn");
const goBackBtn = document.getElementById("go-back-btn");

// ================= FORM INPUTS =================
const problemSelect = document.getElementById("problem");
const descriptionInput = document.getElementById("description");
const locationSelect = document.getElementById("location");

// ================= PROFILE ELEMENTS =================
const userNameSpan = document.getElementById("user-name");
const userAgeSpan = document.getElementById("user-age");
const userPhoneSpan = document.getElementById("user-ph");
const responseList = document.getElementById("response-list");

// ================= AUTH GUARD =================
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;

  if (!user && (path.endsWith("home.html") || path.endsWith("profile.html"))) {
    window.location.href = "index.html";
    return;
  }

  if (user && path.endsWith("home.html")) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      document.getElementById("form-greeting").textContent =
        `Hey ${userDoc.data().name}!`;
    }
  }
});

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

// ================= AI FORM SUBMIT =================
mentalHealthForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  suggestionsBox.style.display = "block";
  suggestionsText.textContent = "Analyzing…";
  hospitalBox.innerHTML = "";

  const user = auth.currentUser;
  if (!user) {
    alert("Login required");
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const age = userDoc.exists() ? userDoc.data().age : "Unknown";

    await addDoc(collection(db, "users", user.uid, "responses"), {
      problem: problemSelect.value,
      description: descriptionInput.value,
      location: locationSelect.value,
      timestamp: new Date()
    });

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

    const data = await res.json();
    suggestionsText.innerHTML = data.response || "No suggestions available.";

    const location = locationSelect.value;

    if (location === "Current Location") {
      if (!navigator.geolocation) {
        hospitalBox.textContent = "Geolocation not supported.";
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const mapsUrl = `https://www.google.com/maps/search/mental+health+hospital/@${latitude},${longitude},14z`;

          hospitalBox.innerHTML = `
            <hr/>
            <h6>🏥 Nearby Mental Health Support</h6>
            <a href="${mapsUrl}" target="_blank" class="btn btn-outline-success">
              Find Mental Health Hospitals Near You
            </a>
          `;
        },
        () => {
          hospitalBox.textContent = "Location permission denied.";
        }
      );
    } else {
      const mapsUrl = `https://www.google.com/maps/search/mental+health+hospital+in+${encodeURIComponent(location)}`;

      hospitalBox.innerHTML = `
        <hr/>
        <h6>🏥 Mental Health Support in ${location}</h6>
        <a href="${mapsUrl}" target="_blank" class="btn btn-outline-success">
          Find Mental Health Hospitals in ${location}
        </a>
      `;
    }
  } catch (err) {
    console.error(err);
    suggestionsText.textContent = "Something went wrong. Please try again.";
  }
});

// ================= PROFILE PAGE =================
if (window.location.pathname.endsWith("profile.html")) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const d = userDoc.data();

    userNameSpan.textContent = d.name;
    userAgeSpan.textContent = d.age;
    userPhoneSpan.textContent = d.phone;

    responseList.innerHTML = "";
    const snap = await getDocs(collection(db, "users", user.uid, "responses"));
    snap.forEach(r => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `${r.data().problem} - ${r.data().description}`;
      responseList.appendChild(li);
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
