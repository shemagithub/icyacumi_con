import Link from "next/link";

export function EventsViewTabs({ active }: { active: "calendar" | "events" }) {
  const tabs = [
    { href: "/calendar", id: "calendar" as const, label: "Calendar" },
    { href: "/events", id: "events" as const, label: "All events" },
  ];

  return (
    <nav
      aria-label="Events views"
      className="mt-8 flex flex-wrap gap-2 border-b border-ash-line pb-px"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-xs tracking-[0.16em] uppercase transition-colors ${
              isActive
                ? "border-rust text-coal"
                : "border-transparent text-bone-dim hover:text-coal"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
