'use client';

import { usePathname } from 'next/navigation';
import PublicNavbar from './PublicNavbar';
import RoleNavbar from './RoleNavbar';

const DynamicNavbar = () => {
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/auth');
  const isSwitchRole = pathname.startsWith('/switch-role');

  const isPublic =
    pathname === '/' || pathname === '/auth/login' || pathname === '/auth/register';

  if (isAuthPage || isSwitchRole) return null;

  if (isPublic) return <PublicNavbar />;

  return <RoleNavbar />;
};

export default DynamicNavbar;
