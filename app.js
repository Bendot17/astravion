import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPe6j8IyIjJcOtj-dseql3fPi4ZwpUVEs",
  authDomain: "astravion-14175.firebaseapp.com",
  projectId: "astravion-14175",
  storageBucket: "astravion-14175.firebasestorage.app",
  messagingSenderId: "192926200620",
  appId: "1:192926200620:web:9af565bf5d2a26fade7289",
  measurementId: "G-E32VWS5SXZ"
};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), functions=getFunctions(app,"asia-southeast2");
const $=id=>document.getElementById(id), setStatus=m=>{ $("status").textContent=m; if($("statusGame")) $("statusGame").textContent=m; };
const heroes=[
 ["AURELION","Guardian","🛡️","Tank","Benteng hidup dari kerajaan fajar.",1200],
 ["LYRA","Arcane Archer","🏹","Marksman","Pemanah bintang dengan serangan jarak jauh.",1500],
 ["KAEL","Stormblade","⚡","Assassin","Pemburu cepat yang menguasai petir.",1600],
 ["MIRA","Celestial Sage","✨","Mage","Mengendalikan sihir kosmik.",1400],
 ["BRONT","Iron Fist","🥊","Fighter","Petarung garis depan yang tangguh.",1300],
 ["ELARA","Dawn Healer","🌙","Support","Penjaga tim dengan cahaya penyembuh.",1100]
];
const skins=[["AURELION","Solar Vanguard","🌞",420],["LYRA","Moonlit Huntress","🌙",450],["KAEL","Thunder Ronin","🌩️",500],["MIRA","Astral Empress","💫",480]];
function renderCards(){
 $("heroCards").innerHTML=heroes.map(h=>`<article class="item"><div class="art">${h[2]}</div><h3>${h[0]}</h3><span class="pill">${h[3]}</span><p class="muted">${h[4]}</p><b class="gold">${h[5]} Coin</b><button class="secondary" disabled>Segera Hadir</button></article>`).join("");
 $("skinCards").innerHTML=skins.map(s=>`<article class="item"><div class="art">${s[2]}</div><h3>${s[1]}</h3><p class="muted">Hero: ${s[0]}</p><b class="gold">${s[3]} Diamond</b><button class="secondary" disabled>Segera Hadir</button></article>`).join("");
 $("shopCards").innerHTML=heroes.slice(0,4).map(h=>`<article class="item"><div class="art">${h[2]}</div><h3>${h[0]}</h3><p class="muted">${h[3]}</p><b class="gold">${h[5]} Coin</b><button class="secondary" disabled>Segera Hadir</button></article>`).join("")+`<article class="item"><div class="art">💎</div><h3>Paket Diamond</h3><p class="muted">Pembayaran resmi belum diintegrasikan.</p><span class="pill">Google Play Billing nanti</span><button class="secondary" disabled>Belum tersedia</button></article>`;
}
renderCards();
function showView(id){document.querySelectorAll(".view").forEach(v=>v.hidden=v.id!==id);document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
$("registerBtn").addEventListener("click",async()=>{
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||password.length<6)return setStatus("Isi email dan password minimal 6 karakter.");
 try{const c=await createUserWithEmailAndPassword(auth,email,password);
 // ID ini hanya sementara; ID pemain unik server belum diterapkan.
 const playerId="AST-"+crypto.randomUUID().replaceAll("-","").slice(0,8).toUpperCase();
 await setDoc(doc(db,"players",c.user.uid),{email,playerId,displayName:email.split("@")[0],createdAt:serverTimestamp()});
 setStatus("Akun berhasil dibuat. ID sementara: "+playerId);
 }catch(e){setStatus("Pendaftaran gagal: "+e.message);}
});
$("loginBtn").addEventListener("click",async()=>{try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);setStatus("Login berhasil.");}catch(e){setStatus("Login gagal: "+e.message);}});
$("logoutBtn").addEventListener("click",()=>signOut(auth).catch(e=>setStatus(e.message)));
onAuthStateChanged(auth,async user=>{
 $("authPanel").hidden=!!user;$("gameArea").hidden=!user;$("wallet").hidden=!user;
 if(!user)return;
 try{
  const snap=await getDoc(doc(db,"players",user.uid));
  if(snap.exists()){const p=snap.data();$("profileInfo").textContent=`ID pemain: ${p.playerId||"belum tersedia"} · ${user.email}`;$("welcome").textContent=p.displayName||"Pemain";}
  else $("profileInfo").textContent=`${user.email} · profil belum tersedia`;
  const token=await user.getIdTokenResult(true);
  document.querySelector('[data-view="tournament"]').hidden=!token.claims.organizer;
  showView("home");setStatus("Login berhasil. Ini adalah lobby pratinjau ASTRAVION.");
 }catch(e){setStatus("Gagal memuat profil: "+e.message);}
});
$("createTournamentBtn").addEventListener("click",async()=>{try{const fn=httpsCallable(functions,"createTournament");const r=await fn({name:$("tournamentName").value.trim()});setStatus("Turnamen dibuat: "+(r.data.tournamentId||"berhasil"));}catch(e){setStatus("Tidak dapat membuat turnamen: "+e.message);}});
$("inviteBtn").addEventListener("click",async()=>{try{const fn=httpsCallable(functions,"inviteReferee");const r=await fn({playerId:$("refereeId").value.trim()});setStatus("Undangan diproses: "+(r.data.invitationId||"berhasil"));}catch(e){setStatus("Tidak dapat mengundang wasit: "+e.message);}});
$("refreshInvitesBtn").addEventListener("click",async()=>{
 const user=auth.currentUser;if(!user)return;
 try{const q=query(collection(db,"refereeInvitations"),where("inviteeUid","==",user.uid)),results=await getDocs(q),container=$("inviteList");container.replaceChildren();
 if(results.empty){container.textContent="Belum ada undangan.";return;}
 results.forEach(item=>{const d=item.data(),box=document.createElement("div");box.className="item";
 const p=document.createElement("p");p.textContent=`Turnamen ${d.tournamentName||""} dari ${d.organizerName||"Organizer"} — ${d.status||"pending"}`;
 const a=document.createElement("button"),r=document.createElement("button");a.textContent="Terima";r.textContent="Tolak";r.className="secondary";
 a.onclick=()=>respond(item.id,"accepted");r.onclick=()=>respond(item.id,"rejected");box.append(p,a,r);container.append(box);});
 }catch(e){setStatus("Gagal memuat undangan: "+e.message);}
});
async function respond(id,decision){try{await httpsCallable(functions,"respondInvitation")({invitationId:id,decision});setStatus("Respons undangan tersimpan.");$("refreshInvitesBtn").click();}catch(e){setStatus("Gagal merespons: "+e.message);}}
