export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-17';
  
  try {
    var key = context.env.FOOTBALL_API_KEY;
    if (!key) throw new Error('No API KEY');
    
    var apiUrl = 'https://live-football-api.com/api/v1/matches?date=' + date + '&language=en';
    var r = await fetch(apiUrl, {
      headers: { 'X-API-Key': key }
    });
    
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : (j.data || j.matches || []);
    var out = [];

    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      
      var home = (m.home && m.home.name) ? m.home.name : (m.home_team || 'Home');
      var away = (m.away && m.away.name) ? m.away.name : (m.away_team || 'Away');
      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';

      // ===== TIME - FROM YOUR API ONLY =====
      var timeVal = '';
      // Try direct time fields
      if (m.time) timeVal = m.time;
      else if (m.fixture && m.fixture.time) timeVal = m.fixture.time;
      else if (m.fixture && m.fixture.date) {
        // "2026-10-17T13:30:00Z" -> "13:30"
        var ds = m.fixture.date;
        if (ds.indexOf('T') > -1) {
          timeVal = ds.split('T')[1].substring(0,5);
        }
      } else if (m.date && m.date.indexOf('T') > -1) {
        timeVal = m.date.split('T')[1].substring(0,5);
      }
      // Fallback to timestamp conversion if no time string
      if (!timeVal && m.fixture && m.fixture.timestamp) {
        var d = new Date(m.fixture.timestamp * 1000);
        timeVal = d.toISOString().split('T')[1].substring(0,5);
      }
      if (!timeVal) timeVal = '15:00';

      var ts = 0;
      if (m.fixture && m.fixture.timestamp) ts = m.fixture.timestamp * 1000;
      else if (m.timestamp) ts = m.timestamp * 1000;
      else ts = Date.now() + i * 1000;

      // ===== FT SCORE - FROM YOUR API =====
      var ftH = null;
      var ftA = null;
      
      if (m.home && m.home.score != null) ftH = m.home.score;
      else if (m.score && m.score.fulltime && m.score.fulltime.home != null) ftH = m.score.fulltime.home;
      else if (m.goals && m.goals.home != null) ftH = m.goals.home;
      else if (m.home_score != null) ftH = m.home_score;
      
      if (m.away && m.away.score != null) ftA = m.away.score;
      else if (m.score && m.score.fulltime && m.score.fulltime.away != null) ftA = m
