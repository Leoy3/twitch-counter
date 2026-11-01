import crypto from "node:crypto";
import {
  forgetSubscriptions,
  handleChannelUpdate,
  handleStreamOffline,
  handleStreamOnline,
  hasStore,
  markAlertConfirmed,
  markMessageHandled,
  wasMessageHandled
} from "../../lib/stream-stats";

export const dynamic = "force-dynamic";

// Avisos que manda Twitch (EventSub): cuando empieza el stream, cuando cambia
// la categoría y cuando termina. Con eso se arma "Top Categories" de Stats.
// Necesita la variable TWITCH_EVENTSUB_SECRET (un texto secreto de 10 a 100 caracteres).

const MAX_MESSAGE_AGE = 10 * 60 * 1000;

function isValidSignature(secret, id, timestamp, body, signature) {
  const expected = Buffer.from(
    "sha256=" + crypto.createHmac("sha256", secret).update(id + timestamp + body).digest("hex")
  );
  const received = Buffer.from(signature);

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function POST(request) {
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  const body = await request.text();
  const id = request.headers.get("twitch-eventsub-message-id") || "";
  const timestamp = request.headers.get("twitch-eventsub-message-timestamp") || "";
  const signature = request.headers.get("twitch-eventsub-message-signature") || "";
  const type = request.headers.get("twitch-eventsub-message-type");

  // solo se aceptan avisos firmados por Twitch y recientes
  if (
    !secret ||
    !isValidSignature(secret, id, timestamp, body, signature) ||
    !(Math.abs(Date.now() - Date.parse(timestamp)) <= MAX_MESSAGE_AGE)
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const message = JSON.parse(body);

  // Twitch confirma que esta dirección es nuestra
  if (type === "webhook_callback_verification") {
    try {
      if (hasStore()) {
        await markAlertConfirmed(message.subscription.type);
      }
    } catch {
      // la confirmación sigue aunque no se pueda anotar
    }

    return new Response(message.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }

  if (!hasStore()) {
    return new Response(null, { status: 204 });
  }

  try {
    if (type === "revocation") {
      await forgetSubscriptions(message.subscription.type);
    }

    if (type === "notification" && !(await wasMessageHandled(id))) {
      const event = message.event;

      if (message.subscription.type === "stream.online") {
        await handleStreamOnline(event);
      } else if (message.subscription.type === "channel.update") {
        await handleChannelUpdate(event);
      } else if (message.subscription.type === "stream.offline") {
        await handleStreamOffline(event);
      }

      await markMessageHandled(id);
    }
  } catch {
    // con un error Twitch vuelve a mandar el aviso más tarde
    return new Response("Error", { status: 500 });
  }

  return new Response(null, { status: 204 });
}
