export async function onRequestGet(context){
const env=context.env;
const key=env.FOOTBALL_API_KEY||env.APISPORT_KEY;
const url=new URL(context.request.url);
let date=url.searchParams.get('date');
if(!date) date=new Date().toISOString().split('T')[0];

if(!key){
return new Response(JSON.stringify({data:{matches:[]}}),{
headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
});
}

try{
const res=await fetch(`https://api.apisport.online/api/v1/fixtures?date=${date}`,{
headers:{Authorization:`Bearer ${key}`}
});
const data=await res.json();
let fixtures=data.fixtures||data.data?.fixtures||data.data||[];

if(fixtures.length===0){
const res2=await fetch(`https://api.apisport.online/api/v1/fixtures/live`,{
headers:{Authorization:`Bearer ${key}`}
});
const data2=await res2.json();
fixtures=data2.fixtures||data2.data?.fixtures||data2.data||[];
}

const matches=fixtures.map((f,i)=>{
return{
id:f.fixture?.id||f.id||i,
home:{name:f.teams?.home?.name||"Home",score:f.goals?.home??f.score?.fulltime?.home??0},
away:{name:f.teams?.away?.name||"Away",score:f.goals?.away??f.score?.fulltime?.away??0},
ht:{home:f.score?.halftime?.home??0,away:f.score?.halftime?.away??0},
league:{country:f.league?.country||"World",name:f.league?.name||"League"},
status:f.fixture?.status?.short||f.status||"FT"
};
});

return new Response(JSON.stringify({data:{matches}}),{
headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
});

}catch(e){
return new Response(JSON.stringify({data:{matches:[]},error:e.message}),{
headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
});
}
}
