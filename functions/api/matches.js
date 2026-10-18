export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-18';
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
      // Names
      var home = (m.home && m.home.name) ? m.home.name : 'Home';
      var away = (m.away && m.away.name) ? m.away.name : 'Away';
      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var league = (m.league && m.league.name) ? m.league.name : 'League';

      // TIME - Use fixture.timestamp (varied) NOT the top-level timestamp
      var timeVal = '15:00';
      var ts = 0;
      var fixtureTs = (m.fixture && m.fixture.timestamp) ? m.fixture.timestamp : m.timestamp;
      var fixtureDate = (m.fixture && m.fixture.date) ? m.fixture.date : '';

      if (fixtureTs) {
        ts = fixtureTs * 1000;
        var d = new Date(ts);
        // Convert UTC -> Africa/Lagos WAT is UTC+1, then +1 for Flashscore = UTC+2
        var utcHours = d.getUTCHours();
        var utcMins = d.getUTCMinutes();
        var lagosHours = (utcHours + 2) % 24; // +1 WAT +1 Flashscore = +2
        timeVal = (lagosHours < 10 ? '0' + lagosHours : '' + lagosHours) + ':' + (utcMins < 10 ? '0' + utcMins : '' + utcMins);
      } else if (fixtureDate) {
        var d2 = new Date(fixtureDate);
        if (!isNaN(d2.getTime())) {
          ts = d2.getTime();
          var lagos = d2.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          var p = lagos.split(':');
          var h = (parseInt(p[0], 10) + 1) % 24;
          timeVal = (h < 10 ? '0' + h : '' + h) + ':' + p[1];
        }
      }

      // SCORE - Results for Yesterday
      var hs = null, as = null, ht = null;
      if (m.home && m.home.score != null) hs = m.home.score;
      else if (m.goals && m.goals.home != null) hs = m.goals.home;
      else if (m.score && m.score.fulltime && m.score.fulltime.home != null) hs = m.score.fulltime.home;

      if (m.away && m.away.score != null) as = m.away.score;
      else if (m.goals && m.goals.away != null) as = m.goals.away;
      else if (m.score && m.score.fulltime && m.score.fulltime.away != null) as = m.score.fulltime.away;

      if (m.score && m.score.halftime) ht = m.score.halftime.home + '-' + m.score.halftime.away;

      var status = 'scheduled', isLive = false;
      if (m.fixture && m.fixture.status) {
        var s = m.fixture.status.short || m.fixture.status.long || '';
        if (s === '1H' || s === '2H' || s === 'HT' || s === 'LIVE') { status = 'live'; isLive = true; }
        else if (s === 'FT' || s === 'AET' || s === 'PEN') status = 'finished';
        else if (s === 'NS') status = 'scheduled';
      }
      if (hs != null && !isLive) status = 'finished';

      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts || i,
        home: { name: home, score: hs },
        away: { name: away, score: as },
        ht: ht,
        league: { country: country, name: league },
        status: status,
        isLive: isLive
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
