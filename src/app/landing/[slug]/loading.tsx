export default function LandingPageLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <section className="bg-[linear-gradient(135deg,#0f172a_0%,#4f46e5_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr),340px]">
            <div className="bg-slate-950/42 rounded-[36px] border border-white/15 p-8 shadow-2xl backdrop-blur-xl md:p-10">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 animate-pulse rounded-2xl bg-white/15" />
                  <div className="space-y-3">
                    <div className="bg-white/12 h-8 w-56 animate-pulse rounded-full" />
                    <div className="h-6 w-44 animate-pulse rounded-full bg-white/10" />
                  </div>
                </div>
                <div className="bg-white/12 h-10 w-28 animate-pulse rounded-full" />
              </div>

              <div className="mt-10 space-y-5">
                <div className="bg-white/14 h-14 w-full max-w-2xl animate-pulse rounded-3xl" />
                <div className="h-6 w-full max-w-xl animate-pulse rounded-full bg-white/10" />
                <div className="h-6 w-full max-w-lg animate-pulse rounded-full bg-white/10" />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="bg-white/14 h-12 w-40 animate-pulse rounded-full" />
                <div className="h-12 w-36 animate-pulse rounded-full bg-white/10" />
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <div className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
                <div className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
                <div className="h-10 w-32 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>

            <div className="border-white/12 rounded-[32px] border bg-white/10 p-5 backdrop-blur-xl">
              <div className="bg-slate-950/24 rounded-[26px] border border-white/10 p-5">
                <div className="bg-white/12 h-6 w-28 animate-pulse rounded-full" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
                  <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
                  <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
                  <div className="h-24 animate-pulse rounded-3xl bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
        <div className="grid gap-8 rounded-[34px] border border-slate-200/85 bg-white p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.3)] md:p-10 lg:grid-cols-[minmax(0,1.05fr),0.95fr]">
          <div className="space-y-7">
            <div className="space-y-3">
              <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="h-12 w-full max-w-lg animate-pulse rounded-3xl bg-slate-200" />
              <div className="h-24 w-full animate-pulse rounded-3xl bg-slate-100" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </div>
          <div className="min-h-[320px] animate-pulse rounded-[30px] bg-slate-100" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),0.92fr]">
          <div className="rounded-[34px] border border-slate-200/85 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] md:p-8">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 h-12 w-64 animate-pulse rounded-3xl bg-slate-200" />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </div>

          <div className="rounded-[34px] border border-slate-200 bg-slate-950 p-6 md:p-8">
            <div className="bg-white/12 h-4 w-24 animate-pulse rounded-full" />
            <div className="mt-5 h-12 w-56 animate-pulse rounded-3xl bg-white/10" />
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="h-10 w-28 animate-pulse rounded-full bg-white/10" />
              <div className="h-10 w-24 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="h-12 w-80 animate-pulse rounded-3xl bg-slate-200" />
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="h-52 animate-pulse rounded-[30px] bg-white shadow-[0_20px_70px_-42px_rgba(15,23,42,0.2)]" />
            <div className="h-52 animate-pulse rounded-[30px] bg-white shadow-[0_20px_70px_-42px_rgba(15,23,42,0.2)]" />
          </div>
        </div>
      </div>
    </main>
  );
}
