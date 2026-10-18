export async function onRequestGet(context) {
  const key = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || '2026-10-18';
  try {
    const r = await fetch('https://live-football-api.com/api/v1/matches?date=' + date + '&language=en', { headers: { 'X-API-Key': key } });
    const j = await r.json();
    const list = j.data && j.data.matches ? j.data.matches : [];
    const out = list.map((m, i) => {
      let isFinished = m.status && (m.status.status === 'finished' || m.status.state === 'postGame');
      let isLive = m.status && m.status.is_live;
      // TIME FIX - Flashscore Lagos time = UTC +1
      let timeVal = m.time || '';
      if (!timeVal && m.timestamp) { let d = new Date(m.timestamp * 1000); timeVal = d.toISOString().substr(11, 5); }
      if (timeVal && timeVal.indexOf('T') > -1) { let mat = timeVal.match(/(\d{2}:\d{2})/); if (mat) timeVal = mat[1]; }
      if (timeVal && timeVal.indexOf(':') > -1) {
        let p = timeVal.split(':'); let h = parseInt(p[0]) || 0; let mi = p[1].substring(0, 2);
        h = (h + 1) % 24; // +1 for Lagos = same as Flashscore.mobi Nigeria time
        let hs = h < 10 ? '0' + h : '' + h; timeVal = hs + ':' + mi;
      }
      if (!timeVal) timeVal = '15:00';
      let country = m.league && m.league.country ? m.league.country : 'Other';
      let leagueName = m.league && m.league.name ? m.league.name : 'League';
      let low = leagueName.toLowerCase();
      if (low.indexOf('laliga') > -1 || low.indexOf('la liga') > -1) { country = 'Spain'; leagueName = 'LaLiga'; }
      if (country === 'World' && low.indexOf('premier') > -1) country = 'England';
      if (country === 'World' && low.indexOf('ligue 1') > -1) country = 'France';
      if (country === 'World' && low.indexOf('bundesliga') > -1) country = 'Germany';
      if (country === 'World' && low.indexOf('serie a') > -1) country = 'Italy';
      // HT-FT DATA
      let ht = null;
      if (m.halftime && m.halftime.home != null) ht = { home: m.halftime.home, away: m.halftime.away };
      else if (m.home && m.home.halftime != null) ht = { home: m.home.halftime, away: m.away.halftime };
      else if (m.score && m.score.halftime) ht = { home: m.score.halftime.home, away: m.score.halftime.away };
      return {
        id: m.id || i, time: timeVal,
        home: { name: m.home && m.home.name ? m.home.name : 'Home', score: m.home && m.home.score != null ? m.home.score : null },
        away: { name: m.away && m.away.name ? m.away.name : 'Away', score: m.away && m.away.score != null ? m.away.score : null },
        ht: ht,
        league: { country: country, name: leagueName },
        status: isFinished ? 'finished' : (isLive ? 'live' : 'scheduled'), isLive: !!isLive
      };
    });
    return new Response(JSON.stringify({ data: { matches: out } }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
