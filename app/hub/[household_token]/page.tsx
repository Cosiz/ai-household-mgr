import { dbService }   from '@/services/db.service';
import { cn }          from '@/lib/utils';

async function getEvents(householdToken: string) {
  try {
    return await dbService.getEventsByHouseholdToken(householdToken);
  } catch {
    return [];
  }
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  });
}

export default async function HubPage({
  params,
}: {
  params: { household_token: string };
}) {
  const events = await getEvents(params.household_token);

  return (
    <main className="min-h-screen bg-zinc-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-3xl tracking-wide text-stone-100">
            Household Dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            Your private family event timeline
          </p>
        </div>
      </header>

      {/* Timeline */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 text-5xl">🍽</div>
            <p className="text-lg text-stone-400">No events yet.</p>
            <p className="mt-1 text-sm text-stone-500">
              Send a message via WhatsApp to get started.
            </p>
          </div>
        ) : (
          <ol className="relative border-l border-zinc-800 pl-8">
            {events.map((event: Record<string, unknown>, i: number) => (
              <li
                key={event.id as string}
                className={cn(
                  'mb-10 last:mb-0',
                  'relative before:absolute before:-left-[1.35rem] before:top-2',
                  'before:h-2.5 before:w-2.5 before:rounded-full before:bg-zinc-700 before:ring-1 before:ring-zinc-800'
                )}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-xl text-stone-100">
                      {event.title as string}
                    </h3>
                    {event.category && (
                      <span className="shrink-0 rounded-full bg-zinc-800 px-3 py-0.5 text-xs text-stone-400">
                        {event.category as string}
                      </span>
                    )}
                  </div>

                  <time className="text-sm text-stone-500">
                    {formatEventDate(event.start_time as string)}
                  </time>

                  {event.location && (
                    <p className="text-sm text-stone-400">📍 {event.location as string}</p>
                  )}

                  {event.description && (
                    <p className="mt-2 text-sm leading-relaxed text-stone-300">
                      {event.description as string}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
