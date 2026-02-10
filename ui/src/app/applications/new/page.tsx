'use client';

import { Header } from '@/components/common/Header';
import { ApplicationEdit } from '@/components/applications/ApplicationEdit';

export default function NewApplicationPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationEdit />
      </main>
    </div>
  );
}
