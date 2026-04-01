'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { generateIntelligentConfiguration, WizardState } from '@/actions/event-intelligence';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Users, Clock, AlertCircle, CheckCircle2, ChevronRight, ActivitySquare } from 'lucide-react';
import { toast } from 'sonner';

const initialState: WizardState = {
  success: false,
  message: '',
};

export default function SmartWizardPage() {
  const [state, formAction, isPending] = useActionState(generateIntelligentConfiguration, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  const hasResults = useMemo(() => state.success && state.inferredGraph && state.inferredGraph.length > 0, [state]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20"
          >
            <BrainCircuit className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-light tracking-tight text-white">
            <span className="font-bold">Intelligence</span> Engine
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Configura tu evento usando nuestro Algoritmo Topológico. Describe el volumen y nosotros resolveremos la logística completa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Formulario (Input Profile) */}
          <motion.div 
            className="lg:col-span-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ActivitySquare className="w-5 h-5 text-zinc-400" />
                  Base Event Profile
                </CardTitle>
                <CardDescription>Parámetros iniciales de la ecuación.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={formAction} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="eventTypeId">Tipo de Evento</Label>
                    <Select name="eventTypeId" defaultValue="a1111111-1111-1111-1111-111111111111">
                      <SelectTrigger className="bg-zinc-950 border-zinc-800">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a1111111-1111-1111-1111-111111111111">Convención Corporativa</SelectItem>
                        <SelectItem value="a2222222-2222-2222-2222-222222222222">Matrimonio Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendees" className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-500" /> Público Estimado (Asistentes)
                    </Label>
                    <Input 
                      id="attendees" 
                      name="attendees" 
                      type="number" 
                      defaultValue={500}
                      min={1} 
                      className="bg-zinc-950 border-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="durationHours" className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" /> Duración (Horas)
                    </Label>
                    <Input 
                      id="durationHours" 
                      name="durationHours" 
                      type="number" 
                      defaultValue={8}
                      min={1} 
                      className="bg-zinc-950 border-zinc-800"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 animate-pulse" />
                        Ejecutando Inferencia...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Generar Grafo Logístico <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resultados (El Grafo Inferido) */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-zinc-900/30 border-zinc-800/50 min-h-[500px]">
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Knowledge Graph Output</span>
                  {hasResults && (
                    <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full border border-zinc-700">
                      SESSION ID: {state.sessionId?.substring(0,8)}...
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Requerimientos inferidos topológicamente a partir de las reglas de tu negocio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {!hasResults ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-600 gap-4"
                    >
                      <BrainCircuit className="w-16 h-16 opacity-20" />
                      <p>Esperando input para computar la topología...</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {state.inferredGraph?.map((need, index) => (
                        <motion.div 
                          key={need.nodeCode}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border ${need.isEssential ? 'bg-zinc-900/80 border-primary/30' : 'bg-zinc-900/40 border-zinc-800'} flex items-start justify-between gap-4`}
                        >
                          <div className="space-y-2 flex-grow">
                            <div className="flex items-center gap-2">
                              {need.isEssential ? (
                                <AlertCircle className="w-5 h-5 text-primary" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5 text-zinc-500" />
                              )}
                              <h3 className="font-semibold text-white text-lg">{need.nodeName}</h3>
                              <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                                {need.nodeCode}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              {need.reasoning.map((reason, i) => (
                                <p key={i} className="text-sm text-zinc-400 pl-7 flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-zinc-600 inline-block" />
                                  {reason}
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-2">
                            <div className="text-3xl font-light text-white">
                              {need.quantityInferred} <span className="text-sm text-zinc-500 font-normal">UNID.</span>
                            </div>
                            <div className="text-xs text-zinc-500 border border-zinc-800 bg-zinc-950 px-2 py-1 rounded">
                              Confianza: {(need.confidenceScore * 100).toFixed(0)}%
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              {hasResults && (
                <CardFooter className="bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center py-4">
                  <p className="text-sm text-zinc-400">
                    <span className="text-primary font-semibold">{state.inferredGraph?.length}</span> Nodos Logísticos Inferidos
                  </p>
                  <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
                    Convertir a Cotización Real
                  </Button>
                </CardFooter>
              )}
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
