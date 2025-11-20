'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/store/useStore';
import { User, Settings as SettingsIcon, Globe, Lock, Bell, BarChart3, RefreshCw } from 'lucide-react';
import { currencies } from '@/data/currencies';
import { fetchExchangeRates, getLastUpdateTime } from '@/lib/exchangeRates';
import { NotificationPreferences } from '@/components/Profile/NotificationPreferences';
import { AnalyticsDashboard } from '@/components/Profile/AnalyticsDashboard';

export default function SettingsPage() {
    const { currentUser, updateCurrentUser } = useStore();
    const [primaryCurrency, setPrimaryCurrency] = useState('USD');
    const [autoConvert, setAutoConvert] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setLastUpdate(getLastUpdateTime());
        if (currentUser && 'currencySettings' in currentUser) {
            setPrimaryCurrency(currentUser.currencySettings.primaryCurrency);
            setAutoConvert(currentUser.currencySettings.autoConvert);
        }
    }, [currentUser]);

    const handleRefreshRates = async () => {
        setIsRefreshing(true);
        try {
            await fetchExchangeRates(primaryCurrency);
            setLastUpdate(getLastUpdateTime());
        } catch (error) {
            console.error('Failed to refresh rates:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="profile">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="preferences">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger value="currency">
                        <Globe className="h-4 w-4 mr-2" />
                        Currency
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="privacy">
                        <Lock className="h-4 w-4 mr-2" />
                        Privacy
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={currentUser?.avatar} />
                                    <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <Button variant="outline">Change Photo</Button>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" defaultValue={currentUser?.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue={currentUser?.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nationality">Nationality</Label>
                                    <Input id="nationality" placeholder="United States" />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <textarea
                                        id="bio"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>

                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Travel Preferences</CardTitle>
                            <CardDescription>Customize your travel experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="mb-3 block">Accommodation Types</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Hotel', 'Hostel', 'Apartment', 'Resort', 'B&B'].map((type) => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <Checkbox id={type} />
                                            <label htmlFor={type} className="text-sm cursor-pointer">
                                                {type}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="activity-level">Activity Level</Label>
                                <Select defaultValue="moderate">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="relaxed">Relaxed</SelectItem>
                                        <SelectItem value="moderate">Moderate</SelectItem>
                                        <SelectItem value="adventurous">Adventurous</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="budget-range">Budget Range</Label>
                                <Select defaultValue="moderate">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="budget">Budget</SelectItem>
                                        <SelectItem value="moderate">Moderate</SelectItem>
                                        <SelectItem value="luxury">Luxury</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button>Save Preferences</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Currency Tab */}
                <TabsContent value="currency" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Currency Settings</CardTitle>
                            <CardDescription>Manage your currency preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="primary-currency">Primary Currency</Label>
                                <Select value={primaryCurrency} onValueChange={setPrimaryCurrency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((currency) => (
                                            <SelectItem key={currency.code} value={currency.code}>
                                                {currency.flag} {currency.name} ({currency.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground mt-1">
                                    All prices will be displayed in this currency
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-convert prices</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically convert prices to your primary currency
                                    </p>
                                </div>
                                <Switch checked={autoConvert} onCheckedChange={setAutoConvert} />
                            </div>

                            <div className="bg-muted p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium">Current Exchange Rates</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRefreshRates}
                                        disabled={isRefreshing}
                                        className="gap-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </div>
                                {lastUpdate && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Last updated: {lastUpdate}
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {currencies.slice(0, 6).map((currency) => (
                                        <div key={currency.code} className="flex justify-between">
                                            <span>{currency.flag} {currency.code}</span>
                                            <span className="text-muted-foreground">
                                                {currency.rate.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={() => {
                                if (currentUser) {
                                    updateCurrentUser({
                                        currencySettings: {
                                            primaryCurrency,
                                            autoConvert,
                                            displayFormat: 'symbol' // Default
                                        }
                                    });
                                    alert('Currency settings saved!');
                                }
                            }}>Save Currency Settings</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <NotificationPreferences />
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                    <AnalyticsDashboard />
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy Settings</CardTitle>
                            <CardDescription>Control your privacy and data</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Public Profile</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow others to view your profile
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Show Travel History</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display your past trips on your profile
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Show Reviews</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Make your reviews visible to others
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-2">Data Management</h4>
                                <div className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start">
                                        Download My Data
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start text-red-600">
                                        Delete Account
                                    </Button>
                                </div>
                            </div>

                            <Button>Save Privacy Settings</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
