export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground transition-colors">
      <div className="flex flex-col items-center gap-4">
        <span className="text-6xl font-bold tracking-tight opacity-80">
          404
        </span>
        <p className="text-lg text-muted-foreground">Página no encontrada</p>
        <a
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-6 py-2 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
