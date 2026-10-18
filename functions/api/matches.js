export async function onRequestGet(context) {
  const key = context.env.FOOTBALL_API_KEY;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || '2026-10-18';
  try {
    const r = await fetch('https://live-football-api.com/api/v1/matches?date=' + date + '&language=en', {
      headers: { 'X-API-Key': key },
      cf: { cacheTtl: 0 }
    });
    const j = await r.json();
    const list = j.data?.matches || [];

    const out = list.map((m, i) => {
      const isFinished = m.status?.status === 'finished' || m.status?.state === 'postGame';
      const isLive = !!m.status?.is_live;
      let ts = m.timestamp || m.fixture?.timestamp || 0;
      let timeVal = '15:00';

      try {
        if (ts) {
          // Get Lagos time
          const d = new Date(ts * 1000);
          let lagosTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          // PLUS 1 HOUR to match Flashscore.mobi
          let [h, mm] = lagosTime.split(':').map(Number);
          h = (h + 1) % 24;
          timeVal = String(h).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
        } else if (m.time) {
          let [h, mm] = String(m.time).slice(0,5).split(':').map(Number);
          h = (h + 1) % 24;
          timeVal = String(h).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
        } else if (m.fixture?.date) {
          const d = new Date(m.fixture.date);
          if (!isNaN(d)) {
            let lagosTime = d.toLocaleTimeString('en-GB
