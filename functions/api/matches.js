export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  try {
    var key = context.env.FOOTBALL_API_KEY;
    var r = await fetch('https://live-football-api.com/api/v1/matches?date=' + date + '&language=en', {
      headers: { 'X-API-Key': key }
    });
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : [];
    var out = [];

    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var home = (m.home && m.home.name) ? m.home.name : 'Home';
      var away = (m.away && m.away.name) ? m.away.name : 'Away';
      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';

      // PURE AUTO - NO 15:00
      var d = null;
      if (m.fixture && m.fixture.timestamp) d = new Date(m.fixture.timestamp * 1000);
      else if (m.fixture && m.fixture.date) d = new Date(m.fixture.date);
      else if (m.timestamp) d = new Date(m.timestamp * 1000);

      var timeVal = '';
      var ts = 0;
      if (d && !isNaN(d.getTime())) {
        // PLUS 1 HOUR AUTO
        var dPlus1 = new Date(d.getTime() + 60 * 60 * 1000);
        ts = dPlus1.getTime();
        timeVal = dPlus1.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false, 
          timeZone: 'Africa/Lagos' 
        });
      }

      // Skip if no time - no more 15:00 default
      if (!timeVal) continue;

      var hs = null, as = null;
      if (m.home && m.home.score != null) hs = m.home.score;
      if (m.away && m.away.score != null) as = m.away.score;

      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts,
        home: { name: home, score: hs },
        away: { name: away, score: as },
        ht: null,
        league: { country: country, name: leagueName },
        status: hs != null ? 'finished' : 'scheduled',
        isLive: false
      });
    }

    out.sort(function(a,b){ return a.ts - b.ts; });

    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
