export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-18';
  try {
    var key = context.env.FOOTBALL_API_KEY;
    var r = await fetch('https://live-football-api.com/api/v1/matches?date=' + date + '&language=en', { headers: { 'X-API-Key': key } });
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var ts = 0;
      var timeVal = '';
      
      // GET REAL VARIED TIME - Try fixture.date first (has real time per league)
      var dateStr = '';
      if (m.fixture && m.fixture.date) dateStr = m.fixture.date;
      else if (m.date) dateStr = m.date;
      else if (m.datetime) dateStr = m.datetime;
      else if (m.kickoff) dateStr = m.kickoff;

      if (dateStr) {
        var d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          ts = Math.floor(d.getTime() / 1000);
          // Lagos time
          var lagos = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          var p = lagos.split(':');
          var h = parseInt(p[0], 10);
          h = (h + 1) % 24; // PLUS 1 HOUR FOR FLASHSCORE
          timeVal = (h < 10 ? '0' + h : '' + h) + ':' + p[1];
        }
      }
      
      // Fallback to timestamp if no fixture.date
      if (!timeVal && m.timestamp) {
        ts = m.timestamp;
        var d2 = new Date(ts * 1000);
        var lagos2 = d2.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
        var p2 = lagos2.split(':');
        var h2 = parseInt(p2[0], 10);
        h2 = (h2 + 1) % 24;
        timeVal = (h2 < 10 ? '0' + h2 : '' + h2) + ':' + p2[1];
      }

      if (!timeVal) timeVal = '15:00';

      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';

      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts,
        home: { name: (m.home && m.home.name) ? m.home.name : 'Home', score: null },
        away: { name: (m.away && m.away.name) ? m.away.name : 'Away', score: null },
        ht: null,
        league: { country: country, name: leagueName },
        status: 'scheduled',
        isLive: false
      });
    }
    // Sort by real time - this makes every club time varied automatically
    out.sort(function(a,b){ return a.ts - b.ts; });
    
    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), { headers: { 'Content-Type': 'application/json' } });
  }
}
