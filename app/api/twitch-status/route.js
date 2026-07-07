let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getTwitchToken() {
  const now = Date.now();

  if (cachedToken && now < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  const tokenUrl =
    `https://id.twitch.tv/oauth2/token` +
    `?client_id=${clientId}` +
    `&client_secret=${clientSecret}` +
    `&grant_type=client_credentials`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener el token de Twitch.");
  }

  const data = await response.json();

  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (data.expires_in - 300) * 1000;

  return cachedToken;
}

export async function GET() {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const channel = process.env.TWITCH_CHANNEL;

    if (!clientId || !clientSecret || !channel) {
      return Response.json(
        {
          error: "Faltan variables de entorno."
        },
        {
          status: 500
        }
      );
    }

    const token = await getTwitchToken();

    const streamUrl =
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(channel)}`;

    const response = await fetch(streamUrl, {
      method: "GET",
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return Response.json(
        {
          error: "No se pudo consultar el estado del stream."
        },
        {
          status: response.status
        }
      );
    }

    const data = await response.json();
    const stream = data.data && data.data.length > 0 ? data.data[0] : null;

    return Response.json({
      isLive: !!stream,
      channel,
      displayName: stream ? stream.user_name : channel,
      title: stream ? stream.title : "",
      gameName: stream ? stream.game_name : "",
      startedAt: stream ? stream.started_at : null,
      url: `https://www.twitch.tv/${channel}`
    });
  } catch (error) {
    return Response.json(
      {
        error: error.message || "Error inesperado."
      },
      {
        status: 500
      }
    );
  }
}
