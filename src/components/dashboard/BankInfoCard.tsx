'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { siteConfig } from '@/config/site';
import { Building2, Copy, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function BankInfoCard() {
    const { bank, legalName, rut, email } = siteConfig.company;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado al portapapeles`);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-md border-primary/20 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Datos Bancarios para Transferencia</CardTitle>
                        <CardDescription>Utiliza estos datos para realizar pagos de servicios.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Banco</span>
                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <span className="font-semibold">{bank.bankName}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Tipo de Cuenta</span>
                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <span className="font-semibold">{bank.accountType}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Número de Cuenta</span>
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-2 text-primary font-mono text-lg font-bold">
                            <CreditCard className="w-5 h-5 opacity-70" />
                            {bank.accountNumber}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-background"
                            onClick={() => copyToClipboard(bank.accountNumber, 'Número de cuenta')}
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Titular</span>
                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <span className="text-sm font-medium truncate" title={legalName}>{legalName}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1 hover:bg-background"
                                onClick={() => copyToClipboard(legalName, 'Titular')}
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">RUT</span>
                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <span className="text-sm font-medium">{rut}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1 hover:bg-background"
                                onClick={() => copyToClipboard(rut, 'RUT')}
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Email de confirmación</span>
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span className="text-sm font-medium">{email}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1 hover:bg-background"
                            onClick={() => copyToClipboard(email, 'Email')}
                        >
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
