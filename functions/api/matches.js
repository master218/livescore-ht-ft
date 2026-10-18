export async function onRequestGet(c){
  const key=c.env.FOOTBALL_API_KEY;
  let date=new URL(c.request.url).searchParams.get('date')||"2026-10-18";
  try{
    let r=await fetch(`https://live-football-api.com/api/v1/matches?date=${date}&language=en`,{headers:{"X-API-Key":key}});
    let j=await r.json();
    let list=j.data?.matches||[];
    
    let out=list.map((m,i)=>{
      let isFinished=m.status?.status==="finished"||m.status?.state==="postGame";
      let isLive=m.status?.is_live||false;
      
      // GET TIME FROM ANY FIELD
      let timeVal="";
      let ts=null;
      
      // 1. Direct time fields
      timeVal = m.time || m.kickoff || m.start_time || m.match_time || "";
      
      // 2. Timestamp fields (Unix seconds) - this API uses this!
      if(m.timestamp) ts=m.timestamp;
      else if(m.game_start) ts=m.game_start;
      else if(m.fixture && m.fixture.timestamp) ts=m.fixture.timestamp;
      else if(m.fixture && m.fixture.date){
        // ISO date like 2026-10-18T13:00:00Z
        let d=new Date(m.fixture.date);
        if(!isNaN(d)) ts=Math.floor(d.getTime()/1000);
      }
      
      // If we have timestamp, convert to HH:MM
      if(!timeVal && ts){
        let d=new Date(ts*1000);
        // d is UTC, convert to string HH:MM UTC
        timeVal = d.toISOString().substr(11,5); // 13:00 in UTC
      }
      
      // If timeVal still empty like "2026-10-18T13:00:00Z" extract
      if(timeVal && timeVal.includes("T")){
        let mm=timeVal.match(/(\d{2}:\d{2})/);
        if(mm) timeVal=mm[1];
      }
      
      // FINAL: Add 2 hours to match Flashscore.mobi (UTC -> CEST +2)
      if(timeVal && timeVal.includes(":")){
        let p=timeVal.split(":");
        let h=parseInt(p[0])||0;
        let mi=p[1].substring(0,2)||"00";
        // Add 2 hours for Europe/Paris time
        let d2=new Date();
        d2.setUTCHours(h);
        d2.setUTCMinutes(parseInt(mi));
        d2.setUTCHours(d2.getUTCHours()+2);
        timeVal=String(d2.getUTCHours()).padStart(2,"0")+":"+String(d2.getUTCMinutes()).padStart(2,"0");
      }
      
      if(!timeVal) timeVal="15:00"; // fallback so never "-"
      
      let country=m.league?.country||"Other";
      let leagueName=m.league?.name||"League";
      if(country==="World"){
        let l=leagueName.toLowerCase();
        if(l.includes("premier")) country="England";
        else if(l.includes("ligue 1")) country="France";
        else if(l.includes("bundesliga")) country="Germany";
        else if(l.includes("serie a")) country="Italy";
        else if(l.includes("la liga")||l.includes("laliga")) country="Spain";
        else if(l.includes("eredivisie")) country="Netherlands";
        else if(l.includes("primeira")) country="Portugal";
        else if(l.includes("champions")) country="Europe";
        else if(l.includes("europa")) country="Europe";
      }
      
      return{
        id:m.id||i,
        time:timeVal,
        home:{name:m.home?.name||"Home",score:m.home?.score??null},
        away:{name:m.away?.name||"Away",score:m.away?.score??null},
        ht:(m.halftime&&m.halftime.home!==null)?{home:m.halftime.home,away:m.halftime.away}:null,
        league:{country:country,name:leagueName},
        status:isFinished?"finished":(isLive?"live":"scheduled"),
        isLive:isLive
      };
    });
    
    return new Response(JSON.stringify({data:{matches:out}}),{headers:{"Content-Type":"application/json"}});
  }catch(e){
    return new Response(JSON.stringify({data:{matches:[]},error:e.message}),{headers:{"Content-Type":"application/json"}});
  }
}
