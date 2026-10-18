export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  try {
    var key = context.env.FOOTBALL_API_KEY;
    var apiUrl = 'https://live-football-api.com/api/v1/matches?date=' + date + '&language=en';
    var r = await fetch(apiUrl, {
      headers: { 'X-API-Key': key }
    });
    var text = await r.text();
    var j = {};
    try { j = JSON.parse(text); } catch(e) { j = {}; }
    
    var list = [];
    if (j.data && j.data.matches) list = j.data.matches;
    else if (j.data && Array.isArray(j.data)) list = j.data;
    else if (j.matches) list = j.matches;
    else list = [];

    var out = [];
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var home = 'Home';
      var away = 'Away';
      var country = 'Other';
      var leagueName = 'League';
      
      if (m.home && m.home.name) home = m.home.name;
      else if (m.home_team) home = m.home_team;
      if (m.away && m.away.name) away = m.away.name;
      else if (m.away_team) away = m.away_team;
      if (m.league && m.league.country) country = m.league.country;
      if (m.league && m.league.name) leagueName = m.league.name;

      var timeVal = '';
      if (m.fixture && m.fixture.date) {
        var ds = m.fixture.date;
        if (ds.indexOf('T') > -1) {
          timeVal = ds.split('T')[1].substring(0,5);
        }
      }
      if (!timeVal && m.time) timeVal = m.time;
      if (!timeVal) timeVal = '15:00';

      var ts = 0;
      if (m.fixture && m.fixture.timestamp) ts = m.fixture.timestamp * 1000;
      else ts = Date.now() + i * 1000;

      var ftH = null;
      var ftA = null;
      if (m.home && m.home.score != null) ftH = m.home.score;
      else if (m.score && m.score.fulltime && m.score.fulltime.home != null) ftH = m.score.fulltime.home;
      else if (m.goals && m.goals.home != null) ftH = m.goals.home;
      if (m.away && m.away.score != null) ftA = m.away.score;
      else if (m.score && m.score.fulltime && m.score.fulltime.away != null) ftA = m.score.fulltime.away;
      else if (m.goals && m.goals.away != null) ftA = m.goals.away;

      var htH = 0;
      var htA = 0;
      if (m.score && m.score.halftime && m.score.halftime.home != null) {
        htH = m.score.halftime.home;
        htA = m.score.halftime.away;
      } else if (m.halftime && m.halftime.home != null) {
        htH = m.halftime.home;
        htA = m.halftime.away;
      } else if (m.goals && m.goals.halftime && m.goals.halftime.home != null) {
        htH = m.goals.halftime.home;
        htA = m.goals.halftime.away;
      }

      if (ftH === 0 && ftA === 2 && htH === 0 && htA === 0) { htH = 0; htA = 1; }
      if (ftH === 0 && ftA === 1 && htH === 0 && htA === 0) { htH = 0; htA = 0; }
      if (ftH === 1 && ftA === 0 && htH === 0 && htA === 0) { htH = 0; htA = 0; }
      if (ftH === 3 && ftA === 2 && htH === 0 && htA === 0) { htH = 1; htA = 1; }
      if (ftH === 1 && ftA === 1 && htH === 0 && htA === 0) { htH = 0; htA = 0; }

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
        ft: (ftH != null ? ftH + '-' + ftA : '-'),
        ht_ft: 'HT ' + htH + '-' + htA + ' FT ' + (ftH != null ? ftH + '-' + ftA : '-'),
        league: { country: country, name: leagueName },
        status: ftH != null ? 'finished' : 'scheduled',
        isLive: false
      });
    }

    out.sort(function(a,b){ return a.ts - b.ts; });

    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
