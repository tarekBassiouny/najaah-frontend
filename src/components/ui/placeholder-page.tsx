type PlaceholderItem = {
  title: string;
  description?: string;
  note?: string;
};

type PlaceholderPageProps = {
  title: string;
  description?: string;
  items?: PlaceholderItem[];
  footerNote?: string;
};

export function PlaceholderPage({
  title,
  description,
  items = [],
  footerNote,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-dark-5 dark:text-dark-4">{description}</p>
        ) : null}
      </header>

      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            >
              <h2 className="text-lg font-semibold text-dark dark:text-white">
                {item.title}
              </h2>
              {item.description ? (
                <p className="mt-2 text-sm text-dark-5 dark:text-dark-4">
                  {item.description}
                </p>
              ) : null}
              {item.note ? (
                <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-xs text-dark-6 dark:bg-gray-800 dark:text-dark-4">
                  {item.note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-dark-5 dark:border-gray-700 dark:bg-gray-900 dark:text-dark-4">
          Nothing here yet. Add the first record once the API is connected.
        </div>
      )}

      {footerNote ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-dark-6 dark:border-gray-700 dark:bg-gray-900 dark:text-dark-4">
          {footerNote}
        </div>
      ) : null}
    </div>
  );
}
