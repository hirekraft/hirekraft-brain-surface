import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ================= config ================= */
const BRAIN = "https://uvdoompnnypmneyrvtas.supabase.co";
const KEY = "sb_publishable_joP87JJiePfN3k1uPoxxVA_DLGT1zv5";
const LENS = BRAIN + "/functions/v1/worklens-live";
const REST = BRAIN + "/rest/v1/rpc/";

const params = new URLSearchParams(location.search);
const MAILBOX = params.get("mailbox") || "gmail:alex@hirekraft.ai";
/* Asserted fallback identity — used ONLY when there is no signed-in session.
   The lens reports identity_route so a fallback can never masquerade as a session. */
/* Stage D (2026-07-31): the asserted identity is gone. It was a hardcoded firm-admin
   UUID, overridable by a URL parameter, used whenever no session existed. Identity now
   comes from the session token or the surface refuses. There is nothing to fall into. */

/* Supabase client purely to pick up the session the login page persisted. */
const sb = createClient(BRAIN, KEY, {
  auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true, flowType: "pkce" },
});

let SESSION_JWT = null;          // set only by a real login session bound to an identity
let ROUTE = "unbound";           // reported by the lens on every response

let STATE = {
  view: "inbox",                 // inbox | loops | resolved
  pages: [],                     // accumulated inbox messages (full pagination)
  nextToken: null,
  totalEstimate: null,
  filter: null,                  // filter_applied from the lens
  openThread: null,
  related: null,
  engagement: {},                // thread_id -> {case_id, case_title, status}
  cases: [],                     // solutions cases
  openCase: null,                // a case being viewed as a workspace
  loadingMore: false,
  showFullThread: false,
};

/* ================= helpers ================= */
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}

async function lens(action, extra){
  if(!SESSION_JWT) throw new Error("not signed in");
  const headers = {"Content-Type":"application/json","apikey":KEY};
  /* THE ONLY ROUTE: the caller's own JWT. No identity_id is ever put in the body, so a
     lapsed session refuses instead of quietly reading as somebody else. */
  headers["Authorization"] = "Bearer " + SESSION_JWT;
  const body = Object.assign({action}, extra||{});
  const r = await fetch(LENS,{method:"POST",headers,body:JSON.stringify(body)});
  const j = await r.json().catch(()=>null);
  if(!r.ok || !j || j.ok === false) throw new Error((j && j.error) ? j.error : (action+" → HTTP "+r.status));
  if(j.identity_route){ ROUTE = j.identity_route; paintRoute(j); }
  return j;
}

/* Case RPCs — PostgREST. Each twin derives the identity from the JWT itself; no id is passed. */
async function rpc(name, args){
  if(!SESSION_JWT) throw new Error("not signed in");
  const r = await fetch(REST+name,{
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":KEY,"Authorization":"Bearer "+SESSION_JWT},
    body:JSON.stringify(args||{})
  });
  const j = await r.json().catch(()=>null);
  if(!r.ok) throw new Error((j&&j.message)?j.message:(name+" → HTTP "+r.status));
  return j;
}
/* fill_label / fill_humanize_drive — human names, never raw source keys (spec item f). */
const LABEL_CACHE = {};
async function humanMailbox(sourceKey){
  if(LABEL_CACHE[sourceKey]!==undefined) return LABEL_CACHE[sourceKey];
  try{ const v=await rpc("fill_label",{p_type:"mailbox",p_key:sourceKey}); LABEL_CACHE[sourceKey]=v||null; }
  catch{ LABEL_CACHE[sourceKey]=null; }
  return LABEL_CACHE[sourceKey];
}

function when(iso){
  if(!iso) return "";
  const d=new Date(iso), now=new Date();
  if(d.toDateString()===now.toDateString()) return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
  if(d.getFullYear()===now.getFullYear()) return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function say(text, cls){
  const s=document.getElementById("speech");
  const d=document.createElement("div");
  d.className="say"+(cls?" "+cls:"");
  d.innerHTML=text; s.appendChild(d); s.scrollTop=s.scrollHeight; return d;
}
function clearSpeech(){document.getElementById("speech").innerHTML="";}

/* identity route, painted on screen (spec item g) — never silent. */
function paintRoute(j){
  const el=document.getElementById("route");
  const t=document.getElementById("routeText");
  el.className="route "+(j.identity_route==="jwt"?"jwt":"asserted");
  const name=(j.asker&&j.asker.name)?j.asker.name:"you";
  if(j.identity_route==="jwt"){
    t.innerHTML="Signed in as <b>"+esc(name)+"</b> — identity <b>proven</b> from your session token.";
  }else{
    t.innerHTML="Identity <b>asserted</b>, not proven by a session. "+
      "<a href=\"../login/\">Sign in</a> to prove it from your own token.";
  }
}

/* provenance — two shapes, never conflated. */
function provBlock(enforcedBy, id){
  const isPhysics = /physics/i.test(enforcedBy||"");
  const kind = isPhysics ? "physics" : "chokepoint";
  const label = isPhysics ? "read as you" : "released by the gate";
  const detail = isPhysics
    ? "<b>Physics.</b> We read this live from Google with your own sign-in. Google itself decides what you can see — if you couldn't open it, neither could we. Nothing was copied to get here."
    : "<b>The gate.</b> This came from your brain, through the one checkpoint everything must pass: sensitivity is filtered in the database before anything is ranked, then Google is asked — as you — whether you may open the file. Anything unsettled is dropped, not shown.";
  return '<button class="prov" data-prov="'+id+'"><span class="dot '+kind+'"></span>'+esc(label)+' · why?</button>'+
         '<div class="prov-detail '+kind+'" id="'+id+'">'+detail+'<div style="margin-top:6px;color:var(--muted-2);font-family:var(--mono);font-size:10.5px">'+esc(enforcedBy||"")+'</div></div>';
}

/* ================= revelation composer (client-side, honest) =================
   The revelation is what the assembled case file surfaces that the single thread
   did not. It is bounded by what the viewer can reach — we state confidence AND reach.
   This composes from the REAL related payload; it never invents a cross-source claim. */
function composeRevelation(thread, related){
  const mail=(related&&related.mail&&related.mail.threads)||[];
  const docs=(related&&related.documents&&related.documents.docs)||[];
  const anchor=(related&&related.anchor)||{};
  const who = anchor.from_email || (thread&&thread.messages&&thread.messages[0]&&thread.messages[0].from_email) || "this correspondent";

  let didnt, conf;
  const legalDocs = docs.filter(d=>/legal|nda|contract|compliance/i.test((d.sensitivity_tier||"")+" "+(d.name||"")));
  if(docs.length && mail.length){
    const lead = legalDocs.length ? legalDocs[0] : docs[0];
    didnt = "This connects to <b>"+esc(lead.name||"a document")+"</b>"+
      (docs.length>1?" and "+(docs.length-1)+" other document"+(docs.length-1===1?"":"s"):"")+
      ", and to <b>"+mail.length+" earlier conversation"+(mail.length===1?"":"s")+"</b> with "+esc(who)+" — pulled together from your mail and your documents.";
    conf = "Confident on the correspondence trail with "+esc(who)+"; the documents are the brain's best match on subject and sender — open one to confirm it's the same matter.";
  } else if(docs.length){
    didnt = "Your documents hold <b>"+docs.length+" file"+(docs.length===1?"":"s")+"</b> that match this — "+esc(docs[0].name||"a document")+(docs.length>1?" among them":"")+" — that the email alone wouldn't have shown you.";
    conf = "These are the brain's best match on subject and sender; open one to confirm relevance.";
  } else if(mail.length){
    didnt = "This isn't the first time — there "+(mail.length===1?"is <b>1 earlier conversation</b>":"are <b>"+mail.length+" earlier conversations</b>")+" with "+esc(who)+" that belong with it.";
    conf = "Confident: these are read live from your own mailbox, same correspondent or same subject.";
  } else {
    didnt = "This one stands alone — nothing else in your mail or documents connects to it.";
    conf = "Confident: we searched your mail live and your documents through the gate, and found no other thread of this story.";
  }
  return {didnt, conf};
}

/* ================= render ================= */
function renderStage(){
  const stage=document.getElementById("stage");
  if(STATE.openCase){ stage.innerHTML=caseWorkspace(); wire(); return; }
  const solo = !STATE.openThread;
  stage.innerHTML =
    proofBand() +
    '<div class="panes'+(solo?" solo":"")+'">'+
      '<div>'+listCard()+'</div>'+
      (solo?"":'<div>'+revealCard()+threadCard()+caseCard()+'</div>')+
    '</div>'+ unreachableNote();
  wire();
}

/* filter_applied rendered visibly — the inbox proving it's unfiltered (spec item a). */
function proofBand(){
  if(STATE.view!=="inbox") return "";
  const f=STATE.filter; if(!f) return "";
  if(f.is_search){
    return '<div class="proof search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>'+
      '<span>You\'re searching — <span class="q">'+esc(f.query)+'</span>. Clear it to see the whole inbox again.</span></div>';
  }
  return '<div class="proof"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>'+
    '<span>This is your whole inbox — <span class="q">'+esc(f.query)+'</span>, Google\'s spam filter and nothing more. Promotions and Social are shown, not hidden.</span></div>';
}

function listCard(){
  if(STATE.view==="inbox") return inboxCard();
  return loopsCard();
}

function inboxCard(){
  const m=STATE.pages;
  if(!m.length) return '<div class="card"><div class="card-head"><h2>Inbox</h2></div><div class="empty">Nothing in the inbox right now.</div></div>';
  const rows=m.map(x=>msgRow(x)).join("");
  const est = STATE.totalEstimate ? (" of ~"+STATE.totalEstimate) : "";
  const more = STATE.nextToken
    ? '<div class="loadmore"><button class="btn" id="moreBtn"'+(STATE.loadingMore?" disabled":"")+'>'+(STATE.loadingMore?"Loading…":"Load more mail")+'</button></div>'
    : '<div class="loadmore"><span class="mono" style="font-size:11px;color:var(--muted-2)">That\'s the whole inbox.</span></div>';
  return '<div class="card"><div class="card-head"><h2>Inbox</h2><span class="meta">'+m.length+est+' · live</span></div>'+rows+more+'</div>';
}

/* Open loops / Resolved — a RECORD OF ENGAGEMENT, derived from the case model.
   It never hides inbox mail; it shows what the user chose to work. */
function loopsCard(){
  const wantResolved = STATE.view==="resolved";
  const map=STATE.engagement;
  const ids=Object.keys(map).filter(tid=>{
    const st=map[tid].status;
    return wantResolved ? st==="resolved" : (st==="open"||st==="waiting");
  });
  const title = wantResolved ? "Resolved" : "Open loops";
  if(!ids.length){
    const msg = wantResolved
      ? "Nothing resolved yet. When you close a case, it lands here — kept, not deleted."
      : "No open loops yet. Open an email, and register it into a case when it's something you've started but not finished. This is a record of what <em>you</em> engaged with — it never decides what matters for you.";
    return '<div class="card"><div class="card-head"><h2>'+title+'</h2></div><div class="empty">'+msg+'</div></div>';
  }
  // map thread ids to whatever message we know about them (from loaded inbox pages)
  const known = {}; STATE.pages.forEach(x=>{known[x.thread_id]=x;});
  const rows=ids.map(tid=>{
    const info=map[tid];
    const x=known[tid] || {thread_id:tid, from_name:info.case_title, subject:"(in “"+info.case_title+"”)", snippet:"", date:null};
    return msgRow(x, info);
  }).join("");
  return '<div class="card"><div class="card-head"><h2>'+title+'</h2><span class="meta">'+ids.length+' · your engagement</span></div>'+rows+'</div>';
}

function msgRow(x, loopInfo){
  const active = STATE.openThread && STATE.openThread.thread_id===x.thread_id;
  const eng = loopInfo || STATE.engagement[x.thread_id];
  let loopPill = "";
  if(eng){
    const cls = eng.status==="resolved" ? "loop resolved" : "loop";
    const word = eng.status==="resolved" ? "resolved" : (eng.status==="waiting" ? "waiting" : "open loop");
    loopPill = '<div class="'+cls+'">'+esc(word)+' · '+esc(eng.case_title)+'</div>';
  }
  const gcat = (x.google_category && x.google_category!=="primary")
    ? '<span class="gcat">'+esc(x.google_category)+'</span>' : "";
  return '<div class="msg'+(x.unread?" unread":"")+(active?" active":"")+'" data-thread="'+esc(x.thread_id)+'">'+
    '<div class="r1"><div class="who">'+esc(x.from_name||x.from_email||"—")+gcat+'</div><div class="when">'+esc(when(x.date))+'</div></div>'+
    '<div class="subj">'+esc(x.subject||"(no subject)")+'</div>'+
    (x.snippet?'<div class="snip">'+esc((x.snippet||"").slice(0,140))+'</div>':"")+
    loopPill+
  '</div>';
}

/* revelation-first: what you didn't know (most prominent) → where this stands → actions. */
function revealCard(){
  const t=STATE.openThread; if(!t) return "";
  const r=STATE.related;
  if(r==="loading"){
    return '<div class="card"><div class="reveal"><p class="lead">What you didn\'t know</p>'+
      '<div class="assembling" style="padding:8px 0 0;text-align:left">Pulling the whole story together<div class="dots"><span></span><span></span><span></span></div></div></div></div>';
  }
  let rev = {didnt:"", conf:""};
  let reach = "";
  if(r && !r.error){
    rev = composeRevelation(t, r);
    // reach honesty: if there are unreachable sources, the money side may be missing
    if(STATE.sources && STATE.sources.unreachable && STATE.sources.unreachable.count){
      reach = "Reach: I can't see the mailboxes connected under an older access shape, so anything living only there — invoices, payment threads — may be missing from this picture.";
    }
  }
  const eng = STATE.engagement[t.thread_id];
  const stands = whereThisStands(t, eng);
  return '<div class="card">'+
    '<div class="reveal">'+
      '<p class="lead">What you didn\'t know</p>'+
      '<p class="didnt">'+(rev.didnt||"—")+'</p>'+
      (rev.conf?'<p class="conf">'+esc(rev.conf)+'</p>':"")+
      (reach?'<p class="reach">'+esc(reach)+'</p>':"")+
    '</div>'+
    '<div class="stands"><p class="lead">Where this stands</p><p>'+stands+'</p></div>'+
    actionZone(t, eng)+
  '</div>';
}

function whereThisStands(t, eng){
  const n=(t.messages||[]).length;
  const last=(t.messages||[])[n-1];
  const lastWho = last ? (last.from_name||last.from_email) : "";
  let base = n===1
    ? "A single message, no reply yet."
    : n+" messages; the last was from "+esc(lastWho)+" on "+esc(when(last&&last.date))+".";
  if(eng){
    if(eng.status==="waiting") base += " You marked this waiting"+(eng.waiting_on?" on "+esc(eng.waiting_on):"")+", in “"+esc(eng.case_title)+"”.";
    else if(eng.status==="resolved") base += " You resolved this in “"+esc(eng.case_title)+"”.";
    else base += " It's an open loop in “"+esc(eng.case_title)+"”.";
  }
  return base;
}

/* three-way primitive: answer / forward / JUST REGISTER (+ open box). */
function actionZone(t, eng){
  const registered = !!eng;
  return '<div class="actions">'+
    '<button class="act primary" data-act="answer"><span>Answer</span><span class="k">draft a reply</span></button>'+
    '<button class="act" data-act="forward"><span>Forward</span><span class="k">hand it on</span></button>'+
    (registered
      ? '<button class="act" data-act="opencase"><span>Open the case</span><span class="k">“'+esc(eng.case_title)+'”</span></button>'
      : '<button class="act" data-act="register"><span>Just register</span><span class="k">keep it, no reply</span></button>')+
  '</div>'+
  '<div class="openbox"><textarea id="openBox" rows="1" placeholder="…or say what you want to do with this"></textarea><button class="send" id="openSend">↑</button></div>';
}

function threadCard(){
  const t=STATE.openThread; if(!t) return "";
  const msgs=(t.messages||[]);
  const show = STATE.showFullThread ? msgs : msgs.slice(-1);
  const hidden = msgs.length - show.length;
  const rows=show.map(m=>
    '<div class="mail">'+
      '<div class="mh"><div class="mfrom">'+esc(m.from_name||m.from_email)+'</div><div class="mdate">'+esc(when(m.date))+'</div></div>'+
      (m.to?'<div class="mto">to '+esc(m.to)+'</div>':"")+
      '<div class="mtext">'+esc(m.body||"(no text)")+'</div>'+
    '</div>').join("");
  const toggle = hidden>0
    ? '<div class="thread-toggle" id="threadToggle">▾ show '+hidden+' earlier message'+(hidden===1?"":"s")+'</div>'
    : (msgs.length>1 ? '<div class="thread-toggle" id="threadToggle">▴ collapse the thread</div>' : "");
  return '<div class="card" style="margin-top:18px">'+
    '<div class="card-head"><h2>'+esc(t.subject||"(no subject)")+'</h2>'+
      '<a class="pill open" href="'+esc(t.gmail_url)+'" target="_blank" rel="noopener">open in Gmail ↗</a></div>'+
    toggle+
    '<div class="m-body">'+rows+'</div>'+
    '<div style="padding:0 16px 14px">'+provBlock("physics: read with the asker's own Google token","prov-thread")+'</div>'+
  '</div>';
}

function caseCard(){
  const r=STATE.related;
  if(r==="loading" || !r) return "";
  if(r.error) return '<div class="note err"><h3>We couldn\'t assemble the case file</h3><p>'+esc(r.error)+'</p><p style="margin-top:6px">Nothing partial is shown — a half-built story is worse than none. Reopen the email to try again.</p></div>';

  const mail=(r.mail&&r.mail.threads)||[], docs=(r.documents&&r.documents.docs)||[];
  if(!mail.length && !docs.length) return "";

  let html='<div class="card" style="margin-top:18px"><div class="card-head"><h2>The case file</h2>'+
    '<span class="meta">'+mail.length+' thread'+(mail.length===1?"":"s")+' · '+docs.length+' doc'+(docs.length===1?"":"s")+'</span></div>';

  if(mail.length){
    html+='<div class="grp">Connected conversations</div>';
    html+=mail.map((t,i)=>
      '<a class="item" href="'+esc(t.gmail_url)+'" target="_blank" rel="noopener">'+
        '<div class="r1"><div class="t">'+esc(t.subject||"(no subject)")+'</div><div class="d">'+esc(when(t.date))+'</div></div>'+
        '<div class="s">'+esc(t.from_name||t.from_email)+' — '+esc((t.snippet||"").slice(0,150))+'</div>'+
        '<div class="tags">'+(t.why?'<span class="pill why">'+esc(t.why)+'</span>':"")+'</div>'+
        provBlock(t.enforced_by,"pv-m-"+i)+
      '</a>').join("");
  }
  if(docs.length){
    html+='<div class="grp">Documents we found for you</div>';
    html+=docs.map((d,i)=>
      '<a class="item" href="'+esc(d.drive_url||"#")+'" target="_blank" rel="noopener">'+
        '<div class="r1"><div class="t">'+esc(d.name||"(untitled)")+'</div><div class="d">'+esc(when(d.content_date))+'</div></div>'+
        '<div class="s">'+esc((d.snippet||"").replace(/\s+/g," ").slice(0,170))+'</div>'+
        '<div class="tags">'+(d.sensitivity_tier?'<span class="pill tier">'+esc(d.sensitivity_tier)+'</span>':"")+'</div>'+
        provBlock(d.enforced_by,"pv-d-"+i)+
      '</a>').join("");
  }
  return html+'</div>';
}

/* Standing law: never a bare gap. Name what's withheld AND the way out — human language. */
function unreachableNote(){
  const s=STATE.sources; if(!s||!s.unreachable||!s.unreachable.count) return "";
  const keys=s.unreachable.source_keys||[];
  const mail=keys.filter(k=>k.startsWith("gmail:")).map(k=>k.replace("gmail:",""));
  const named = mail.length ? mail.join(", ") : (keys.length+" sources");
  return '<div class="note">'+
    '<h3>There\'s more of this story we can\'t reach from here</h3>'+
    '<p>We can\'t open '+esc(named)+' as you. '+
    (mail.length?'Those mailboxes are connected under an older access shape — one shared key for the whole company rather than your own sign-in. This lens refuses that shape on purpose: it can\'t tell <em>you</em> apart from anyone else holding the key, so it would be guessing about what you\'re allowed to see.':'')+
    '</p>'+
    '<p style="margin-top:7px"><b>What this means in practice:</b> invoices, timesheets and payment threads live in there, so the money side of this story may be missing — not hidden, just out of reach.</p>'+
    '<p style="margin-top:7px"><b>The way out:</b> each of those mailboxes gets connected the same way yours is — signed in as a real person, once. Then they come into the case file automatically and this note disappears.</p>'+
  '</div>';
}

/* ================= the Solutions Lens workspace (spec item d) ================= */
function caseWorkspace(){
  const c=STATE.openCase;
  const parent = c.parent_case_id ? (STATE.cases.find(x=>x.id===c.parent_case_id)) : null;
  const items=(c.items||[]);
  const statusChip=(v,label)=>'<span class="chip'+(c.status===v?" on":"")+'" data-status="'+v+'">'+label+'</span>';
  let itemsHtml = items.length
    ? items.map(it=>
        '<a class="item" href="'+(it.ref_type==="thread"?"#":esc("https://drive.google.com/file/d/"+it.ref_id+"/view"))+'"'+
        (it.ref_type==="document"?' target="_blank" rel="noopener"':' data-openref="'+esc(it.ref_id)+'"')+'>'+
          '<div class="r1"><div class="t">'+esc(it.ref_label||it.ref_id)+'</div><div class="d">'+esc(it.ref_type)+'</div></div>'+
          '<div class="s">registered '+esc(when(it.registered_at))+'</div>'+
        '</a>').join("")
    : '<div class="empty">Nothing registered into this case yet. Open a thread and choose <em>Just register</em> to build the file.</div>';
  // proposal-nesting: child cases
  const children=STATE.cases.filter(x=>x.parent_case_id===c.id);
  let childHtml = children.length
    ? '<div class="grp">Inside this case</div>'+children.map(ch=>
        '<a class="item" data-opencase="'+esc(ch.id)+'" href="#">'+
          '<div class="r1"><div class="t">'+esc(ch.title)+'</div><div class="d">'+esc(ch.status)+'</div></div>'+
          '<div class="s">'+esc((ch.the_situation||"").slice(0,140))+'</div>'+
        '</a>').join("")
    : "";
  return '<div class="card" style="margin-top:16px"><div class="ws">'+
    '<div class="ws-top">'+
      (parent?'<div class="parent" style="margin:0 0 8px">↑ inside “'+esc(parent.title)+'”</div>':"")+
      '<div class="name">'+esc(c.title)+'</div>'+
      (c.the_situation?'<div class="sit">'+esc(c.the_situation)+'</div>':"")+
      '<div class="ws-status">'+statusChip("open","Open")+statusChip("waiting","Waiting")+statusChip("resolved","Resolved")+
        '<button class="miniact" data-back="cases">← all cases</button></div>'+
    '</div>'+
    '<div class="grp">Registered in this case</div>'+itemsHtml+
    childHtml+
  '</div></div>';
}

function casesList(){
  const top=STATE.cases.filter(c=>!c.parent_case_id);
  if(!top.length){
    return '<div class="card" style="margin-top:16px"><div class="card-head"><h2>Your cases</h2>'+
      '<button class="btn" id="newCaseBtn">Start a case</button></div>'+
      '<div class="empty">No cases yet. A case is something you\'re working — a problem, a thread you\'re driving to a close. You start one deliberately; we never create them for you.</div></div>';
  }
  const rows=top.map(c=>
    '<a class="item" data-opencase="'+esc(c.id)+'" href="#">'+
      '<div class="r1"><div class="t">'+esc(c.title)+'</div><div class="d">'+esc(c.status)+' · '+(c.item_count||0)+' item'+(c.item_count===1?"":"s")+'</div></div>'+
      '<div class="s">'+esc((c.the_situation||"").slice(0,150))+'</div>'+
    '</a>').join("");
  return '<div class="card" style="margin-top:16px"><div class="card-head"><h2>Your cases</h2>'+
    '<button class="btn" id="newCaseBtn">Start a case</button></div>'+rows+'</div>';
}

/* ================= modals ================= */
function openModal(html){ const bg=document.getElementById("modalBg"); document.getElementById("modal").innerHTML=html; bg.classList.add("on"); wireModal(); }
function closeModal(){ document.getElementById("modalBg").classList.remove("on"); }

/* Register a thread: propose an existing case when one looks right; else start a new one.
   Structure emerges from language — the Tool proposes, the user confirms. */
function registerModal(thread){
  const subj=thread.subject||"this thread";
  // proposal: if an open case shares a word with the subject, propose it
  const stem=(subj||"").toLowerCase();
  const proposal=STATE.cases.find(c=>c.status!=="resolved" && c.title && stem.includes((c.title||"").toLowerCase().split(" ")[0]));
  const options=STATE.cases.filter(c=>c.status!=="resolved").map(c=>'<option value="'+esc(c.id)+'"'+(proposal&&proposal.id===c.id?" selected":"")+'>'+esc(c.title)+'</option>').join("");
  return openModal(
    '<h3>Register this</h3>'+
    '<p class="hint">Keep this thread as part of a case — no reply, just on the record. We ask what it belongs to in your words; we never file it into a shape you didn\'t choose.</p>'+
    (proposal?'<div class="propose" id="acceptPropose">This looks like it belongs to <b>“'+esc(proposal.title)+'”</b> — tap to use that.</div>':"")+
    (options?'<label>Add to an existing case</label><select id="caseSelect" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:inherit;font-size:14px">'+
      '<option value="">— new case —</option>'+options+'</select>':"")+
    '<div id="newFields"'+(options?' style="display:'+(proposal?"none":"block")+'"':'')+'>'+
      '<label>New case — name it in your words</label>'+
      '<input id="caseTitle" placeholder="e.g. Diconium — Scott Gardner submission" value="'+esc(subj)+'">'+
      '<label>What\'s the situation? (optional)</label>'+
      '<textarea id="caseSit" rows="3" placeholder="A sentence in your words — what this is and what you\'re trying to do."></textarea>'+
    '</div>'+
    '<div class="modal-actions"><button class="btn" data-close>Cancel</button>'+
      '<button class="btn primary" id="doRegister">Register</button></div>'
  );
}
function newCaseModal(){
  return openModal(
    '<h3>Start a case</h3>'+
    '<p class="hint">A deliberate act — you decide this is worth tracking. Name it however you think of it; the structure follows your language, not a template.</p>'+
    '<label>Name it in your words</label>'+
    '<input id="caseTitle" placeholder="e.g. Diconium IT Business Partner search">'+
    '<label>What\'s the situation? (optional)</label>'+
    '<textarea id="caseSit" rows="3" placeholder="A sentence on what this is and what you want to happen."></textarea>'+
    '<div class="modal-actions"><button class="btn" data-close>Cancel</button>'+
      '<button class="btn primary" id="doNewCase">Create</button></div>'
  );
}

/* ================= event wiring (delegated) ================= */
function wire(){
  document.querySelectorAll(".msg[data-thread]").forEach(el=>{
    el.onclick=()=>openThread(el.getAttribute("data-thread"));
  });
  document.querySelectorAll(".prov[data-prov]").forEach(el=>{
    el.onclick=(e)=>{e.preventDefault();e.stopPropagation();document.getElementById(el.getAttribute("data-prov")).classList.toggle("show");};
  });
  const more=document.getElementById("moreBtn"); if(more) more.onclick=loadMore;
  const tt=document.getElementById("threadToggle"); if(tt) tt.onclick=()=>{STATE.showFullThread=!STATE.showFullThread;renderStage();};
  document.querySelectorAll(".act[data-act]").forEach(el=>{ el.onclick=()=>handleAct(el.getAttribute("data-act")); });
  const os=document.getElementById("openSend"); if(os) os.onclick=handleOpenBox;
  const ob=document.getElementById("openBox"); if(ob) ob.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleOpenBox();}});
  // cases
  const nc=document.getElementById("newCaseBtn"); if(nc) nc.onclick=()=>newCaseModal();
  document.querySelectorAll("[data-opencase]").forEach(el=>{ el.onclick=(e)=>{e.preventDefault();openCase(el.getAttribute("data-opencase"));}; });
  document.querySelectorAll("[data-back]").forEach(el=>{ el.onclick=(e)=>{e.preventDefault();STATE.openCase=null;renderCasesView();}; });
  document.querySelectorAll(".chip[data-status]").forEach(el=>{ el.onclick=()=>setCaseStatus(el.getAttribute("data-status")); });
  document.querySelectorAll("[data-openref]").forEach(el=>{ el.onclick=(e)=>{e.preventDefault();STATE.openCase=null;STATE.view="inbox";document.querySelector('.toggle button[data-view="inbox"]').click();openThread(el.getAttribute("data-openref"));}; });
}
function wireModal(){
  document.querySelectorAll("[data-close]").forEach(el=>el.onclick=closeModal);
  const sel=document.getElementById("caseSelect");
  if(sel) sel.onchange=()=>{const nf=document.getElementById("newFields"); if(nf) nf.style.display=sel.value?"none":"block";};
  const ap=document.getElementById("acceptPropose");
  if(ap) ap.onclick=()=>{ const nf=document.getElementById("newFields"); if(nf) nf.style.display="none"; };
  const dr=document.getElementById("doRegister"); if(dr) dr.onclick=doRegister;
  const dn=document.getElementById("doNewCase"); if(dn) dn.onclick=doNewCase;
}
document.getElementById("modalBg").addEventListener("click",e=>{ if(e.target.id==="modalBg") closeModal(); });

/* ================= actions ================= */
async function openThread(threadId){
  STATE.openCase=null;
  const hit=STATE.pages.find(m=>m.thread_id===threadId);
  STATE.showFullThread=false;
  clearSpeech();
  say("Opening <b>"+esc(hit?(hit.from_name||hit.from_email):"this thread")+"</b>.");
  STATE.related="loading"; STATE.openThread=null;
  renderStage();
  try{
    const t=await lens("thread",{source_key:MAILBOX,thread_id:threadId});
    STATE.openThread=t; renderStage();
    say("Finding everything else that belongs with it — mail and documents both.","small");
    const r=await lens("related",{source_key:MAILBOX,thread_id:threadId});
    STATE.related=r; renderStage();
    const m=(r.mail&&r.mail.count)||0, d=(r.documents&&r.documents.count)||0;
    clearSpeech();
    if(m||d) say("Here's what you didn't know — laid out above the thread.");
    else say("This one stands alone. The thread's above; nothing else connects to it.","small");
  }catch(e){
    STATE.related={error:String(e.message||e)};
    renderStage();
    say("That didn't come back cleanly. The reason is on the card — we'd rather show you the failure than a half-built story.","small");
  }
}

function handleAct(kind){
  const t=STATE.openThread; if(!t) return;
  if(kind==="answer" || kind==="forward"){
    const verb = kind==="answer" ? "Replying" : "Forwarding";
    say(verb+" means writing into your mailbox, and we only hold permission to read it today. When you want that, you grant it deliberately, once — and you'll see exactly what changed.","small");
    return;
  }
  if(kind==="register"){ registerModal(t); return; }
  if(kind==="opencase"){ const eng=STATE.engagement[t.thread_id]; if(eng) openCase(eng.case_id); return; }
}

function handleOpenBox(){
  const ta=document.getElementById("openBox"); const q=(ta.value||"").trim(); if(!q) return;
  ta.value="";
  say("You said: <em>"+esc(q)+"</em>","small");
  say("The open box is a shortcut into the same three moves — answer, forward, or just register. Answering isn't wired yet (we only read today); to keep this without a reply, use <b>Just register</b>. Your words aren't lost.","small");
}

async function doRegister(){
  const t=STATE.openThread; if(!t) return;
  const sel=document.getElementById("caseSelect");
  const existingId = sel && sel.value ? sel.value : null;
  const label = (t.subject||"thread")+" — "+((t.messages&&t.messages[0]&&(t.messages[0].from_name||t.messages[0].from_email))||"");
  try{
    if(existingId){
      const c=await rpc("sol_case_register",{p_case_id:existingId,p_ref_type:"thread",p_ref_id:t.thread_id,p_ref_label:label});
      closeModal(); await refreshCases();
      say("Registered into <b>“"+esc(c.title)+"”</b>. It's an open loop now — on the record, no reply sent.","small");
    }else{
      const title=(document.getElementById("caseTitle").value||"").trim();
      const sit=(document.getElementById("caseSit").value||"").trim();
      if(!title){ document.getElementById("caseTitle").focus(); return; }
      /* the twin has no argument defaults, so every parameter is named explicitly */
      const c=await rpc("sol_case_create",{p_title:title,p_situation:sit||null,p_parent_case_id:null,p_first_ref_type:"thread",p_first_ref_id:t.thread_id,p_first_ref_label:label});
      closeModal(); await refreshCases();
      say("Started the case <b>“"+esc(c.title)+"”</b> and registered this into it.","small");
    }
    renderStage();
  }catch(e){ say("Couldn't register that: "+esc(String(e.message||e)),"small"); }
}
async function doNewCase(){
  const title=(document.getElementById("caseTitle").value||"").trim();
  const sit=(document.getElementById("caseSit").value||"").trim();
  if(!title){ document.getElementById("caseTitle").focus(); return; }
  try{
    const c=await rpc("sol_case_create",{p_title:title,p_situation:sit||null,p_parent_case_id:null,p_first_ref_type:null,p_first_ref_id:null,p_first_ref_label:null});
    closeModal(); await refreshCases();
    STATE.openCase=STATE.cases.find(x=>x.id===c.id)||c; renderCasesView();
    say("Case <b>“"+esc(c.title)+"”</b> is open. Register threads into it as you work them.","small");
  }catch(e){ say("Couldn't create the case: "+esc(String(e.message||e)),"small"); }
}

async function openCase(id){
  try{
    const c=await rpc("sol_case_get",{p_case_id:id});
    STATE.openCase=c; renderCasesView();
  }catch(e){ say("Couldn't open that case: "+esc(String(e.message||e)),"small"); }
}
async function setCaseStatus(status){
  const c=STATE.openCase; if(!c) return;
  let waiting=null;
  if(status==="waiting"){ waiting=prompt("Waiting on what, or whom?")||null; }
  try{
    const updated=await rpc("sol_case_set_status",{p_case_id:c.id,p_status:status,p_waiting_on:waiting});
    STATE.openCase=updated; await refreshCases(); renderCasesView();
  }catch(e){ say("Couldn't update status: "+esc(String(e.message||e)),"small"); }
}

async function refreshCases(){
  try{
    STATE.cases = await rpc("sol_cases_list",{}) || [];
    STATE.engagement = await rpc("sol_engagement_map",{}) || {};
  }catch(e){ /* cases are additive; never block the inbox on them */ }
  paintCounts();
}

/* the Solutions Lens is a workspace VIEW, reached from the toggle-independent cases area.
   Rendered in place of the panes when a case (or the case list) is open. */
function renderCasesView(){
  const stage=document.getElementById("stage");
  if(STATE.openCase){ stage.innerHTML=caseWorkspace(); }
  else { stage.innerHTML=casesList(); }
  wire();
}

/* ================= inbox pagination ================= */
async function loadMore(){
  if(!STATE.nextToken || STATE.loadingMore) return;
  STATE.loadingMore=true; renderStage();
  try{
    const inbox=await lens("inbox",{source_key:MAILBOX,page_token:STATE.nextToken});
    STATE.pages=STATE.pages.concat(inbox.messages||[]);
    STATE.nextToken=inbox.next_page_token||null;
    STATE.filter=inbox.filter_applied||STATE.filter;
  }catch(e){ say("Couldn't load more mail: "+esc(String(e.message||e)),"small"); }
  STATE.loadingMore=false; renderStage();
}

/* ================= counts / toggle ================= */
function paintCounts(){
  document.getElementById("cInbox").textContent = STATE.totalEstimate ? ("~"+STATE.totalEstimate) : STATE.pages.length;
  const map=STATE.engagement;
  const open=Object.values(map).filter(v=>v.status==="open"||v.status==="waiting").length;
  const res=Object.values(map).filter(v=>v.status==="resolved").length;
  document.getElementById("cLoops").textContent=open;
  document.getElementById("cResolved").textContent=res;
  const cc=document.getElementById("cCases"); if(cc) cc.textContent=STATE.cases.length?("· "+STATE.cases.length):"";
}
function setupToggle(){
  const tg=document.getElementById("toggle"); tg.style.display="inline-flex";
  tg.querySelectorAll("button").forEach(b=>{
    b.onclick=()=>{
      tg.querySelectorAll("button").forEach(x=>x.classList.remove("on"));
      b.classList.add("on");
      STATE.view=b.getAttribute("data-view");
      STATE.openCase=null;
      renderStage();
    };
  });
  const cb=document.getElementById("casesBtn"); cb.style.display="inline-flex";
  cb.onclick=()=>{ STATE.openCase=null; renderCasesView(); };
}

/* ================= ask box ================= */
document.getElementById("askSend").onclick=()=>{
  const t=document.getElementById("askBox"); const q=(t.value||"").trim(); if(!q) return;
  t.value="";
  say("You asked: <em>"+esc(q)+"</em>","small");
  say("We're not wired to answer free questions here yet — this lens reads, assembles, and lets you register cases today. Ask it on the brain page and we'll take it from there.","small");
};
document.getElementById("askBox").addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();document.getElementById("askSend").click();}
});
document.getElementById("composeBtn").onclick=()=>{
  say("Replying means writing into your mailbox, and we only hold permission to read it. We won't quietly ask for more — when you want that, you grant it deliberately, once.","small");
};

/* ================= boot ================= */
async function pickUpSession(){
  try{
    const { data:{ session } } = await sb.auth.getSession();
    if(session && session.access_token){
      SESSION_JWT = session.access_token;
      const id = await sb.rpc("identity_for_jwt");
      if(id && id.data){ ROUTE="jwt"; }
      else { SESSION_JWT=null; } // unbound session is discarded and boot() refuses. Previously: → fall back, honestly reported by lens
    }
  }catch{ SESSION_JWT=null; }
}

async function boot(){
  await pickUpSession();
  if(!SESSION_JWT){
    document.getElementById("sub").textContent="";
    document.getElementById("stage").innerHTML='<div class="note err" style="margin:16px 0 0">'+
      '<h3>Sign in to read this mailbox</h3>'+
      '<p>This lens reads as <b>you</b>, with your own sign-in. There is no shared key and no '+
      'assumed identity behind it, so without a session there is nothing it can honestly show. '+
      'That is a refusal, not a failure.</p>'+
      '<p style="margin-top:7px"><b>The way out:</b> <a href="../login/">sign in</a>, and this fills '+
      'in with whatever your own accounts already reach.</p></div>';
    say("Not signed in. This refuses rather than assuming who you are.","small");
    return;
  }
  try{
    say("Reading your mailbox live — as you, with your own sign-in.");
    const [src,inbox,cases,engagement]=await Promise.all([
      lens("sources",{}),
      lens("inbox",{source_key:MAILBOX}),
      rpc("sol_cases_list",{}).catch(()=>[]),
      rpc("sol_engagement_map",{}).catch(()=>({})),
    ]);
    STATE.sources=src;
    STATE.pages=inbox.messages||[];
    STATE.nextToken=inbox.next_page_token||null;
    STATE.totalEstimate=inbox.total_estimate||null;
    STATE.filter=inbox.filter_applied||null;
    STATE.cases=cases||[];
    STATE.engagement=engagement||{};

    const addr=(await humanMailbox(MAILBOX)) || MAILBOX.replace("gmail:","");
    document.getElementById("title").textContent=addr;
    const est = STATE.totalEstimate ? (" of ~"+STATE.totalEstimate) : "";
    document.getElementById("sub").innerHTML='<span class="mono">'+esc(STATE.pages.length)+est+' threads · read live, nothing copied</span>';
    document.getElementById("sovLine").textContent="Read as you — "+(src.asker&&src.asker.name?src.asker.name:"you");

    setupToggle(); paintCounts(); renderStage();
    clearSpeech();
    say("This is <b>"+esc(addr)+"</b>, read live just now — your whole inbox, nothing filtered out but spam.");
    say("Open any email: we lead with <b>what you didn't know</b> — the cross-source story — then the thread, then what you can do. Answer, forward, or just register it into a case.","small");
  }catch(e){
    document.getElementById("sub").textContent="";
    document.getElementById("stage").innerHTML='<div class="note err" style="margin:16px 0 0"><h3>We couldn\'t open the mailbox</h3><p>'+esc(String(e.message||e))+'</p>'+
      '<p style="margin-top:7px"><b>The way out:</b> this usually means the mailbox isn\'t connected under your own sign-in, or the connection has lapsed. Reconnecting it from your brain page fixes it.</p></div>';
    say("We couldn't get in. The reason is on the page — no guessing from us.","small");
  }
}

window.addEventListener("DOMContentLoaded",()=>{
  boot();
});
