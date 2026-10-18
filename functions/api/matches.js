export async function onRequestGet(context) {
  const key = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || '2026-10-18';
  const dParam = url.searchParams.get('date') || date;

  try {
    // NO CACHE - get fresh time
    const r = await fetch('https://live-football-api.com/api/v1/matches?date=' + dParam + '&language=en', {
      headers: { 'X-API-Key': key, 'Cache-Control': 'no-cache' },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    const j = await r.json();
    const list = j.data?.matches || [];

    const out = list.map((m, i) => {
      const isFinished = m.status?.status === 'finished' || m.status?.state === 'postGame';
      const isLive = !!m.status?.is_live;

      // AUTOMATIC REAL KICKOFF TIME PER CLUB
      let timeVal = '';
      let ts = m.timestamp || m.fixture?.timestamp || 0;

      if (ts) {
        const d = new Date(ts * 1000);
        timeVal = d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Africa/Lagos'
        });
      } else if (m.time) {
        // time comes like "13:00:00" or "13:00" - take it as is, convert to Lagos
        timeVal = String(m.time).slice(0,5);
      } else if (m.fixture?.date) {
        const d = new Date(m.fixture.date);
        if (!isNaN(d)) {
          timeVal = d.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Africa/Lagos'
          });
          ts = Math.floor(d.getTime()/1000);
        }
      }

      if (!timeVal || timeVal === '00:00') timeVal = '14:00';

      let country = m.league?.country || 'Other';
      let leagueName = m.league?.name || 'League';
      if (leagueName.toLowerCase().includes('laliga')) { country = 'Spain'; leagueName = 'LaLiga'; }

      return {
        id: m.id || i,
        time: timeVal,
        ts: ts,
        home: { name: m.home?.name || 'Home', score: m.home?.score ?? null },
        away: { name: m.away?.name || 'Away', score: m.away?.score ?? null },
        ht: m.halftime || null,
        league: { country, name: leagueName },
        status: isFinished ? 'finished' : (isLive ? 'live' : 'scheduled'),
        isLive
      };
    });

    // Sort each match by real time so clubs show different times
    out.sort((a,b) => a.ts - b.ts);

    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] }, error: String(e) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
}
