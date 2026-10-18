export async function onRequestGet(c){
  const key=c.env.FOOTBALL_API_KEY;
  let date=new URL(c.request.url).searchParams.get('date')||"2026-10-18";
  try{
    let r=await fetch(`https://live-football-api.com/api/v1/matches?date=${date}&language=en`,{headers:{"X-API-Key":key}});
    let j=await r.json();
    let list=j.data?.matches||[];
    let out=list.map((m,i)=>{
      let isFinished=m.status?.status==="finished"||m.status?.state==="postGame"||false;
      let isLive=m.status?.is_live||false;
      let timeVal=m.time||"";
      if(!timeVal && m.timestamp){let d=new Date(m.timestamp*1000);timeVal=d.toISOString().substr(11,5)}
      if(!timeVal && m.fixture?.date){let mm=m.fixture.date.match(/(\d{2}:\d{2})/);if(mm)timeVal=mm[1]}
      if(timeVal.includes("T")){let mm=timeVal.match(/(\d{2}:\d{2})/);if(mm)timeVal=mm[1]}
      // ADD 2 HOURS TO MATCH FLASHSCORE.MOBI
      if(timeVal.includes(":")){let p=timeVal.split(":");let h=parseInt(p[0]);let mi=p[1].slice(0,2);h=(h+2)%24;timeVal=String(h).padStart(2,"0")+":"+mi}
      if(!timeVal) timeVal="15:00";
      let country=m.league?.country||"Other";
      let leagueName=m.league?.name||"League";
      if(leagueName.toLowerCase().includes("laliga")||leagueName.toLowerCase().includes("la liga")){country="Spain";leagueName="LaLiga"}
      if(country==="World" && leagueName.toLowerCase().includes("premier")) country="England";
      if(country==="World" && leagueName.toLowerCase().includes("ligue 1")) country="France";
      if(country==="World" && leagueName.toLowerCase().includes("bundesliga")) country="Germany";
      if(country==="World" && leagueName.toLowerCase().includes("serie a")) country="Italy";
      return{id:m.id||i,time:timeVal,home:{name:m.home?.name||"Home",score:m.home?.score??null},away:{name:m.away?.name||"Away",score:m.away?.score??null},ht:null,league:{country:country,name:leagueName},status:isFinished?"finished":(isLive?"live":"scheduled"),isLive:isLive};
    });
    return new Response(JSON.stringify({data:{matches:out}}),[STRIPPED]
  }catch(e){return new Response(JSON.stringify({data:{matches:[]},[STRIPPED]
}
