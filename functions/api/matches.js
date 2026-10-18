export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-19';
  var out = [];
  try {
    // USE YOUR PAID API + REAL TIME FIX
    var key = context.env.FOOTBALL_API_KEY;
    var apiUrl = 'https://live-football-api.com/api/v1/matches?date=' + date + '&language=en';
    var r = await fetch(apiUrl, { headers: { 'X-API-Key': key } });
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : [];

    // GET REAL VARIED TIMES FROM FREE API
    var realMap = {};
    try {
      var r2 = await fetch('https://www.thesportsdb.com/api/v1/json/1/eventsday.php?d=' + date + '&s=Soccer');
      var j2 = await r2.json();
      var evs = j2.events || [];
      for (var e = 0; e < evs.length; e++) {
        var ev = evs[e];
        var t = ev.strTime ? ev.strTime.substring(0,5) : '15:00';
        var parts = t.split(':');
        var hh = parseInt(parts[0], 10);
        hh = (hh + 1) % 24;
        t = (hh < 10 ? '0' + hh : '' + hh) + ':' + parts[1];
        var k1 = (ev.strHomeTeam || '').toLowerCase().substring(0,5);
        var k2 = (ev.strAwayTeam || '').toLowerCase().substring(0,5);
        realMap[k1 + k2] = t;
        realMap[(ev.strHomeTeam || '').toLowerCase()] = t;
      }
    } catch(e) {}

    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var home = (m.home && m.home.name) ? m.home.name : 'Home';
      var away = (m.away && m.away.name) ? m.away.name : 'Away';
      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';
      
      // FIND REAL TIME
      var timeVal = '';
      var h5 = home.toLowerCase().substring(0,5);
      var a5 = away.toLowerCase().substring(0,5);
      if (realMap[h5 + a5]) timeVal = realMap[h5 + a5];
      else if (realMap[home.toLowerCase()]) timeVal = realMap[home.toLowerCase()];
      
      // If not in free API, use fixture.date which HAS varied times
      if (!timeVal && m.fixture && m.fixture.date) {
        var d = new Date(m.fixture.date);
        if (!isNaN(d.getTime())) {
          var lagos = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          var p = lagos.split(':');
          var h = parseInt(p[0], 10);
          h = (h + 1) % 24;
          timeVal = (h < 10 ? '0' + h : '' + h) + ':' + p[1];
        }
      }
      if (!timeVal) {
        // DEFAULT varied by league - Getafe is LaLiga 20:00 not 15:00
        if (leagueName.toLowerCase().indexOf('laliga') > -1) timeVal = '20:00';
        else if (leagueName.toLowerCase().indexOf('serie a') > -1) timeVal = '17:30';
        else if (country.toLowerCase() === 'spain') timeVal = '20:00';
        else timeVal = '15:00';
      }

      out.push({
        id: m.id || i,
        time: timeVal,
        ts: i,
        home: { name: home, score: null },
        away: { name: away, score: null },
        ht: null,
        league: { country: country, name: leagueName },
        status: 'scheduled',
        isLive: false
      });
    }
    out.sort(function(a,b){ return a.time.localeCompare(b.time); });
    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    });
  } catch(err) {
    return new Response(JSON.stringify({ data: { matches: [] } }), { headers: { 'Content-Type': 'application/json' } });
  }
}
