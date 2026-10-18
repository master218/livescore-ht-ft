export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-18';
  try {
    var key = context.env.FOOTBALL_API_KEY;
    // ADD TIMEZONE - THIS IS KEY FOR YOUR PAID API TO GIVE VARIED TIMES
    var apiUrl = 'https://live-football-api.com/api/v1/matches?date=' + date + '&language=en&timezone=Africa/Lagos';
    var r = await fetch(apiUrl, { headers: { 'X-API-Key': key } });
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var home = (m.home && m.home.name) ? m.home.name : 'Home';
      var away = (m.away && m.away.name) ? m.away.name : 'Away';
      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';
      var timeVal = '15:00';
      var ts = 0;
      
      // YOUR PAID API HAS REAL TIME HERE - fixture.date = "2026-10-18T12:30:00+01:00" etc - VARIED PER LEAGUE
      var dateStr = '';
      if (m.fixture && m.fixture.date) dateStr = m.fixture.date;
      else if (m.fixture && m.fixture.datetime) dateStr = m.fixture.datetime;
      else if (m.kickoff) dateStr = m.kickoff;
      
      if (dateStr) {
        var d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          ts = d.getTime();
          // This gives varied times: 12:30, 15:00, 17:15, 20:45 etc per league
          var lagos = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          var p = lagos.split(':');
          var h = parseInt(p[0], 10);
          h = (h + 1) % 24; // +1 for Flashscore
          timeVal = (h < 10 ? '0' + h : '' + h) + ':' + p[1];
        }
      } else if (m.timestamp) {
        // Fallback - but this is why you had all 15:00
        var d2 = new Date(m.timestamp * 1000);
        var lagos2 = d2.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
        var p2 = lagos2.split(':');
        var h2 = parseInt(p2[0], 10);
        h2 = (h2 + 1) % 24;
        timeVal = (h2 < 10 ? '0' + h2 : '' + h2) + ':' + p2[1];
        ts = d2.getTime();
      }
      
      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts,
        home: { name: home, score: (m.home && m.home.score != null) ? m.home.score : null },
        away: { name: away, score: (m.away && m.away.score != null) ? m.away.score : null },
        ht: m.halftime || null,
        league: { country: country, name: leagueName },
        status: (m.status && m.status.is_live) ? 'live' : 'scheduled',
        isLive: !!(m.status && m.status.is_live)
      });
    }
    // Sort by REAL time - so 12:30 first, 20:45 last - varied like Flashscore
    out.sort(function(a,b){ return a.ts - b.ts; });
    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), { headers: { 'Content-Type': 'application/json' } });
  }
}
