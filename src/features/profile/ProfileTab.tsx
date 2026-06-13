import React from 'react';
import ProfileSettingsContent from '../settings/components/ProfileSettingsContent';

export default function ProfileTab() {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] overflow-hidden">
      <ProfileSettingsContent />
    </div>
  );
}
