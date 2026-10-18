export async function onRequestGet(context) {
  const key = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || '2026-10-18';

  try {
    const r = await fetch('https://live-football-api.com/api/v1/matches?date=' + date + '&language=en', {
      headers: { 'X-API-Key': key },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    const j = await r.json();
    const list = j.data?.matches || j.data || [];

    const out = list.map((m, i) => {
      const isFinished = m.status?.status === 'finished' || m.status?.state === 'postGame';
      const isLive = !!m.status?.is_live;

      let rawTime = null;
      let ts = 0;
      
      if (m.timestamp) { ts = m.timestamp; rawTime = m.timestamp; }
      else if (m.fixture?.timestamp) { ts = m.fixture.timestamp; rawTime = ts; }
      else if (m.time) rawTime = m.time;
      else if (m.kickoff) rawTime = m.kickoff;
      else if (m.fixture?.date) rawTime = m.fixture.date;
      else if (m.date) rawTime = m.date;
      else if (m.datetime) rawTime = m.datetime;
      else if (m.start) rawTime = m.start;
      else if (m.match_time) rawTime = m.match_time;
      else if (m.fixture?.time) rawTime = m.fixture.time;

      let timeVal = '15:00'; // Default 15:00 now to match Flashscore
      
      try {
        if (ts) {
          const d = new Date(ts * 1000);
          let lagosTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          // PLUS 1 HOUR FOR FLASHSCORE
          let [h, mm] = lagosTime.split(':').map(Number);
          h = (h + 1) % 24;
          timeVal = String(h).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
        } else if (rawTime) {
          const s = String(rawTime);
          if (s.includes('T')) {
            const d = new Date(s);
            if (!isNaN(d)) {
              let lagosTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
              // PLUS 1 HOUR FOR FLASHSCORE
              let [h, mm] = lagosTime.split(':').map(Number);
              h = (h + 1) % 24;
              timeVal = String(h).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
              ts
