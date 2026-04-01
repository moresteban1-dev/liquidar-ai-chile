'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, Calendar, MapPin, Tag, ArrowLeft, 
  CheckCircle2, XCircle, ShoppingBag, Terminal
} from 'lucide-react';
import { QuoteSession } from '@/core/domain/quote/QuoteTypes';
import { updateLeadStatusAction } from '@/actions/admin-leads';
import { toast } from 'sonner';
import { formatDateShort } from '@/lib/formatters';

interface LeadDetailClientProps {
  lead: QuoteSession;
}

export function LeadDetailClient({ lead }: LeadDetailClientProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    const res = await updateLeadStatusAction(lead.id!, newStatus);
    setUpdating(false);

    if (res.success) {
      toast.success(`Lead actualizado a ${newStatus}`);
      router.refresh();
    } else {
      toast.error(`Error: ${res.error}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Navigation Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/leads')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Leads
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Client & Event Context */}
        <div className="flex-1 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider px-2 py-0 h-5">
                   ID: {lead.id?.slice(0, 13) || 'NUEVO'}...
                </Badge>
                <div className="flex items-center gap-2">
                   <Badge variant={lead.status === 'GENERATED' ? 'warning' : lead.status === 'ACCEPTED' ? 'success' : 'secondary'}>
                      {lead.status}
                   </Badge>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold mt-2">
                Lead {lead.segment} - {lead.eventType}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-sm">
                Solicitado el {formatDateShort(lead.createdAt ? String(lead.createdAt) : null)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Datos del Cliente</h4>
                <div className="space-y-2">
                  <p className="text-lg font-medium">{lead.clientData.name}</p>
                  <p className="text-sm text-muted-foreground">{lead.clientData.email}</p>
                  <p className="text-sm text-muted-foreground">{lead.clientData.phone}</p>
                  {lead.clientData.company && (
                    <Badge variant="secondary" className="mt-1">{lead.clientData.company}</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Logística del Evento</h4>
                <div className="space-y-3">
                   <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Users className="h-4 w-4 text-primary/70" />
                      <span>{lead.attendees} asistentes</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span>{lead.duration} de duración</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                      <MapPin className="h-4 w-4 text-primary/70" />
                      <span className="truncate">{lead.location}</span>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight">Requerimientos Inferidos por IA</h3>
                <Badge variant="secondary">{lead.requestedItems?.length || 0} items</Badge>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {lead.requestedItems?.map((item, idx) => (
                  <Card key={idx} className="border-border/40 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${item.isCustom ? 'bg-orange-50' : 'bg-blue-50'}`}>
                             {item.isCustom ? <Terminal className="h-5 w-5 text-orange-600" /> : <ShoppingBag className="h-5 w-5 text-blue-600" />}
                          </div>
                          <div>
                             <p className="font-semibold text-foreground">
                                {item.isCustom ? item.customName : `Catálogo: ${item.catalogItemId}`}
                             </p>
                             <p className="text-xs text-muted-foreground">
                                {item.isCustom ? 'Necesidad técnica inferida por IA' : 'Match exacto en el catálogo'}
                             </p>
                          </div>
                       </div>
                       {!item.isCustom && (
                         <Badge variant="success" className="text-[10px]">MATCH OK</Badge>
                       )}
                    </CardContent>
                  </Card>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Actions Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
           <Card className="border-border/60 bg-muted/10">
              <CardHeader className="pb-4">
                 <CardTitle className="text-lg">Acciones de Gestión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <Button 
                    className="w-full justify-start" 
                    variant="secondary"
                    onClick={() => handleStatusUpdate('ACCEPTED')}
                    disabled={updating}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                    Convertir a RFQ / Orden
                 </Button>
                 <Button 
                    className="w-full justify-start" 
                    variant="ghost"
                    onClick={() => handleStatusUpdate('REJECTED')}
                    disabled={updating}
                  >
                    <XCircle className="h-4 w-4 mr-2 text-destructive" />
                    Rechazar Lead
                 </Button>
              </CardContent>
           </Card>

           <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary/80 space-y-2">
              <h5 className="font-bold flex items-center gap-1 uppercase tracking-tighter">
                <Tag className="h-3 w-3" />
                Nota de Inteligencia
              </h5>
              <p>
                Este lead fue generado usando el motor de inferencia V2. 
                Los items marcados como personalizados reflejan brechas identificadas en el catálogo.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
