export async function onRequestGet(context) {
  const apikey = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!apikey) {
    return new Response(JSON.stringify({ success: false, data: { matches: [] } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${apikey}&date=${date}&lang=en`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message, data: { matches: [] } }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
export async function onRequestGet(c){
const key=c.env.FOOTBALL_API_KEY;
let date=new URL(c.request.url).searchParams.get('date')||"2026-10-17";
try{
let r=await fetch(`https://live-football-api.com/api/v1/matches?date=${date}&language=en`,{headers:{"X-API-Key":key}});
let j=await r.json();
let list=j.data?.matches||[];

let out=list.map((m,i)=>{
let isFinished=m.status?.status==="finished"||m.status?.state==="postGame";
return{
id:m.id||i,
home:{name:m.home?.name||"Home",score:m.home?.score??0},
away:{name:m.away?.name||"Away",score:m.away?.score??0},
ht:(m.halftime&&m.halftime.home!==null)?{home:m.halftime.home,away:m.halftime.away}:null,
league:{country:m.league?.country||"World",name:m.league?.name||m.league?.country||"League"},
status:m.status?.status||"FT",
isLive:m.status?.is_live||false
};
});
return new Response(JSON.stringify({data:{matches:out}}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}catch(e){
return new Response(JSON.stringify({data:{matches:[]},error:e.message}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
}
