import type { ReactNode } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface ShellProps {
  children: ReactNode;
  nav: NavItem[];
  active: string;
  onNav: (id: string) => void;
}

export function Shell({ children, nav, active, onNav }: ShellProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex h-screen" style={{ background: "var(--paper)" }}>
        <aside
          className="flex flex-col border-r h-full shrink-0"
          style={{ width: "17rem", borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <div className="p-6">
            <div
              className="text-xl font-bold"
              style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
            >
              Smart Study
            </div>
            <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Coach
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active === item.id ? "var(--accent)" : "transparent",
                  color: active === item.id ? "#fff" : "var(--ink)",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t" style={{ borderColor: "var(--line)" }}>
            <a
              href="https://freeappstore.online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              🛍️ freeappstore.online
            </a>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto" style={{ background: "var(--paper)" }}>
          {children}
        </main>
      </div>

      {/* Mobile */}
      <div className="flex flex-col h-screen md:hidden" style={{ background: "var(--paper)" }}>
        <header
          className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <span className="text-lg">{nav.find((n) => n.id === active)?.icon}</span>
          <span
            className="font-bold text-base"
            style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
          >
            {nav.find((n) => n.id === active)?.label ?? "Smart Study Coach"}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        <nav
          className="flex border-t shrink-0"
          style={{ borderColor: "var(--line)", background: "var(--dock)" }}
        >
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-all"
              style={{
                color: active === item.id ? "var(--accent)" : "var(--muted)",
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="truncate w-full text-center px-0.5" style={{ fontSize: "0.6rem" }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
