import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useParams, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { homePathFor } from '@/components/layout/nav'
import { Spinner } from '@/components/ui/Spinner'
import { useSession } from '@/state/session'
import type { Permission } from '@/lib/access'
import { AppRoute, RequirePermission, StageRoute } from './guards'
import { RouteError } from './RouteError'

const page = (loader: () => Promise<{ default: ComponentType }>) => {
  const C = lazy(loader)
  return <Suspense fallback={<Spinner />}><C /></Suspense>
}

const guarded = (permission: Permission, el: ReactNode) => <RequirePermission permission={permission}>{el}</RequirePermission>

function AppHome() {
  const { session } = useSession()
  return <Navigate to={homePathFor(session.user.role, session.user.permissions)} replace />
}

/** The Wallet Cards tab was removed: each program's wallet card now lives inside Loyalty Programs. */
function WalletCardRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? `/app/programs/${id}?tab=wallet` : '/app/programs'} replace />
}

export const routes: RouteObject[] = [
  { path: '/', element: page(() => import('@/features/auth/pages/LandingPage')), errorElement: <RouteError /> },
  { path: '/login', element: <StageRoute stage="anon">{page(() => import('@/features/auth/pages/LoginPage'))}</StageRoute> },
  { path: '/register', element: <StageRoute stage="anon">{page(() => import('@/features/auth/pages/RegisterPage'))}</StageRoute> },
  { path: '/join/campaign/:token', element: page(() => import('@/features/join/pages/JoinCampaignPage')) },
  { path: '/join/program/:token', element: page(() => import('@/features/join/pages/JoinPage')) },
  { path: '/accept-invite/:token', element: page(() => import('@/features/auth/pages/AcceptInvitePage')) },
  { path: '/verify-email', element: <StageRoute stage="verify">{page(() => import('@/features/auth/pages/VerifyEmailPage'))}</StageRoute> },
  { path: '/onboarding/business', element: <StageRoute stage="business">{page(() => import('@/features/onboarding/pages/BusinessProfilePage'))}</StageRoute> },
  { path: '/onboarding/plan', element: <StageRoute stage="plan">{page(() => import('@/features/onboarding/pages/PlanSelectionPage'))}</StageRoute> },
  { path: '/onboarding/first-program', element: <StageRoute stage="first_program">{page(() => import('@/features/onboarding/pages/FirstProgramPage'))}</StageRoute> },
  {
    path: '/app',
    element: <AppRoute><AppShell /></AppRoute>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <AppHome /> },
      { path: 'dashboard', element: guarded('dashboard.view', page(() => import('@/features/dashboard/pages/DashboardPage'))) },
      { path: 'programs', element: guarded('programs.view', page(() => import('@/features/loyalty-programs/pages/ProgramsPage'))) },
      { path: 'programs/new/:type', element: guarded('programs.view', page(() => import('@/features/loyalty-programs/pages/ProgramEditorPage'))) },
      { path: 'programs/:id', element: guarded('programs.view', page(() => import('@/features/loyalty-programs/pages/ProgramDetailPage'))) },
      { path: 'programs/:id/live', element: guarded('programs.view', page(() => import('@/features/loyalty-programs/pages/ProgramLivePage'))) },
      { path: 'programs/:id/edit', element: guarded('programs.view', page(() => import('@/features/loyalty-programs/pages/ProgramEditorPage'))) },
      { path: 'campaigns', element: guarded('programs.view', page(() => import('@/features/campaigns/pages/CampaignsPage'))) },
      { path: 'campaigns/new/:kind', element: guarded('programs.view', page(() => import('@/features/loyalty-programs/pages/CampaignEditorPage'))) },
      { path: 'campaigns/:id', element: guarded('programs.view', page(() => import('@/features/loyalty-programs/pages/CampaignDetailPage'))) },
      { path: 'campaigns/:id/edit', element: guarded('programs.view', page(() => import('@/features/loyalty-programs/pages/CampaignEditorPage'))) },
      { path: 'wallet-cards', element: <WalletCardRedirect /> },
      { path: 'wallet-cards/:id', element: <WalletCardRedirect /> },
      { path: 'scanner', element: guarded('scanner.use', page(() => import('@/features/qr-scanner/pages/ScannerPage'))) },
      { path: 'scanner/qr-codes', element: guarded('programs.view', page(() => import('@/features/qr-scanner/pages/QrCodesPage'))) },
      { path: 'customers', element: guarded('customers.view', page(() => import('@/features/customers/pages/CustomersPage'))) },
      { path: 'customers/signup-fields', element: guarded('customers.viewFull', page(() => import('@/features/customers/pages/SignupFieldsPage'))) },
      { path: 'customers/:id', element: guarded('customers.view', page(() => import('@/features/customers/pages/CustomerDetailPage'))) },
      { path: 'employees', element: guarded('employees.view', page(() => import('@/features/employees/pages/EmployeesPage'))) },
      { path: 'notifications', element: guarded('notifications.view', page(() => import('@/features/notifications/pages/NotificationsPage'))) },
      { path: 'rewards', element: guarded('rewards.view', page(() => import('@/features/rewards/pages/RewardsPage'))) },
      { path: 'analytics', element: guarded('analytics.view', page(() => import('@/features/analytics/pages/AnalyticsPage'))) },
      { path: 'branding', element: guarded('settings.view', page(() => import('@/features/branding/pages/BrandingPage'))) },
      { path: 'subscription', element: guarded('subscription.view', page(() => import('@/features/subscriptions/pages/SubscriptionPage'))) },
      { path: 'settings', element: <Navigate to="business" replace /> },
      { path: 'settings/:section', element: guarded('settings.view', page(() => import('@/features/settings/pages/SettingsPage'))) },
      { path: 'account', element: guarded('account.view', page(() => import('@/features/employees/pages/AccountPage'))) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]

export function createRouter() {
  return createBrowserRouter(routes)
}
