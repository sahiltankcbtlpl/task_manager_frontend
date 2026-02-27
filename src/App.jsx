import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import StaffList from './pages/staff/StaffList';
import CreateStaff from './pages/staff/CreateStaff';
import EditStaff from './pages/staff/EditStaff';
import TaskList from './pages/tasks/TaskList';
import CreateTask from './pages/tasks/CreateTask';
import EditTask from './pages/tasks/EditTask';
import RoleList from './pages/roles/RoleList';
import CreateRole from './pages/roles/CreateRole';
import EditRole from './pages/roles/EditRole';
import PermissionList from './pages/permissions/PermissionList';
import CreatePermission from './pages/permissions/CreatePermission';
import EditPermission from './pages/permissions/EditPermission';
import TaskStatusList from './pages/taskStatus/TaskStatusList';
import CreateTaskStatus from './pages/taskStatus/CreateTaskStatus';
import EditTaskStatus from './pages/taskStatus/EditTaskStatus';
import ProjectList from './pages/projects/ProjectList';
import CreateProject from './pages/projects/CreateProject';
import EditProject from './pages/projects/EditProject';
import TeamList from './pages/team/TeamList';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<TeamList />} />

          {/* Staff Routes */}
          <Route path="/staff" element={<StaffList />} />
          <Route path="/staff/create" element={<CreateStaff />} />
          <Route path="/staff/:id/edit" element={<EditStaff />} />

          {/* Task Routes - category TASK */}
          <Route path="/tasks" element={<TaskList category="TASK" />} />
          <Route path="/tasks/create" element={<CreateTask category="TASK" />} />
          <Route path="/tasks/edit/:id" element={<EditTask category="TASK" />} />

          {/* Issue Routes - category ISSUE */}
          <Route path="/issues" element={<TaskList category="ISSUE" />} />
          <Route path="/issues/create" element={<CreateTask category="ISSUE" />} />
          <Route path="/issues/edit/:id" element={<EditTask category="ISSUE" />} />

          {/* Role Routes */}
          <Route path="/roles" element={<RoleList />} />
          <Route path="/roles/create" element={<CreateRole />} />
          <Route path="/roles/edit/:id" element={<EditRole />} />

          {/* Permission Routes */}
          <Route path="/permissions" element={<PermissionList />} />
          <Route path="/permissions/create" element={<CreatePermission />} />
          <Route path="/permissions/edit/:id" element={<EditPermission />} />

          {/* Task Status Routes */}
          <Route path="/task-status" element={<TaskStatusList />} />
          <Route path="/task-status/create" element={<CreateTaskStatus />} />
          <Route path="/task-status/edit/:id" element={<EditTaskStatus />} />

          {/* Project Routes */}
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/projects/edit/:id" element={<EditProject />} />

          {/* Redirect root URL to dashboard, which redirects to login if not authenticated */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
