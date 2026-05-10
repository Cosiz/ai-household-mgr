import { notFound } from "next/navigation";
import { getEventsByHouseholdToken, getHouseholdByToken } from "@/services/db.service";
import { cn } from "@/lib/utils";
import { MotionWrapper } from "@/components/motion-wrapper";

interface PageProps {
  params: Promise<{ household_token: string }>;
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export default async function HubPage({ params }: PageProps) {
  const { household_token } = await params;

  const household = await getHouseholdByToken(household_token);
  if (!household) notFound();

  const events = await getEventsByHouseholdToken(household_token);

  return (
    <main className="min-h-screen bg-zinc-950 text-stone-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <MotionWrapper className="mb-12 text-center">
          <h1 className="mb-2 font-serif text-4xl tracking-wide text-stone-100">
            {household.name}
          </h1>
          <p className="text-sm tracking-widest uppercase text-stone-500">
            Household Chronicle
          </p>
        </MotionWrapper>

        {events.length === 0 ? (
          <MotionWrapper className="text-center py-20">
            <p className="text-stone-400 font-light">
              No events recorded as yet.
            </p>
          </MotionWrapper>
        ) : (
          <ol className="relative border-l border-zinc-800 ml-4 space-y-10">
            {events.map((event, i) => (
              <MotionWrapper key={event.id} delay={i * 0.08}>
                <li className="ml-6">
                  <div className="absolute -left-3 mt-1.5 h-2 w-2 rounded-full bg-stone-600 ring-2 ring-zinc-950" />
                  <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-medium text-stone-100 text-lg leading-snug">
                        {event.title}
                      </h3>
                      {event.event_type && (
                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-stone-400 uppercase tracking-wider">
                          {event.event_type}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-stone-400 text-sm leading-relaxed mb-3">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-stone-500">
                      {event.timestamp && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTimestamp(event.timestamp)}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-right text-xs text-stone-600">
                      {formatTimestamp(event.created_at)}
                    </p>
                  </div>
                </li>
              </MotionWrapper>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
