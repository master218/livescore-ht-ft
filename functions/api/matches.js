export async function onRequestGet(c){
const k=c.env.FOOTBALL_API_KEY||c.env.APISPORT_KEY||c.env.LIVE_FOOTBALL_API_KEY;
const d=new URL(c.request.url).searchParams.get('date')||new Date().toISOString().split('T')[0];
if(!k)return new Response(JSON.stringify({data:{matches:[]},error:"NO KEY"}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
try{
let r=await fetch(`https://api.apisport.online/api/v1/fixtures?date=${d}`,{headers:{Authorization:`Bearer ${k}`}});
let j=await r.json();
let list=j.fixtures||j.data?.fixtures||j.data||[];
if(!list.length){
let lv=await fetch(`https://api.apisport.online/api/v1/fixtures/live`,{headers:{Authorization:`Bearer ${k}`}});
let lj=await lv.json();
list=lj.fixtures||lj.data?.fixtures||lj.data||[];
}
let ms=list.map((f,i)=>{
return{
id:f.fixture?.id||f.id||i,
home:{name:f.teams?.home?.name||f.home_team||"Home",score:f.goals?.home??f.score?.fulltime?.home??0,ht_score:f.score?.halftime?.home??0},
away:{name:f.teams?.away?.name||f.away_team||"Away",score:f.goals?.away??f.score?.fulltime?.away??0,ht_score:f.score?.halftime?.away??0},
ht:{home:f.score?.halftime?.home??0,away:f.score?.halftime?.away??0},
league:{country:f.league?.country||"World",name:f.league?.name||"League"}
};
});
return new Response(JSON.stringify({data:{matches:ms}}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}catch(e){
return new Response(JSON.stringify({data:{matches:[]},error:e.message}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
}
