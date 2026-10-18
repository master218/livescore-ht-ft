export async function onRequestGet(c){
const key=c.env.FOOTBALL_API_KEY;
let date=new URL(c.request.url).searchParams.get('date')||"2026-10-17";
try{
let r=await fetch(`https://live-football-api.com/api/v1/matches?date=${date}&language=en&timezone=Europe/Paris`,{headers:{"X-API-Key":key}});
let j=await r.json();
let list=j.data?.matches||[];

let out=list.map((m,i)=>{
// FIX 1: TIME - you were not returning time at all! Frontend showed NS/--:--
let timeVal = m.time || m.kickoff || m.start || m.datetime || "";
if(m.date && m.time && m.time.includes(":")){
  // Combine date + time to full ISO with France offset
  timeVal = `${m.date}T${m.time}:00+02:00`;
}
if(m.fixture?.date) timeVal = m.fixture.date;
if(m.fixture?.timestamp) timeVal = m.fixture.timestamp;
if(m.kickoff_utc) timeVal = m.kickoff_utc;

// FIX 2: COUNTRY - you had || "World" - that's why TOP badge broke
let country = m.league?.country || m.country || "Other";
if(country==="World" || country==="world") country = m.league?.name?.includes("Premier") ? "England" : (m.league?.name?.includes("Ligue 1") ? "France" : "Other");
let leagueName = m.league?.name || "League";

// FIX 3: STATUS - you set || "FT" so all games looked finished
let isFinished = m.status?.status==="finished" || m.status?.state==="postGame" || m.status?.status==="FT" || m.status==="finished";
let isLive = m.status?.is_live || m.status?.isLive || false;
let statusStr = isFinished ? "finished" : (isLive ? "live" : "scheduled");

return{
id:m.id||i,
// THIS FIXES FRANCE TIME
time: timeVal,
timestamp: m.timestamp || m.fixture?.timestamp || null,
home:{name:m.home?.name||"Home",score:m.home?.score ?? null},
away:{name:m.away?.name||"Away",score:m.away?.score ?? null},
ht:(m.halftime&&m.halftime.home!==null)?{home:m.halftime.home,away:m.halftime.away}:null,
league:{country:country,name:leagueName},
status:statusStr,
isLive:isLive
};
});
return new Response(JSON.stringify({data:{matches:out}}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}catch(e){
return new Response(JSON.stringify({data:{matches:[]},error:e.message}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
}
