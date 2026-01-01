import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-foreground">Commander Stats</p>
        <div className="flex items-center gap-4">
          <Link className="hover:text-foreground" href="#">
            Privacy
          </Link>
          <Link className="hover:text-foreground" href="#">
            Feedback
          </Link>
          <Link className="hover:text-foreground" href="#">
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
