import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

/** Centralised render-error fallback for routes. */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unexpected error.'
  return (
    <div className="mx-auto mt-24 max-w-md px-4" role="alert">
      <div className="card empty gap-3 py-10">
        <h1 className="page-title text-[28px]">
          Something went <span className="hl">wrong</span>
        </h1>
        <p className="text-sm">{message}</p>
        <Link to="/" className="btn btn-primary">
          Go to start
        </Link>
      </div>
    </div>
  )
}
