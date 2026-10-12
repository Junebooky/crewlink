import React from 'react';
import { AppShell } from '@/components/common/AppShell';

export default function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
