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
      var ts = m.timestamp || (m.fixture && m.fixture.timestamp) || 0;
      var home = (m.home && m.home.name) ? m.home.name : '';
      var away = (m.away && m.away.name) ? m.away.name : '';
      var timeVal = '15:00';
      
      // Automatic +1 hour from API
      if (ts) {
        var d = new Date(ts * 1000);
        var lagos = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
        var p = lagos.split(':');
        var h = parseInt(p[0], 10);
        h = (h + 1) % 24;
        timeVal = (h < 10 ? '0' + h : '' + h) + ':' + p[1];
      }

      // FIX FOR GAMES THAT API SENDS WRONG SAME TIME - FORCE REAL TIMES
      var both = (home + ' ' + away).toLowerCase();
      if (both.indexOf('forest') > -1 && both.indexOf('arsenal') > -1) {
        timeVal = '17:30'; // Forest vs Arsenal is late kickoff
        ts = ts + 9000; // 2.5 hours later for sorting
      }
      if (both.indexOf('angers') > -1 && both.indexOf('marseille') > -1) {
        timeVal = '16:00';
      }

      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';

      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts,
        home: { name: home || 'Home', score: null },
        away: { name: away || 'Away', score: null },
        ht: null,
        league: { country: country, name: leagueName },
        status: 'scheduled',
        isLive: false
      });
    }
    out.sort(function(a,b){ return a.ts - b.ts; });
    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), { headers: { 'Content-Type': 'application/json' } });
  }
}
