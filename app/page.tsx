'use client';

import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';
import * as db from '@/utils/database';

export default function HomePage() {
  const router = useRouter();

  const handleStart = () => {
    db.del('viewMode').catch(console.error);
    router.push('/app');
  };
  
  const handleShowRedesigned = () => {
    db.set('viewMode', 'redesigned').catch(console.error);
    router.push('/app');
  };

  return <LandingPage onStart={handleStart} onShowRedesigned={handleShowRedesigned} />;
}