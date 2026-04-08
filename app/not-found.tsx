import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="bg-foreground text-background mt-2 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
      >
        Go home
      </Link>
    </div>
  );
}
