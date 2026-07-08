let cachedToken = null;
let cachedTokenExpiresAt = 0;
let cachedUserId = null;
let cachedUserLogin = null;

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
    throw new Error("Could not get Twitch token.");
  }

  const data = await response.json();

  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (data.expires_in - 300) * 1000;

  return cachedToken;
}

async function getTwitchUserId(token, clientId, channel) {
  if (cachedUserId && cachedUserLogin === channel) {
    return cachedUserId;
  }

  const userUrl =
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(channel)}`;

  const response = await fetch(userUrl, {
    method: "GET",
    headers: {
      "Client-Id": clientId,
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not get Twitch user ID.");
  }

  const data = await response.json();
  const user = data.data && data.data.length > 0 ? data.data[0] : null;

  if (!user) {
    throw new Error("Twitch channel not found.");
  }

  cachedUserId = user.id;
  cachedUserLogin = channel;

  return cachedUserId;
}

function getThumbnailUrl(thumbnailUrl) {
  if (!thumbnailUrl) {
    return "";
  }

  return thumbnailUrl
    .replace("%{width}", "640")
    .replace("%{height}", "360");
}

export async function GET() {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const channel = process.env.TWITCH_CHANNEL;

    if (!clientId || !clientSecret || !channel) {
      return Response.json(
        {
          error: "Missing environment variables."
        },
        {
          status: 500
        }
      );
    }

    const token = await getTwitchToken();
    const userId = await getTwitchUserId(token, clientId, channel);

    const videosUrl =
      `https://api.twitch.tv/helix/videos` +
      `?user_id=${encodeURIComponent(userId)}` +
      `&first=8` +
      `&type=archive` +
      `&sort=time`;

    const response = await fetch(videosUrl, {
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
          error: "Could not get latest VODs."
        },
        {
          status: response.status
        }
      );
    }

    const data = await response.json();

    const vods = (data.data || []).map((vod) => ({
      id: vod.id,
      title: vod.title,
      url: vod.url,
      thumbnailUrl: getThumbnailUrl(vod.thumbnail_url),
      duration: vod.duration,
      viewCount: vod.view_count,
      createdAt: vod.created_at,
      publishedAt: vod.published_at
    }));

    return Response.json({
      channel,
      videosUrl: `https://www.twitch.tv/${channel}/videos?filter=archives&sort=time`,
      vods
    });
  } catch (error) {
    return Response.json(
      {
        error: error.message || "Unexpected error."
      },
      {
        status: 500
      }
    );
  }
}
