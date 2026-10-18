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
      
      // AUTOMATIC TIME PER CLUB - try every field the API can have
      let timeVal = null;
      let ts = m.timestamp || m.fixture?.timestamp || m.game_start || m.startTime || null;
      
      if (ts) {
        // timestamp is seconds - convert to Lagos time automatically
        let d = new Date(ts * 1000);
        timeVal = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
      } else if (m.time && /^\d{2}:\d{2}/.test(m.time)) {
        timeVal = m.time.slice(0,5);
      } else if (m.fixture?.date) {
        let d = new Date(m.fixture.date);
        if (!isNaN(d)) timeVal = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
      } else if (m.kickoff) {
        let d = new Date(m.kickoff);
        if (!isNaN(d)) timeVal = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
      }
      
      if (!timeVal) timeVal = '14:00'; // fallback only if no data

      let country = m.league?.country || 'Other';
      let leagueName = m.league?.name || 'League';
      let low = leagueName.toLowerCase();
      if (low.includes('laliga') || low.includes('la liga')) { country = 'Spain'; leagueName = 'LaLiga'; }

      let ht = null;
      if (m.halftime?.home != null) ht = { home: m.halftime.home, away: m.halftime.away };
      else if (m.home?.halftime != null) ht = { home: m.home.halftime, away: m.away.halftime };

      return {
        id: m.id || i,
        time: timeVal,
        timestamp: ts || 0,
        home: { name: m.home?.name || 'Home', score: m.home?.score ?? null },
        away: { name: m.away?.name || 'Away', score: m.away?.score ?? null },
        ht: ht,
        league: { country: country, name: leagueName },
        status: isFinished ? 'finished' : (isLive ? 'live' : 'scheduled'),
        isLive: !!isLive
      };
    });
    // Sort by actual kickoff time per club
    out.sort((a,b) => (a.timestamp||0) - (b.timestamp||0) || a.time.localeCompare(b.time));
    
    return new Response(JSON.stringify({ data: { matches: out } }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
