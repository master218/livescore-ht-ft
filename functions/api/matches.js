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
      var home = (m.home && m.home.name) ? m.home.name : 'Home';
      var away = (m.away && m.away.name) ? m.away.name : 'Away';
      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';

      // TIME FROM YOUR API ONLY - NO AUTO
      var timeVal = m.time || (m.fixture && m.fixture.time) || '';
      if (!timeVal && m.fixture && m.fixture.date) {
        // If API gives "2026-10-17T14:30:00" - take 14:30 directly, no conversion
        var dateStr = m.fixture.date;
        if (dateStr.indexOf('T') > -1) {
          timeVal = dateStr.split('T')[1].substring(0,5);
        }
      }
      if (!timeVal && m.date && m.date.indexOf('T') > -1) {
        timeVal = m.date.split('T')[1].substring(0,5);
      }
      if (!timeVal) timeVal = m.kickoff_time || '';

      var ts = (m.fixture && m.fixture.timestamp) ? m.fixture.timestamp * 1000 : Date.now() + i;

      // FT FROM YOUR API ONLY
      var ftH = (m.home && m.home.score != null) ? m.home.score : null;
      var ftA = (m.away && m.away.score != null) ? m.away.score : null;
      if (ftH == null && m.score && m.score.fulltime) { ftH = m.score.fulltime.home; ftA = m.score.fulltime.away; }

      // HT FROM YOUR API ONLY - NO ESTIMATE, RAW
      var htH = null, htA = null;
      if (m.score && m.score.halftime) { htH = m.score.halftime.home; htA = m.score.halftime.away; }
      if (htH == null && m.halftime) { htH = m.halftime.home; htA = m.halftime.away; }
      if (htH == null && m.goals && m.goals.halftime) { htH = m.goals.halftime.home; htA = m.goals.halftime.away; }

      // If your API no HT, leave 0-0 but NOT undefined
      if (htH == null) htH = 0;
      if (htA == null) htA = 0;

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
        ht_ft: htH + '-' + htA + ' / ' + (ftH != null ? ftH + '-' + ftA : '-'),
        league: { country: country, name: leagueName },
        status: ftH != null ? 'finished' : 'scheduled',
        isLive: false
      });
    }

    return new Response(JSON.stringify({ data: { matches: out } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: { matches: [] } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
