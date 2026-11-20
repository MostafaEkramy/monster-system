import React from 'react';

export function LoadingScreen({ message = 'Loading Monsters System...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-main p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-full w-full animate-ping rounded-full bg-[#8EDB2A]/20 duration-1000" />
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8EDB2A] border-t-transparent shadow-lg shadow-[#8EDB2A]/20" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-tight text-primary">MONSTERS TEAM</h2>
          <p className="text-sm text-secondary mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
