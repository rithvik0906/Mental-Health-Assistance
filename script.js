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
    deleteDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

// ✅ Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBo2z3a__-RSjUXzjELJMXcc0c-BTdJkr0",
    authDomain: "mental-health-assistance-44093.firebaseapp.com",
    projectId: "mental-health-assistance-44093",
    storageBucket: "mental-health-assistance-44093.firebasestorage.app",
    messagingSenderId: "139489377631",
    appId: "1:139489377631:web:42cc3264f167d2fbdd0aea",
    measurementId: "G-PNBC83NNEC"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const genAI = new GoogleGenerativeAI("AIzaSyAy5yFD9fcE8b8Gr8ZNLz053SNybVE_OUs");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 🔹 Ensure user is authenticated before accessing home page
onAuthStateChanged(auth, async (user) => {
    if (!user && window.location.pathname.includes("home.html")) {
        window.location.href = "index.html";
    } else if (user && window.location.pathname.includes("home.html")) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userName = userDoc.data().name;
            document.getElementById("form-greeting").textContent = `Hey ${userName}!`;
        }
    }
});

// 🔹 Signup Function (Email & Password with Confirm Password)
document.getElementById("signup-btn")?.addEventListener("click", async () => {
    const name = document.getElementById("signup-name").value;
    const age = document.getElementById("signup-age").value;
    const phone = document.getElementById("signup-phone").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;

    // ✅ Check if passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match. Please enter the same password in both fields.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Store user details in Firestore
        await setDoc(doc(db, "users", user.uid), { 
            name, 
            age: age.toString(), 
            phone, 
            email 
        });

        alert("Signup Successful! Redirecting to Login...");
        setTimeout(() => { window.location.href = "index.html"; }, 1000);
    } catch (error) {
        alert(error.message);
    }
});

// 🔹 Login Function (Email & Password)
document.getElementById("login-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Get user name from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            alert(`Welcome, ${userDoc.data().name}!`);
        }

        window.location.href = "home.html"; // Redirect to Home
    } catch (error) {
        alert(error.message);
    }
});

// 🔹 Google Signup & Login Function
async function handleGoogleAuth() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // ✅ Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            // ✅ Store new Google user in Firestore
            await setDoc(doc(db, "users", user.uid), { 
                name: user.displayName, 
                age: "N/A", 
                phone: "N/A", 
                email: user.email 
            });
        }

        alert("Google Login Successful!");
        window.location.href = "home.html"; // Redirect to Home
    } catch (error) {
        alert(error.message);
    }
}

// Attach Google Auth to buttons
document.getElementById("google-signup-btn")?.addEventListener("click", handleGoogleAuth);
document.getElementById("google-login-btn")?.addEventListener("click", handleGoogleAuth);

// 🔹 Logout Function
document.getElementById("logout-btn")?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        alert("Logged out successfully!");
        window.location.href = "index.html"; // Redirect to Login
    } catch (error) {
        alert("Error logging out: " + error.message);
    }
});

// 🔹 Save Response to Firestore & Fetch Gemini AI Suggestions
document.getElementById("mental-health-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.getElementById("suggestions-box").style.display = "block";

    const problem = document.getElementById("problem").value;
    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;
    const suggestionsText = document.getElementById("suggestions-text");
    const hospitalSuggestion = document.getElementById("hospital-suggestion");

    suggestionsText.innerHTML = "<p>Analyzing your problem... Please wait.</p>";
    hospitalSuggestion.innerHTML = "";

    try {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to submit responses.");
            return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        let userAge = userDoc.exists() ? userDoc.data().age : "Unknown";
        let ageText = (userAge && userAge !== "N/A" && userAge !== "Unknown") ? `The user is ${userAge} years old.` : "";

        await addDoc(collection(db, "responses"), {
            uid: user.uid,
            problem: problem,
            description: description,
            location: location,
            timestamp: new Date()
        });

        const result = await model.generateContent(
            `${ageText} The user is experiencing ${problem}. They describe it as: "${description}". Provide brief relaxation techniques and coping strategies in a well-formatted list.`
        );

        let text = await result.response.text();
        text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        text = text.replace(/(^|\n)\* (.*?)(?=\n|$)/g, "$1<li>$2</li>");
        text = text.replace(/(<li>.*?<\/li>(?:\n<li>.*?<\/li>)*)/gs, "<ul>$1</ul>");

        suggestionsText.innerHTML = text || "<p>No suggestions available at the moment.</p>";
        const hospitalUrl = `https://www.google.com/maps/search/mental+health+hospital+in+${encodeURIComponent(location)}`;
        hospitalSuggestion.innerHTML = `<p><strong>Consider visiting a mental health specialist.</strong><br><a href="${hospitalUrl}" target="_blank">Find hospitals near ${location}</a></p>`;
        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
        console.error("❌ Error fetching suggestions or saving data:", err);
        suggestionsText.innerHTML = "<p>Error fetching suggestions. Please try again.</p>";
    }
});

// 🔹 Load Profile Data on Profile Page
if (window.location.pathname.includes("profile.html")) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                document.getElementById("user-name").textContent = userData.name || "N/A";
                document.getElementById("user-age").textContent = userData.age || "N/A";
            }

            const responseList = document.getElementById("response-list");
            responseList.innerHTML = "";

            const responsesSnapshot = await getDocs(collection(db, "responses"));
            let hasResponses = false;

            responsesSnapshot.forEach(doc => {
                const response = doc.data();
                if (response.uid === user.uid) {
                    hasResponses = true;
                    const li = document.createElement("li");
                    li.classList.add("list-group-item");
                    li.innerHTML = `<strong>${response.problem}</strong> - ${response.description} <br><small>Location: ${response.location}</small>`;
                    responseList.appendChild(li);
                }
            });

            if (!hasResponses) {
                responseList.innerHTML = `<li class="list-group-item">No previous responses found.</li>`;
            }

        } catch (error) {
            console.error("❌ Error loading profile data:", error);
            alert("Error loading profile data. Please try again.");
        }
    });
}

// 🔹 Redirect to Profile Page
document.getElementById("view-profile-btn")?.addEventListener("click", () => {
    window.location.href = "profile.html";
});

// 🔹 "Go Back" Button on Profile Page
document.getElementById("go-back-btn")?.addEventListener("click", () => {
    window.location.href = "home.html";
});

// Edit and Update Profile
document.getElementById("editProfileBtn")?.addEventListener("click", async () => {
    const editForm = document.getElementById("editProfileForm");
    editForm.style.display = "block";
  
    const user = auth.currentUser;
    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }
  
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
  
    if (userDoc.exists()) {
      const userData = userDoc.data();
      document.getElementById("editName").value = userData.name || "";
      document.getElementById("editAge").value = userData.age || "";
      document.getElementById("editPhone").value = userData.phone || "";
    } else {
      alert("User data not found!");
    }
  });
  
  document.getElementById("saveProfileBtn")?.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }
  
    const updatedData = {
      name: document.getElementById("editName").value,
      age: document.getElementById("editAge").value,
      phone: document.getElementById("editPhone").value,
    };
  
    try {
      await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
      alert("Profile updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  });
  
