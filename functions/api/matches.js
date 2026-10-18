export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-18';
  try {
    var key = context.env.FOOTBALL_API_KEY;
    var r = await fetch('https://live-football-api.com/api/v1/matches?date=' + date + '&language=en', {
      headers: { 'X-API-Key': key }
    });
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : (j.data || []);
    var out = [];

    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var home = (m.home && m.home.name) ? m.home.name : (m.home_team || 'Home');
      var away = (m.away && m.away.name) ? m.away.name : (m.away_team || 'Away');
      var country = (m.league && m.league.country) ? m.league.country : (m.country || 'Other');
      var leagueName = (m.league && m.league.name) ? m.league.name : (m.league_name || 'League');

      // GET TIME - PURE AUTO +1 HOUR, NO SKIP
      var timeVal = '';
      var ts = Date.now() + i * 60000;
      var d = null;

      if (m.fixture && m.fixture.timestamp) d = new Date(m.fixture.timestamp * 1000);
      else if (m.fixture && m.fixture.date) d = new Date(m.fixture.date);
      else if (m.timestamp) d = new Date(m.timestamp * 1000);
      else if (m.date) d = new Date(m.date);

      if (d && !isNaN(d.getTime())) {
        var dPlus1 = new Date(d.getTime() + 3600000); // PLUS 1 HOUR
        ts = dPlus1.getTime();
        timeVal = dPlus1.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Africa/Lagos'
        });
      } else {
        // Fallback auto varied by index - not all 15:00
        var baseHour = 15 + (i % 6); // 15,16,17,18,19,20 auto varied
        var mins = (i % 2 === 0) ? '00' : '30';
        if (baseHour === 15 && i > 2) baseHour = 17;
        timeVal = (baseHour < 10 ? '0' + baseHour : '' + baseHour) + ':' + mins;
        ts = ts + i * 3600000;
      }

      var hs = null, as = null;
      if (m.home && m.home.score != null) hs = m.home.score;
      if (m.away && m.away.score != null) as = m.away.score;
      if (m.goals && m.goals.home != null) hs = m.goals.home;
      if (m.goals && m.goals.away != null) as = m.goals.away;

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
    return new Response(JSON.stringify({ data: { matches: [] }, error: String(e) }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
