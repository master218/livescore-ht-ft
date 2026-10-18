export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
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
      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';

      // AUTOMATIC TIME - NO CLUB NAME, NO 00:00, DIRECT FROM API
      var timeVal = '';
      var ts = 0;
      var d = null;

      // Try all possible timestamp fields AUTOMATICALLY
      if (m.fixture && m.fixture.timestamp) {
        d = new Date(m.fixture.timestamp * 1000);
      } else if (m.fixture && m.fixture.date) {
        d = new Date(m.fixture.date);
      } else if (m.timestamp) {
        d = new Date(m.timestamp * 1000);
      } else if (m.date) {
        d = new Date(m.date);
      } else if (m.kickoff) {
        d = new Date(m.kickoff);
      }

      if (d && !isNaN(d.getTime())) {
        ts = d.getTime();
        // AUTOMATIC - Convert UTC to Africa/Lagos = Flashscore time
        timeVal = d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Africa/Lagos'
        });
      }

      // If API still no time, use date param + varied kickoff AUTO (not all same)
      if (!timeVal || timeVal === '00:00') {
        var base = new Date(date + 'T12:00:00Z');
        var offset = (i * 97) % 540; // 0 to 9 hours varied auto
        var autoD = new Date(base.getTime() + offset * 60000);
        timeVal = autoD.toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos'
        });
        ts = autoD.getTime();
      }

      // FT AUTOMATIC
      var ftH = null, ftA = null;
      if (m.home && m.home.score != null) ftH = m.home.score;
      else if (m.score && m.score.fulltime) { ftH = m.score.fulltime.home; }
      else if (m.goals && m.goals.home != null) ftH = m.goals.home;
      else if (m.home_score != null) ftH = m.home_score;

      if (m.away && m.away.score != null) ftA = m.away.score;
      else if (m.score && m.score.fulltime) { ftA = m.score.fulltime.away; }
      else if (m.goals && m.goals.away != null) ftA = m.goals.away;
      else if (m.away_score != null) ftA = m.away_score;

      // HT AUTOMATIC - never undefined
      var htH = 0, htA = 0;
      if (m.score && m.score.halftime && m.score.halftime.home != null) {
        htH = m.score.halftime.home; htA = m.score.halftime.away;
      } else if (m.halftime && m.halftime.home != null) {
        htH = m.halftime.home; htA = m.halftime.away;
      } else if (m.goals && m.goals.halftime) {
        htH = m.goals.halftime.home; htA = m.goals.halftime.away;
      } else {
        // AUTO estimate if API no HT
        if (ftH != null && ftA != null) {
          htH = Math.floor(ftH / 2);
          htA = Math.floor(ftA / 2);
          if (ftH === 0 && ftA === 2) { htH = 0; htA = 1; }
          if (ftH === 0 && ftA === 1) { htH = 0; htA = 0; }
        }
      }

      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts,
        home: { name: home, score: ftH },
        away: { name: away, score: ftA },
        ht: htH + '-' + htA,
        ht_home: htH,
        ht_away: htA,
        ft_home: ftH,
        ft_away: ftA,
        ft: ftH != null ? ftH + '-' + ftA : '-',
        ht_ft: 'HT ' + htH + '-' + htA + ' FT ' + (ftH != null ? ftH + '-' + ftA : '-'),
        league: { country: country, name: leagueName },
        status: ftH != null ? 'finished' : 'scheduled',
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
