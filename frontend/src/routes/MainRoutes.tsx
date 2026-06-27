import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import Loadable from 'components/Loadable';
import CommonLayout from 'layout/CommonLayout';
import MainLayout from 'layout/MainLayout';
import AuthGuard from 'utils/route-guard/AuthGuard';

const MaintenanceError = Loadable(lazy(() => import('pages/maintenance/404')));
const MaintenanceError500 = Loadable(lazy(() => import('pages/maintenance/500')));
const MaintenanceUnderConstruction = Loadable(lazy(() => import('pages/maintenance/under-construction')));
const MaintenanceComingSoon = Loadable(lazy(() => import('pages/maintenance/coming-soon')));

const LmsDashboard = Loadable(lazy(() => import('pages/HR/dashboard/LmsDashboard')));
const EmployeeHrPage = Loadable(lazy(() => import('pages/HR/Masters/Employee/EmployeeHrPage')));
const HREmployeeProfileMainPage = Loadable(lazy(() => import('pages/HR/HRFlow/EmployeeProfile/HREmployeeProfileMainPage')));
const CategoryHrPage = Loadable(lazy(() => import('pages/HR/CategoryHrPage')));
const SectionPage = Loadable(lazy(() => import('pages/HR/SectionPage')));
const HrleavetypePage = Loadable(lazy(() => import('pages/HR/HrleavetypePage')));
const PaycomponentHrPage = Loadable(lazy(() => import('pages/HR/HrPaycomponentPage')));
const KpiNamePage = Loadable(lazy(() => import('pages/HR/KpiNamePage')));
const OperationHrPage = Loadable(lazy(() => import('pages/HR/OperationHrPage')));
const GradeHrPage = Loadable(lazy(() => import('pages/HR/GradeHrPage')));
const DesignationHrPage = Loadable(lazy(() => import('pages/HR/DesignationHrPage')));
const FormaldesignationHrPage = Loadable(lazy(() => import('pages/HR/FormaldesignationHrPage')));
const BankWmsPage = Loadable(lazy(() => import('pages/HR/BankWmsPage')));

const BTHRMainPage = Loadable(lazy(() => import('BT_INDIA/pages/BTHRMainPages')));
const BT_HRPayslips = Loadable(lazy(() => import('BT_INDIA/pages/BT_HRPayslips')));
const BT_ViewPayslipReport = Loadable(lazy(() => import('BT_INDIA/pages/BT_ViewPayslipReport')));
const BT_HrEmployeeRegisterMainPage = Loadable(lazy(() => import('BT_INDIA/pages/BT_HrEmployeeRegisterMainPage')));
const BT_HRLeaveResumptionMainPage = Loadable(lazy(() => import('BT_INDIA/pages/BT_HRLeaveResumptionMainPage')));

const MainRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      element: (
        <AuthGuard>
          <MainLayout />
        </AuthGuard>
      ),
      children: [
        { index: true, element: <Navigate to="/hr/dashboard" replace /> },
        { path: 'apps', element: <Navigate to="/hr/dashboard" replace /> },
        {
          path: 'hr',
          children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: 'dashboard', element: <LmsDashboard /> },
            {
              path: 'masters',
              children: [
                {
                  path: 'employee',
                  children: [{ path: 'employeemaster', element: <EmployeeHrPage /> }]
                },
                {
                  path: 'gm',
                  children: [
                    { path: 'employee_profile', element: <HREmployeeProfileMainPage /> },
                    { path: 'categorymaster', element: <CategoryHrPage /> },
                    { path: 'section', element: <SectionPage /> },
                    { path: 'leavetype', element: <HrleavetypePage /> },
                    { path: 'paycomponent', element: <PaycomponentHrPage /> },
                    { path: 'kpiname', element: <KpiNamePage /> },
                    { path: 'kpioperation', element: <OperationHrPage /> },
                    { path: 'grademaster', element: <GradeHrPage /> },
                    { path: 'designation', element: <DesignationHrPage /> },
                    { path: 'formaldesignation', element: <FormaldesignationHrPage /> },
                    { path: 'bank', element: <BankWmsPage /> },
                    { path: '*', element: <MaintenanceError /> }
                  ]
                },
                { path: '*', element: <MaintenanceComingSoon /> }
              ]
            },
            {
              path: 'Activity',
              children: [
                {
                  path: 'Request',
                  children: [
                    { path: 'leave_request', element: <BTHRMainPage /> },
                    { path: 'employee_payslip', element: <BT_HRPayslips /> },
                    { path: 'employee_payslip_view/:employeeId/:month/:year', element: <BT_ViewPayslipReport /> },
                    { path: 'leave_register', element: <BT_HrEmployeeRegisterMainPage /> },
                    { path: 'leave_resumption', element: <BT_HRLeaveResumptionMainPage /> },
                    { path: '*', element: <MaintenanceError /> }
                  ]
                },
                { path: '*', element: <MaintenanceComingSoon /> }
              ]
            },
            { path: '*', element: <MaintenanceComingSoon /> }
          ]
        },
        { path: '*', element: <Navigate to="/hr/dashboard" replace /> }
      ]
    },
    {
      path: '/maintenance',
      element: <CommonLayout />,
      children: [
        { path: '404', element: <MaintenanceError /> },
        { path: '500', element: <MaintenanceError500 /> },
        { path: 'under-construction', element: <MaintenanceUnderConstruction /> },
        { path: 'coming-soon', element: <MaintenanceComingSoon /> }
      ]
    },
    { path: '*', element: <Navigate to="/hr/dashboard" replace /> }
  ]
};

export default MainRoutes;
