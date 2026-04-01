'use client';

import { ColumnDef } from '@tanstack/react-table';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Users, Calendar, MapPin, Tag } from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/formatters';
import { QuoteSession } from '@/core/domain/quote/QuoteTypes';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  DRAFT: { label: 'Borrador (IA)', variant: 'neutral' },
  GENERATED: { label: 'Pendiente Revisión', variant: 'warning' },
  ACCEPTED: { label: 'Aceptado (Convertido)', variant: 'success' },
  REJECTED: { label: 'Rechazado', variant: 'error' },
};

const SEGMENT_COLORS: Record<string, string> = {
  CORPORATIVO: 'bg-blue-100 text-blue-700 border-blue-200',
  AGENCIA: 'bg-purple-100 text-purple-700 border-purple-200',
  SOCIAL_PREMIUM: 'bg-orange-100 text-orange-700 border-orange-200',
  PUBLICO: 'bg-green-100 text-green-700 border-green-200',
};

export const columns: ColumnDef<QuoteSession>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Fecha Lead',
    cell: ({ row }: { row: any }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">
          {formatDateShort(row.original.createdAt)}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {row.original.id.slice(0, 8)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'clientData',
    header: 'Cliente / Segmento',
    cell: ({ row }: { row: any }) => {
      const client = row.original.clientData;
      const segment = row.original.segment;
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{client.name}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${SEGMENT_COLORS[segment] || ''}`}>
              {segment}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{client.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'eventType',
    header: 'Tipo de Evento',
    cell: ({ row }: { row: any }) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-foreground/90">
          <Tag className="h-3.5 w-3.5 text-primary/60" />
          <span className="text-sm font-medium">{row.original.eventType}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{row.original.attendees}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{row.original.duration}</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'location',
    header: 'Ubicación',
    cell: ({ row }: { row: any }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground max-w-[150px] truncate">
        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs">{row.original.location}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }: { row: any }) => {
      const status = STATUS_CONFIG[row.original.status] || { label: row.original.status, variant: 'neutral' };
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
    filterFn: (row: any, id: string, value: any) => value.includes(row.getValue(id)),
  },
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => (
      <div className="flex justify-end pr-2">
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/admin/leads/${row.original.id}`}>
            <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        </Button>
      </div>
    ),
  },
];

export function LeadsTable({ data }: { data: QuoteSession[] }) {
  return (
    <AdvancedDataTable
      columns={columns}
      data={data}
      filterColumn="clientData"
      filterPlaceholder="Buscar por cliente..."
      facetedFilters={[
        {
          column: 'status',
          title: 'Estado',
          options: Object.entries(STATUS_CONFIG).map(([key, config]) => ({
            label: config.label,
            value: key,
          })),
        },
      ]}
    />
  );
}
