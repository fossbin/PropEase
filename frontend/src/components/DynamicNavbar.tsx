'use client';

import { usePathname } from 'next/navigation';
import PublicNavbar from './PublicNavbar';
import RoleNavbar from './RoleNavbar';

const DynamicNavbar = () => {
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/auth');
  const isSwitchRole = pathname.startsWith('/switch-role');
  const isAdminPage = pathname.startsWith('/admin');

  const isPublicPage = ['/', '/auth/login', '/auth/register'].includes(pathname);

  if (isAuthPage || isSwitchRole || isAdminPage) return null;

  if (isPublicPage) return <PublicNavbar />;

  return <RoleNavbar />;
};

export default DynamicNavbar;
