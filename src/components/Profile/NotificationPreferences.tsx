'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

interface NotificationSettings {
    email: {
        bookingConfirmations: boolean;
        priceAlerts: boolean;
        tripReminders: boolean;
        socialUpdates: boolean;
    };
    push: {
        checkInReminders: boolean;
        flightUpdates: boolean;
        groupMessages: boolean;
    };
    sms: {
        urgentAlerts: boolean;
        bookingChanges: boolean;
    };
}

export function NotificationPreferences() {
    const [settings, setSettings] = useState<NotificationSettings>({
        email: {
            bookingConfirmations: true,
            priceAlerts: true,
            tripReminders: true,
            socialUpdates: false,
        },
        push: {
            checkInReminders: true,
            flightUpdates: true,
            groupMessages: true,
        },
        sms: {
            urgentAlerts: false,
            bookingChanges: false,
        },
    });

    const updateSetting = (category: keyof NotificationSettings, key: string, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value,
            },
        }));
    };

    const handleSave = () => {
        // Save to store/API
        console.log('Saving notification settings:', settings);
        alert('Notification preferences saved!');
    };

    return (
        <div className="space-y-4">
            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Notifications
                    </CardTitle>
                    <CardDescription>Manage your email notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Booking Confirmations</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive confirmation emails for bookings
                            </p>
                        </div>
                        <Switch
                            checked={settings.email.bookingConfirmations}
                            onCheckedChange={(checked) => updateSetting('email', 'bookingConfirmations', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Price Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                                Get notified about price drops and deals
                            </p>
                        </div>
                        <Switch
                            checked={settings.email.priceAlerts}
                            onCheckedChange={(checked) => updateSetting('email', 'priceAlerts', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Trip Reminders</Label>
                            <p className="text-sm text-muted-foreground">
                                Reminders about upcoming trips and check-ins
                            </p>
                        </div>
                        <Switch
                            checked={settings.email.tripReminders}
                            onCheckedChange={(checked) => updateSetting('email', 'tripReminders', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Social Updates</Label>
                            <p className="text-sm text-muted-foreground">
                                Updates from followers and group activities
                            </p>
                        </div>
                        <Switch
                            checked={settings.email.socialUpdates}
                            onCheckedChange={(checked) => updateSetting('email', 'socialUpdates', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Push Notifications
                    </CardTitle>
                    <CardDescription>Manage browser and mobile push notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Check-in Reminders</Label>
                            <p className="text-sm text-muted-foreground">
                                Reminders 24 hours before check-in
                            </p>
                        </div>
                        <Switch
                            checked={settings.push.checkInReminders}
                            onCheckedChange={(checked) => updateSetting('push', 'checkInReminders', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Flight Updates</Label>
                            <p className="text-sm text-muted-foreground">
                                Real-time flight status and gate changes
                            </p>
                        </div>
                        <Switch
                            checked={settings.push.flightUpdates}
                            onCheckedChange={(checked) => updateSetting('push', 'flightUpdates', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Group Messages</Label>
                            <p className="text-sm text-muted-foreground">
                                New messages in trip group chats
                            </p>
                        </div>
                        <Switch
                            checked={settings.push.groupMessages}
                            onCheckedChange={(checked) => updateSetting('push', 'groupMessages', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SMS Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        SMS Notifications
                    </CardTitle>
                    <CardDescription>Manage text message notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Urgent Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                                Critical updates requiring immediate attention
                            </p>
                        </div>
                        <Switch
                            checked={settings.sms.urgentAlerts}
                            onCheckedChange={(checked) => updateSetting('sms', 'urgentAlerts', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Booking Changes</Label>
                            <p className="text-sm text-muted-foreground">
                                Cancellations and modifications to bookings
                            </p>
                        </div>
                        <Switch
                            checked={settings.sms.bookingChanges}
                            onCheckedChange={(checked) => updateSetting('sms', 'bookingChanges', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full">
                Save Notification Preferences
            </Button>
        </div>
    );
}
