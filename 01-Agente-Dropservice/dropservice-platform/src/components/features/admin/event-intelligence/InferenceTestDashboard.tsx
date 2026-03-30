'use client';

import { useState, useEffect, useActionState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { generateIntelligentConfiguration, WizardState } from '@/actions/event-intelligence';
import { getEventTypesAction } from '@/actions/event-types';
import { Loader2, BrainCircuit, Play, Info } from 'lucide-react';

export function InferenceTestDashboard() {
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const initialState: WizardState = {
    success: false,
    message: '',
    inferredGraph: []
  };

  const [state, action, isPending] = useActionState(generateIntelligentConfiguration, initialState);

  useEffect(() => {
    getEventTypesAction().then(res => {
      if (res.success) setEventTypes(res.data || []);
      setLoadingTypes(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Parámetros de Prueba
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventTypeId">Tipo de Evento</Label>
                <Select name="eventTypeId" disabled={loadingTypes}>
                  <SelectTrigger id="eventTypeId">
                    <SelectValue placeholder={loadingTypes ? "Cargando..." : "Selecciona un evento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(et => (
                      <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendees">Cantidad de Asistentes</Label>
                <Input type="number" id="attendees" name="attendees" defaultValue="50" min="1" step="1" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationHours">Duración (Horas)</Label>
                <Input type="number" id="durationHours" name="durationHours" defaultValue="6" min="1" step="1" required />
              </div>

              <Button type="submit" className="w-full" disabled={isPending || loadingTypes}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Ejecutar Inferencia
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Resultados del Grafo de Conocimiento</CardTitle>
          </CardHeader>
          <CardContent>
             {state.success && state.inferredGraph && state.inferredGraph.length > 0 ? (
               <div className="space-y-4">
                 <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm font-medium">
                   {state.message}
                 </div>
                 <div className="overflow-x-auto border rounded-xl">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Servicio</TableHead>
                         <TableHead>Código</TableHead>
                         <TableHead className="text-right">Cantidad</TableHead>
                         <TableHead>Razonamiento</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {state.inferredGraph.map((need, i) => (
                         <TableRow key={i}>
                           <TableCell className="font-bold">{need.serviceName}</TableCell>
                           <TableCell><Badge variant="outline">{need.nodeCode}</Badge></TableCell>
                           <TableCell className="text-right font-mono text-primary font-bold">{need.quantityInferred}</TableCell>
                           <TableCell className="text-[10px] text-muted-foreground max-w-[300px]">
                             <ul className="list-disc pl-4 space-y-1">
                               {need.reasoning.map((r, ri) => <li key={ri}>{r}</li>)}
                             </ul>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4 text-center">
                  <Info className="h-10 w-10 opacity-20" />
                  <div>
                    <p className="font-medium">Sin datos para mostrar</p>
                    <p className="text-xs">Configura los parámetros y presiona "Ejecutar" para ver la topología funcional inferida.</p>
                  </div>
                  {state.message && !state.success && <p className="text-destructive text-xs p-2 bg-destructive/10 rounded">{state.message}</p>}
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
