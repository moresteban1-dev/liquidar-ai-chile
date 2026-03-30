"use client"

import * as React from 'react';
import {
    Calendar,
    Mail,
    Smile,
    Settings,
    User,
    Rocket,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command'

export function AdminCommandMenu() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <div className="hidden">
                {/* Hidden trigger for SEO/Accessibility if needed, usually handled by global listener */}
            </div>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Escribe un comando o busca..." />
                <CommandList>
                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                    <CommandGroup heading="Sugerencias">
                        <CommandItem onSelect={() => runCommand(() => router.push('/admin/quotations'))}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Ver Cotizaciones</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/admin/orders'))}>
                            <Rocket className="mr-2 h-4 w-4" />
                            <span>Ver Órdenes</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/admin/analytics'))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Analíticas</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Configuración">
                        <CommandItem onSelect={() => runCommand(() => router.push('/admin/users'))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Gestión de Usuarios</span>
                            <CommandShortcut>⌘U</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/admin/services'))}>
                            <Smile className="mr-2 h-4 w-4" />
                            <span>Catálogo de Servicios</span>
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/admin/settings'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Ajustes Generales</span>
                            <CommandShortcut>⌘G</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
