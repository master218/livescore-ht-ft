export async function onRequest(c){
  const d = new URL(c.request.url).searchParams.get("date") || "2026-05-12";
  const k = c.env.FOOTBALL_API_KEY;
  const r = await fetch(`https://www.live-football-api.com/api/v1/matches?api_key=${k}&date=${d}&lang=en`);
  const j = await r.json();
  const m = (j.data||[]).map(x=>({
    home: x.home_team,
    away: x.away_team,
    time: x.time || x.match_time || "00:00",
    ht: x.ht_score || x.halftime_score || `${x.home_score_ht??0}-${x.away_score_ht??0}`,
    ft: x.score || x.ft_score || `${x.home_score??0}-${x.away_score??0}`,
    league: x.league_name,
    status: x.status
  }));
  return new Response(JSON.stringify(m),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
}
