'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

interface Order {
    id: string;
    code: string;
    status: string;
    priceCost: number;
    deliveryDate: string | null;
    deliverables: string | null;
    quotation?: { brief: string; requirements: string | null };
    items?: { quantity: number; service: { name: string } }[];
}

interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
}

export function useVendorOrder(orderId: string) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [message, setMessage] = useState('');

    const fetchOrder = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/orders/${orderId}`);
            if (response.ok) {
                const data = await response.json();
                setOrder(data);
                if (data.deliverables) {
                    try {
                        setFiles(JSON.parse(data.deliverables));
                    } catch (error) {
                        logger.error('Failed to parse deliverables JSON:', error);
                        setFiles([]);
                    }
                }
            }
        } catch (error) {
            logger.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId) fetchOrder();
    }, [orderId, fetchOrder]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('orderId', orderId);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                const newFiles = [...files, data.file];
                setFiles(newFiles);

                await fetch(`/api/orders/${orderId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deliverables: JSON.stringify(newFiles) }),
                });

                setMessage('¡Archivo subido correctamente!');
            } else {
                setMessage(data.error || 'Error al subir archivo');
            }
        } catch (error) {
            logger.error('Error uploading file:', error);
            setMessage('Error de conexión');
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleMarkComplete = async () => {
        setMessage('');
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'INTERNAL_REVIEW' }),
            });
            if (response.ok) {
                setMessage('¡Trabajo entregado! Pasó a revisión.');
                fetchOrder();
            }
        } catch (error) {
            logger.error('Error marking order complete:', error);
            setMessage('Error de conexión');
        }
    };

    return {
        order,
        loading,
        uploading,
        files,
        message,
        handleFileUpload,
        handleMarkComplete
    };
}
