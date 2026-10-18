export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-17';
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

      // CORRECT TIME - Africa/Lagos like Flashscore
      var timeVal = '00:00';
      var ts = 0;
      var d = null;
      if (m.fixture && m.fixture.timestamp) d = new Date(m.fixture.timestamp * 1000);
      else if (m.fixture && m.fixture.date) d = new Date(m.fixture.date);
      else if (m.timestamp) d = new Date(m.timestamp * 1000);
      if (d && !isNaN(d.getTime())) {
        ts = d.getTime();
        timeVal = d.toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos'
        });
      }

      // FT SCORE - for main page
      var ft_home = null, ft_away = null;
      if (m.home && m.home.score != null) ft_home = m.home.score;
      else if (m.score && m.score.fulltime && m.score.fulltime.home != null) ft_home = m.score.fulltime.home;
      else if (m.goals && m.goals.home != null) ft_home = m.goals.home;
      else if (m.score && m.score.home != null) ft_home = m.score.home;

      if (m.away && m.away.score != null) ft_away = m.away.score;
      else if (m.score && m.score.fulltime && m.score.fulltime.away != null) ft_away = m.score.fulltime.away;
      else if (m.goals && m.goals.away != null) ft_away = m.goals.away;
      else if (m.score && m.score.away != null) ft_away = m.score.away;

      // HT SCORE - for detail page HT-FT
      var ht_home = null, ht_away = null, ht_str = null;
      if (m.score && m.score.halftime) {
        ht_home = m.score.halftime.home;
        ht_away = m.score.halftime.away;
        ht_str = ht_home + '-' + ht_away;
      } else if (m.halftime && typeof m.halftime === 'object') {
        ht_home = m.halftime.home;
        ht_away = m.halftime.away;
        ht_str = ht_home + '-' + ht_away;
      } else if (m.goals && m.goals.halftime) {
        ht_home = m.goals.halftime.home;
        ht_away = m.goals.halftime.away;
        ht_str = ht_home + '-' + ht_away;
      }

      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts || i,
        // FT for main
        home: { name: home, score: ft_home },
        away: { name: away, score: ft_away },
        // HT-FT for detail
        ht: ht_str,
        ht_home: ht_home,
        ht_away: ht_away,
        ft_home: ft_home,
        ft_away: ft_away,
        ft: (ft_home != null) ? ft_home + '-' + ft_away : null,
        ht_ft: (ht_str && ft_home != null) ? 'HT ' + ht_str + ' FT ' + ft_home + '-' + ft_away : null,
        league: { country: country, name: leagueName },
        status: ft_home != null ? 'finished' : 'scheduled',
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
