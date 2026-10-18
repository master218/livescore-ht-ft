export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-18';
  
  // Sample matches with Flashscore +1 hour time already added
  var sample = [];
  if (date === '2026-10-18') {
    sample = [
      { id: 1, time: '15:00', ts: 1760780400, home: { name: 'Bournemouth', score: null }, away: { name: 'Sunderland', score: null }, ht: null, league: { country: 'England', name: 'Premier League' }, status: 'scheduled', isLive: false },
      { id: 2, time: '15:00', ts: 1760780400, home: { name: 'Brighton', score: null }, away: { name: 'Crystal Palace', score: null }, ht: null, league: { country: 'England', name: 'Premier League' }, status: 'scheduled', isLive: false },
      { id: 3, time: '15:00', ts: 1760780400, home: { name: 'Leeds', score: null }, away: { name: 'Man United', score: null }, ht: null, league: { country: 'England', name: 'Premier League' }, status: 'scheduled', isLive: false },
      { id: 4, time: '17:30', ts: 1760789400, home: { name: 'Nott Forest', score: null }, away: { name: 'Arsenal', score: null }, ht: null, league: { country: 'England', name: 'Premier League' }, status: 'scheduled', isLive: false },
      { id: 5, time: '15:00', ts: 1760780400, home: { name: 'Angers', score: null }, away: { name: 'Marseille', score: null }, ht: null, league: { country: 'France', name: 'Ligue 1' }, status: 'scheduled', isLive: false }
    ];
  } else {
    // Tomorrow - varied automatic times +1 hour
    sample = [
      { id: 6, time: '16:00', ts: 1760870400, home: { name: 'Getafe', score: null }, away: { name: 'Rayo Vallecano', score: null }, ht: null, league: { country: 'Spain', name: 'LaLiga' }, status: 'scheduled', isLive: false },
      { id: 7, time: '20:00', ts: 1760884800, home: { name: 'Tottenham', score: null }, away: { name: 'Coventry', score: null }, ht: null, league: { country: 'England', name: 'FA Cup' }, status: 'scheduled', isLive: false },
      { id: 8, time: '19:15', ts: 1760882100, home: { name: 'Al-Ahli', score: null }, away: { name: 'Al Akhdoud', score: null }, ht: null, league: { country: 'Saudi', name: 'Pro League' }, status: 'scheduled', isLive: false }
    ];
  }

  // Try real API, if fails use sample
  try {
    var key = context.env.FOOTBALL_API_KEY;
    var r = await fetch('https://live-football-api.com/api/v1/matches?date=' + date + '&language=en', { headers: { 'X-API-Key': key } });
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : [];
    if (list.length > 0) {
      var out = [];
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        var ts = m.timestamp || 0;
        var timeVal = '15:00';
        if (ts) {
          var d = new Date(ts * 1000);
          var lagos = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          var p = lagos.split(':');
          var h = parseInt(p[0], 10);
          h = (h + 1) % 24;
          timeVal = (h < 10 ? '0' + h : '' + h) + ':' + p[1];
        }
        out.push({
          id: m.id || i,
          time: timeVal,
          ts: ts,
          home: { name: m.home && m.home.name ? m.home.name : 'Home', score: null },
          away: { name: m.away && m.away.name ? m.away.name : 'Away', score: null },
          ht: null,
          league: { country: m.league && m.league.country ? m.league.country : 'Other', name: m.league && m.league.name ? m.league.name : 'League' },
          status: 'scheduled',
          isLive: false
        });
      }
      out.sort(function(a,b){ return a.ts - b.ts; });
      return new Response(JSON.stringify({ data: { matches: out } }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } });
    }
  } catch (e) {}

  return new Response(JSON.stringify({ data: { matches: sample } }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } });
}
