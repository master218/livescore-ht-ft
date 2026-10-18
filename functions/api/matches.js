export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  var out = [];
  try {
    var key = context.env.FOOTBALL_API_KEY;
    var apiUrl = 'https://live-football-api.com/api/v1/matches?date=' + date + '&language=en';
    var r = await fetch(apiUrl, { headers: { 'X-API-Key': key } });
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : (j.data || []);

    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var homeName = (m.home && m.home.name) ? m.home.name : (m.home_team || 'Home');
      var awayName = (m.away && m.away.name) ? m.away.name : (m.away_team || 'Away');
      var country = (m.league && m.league.country) ? m.league.country : (m.country || 'Other');
      var leagueName = (m.league && m.league.name) ? m.league.name : (m.league_name || 'League');

      // 1. GET REAL VARIED TIME from fixture.date (12:30,15:00,17:15,20:45 etc)
      var timeVal = '15:00';
      var ts = 0;
      var dateStr = (m.fixture && m.fixture.date) ? m.fixture.date : (m.date || m.kickoff || '');
      if (dateStr) {
        var d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          ts = d.getTime();
          var lagos = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          var p = lagos.split(':');
          var h = parseInt(p[0], 10);
          h = (h + 1) % 24; // +1 for Flashscore
          timeVal = (h < 10 ? '0' + h : '' + h) + ':' + p[1];
        }
      } else if (m.timestamp) {
        var d2 = new Date(m.timestamp * 1000);
        ts = d2.getTime();
        var lagos2 = d2.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
        var p2 = lagos2.split(':');
        var h2 = parseInt(p2[0], 10);
        h2 = (h2 + 1) % 24;
        timeVal = (h2 < 10 ? '0' + h2 : '' + h2) + ':' + p2[1];
      }

      // 2. GET REAL SCORE - RESULTS
      var homeScore = null;
      var awayScore = null;
      var ht = null;
      var status = 'scheduled';
      var isLive = false;

      // Try all possible fields your paid API uses
      if (m.home && m.home.score != null) homeScore = m.home.score;
      else if (m.score && m.score.home != null) homeScore = m.score.home;
      else if (m.home_score != null) homeScore = m.home_score;
      else if (m.goals && m.goals.home != null) homeScore = m.goals.home;

      if (m.away && m.away.score != null) awayScore = m.away.score;
      else if (m.score && m.score.away != null) awayScore = m.score.away;
      else if (m.away_score != null) awayScore = m.away_score;
      else if (m.goals && m.goals.away != null) awayScore = m.goals.away;

      if (m.halftime) ht = m.halftime;
      else if (m.score && m.score.halftime) ht = m.score.halftime;

      // Status
      if (m.status) {
        if (m.status.is_live || m.status.live) { status = 'live'; isLive = true; }
        else if (m.status.is_finished || m.status.finished || m.status.short === 'FT' || m.status.long === 'Finished') status = 'finished';
        else if (m.status.short) status = m.status.short.toLowerCase();
      }
      if (m.is_live) { status = 'live'; isLive = true; }
      if (homeScore != null && awayScore != null && !isLive) status = 'finished';

      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts || i,
        home: { name: homeName, score: homeScore },
        away: { name: awayName, score: awayScore },
        ht: ht,
        league: { country: country, name: leagueName },
        status: status,
        isLive: isLive
      });
    }

    // Sort by time - Yesterday results sorted by kickoff
    out.sort(function(a,b){ return a.ts - b.ts; });

    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: out }, error: String(e) }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
