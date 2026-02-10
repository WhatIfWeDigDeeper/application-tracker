'use client';

import { use } from 'react';
import { Header } from '@/components/common/Header';
import { ApplicationEdit } from '@/components/applications/ApplicationEdit';

interface EditApplicationPageProps {
  params: Promise<{ id: string }>;
}

export default function EditApplicationPage({ params }: EditApplicationPageProps): React.ReactElement {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationEdit applicationId={id} />
      </main>
    </div>
  );
}
