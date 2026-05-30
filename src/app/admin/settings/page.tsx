import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, CreditCard, Brain, Package as _Package } from 'lucide-react';

// Components
import { getOrganizationSettings } from '@/actions/settings';
import { SettingsForm } from '@/components/admin/settings/SettingsForm';
import { PaymentGatewayManager } from '@/components/admin/PaymentGatewayManager';
import { AIManagerPanel } from '@/components/admin/settings/AIManagerPanel';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    // 🚀 Server-side fetching
    const settings = await getOrganizationSettings();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">Administra los servicios, categorías y opciones generales.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="w-full max-w-2xl h-11 p-1 bg-muted/50 border border-border/50 rounded-lg flex items-center gap-1 mx-auto lg:mx-0">
                    <TabsTrigger value="general" className="flex-1 h-full rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm">
                        <Building2 className="mr-2 h-4 w-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="banking" className="flex-1 h-full rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm">
                        <CreditCard className="mr-2 h-4 w-4" /> Pagos
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex-1 h-full rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm">
                        <Brain className="mr-2 h-4 w-4" /> Inteligencia Artificial
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 animate-in fade-in-50 slide-in-from-left-2 duration-300">
                    <SettingsForm initialData={settings} />
                </TabsContent>

                <TabsContent value="banking">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de Pagos</CardTitle>
                            <CardDescription>Pasarelas de pago y datos bancarios.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentGatewayManager />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ai">
                    <Card>
                        <CardHeader>
                            <CardTitle>Proveedores de Inteligencia Artificial</CardTitle>
                            <CardDescription>Configura y activa de forma opcional OpenAI, Gemini, Claude, Perplexity y Groq.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AIManagerPanel />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
