import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

/** Centralised render-error fallback for routes. */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unexpected error.'
  return (
    <div className="mx-auto mt-24 flex max-w-md flex-col items-center gap-3 px-4 text-center" role="alert">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted">{message}</p>
      <Link to="/" className="text-sm font-medium text-accent hover:underline">
        Go to start
      </Link>
    </div>
  )
}
