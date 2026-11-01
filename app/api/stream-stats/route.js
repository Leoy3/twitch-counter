import { after } from "next/server";
import { getCategoryCovers, hasTwitchCredentials } from "../../lib/twitch";
import { ensureEventSubscriptions, getMonthKey, getStreamStats } from "../../lib/stream-stats";

export const dynamic = "force-dynamic";

// Stats de un mes para la página /stats (?month=2026-11, si no se pasa es el mes actual)
export async function GET(request) {
  try {
    if (!hasTwitchCredentials()) {
      return Response.json(
        {
          error: "Missing environment variables."
        },
        {
          status: 500
        }
      );
    }

    const requested = new URL(request.url).searchParams.get("month") || "";
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : getMonthKey(new Date());
    const stats = await getStreamStats(month);

    try {
      const covers = await getCategoryCovers(stats.categories.map((category) => category.id));

      stats.categories = stats.categories.map((category) => ({
        ...category,
        coverUrl: covers[category.id] || ""
      }));
    } catch {
      // sin portadas, las categorías se muestran igual
    }

    // después de responder: se asegura de que Twitch avise de los próximos streams
    after(() => ensureEventSubscriptions().catch(() => {}));

    return Response.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600"
      }
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
