// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
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

// ================= FIREBASE CONFIG =================
// 🔥 Public config – SAFE in frontend
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
const googleSignupBtn = document.getElementById("google-signup-btn");
const googleLoginBtn = document.getElementById("google-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const darkModeToggle = document.getElementById("darkModeToggle");
const mentalHealthForm = document.getElementById("mental-health-form");
const suggestionsBox = document.getElementById("suggestions-box");
const suggestionsText = document.getElementById("suggestions-text");
const viewProfileBtn = document.getElementById("view-profile-btn");
const goBackBtn = document.getElementById("go-back-btn");
const hospitalBox = document.getElementById("hospital-suggestion");

// ================= FORM INPUTS =================
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

// ================= SIGNUP =================
document.getElementById("signup-btn")?.addEventListener("click", async () => {
  const name = signupName.value;
  const age = signupAge.value;
  const phone = signupPhone.value;
  const email = signupEmail.value;
  const password = signupPassword.value;
  const confirm = signupConfirmPassword.value;

  if (password !== confirm) return alert("Passwords do not match");
  if (!/^\d{10}$/.test(phone)) return alert("Phone must be 10 digits");
  if (age > 120) return alert("Invalid age");
  if (password.length < 6) return alert("Weak password");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      age,
      phone,
      email
    });
    alert("Signup successful");
    window.location.href = "index.html";
  } catch (e) {
    alert(e.message);
  }
});

// ================= LOGIN =================
document.getElementById("login-btn")?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      loginEmail.value,
      loginPassword.value
    );
    window.location.href = "home.html";
  } catch (e) {
    alert(e.message);
  }
});

// ================= GOOGLE AUTH =================
async function googleAuth() {
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

// ================= AI FORM SUBMIT =================
mentalHealthForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  suggestionsBox.style.display = "block";
  suggestionsText.textContent = "Analyzing…";

  const hospitalBox = document.getElementById("hospital-suggestion");
  hospitalBox.innerHTML = "";

  const user = auth.currentUser;
  if (!user) {
    alert("Login required");
    return;
  }

  try {
    // 🔹 Fetch user age
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const age = userDoc.exists() ? userDoc.data().age : "Unknown";

    // 🔹 Store user query history
    await addDoc(collection(db, "users", user.uid, "responses"), {
      problem: problemSelect.value,
      description: descriptionInput.value,
      location: locationSelect.value,
      timestamp: new Date()
    });

    // 🔹 Call backend AI
    const token = await user.getIdToken();
    const res = await fetch("https://mental-health-assistance-ppru.onrender.com", {
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

    // ================= HOSPITAL SUGGESTIONS =================
    const location = locationSelect.value;

    if (location === "Current Location") {
      if (!navigator.geolocation) {
        hospitalBox.textContent = "Geolocation not supported by your browser.";
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const mapsUrl = `https://www.google.com/maps/search/mental+health+hospital/@${latitude},${longitude},14z`;

          hospitalBox.innerHTML = `
            <hr/>
            <h6>🏥 Nearby Mental Health Support</h6>
            <p>If you feel professional help is needed, you can explore trusted options nearby.</p>
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
        <p>If you feel professional help is needed, you can explore trusted options nearby.</p>
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

// ================= EDIT PROFILE =================
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileForm = document.getElementById("editProfileForm");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const editNameInput = document.getElementById("editName");
const editAgeInput = document.getElementById("editAge");
const editPhoneInput = document.getElementById("editPhone");

if (window.location.pathname.endsWith("profile.html")) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const data = userSnap.data();

    // 🔹 Edit button click
    editProfileBtn.addEventListener("click", () => {
      editProfileForm.style.display = "block";

      // Pre-fill inputs
      editNameInput.value = data.name || "";
      editAgeInput.value = data.age || "";
      editPhoneInput.value = data.phone || "";
    });

    // 🔹 Save changes
    saveProfileBtn.addEventListener("click", async () => {
      const updatedName = editNameInput.value.trim();
      const updatedAge = editAgeInput.value.trim();
      const updatedPhone = editPhoneInput.value.trim();

      if (!updatedName || !updatedAge || !updatedPhone) {
        alert("All fields are required");
        return;
      }

      if (!/^\d{10}$/.test(updatedPhone)) {
        alert("Phone number must be 10 digits");
        return;
      }

      if (updatedAge > 120) {
        alert("Invalid age");
        return;
      }

      await setDoc(
        userRef,
        {
          name: updatedName,
          age: updatedAge,
          phone: updatedPhone
        },
        { merge: true }
      );

      // Update UI immediately
      userNameSpan.textContent = updatedName;
      userAgeSpan.textContent = updatedAge;
      userPhoneSpan.textContent = updatedPhone;

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
