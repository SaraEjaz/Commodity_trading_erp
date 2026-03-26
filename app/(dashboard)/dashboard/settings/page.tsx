'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>

      <div className="max-w-2xl space-y-8">
        {/* Profile Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="First Name" defaultValue={user?.first_name || ''} />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Last Name" defaultValue={user?.last_name || ''} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Email" defaultValue={user?.email || ''} disabled />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="Role" defaultValue={user?.role || ''} disabled />
            </div>
            <Button className="w-full">Save Changes</Button>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Security</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" placeholder="Current Password" />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="New Password" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" placeholder="Confirm Password" />
            </div>
            <Button className="w-full">Change Password</Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label>Email Notifications</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <label>Trade Alerts</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <label>Order Updates</label>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
