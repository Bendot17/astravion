import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-functions.js";

// Konfigurasi dari Firebase Console proyek astravion-14175
const firebaseConfig = {
  apiKey: "AIzaSyDPe6j8IyIjJcOtj-dseql3fPi4ZwpUVEs",
  authDomain: "astravion-14175.firebaseapp.com",
  projectId: "astravion-14175",
  storageBucket: "astravion-14175.firebasestorage.app",
  messagingSenderId: "192926200620",
  appId: "1:192926200620:web:9af565bf5d2a26fade7289",
  measurementId: "G-E32VWS5SXZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "asia-southeast2");
const $ = (id) => document.getElementById(id);
const status = (message) => { $("status").textContent = message; };

function makePlayerId() {
  // ID sementara untuk tampilan; produksi harus dibuat server-side agar unik.
  return "AST-" + Math.random().toString(10).slice(2, 8).padEnd(6, "0");
}

$("registerBtn").addEventListener("click", async () => {
  const email = $("email").value.trim(), password = $("password").value;
  if (!email || password.length < 6) return status("Isi email dan password minimal 6 karakter.");
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const playerId = makePlayerId();
    await setDoc(doc(db, "players", credential.user.uid), {
      email, playerId, displayName: email.split("@")[0], createdAt: serverTimestamp()
    });
    status("Akun berhasil dibuat. ID pemain: " + playerId);
  } catch (e) { status("Pendaftaran gagal: " + e.message); }
});

$("loginBtn").addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    status("Login berhasil.");
  } catch (e) { status("Login gagal: " + e.message); }
});

$("logoutBtn").addEventListener("click", () => signOut(auth).catch(e => status(e.message)));

onAuthStateChanged(auth, async (user) => {
  $("authForm").hidden = !!user;
  $("profile").hidden = !user;
  $("appArea").hidden = !user;
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, "players", user.uid));
    if (snap.exists()) {
      const p = snap.data();
      $("profileInfo").textContent = `${p.displayName || user.email} · ID: ${p.playerId || "belum tersedia"}`;
    } else {
      $("profileInfo").textContent = user.email + " · profil belum dibuat";
    }
    const token = await user.getIdTokenResult(true);
    $("organizer").hidden = !token.claims.organizer;
    status("Terhubung sebagai " + user.email);
  } catch (e) { status("Gagal memuat profil: " + e.message); }
});

document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(el => el.hidden = el.id !== button.dataset.tab);
}));

$("createTournamentBtn").addEventListener("click", async () => {
  try {
    const fn = httpsCallable(functions, "createTournament");
    const result = await fn({ name: $("tournamentName").value.trim() });
    status("Turnamen dibuat: " + (result.data.tournamentId || "berhasil"));
  } catch (e) { status("Tidak dapat membuat turnamen: " + e.message); }
});

$("inviteBtn").addEventListener("click", async () => {
  try {
    const fn = httpsCallable(functions, "inviteReferee");
    const result = await fn({ playerId: $("refereeId").value.trim() });
    status("Undangan diproses: " + (result.data.invitationId || "berhasil"));
  } catch (e) { status("Tidak dapat mengundang wasit: " + e.message); }
});

$("refreshInvitesBtn").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const q = query(collection(db, "refereeInvitations"), where("inviteeUid", "==", user.uid));
    const results = await getDocs(q);
    const container = $("inviteList");
    container.replaceChildren();
    if (results.empty) { container.textContent = "Belum ada undangan."; return; }
    results.forEach(item => {
      const data = item.data(), box = document.createElement("div");
      box.className = "panel";
      const label = document.createElement("p");
      label.textContent = `Undangan turnamen ${data.tournamentName || ""} dari ${data.organizerName || "Organizer"} — ${data.status || "pending"}`;
      const accept = document.createElement("button"), reject = document.createElement("button");
      accept.textContent = "Terima"; reject.textContent = "Tolak"; reject.className = "secondary";
      accept.onclick = () => respond(item.id, "accepted");
      reject.onclick = () => respond(item.id, "rejected");
      box.append(label, accept, reject); container.append(box);
    });
  } catch (e) { status("Gagal memuat undangan: " + e.message); }
});

async function respond(invitationId, decision) {
  try {
    const fn = httpsCallable(functions, "respondInvitation");
    await fn({ invitationId, decision });
    status("Respons undangan tersimpan.");
    $("refreshInvitesBtn").click();
  } catch (e) { status("Gagal merespons: " + e.message); }
}
