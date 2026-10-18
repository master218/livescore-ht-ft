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

      // CORRECT FLASHSCORE TIME FOR LAGOS
      let timeVal = '';
      // 1. Try timestamp (most accurate)
      if (m.timestamp) {
        let d = new Date(m.timestamp * 1000);
        timeVal = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
      } else if (m.fixture && m.fixture.timestamp) {
        let d = new Date(m.fixture.timestamp * 1000);
        timeVal = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
      } else if (m.time && m.time.match(/^\d{2}:\d{2}/)) {
        // API already gives time like 13:00 - treat as UTC and convert to Lagos
        timeVal = m.time.substring(0,5);
      } else if (m.fixture && m.fixture.date) {
        let d = new Date(m.fixture.date);
        if (!isNaN(d)) timeVal = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
      }
      if (!timeVal) timeVal = m.time ? m.time.substring(0,5) : '14:00';

      let country = m.league && m.league.country ? m.league.country : 'Other';
      let leagueName = m.league && m.league.name ? m.league.name : 'League';
      let low = leagueName.toLowerCase();
      if (low.indexOf('laliga') > -1 || low.indexOf('la liga') > -1) { country = 'Spain'; leagueName = 'LaLiga'; }

      // HT
      let ht = null;
      if (m.halftime && m.halftime.home != null) ht = { home: m.halftime.home, away: m.halftime.away };
      else if (m.home && m.home.halftime != null) ht = { home: m.home.halftime, away: m.away.halftime };

      return {
        id: m.id || i,
        time: timeVal,
        home: { name: m.home && m.home.name ? m.home.name : 'Home', score: m.home && m.home.score != null ? m.home.score : null },
        away: { name: m.away && m.away.name ? m.away.name : 'Away', score: m.away && m.away.score != null ? m.away.score : null },
        ht: ht,
        league: { country: country, name: leagueName },
        status: isFinished ? 'finished' : (isLive ? 'live' : 'scheduled'),
        isLive: !!isLive
      };
    });
    return new Response(JSON.stringify({ data: { matches: out } }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
