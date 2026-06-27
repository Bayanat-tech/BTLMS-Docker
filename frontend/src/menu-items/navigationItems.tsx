import { HomeOutlined, IdcardOutlined, ProfileOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';

const icons = {
  HomeOutlined,
  IdcardOutlined,
  ProfileOutlined,
  SettingOutlined,
  UserOutlined
};

export const NavigationItems = [
  {
    id: 'hr_dashboard',
    type: 'item',
    url_path: '/hr/dashboard',
    icon: icons.HomeOutlined
  },
  {
    id: 'employee_hr',
    type: 'item',
    url_path: '/hr/masters/employee/employeemaster',
    icon: icons.UserOutlined
  },
  {
    id: 'employee_profile_hr',
    type: 'item',
    url_path: '/hr/masters/gm/employee_profile',
    icon: icons.IdcardOutlined
  },
  {
    id: 'leave_request_hr',
    type: 'item',
    url_path: '/hr/Activity/Request/leave_request',
    icon: icons.ProfileOutlined
  },
  {
    id: 'leave_resumption_hr',
    type: 'item',
    url_path: '/hr/Activity/Request/leave_resumption',
    icon: icons.ProfileOutlined
  },
  {
    id: 'hr_masters',
    type: 'collapse',
    icon: icons.SettingOutlined,
    children: [
      { id: 'category_hr', type: 'item', url_path: '/hr/masters/gm/categorymaster', icon: icons.SettingOutlined },
      { id: 'section_hr', type: 'item', url_path: '/hr/masters/gm/section', icon: icons.SettingOutlined },
      { id: 'leave_type_hr', type: 'item', url_path: '/hr/masters/gm/leavetype', icon: icons.SettingOutlined },
      { id: 'paycomponent_hr', type: 'item', url_path: '/hr/masters/gm/paycomponent', icon: icons.SettingOutlined },
      { id: 'grade_hr', type: 'item', url_path: '/hr/masters/gm/grademaster', icon: icons.SettingOutlined },
      { id: 'designation_hr', type: 'item', url_path: '/hr/masters/gm/designation', icon: icons.SettingOutlined },
      { id: 'formaldesignation_hr', type: 'item', url_path: '/hr/masters/gm/formaldesignation', icon: icons.SettingOutlined },
      { id: 'bank_hr', type: 'item', url_path: '/hr/masters/gm/bank', icon: icons.SettingOutlined }
    ]
  }
];
