
export async function onRequest(context){
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date") || new Date().toISOString().split('T')[0];
  const key = context.env.FOOTBALL_API_KEY;
  
  if(!key){
    return new Response(JSON.stringify({error:"No API Key", data:[]}), {
      headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }
  
  try{
    const apiRes = await fetch(`https://www.live-football-api.com/api/v1/matches?api_key=${key}&date=${date}&lang=en`);
    const data = await apiRes.json();
    return new Response(JSON.stringify(data.data || data.matches || []), {
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, max-age=60"
      }
    });
  }catch(e){
    return new Response(JSON.stringify([]), {headers:{"Content-Type":"application/json"}});
  }
}
