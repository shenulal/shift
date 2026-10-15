import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { DataProvider } from '@/data';
import { ToastProvider, Loading } from '@/ui/kit';
import { Theme } from '@/ui/Theme';
import { DemoBar } from '@/layouts/DemoBar';
import { PublicLayout } from '@/layouts/PublicLayout';
import { MemberLayout } from '@/layouts/MemberLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import '@/ui/charts';

const L = (f: () => Promise<{ default: ComponentType }>) => {
  const C = lazy(f);
  return <Suspense fallback={<div className="wrap section"><Loading /></div>}><C /></Suspense>;
};

const Router = __DEMO__ ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <Router>
          <Theme />
          <DemoBar />
          <Routes>
            {/* Public marketing site + client journey pages */}
            <Route element={<PublicLayout />}>
              <Route index element={L(() => import('@/pages/public/Home'))} />
              <Route path="method" element={L(() => import('@/pages/public/Method'))} />
              <Route path="about" element={L(() => import('@/pages/public/About'))} />
              <Route path="path" element={L(() => import('@/pages/public/Path'))} />
              <Route path="discover" element={L(() => import('@/pages/public/Discover'))} />
              <Route path="tools" element={L(() => import('@/pages/public/Tools'))} />
              <Route path="tools/:id" element={L(() => import('@/pages/public/ToolkitDetail'))} />
              <Route path="journey" element={L(() => import('@/pages/public/JourneyPage'))} />
              <Route path="coaching" element={L(() => import('@/pages/public/Coaching'))} />
              <Route path="enquiry" element={L(() => import('@/pages/public/Enquiry'))} />
              <Route path="discovery-call" element={L(() => import('@/pages/public/DiscoveryCall'))} />
              <Route path="enrol" element={L(() => import('@/pages/public/Enrolment'))} />
              <Route path="onboarding" element={L(() => import('@/pages/public/Onboarding'))} />
              <Route path="process" element={L(() => import('@/pages/public/Process'))} />
              <Route path="complete" element={L(() => import('@/pages/public/Complete'))} />
              <Route path="brochure" element={L(() => import('@/pages/public/Brochure'))} />
              <Route path="login" element={L(() => import('@/pages/Login'))} />
              <Route path="*" element={L(() => import('@/pages/NotFound'))} />
            </Route>
            {/* Discover SHIFT free tool — full-screen flow */}
            <Route path="discover/start" element={L(() => import('@/pages/public/DiscoverFlow'))} />

            {/* Member app */}
            <Route path="app" element={<MemberLayout />}>
              <Route index element={L(() => import('@/pages/member/Dashboard'))} />
              <Route path="journey" element={L(() => import('@/pages/member/JourneyHome'))} />
              <Route path="stage/:stageId" element={L(() => import('@/pages/member/StagePage'))} />
              <Route path="stage/:stageId/reflection" element={L(() => import('@/pages/member/StageReflection'))} />
              <Route path="lesson/:lessonId" element={L(() => import('@/pages/member/LessonPage'))} />
              <Route path="tools" element={L(() => import('@/pages/member/MyTools'))} />
              <Route path="tools/:toolkitId" element={L(() => import('@/pages/member/ToolkitTools'))} />
              <Route path="portal" element={L(() => import('@/pages/member/Portal'))} />
              <Route path="checkpoint/:id" element={L(() => import('@/pages/member/Checkpoint'))} />
              <Route path="blueprint" element={L(() => import('@/pages/member/Blueprint'))} />
              <Route path="onboarding" element={L(() => import('@/pages/member/ClientOnboarding'))} />
            </Route>

            {/* Coach admin + CMS */}
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={L(() => import('@/pages/admin/Overview'))} />
              <Route path="clients" element={L(() => import('@/pages/admin/Clients'))} />
              <Route path="clients/:userId" element={L(() => import('@/pages/admin/ClientDetail'))} />
              <Route path="pipeline" element={L(() => import('@/pages/admin/Pipeline'))} />
              <Route path="analytics" element={L(() => import('@/pages/admin/Analytics'))} />
              <Route path="preview" element={L(() => import('@/pages/admin/Preview'))} />
              <Route path="cms/plans" element={L(() => import('@/pages/admin/Plans'))} />
              <Route path="cms/toolkits" element={L(() => import('@/pages/admin/Toolkits'))} />
              <Route path="cms/journey" element={L(() => import('@/pages/admin/JourneyBuilder'))} />
              <Route path="cms/questions" element={L(() => import('@/pages/admin/QuestionsWheel'))} />
              <Route path="cms/forms" element={L(() => import('@/pages/admin/FormsEmails'))} />
              <Route path="cms/content" element={L(() => import('@/pages/admin/ContentPages'))} />
              <Route path="cms/branding" element={L(() => import('@/pages/admin/Branding'))} />
              <Route path="cms/settings" element={L(() => import('@/pages/admin/Settings'))} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </DataProvider>
  );
}
