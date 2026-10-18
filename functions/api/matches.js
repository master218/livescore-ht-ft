export async function onRequestGet(context) {
  var key = context.env.FOOTBALL_API_KEY;
  var url = new URL(context.request.url);
  var date = url.searchParams.get('date') || '2026-10-18';
  try {
    var r = await fetch('https://live-football-api.com/api/v1/matches?date=' + date + '&language=en', {
      headers: { 'X-API-Key': key }
    });
    var j = await r.json();
    var list = (j.data && j.data.matches) ? j.data.matches : [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var isFinished = m.status && (m.status.status === 'finished' || m.status.state === 'postGame');
      var isLive = m.status && m.status.is_live;
      var ts = m.timestamp || (m.fixture && m.fixture.timestamp) || 0;
      var timeVal = '15:00';
      if (ts) {
        var d = new Date(ts * 1000);
        var lagos = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
        var parts = lagos.split(':');
        var h = parseInt(parts[0], 10);
        var mm = parts[1];
        h = (h + 1) % 24; // PLUS 1 HOUR FOR FLASHSCORE
        if (h < 10) timeVal = '0' + h + ':' + mm;
        else timeVal = h + ':' + mm;
      } else if (m.time) {
        var t = String(m.time).substring(0,5);
        var p = t.split(':');
        var hh = parseInt(p[0], 10);
        var mmm = p[1];
        hh = (hh + 1) % 24;
        if (hh < 10) timeVal = '0' + hh + ':' + mmm;
        else timeVal = hh + ':' + mmm;
      } else if (m.fixture && m.fixture.date) {
        var dd = new Date(m.fixture.date);
        if (!isNaN(dd.getTime())) {
          var lagos2 = dd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
          var pp = lagos2.split(':');
          var h2 = parseInt(pp[0], 10);
          var mm2 = pp[1];
          h2 = (h2 + 1) % 24;
          if (h2 < 10) timeVal = '0' + h2 + ':' + mm2;
          else timeVal = h2 + ':' + mm2;
          ts = Math.floor(dd.getTime() / 1000);
        }
      }
      var country = (m.league && m.league.country) ? m.league.country : 'Other';
      var leagueName = (m.league && m.league.name) ? m.league.name : 'League';
      if (leagueName.toLowerCase().indexOf('laliga') > -1) { country = 'Spain'; leagueName = 'LaLiga'; }
      out.push({
        id: m.id || i,
        time: timeVal,
        ts: ts,
        home: { name: (m.home && m.home.name) ? m.home.name : 'Home', score: (m.home && m.home
