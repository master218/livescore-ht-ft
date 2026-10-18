export async function onRequestGet(c){
const key=c.env.FOOTBALL_API_KEY;
let date=new URL(c.request.url).searchParams.get('date')||"2026-10-18";
try{
let r=await fetch(`https://live-football-api.com/api/v1/matches?date=${date}&language=en`,{headers:{"X-API-Key":key}});
let j=await r.json();
let list=j.data?.matches||[];
let out=list.map((m,i)=>{
let isFinished=m.status?.status==="finished"||m.status?.state==="postGame"||m.status?.status==="FT";
let isLive=m.status?.is_live||false;
let timeVal=m.time||"";
if(typeof timeVal==="string"&&timeVal.includes("T")){
 let mm=timeVal.match(/(\d{2}:\d{2})/);
 if(mm) timeVal=mm[1];
}
// ADD 2 HOURS TO MATCH FLASHSCORE.MOBI
if(timeVal && timeVal.includes(":")){
 let parts=timeVal.split(":");
 let h=parseInt(parts[0])||0;
 let mm=parts[1]||"00";
 h=(h+2)%24; // +2 hours
 timeVal=`${String(h).padStart(2,'0')}:${mm}`;
}
let country=m.league?.country||"Other";
let leagueName=m.league?.name||"League";
if(country==="World"){
 let l=leagueName.toLowerCase();
 if(l.includes("premier"))country="England";
 else if(l.includes("ligue 1"))country="France";
 else if(l.includes("bundesliga"))country="Germany";
 else if(l.includes("serie a"))country="Italy";
 else if(l.includes("la liga")||l.includes("laliga"))country="Spain";
 else if(l.includes("eredivisie"))country="Netherlands";
 else if(l.includes("primeira")||l.includes("liga portugal"))country="Portugal";
 else if(l.includes("champions"))country="Europe";
 else if(l.includes("europa"))country="Europe";
}
return{
id:m.id||i,
time:timeVal,
home:{name:m.home?.name||"Home",score:m.home?.score??null},
away:{name:m.away?.name||"Away",score:m.away?.score??null},
ht:(m.halftime&&m.halftime.home!=null)?{home:m.halftime.home,away:m.halftime.away}:null,
league:{country:country,name:leagueName},
status:isFinished?"finished":(isLive?"live":"scheduled"),
isLive:isLive
};
});
return new Response(JSON.stringify({data:{matches:out}}),[STRIPPED]
}catch(e){
return new Response(JSON.stringify({data:{matches:[]},[STRIPPED]
}
}
