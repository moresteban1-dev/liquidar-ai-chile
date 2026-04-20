import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Roles y Credenciales preconfiguradas para pruebas
const TCLIENT = { email: `client.${Date.now()}@test.com`, pass: 'test1234' };
const TADMIN = { email: `admin.${Date.now()}@test.com`, pass: 'test1234' };
const TVENDOR = { email: `vendor.${Date.now()}@test.com`, pass: 'test1234' };

test.describe('E2E Golden Flow: Dropservice Lifecycle', () => {

    test.beforeAll(async () => {
        // 🛠️ SEEDING AUTOMÁTICO DE USUARIOS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRole) {
            console.warn("⚠️ Faltan variables de entorno Supabase. El login real fallará si no existen los usuarios.");
            return;
        }

        const supabase = createClient(supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

        const createTestUser = async (email: string, pass: string, roleName: string) => {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password: pass,
                email_confirm: true,
            });

            if (authError) {
                console.error(`Error creando a ${email}:`, authError.message);
                return;
            }

            if (authData?.user) {
                await supabase.from('profiles').update({ role: roleName }).eq('id', authData.user.id);
            }
        };

        const seedGateways = async () => {
            const { error } = await supabase.from('payment_gateways').upsert({
                slug: 'manual_transfer',
                name: 'Transferencia Manual',
                is_active: true,
                config: { instructions: "Datos Bancarios de Prueba E2E" }
            }, { onConflict: 'slug' });
            if (error) console.error('Error insertando gateway de pago:', error.message);
        };

        console.log("🌱 Sembrando datos y usuarios de prueba en Supabase BD...");
        await Promise.all([
            createTestUser(TCLIENT.email, TCLIENT.pass, 'CLIENTE'),
            createTestUser(TADMIN.email, TADMIN.pass, 'ADMIN'),
            createTestUser(TVENDOR.email, TVENDOR.pass, 'PROVEEDOR'),
            seedGateways()
        ]);
    });

    test('Cliente Solicita -> Admin Asigna -> Proveedor Cotiza -> Admin Aprueba -> Cliente Paga', async ({ browser }) => {
        test.setTimeout(120000); // Dar 2 minutos para todo el flujo

        // -------------------------------------------------------------
        // FASE 1: CLIENTE SOLICITA COTIZACIÓN
        // -------------------------------------------------------------
        const clientContext = await browser.newContext();
        const clientPage = await clientContext.newPage();

        // 🚨 ATRAPAR LOGS Y CRASHES DEL NAVEGADOR (CLIENT-SIDE)
        clientPage.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`🖥️ BROWSER [${msg.type().toUpperCase()}]: ${msg.text()}`);
            }
        });
        clientPage.on('pageerror', exception => {
            console.log(`💥 BROWSER UNCAUGHT EXCEPTION: ${exception.message}`);
        });

        let adminContext;
         
        let adminPage: any;
        let vendorContext;
         
        let vendorPage: any;

        await test.step('1. Cliente Login', async () => {
            test.setTimeout(180000); // 3 minutos para que no falle antes de la Fase 4
            console.log(`Logueando como cliente: ${TCLIENT.email}`);
            await clientPage.goto('/login');

            // 🔥 FIX CRÍTICO: NextJs App Router + Suspense tarda en atachar los EventListeners (onSubmit, onChange)
            // Si Playwright dispara Enter o fill antes de que React despierte, el navegador hace un Native Form GET y recarga la página.
            await clientPage.waitForTimeout(3000);

            // Evade el borrado fantasma del estado de React con tipeo humano y reintento
            await clientPage.locator('#email').waitFor({ state: 'visible' });

            // Esperar que la red esté ociosa para evitar colisión con la recarga de Sesión (useEffect del Login)
            await clientPage.waitForLoadState('networkidle');

            // Selectores semánticos que garantizan interacción humana
            const emailInput = clientPage.getByLabel('Correo electrónico');
            const passwordInput = clientPage.getByLabel('Contraseña');
             
            const submitButton = clientPage.getByRole('button', { name: 'Iniciar Sesión' });

            await emailInput.click();
            await clientPage.keyboard.type(TCLIENT.email, { delay: 20 });

            await passwordInput.click();
            await clientPage.keyboard.type(TCLIENT.pass, { delay: 20 });

            // Diagnóstico Extremo DOM
            const domState = await clientPage.evaluate(() => {
                const elEmail = document.querySelector('#email') as HTMLInputElement;
                const elPass = document.querySelector('#password') as HTMLInputElement;
                const form = document.querySelector('form');
                return {
                    emailValue: elEmail?.value,
                    passValue: elPass?.value,
                    emailDisabled: elEmail?.disabled,
                    formValid: form?.checkValidity()
                };
            });
            console.log("🕵️ ESTADO VITAL DEL DOM ANTES DEL SUBMIT:", domState);

            // Acción en Forma de Submit Nativo
            await clientPage.keyboard.press('Enter');

            try {
                await clientPage.waitForURL('/client', { timeout: 15000 });

                // Lidiar con el Onboarding Modal si aparece (no bloqueante)
                try {
                    const btnOmitir = clientPage.getByRole('button', { name: 'Omitir' });
                    await btnOmitir.waitFor({ state: 'visible', timeout: 3000 });
                    await btnOmitir.click();
                 
                } catch (e) {
                    console.log("No detectó Modal de Onboarding, continuando...");
                }

                // Verificar que el dashboard cargó (buscamos texto seguro como "Cliente" o el título del header)
                await expect(clientPage.getByRole('heading', { level: 1 }).filter({ hasText: /días|tardes|noches|Dashboard/i })).toBeVisible({ timeout: 10000 });

                // -------------------------------------------------------------
                // FASE 1B: CLIENTE CREA SOLICITUD
                // -------------------------------------------------------------
                console.log("Creando nueva solicitud en QuoteWizard...");
                await clientPage.getByRole('link', { name: /Nueva Solicitud|Cotizar mi Evento/ }).first().click();
                await clientPage.waitForURL('**/quotations/request**');

                // Step 1: Identidad
                await clientPage.getByLabel('Nombre Completo').fill('Cliente Test Automatizado');
                await clientPage.getByLabel('RUT Empresa/Persona').fill('19000000-1'); // Valid Modulo 11 RUT
                await clientPage.getByLabel('Email Corporativo').fill(TCLIENT.email);
                await clientPage.getByLabel('Teléfono de Contacto').fill('+56991234567'); // Valid Chilean Phone format
                await clientPage.getByRole('button', { name: 'Siguiente' }).click();

                // Step 2: Requerimiento
                await clientPage.getByLabel('Tipo de Servicio').selectOption('audio');
                await clientPage.getByLabel('Fecha del Evento').fill('2028-12-31');
                await clientPage.getByLabel('Detalles Técnicos').fill('Prueba E2E automatizada de sonido para 500 personas.');
                // Bypass animation wait by ensuring the button is actionable
                const btnSiguiente = clientPage.getByRole('button', { name: 'Siguiente' });
                await btnSiguiente.waitFor({ state: 'visible' });
                await clientPage.waitForTimeout(500); // Dar respiro a la animación de Framer Motion
                await btnSiguiente.click();

                // Step 3: Logística
                await clientPage.getByPlaceholder('Av. Costanera Sur 2710, Santiago').fill('Av E2E Testing 1234, Santiago');
                // Los time inputs ya tienen defaultValues (10:00, 20:00, etc) en el código, no es urgente rellenarlos.

                const btnFinalizar = clientPage.getByRole('button', { name: 'Finalizar Cotización' });
                await btnFinalizar.waitFor({ state: 'visible' });
                await clientPage.waitForTimeout(500);
                await btnFinalizar.click();

                // Esperar pantalla de Éxito o Redirección a success
                await clientPage.waitForURL('**/quotations/success**', { timeout: 10000 });
                await expect(clientPage.getByText(/¡Solicitud Recibida!/i).first()).toBeVisible({ timeout: 10000 });
                console.log("✅ Cotización solicitada exitosamente por el Cliente.");

                // -------------------------------------------------------------
                // FASE 2: ADMIN ASIGNA LA COTIZACIÓN AL PROVEEDOR
                // -------------------------------------------------------------
                console.log("Iniciando sesión como Admin en un nuevo contexto...");

                adminContext = await browser.newContext();
                adminPage = await adminContext.newPage();

                // Escuchar errores del lado del cliente Admin
                 
                adminPage.on('console', (msg: any) => {
                    if (msg.type() === 'error' || msg.type() === 'warning') {
                        console.log(`🖥️ ADMIN-BROWSER [${msg.type().toUpperCase()}]: ${msg.text()}`);
                    }
                });
                 
                adminPage.on('pageerror', (exception: any) => {
                    console.log(`💥 ADMIN-BROWSER UNCAUGHT EXCEPTION: ${exception.message}`);
                });

                await adminPage.goto('/login');
                await adminPage.waitForTimeout(2000); // Wait for React Auth Hydration

                await adminPage.getByLabel('Correo Electrónico').fill(TADMIN.email);
                await adminPage.getByLabel('Contraseña', { exact: true }).fill(TADMIN.pass);
                await adminPage.keyboard.press('Enter');

                // Asegurar que admin entró al panel
                await adminPage.waitForURL('**/admin**', { timeout: 15000 });
                console.log("Admin logueado. Buscando cotización en panel...");

                // Navegar a la tabla de cotizaciones si no está ahí por defecto
                await adminPage.goto('/admin/quotations');
                await adminPage.waitForTimeout(2000);

                // Localizar la fila del cliente recién automatizado buscando por su Email (garantizado de existir)
                const quotationRow = adminPage.getByRole('row').filter({ hasText: new RegExp(TCLIENT.email, 'i') }).first();
                await expect(quotationRow).toBeVisible({ timeout: 10000 });

                // Click en botón Asignar
                await quotationRow.getByRole('button', { name: /Asignar Proveedor/i }).click();

                // Esperar a que carguen los proveedores en el combobox
                const providerSelect = quotationRow.getByRole('combobox');
                await expect(providerSelect).toBeVisible({ timeout: 10000 });

                // Identificar el "value" del option que contiene el email del Proveedor de prueba
                const vendorValue = await providerSelect.evaluate((select: HTMLSelectElement, email: string) => {
                    const opt = Array.from(select.options).find(o => o.text.includes(email));
                    return opt ? opt.value : null;
                }, TVENDOR.email);

                if (!vendorValue) throw new Error("No se encontró al proveedor automatizado en la lista.");

                // Seleccionar al Proveedor
                await providerSelect.selectOption(vendorValue);

                // Esperar el Toast de éxito de asignación
                await expect(adminPage.getByText(/Proveedor asignado y cotización enviada/i)).toBeVisible({ timeout: 15000 });
                console.log("✅ Admin asignó la cotización al Proveedor exitosamente.");

                // Cerramos ventana de admin temporalmente para dar paso al proveedor
                await adminContext.close();

                // -------------------------------------------------------------
                // FASE 3: PROVEEDOR RECIBE Y COTIZA (BID)
                // -------------------------------------------------------------
                vendorContext = await browser.newContext();
                vendorPage = await vendorContext.newPage();

                // Escuchar errores del lado del vendor
                 
                vendorPage.on('console', (msg: any) => {
                    if (msg.type() === 'error' || msg.type() === 'warning') {
                        console.log(`🖥️ VENDOR-BROWSER [${msg.type().toUpperCase()}]: ${msg.text()}`);
                    }
                });
                 
                vendorPage.on('pageerror', (exception: any) => {
                    console.log(`💥 VENDOR-BROWSER EXCEPTION: ${exception.message}`);
                });

                await vendorPage.goto('/login');
                await vendorPage.waitForTimeout(2000);

                await vendorPage.getByLabel('Correo Electrónico').fill(TVENDOR.email);
                await vendorPage.getByLabel('Contraseña', { exact: true }).fill(TVENDOR.pass);
                await vendorPage.keyboard.press('Enter');

                await vendorPage.waitForURL('**/vendor**', { timeout: 15000 });
                console.log("Proveedor logueado. Buscando solicitud...");

                await vendorPage.goto('/vendor/quotations');
                await vendorPage.waitForTimeout(2000);

                // Hacer click en "Cotizar Proyecto"
                const btnCotizar = vendorPage.getByRole('button', { name: /Cotizar Proyecto/i }).first();
                await expect(btnCotizar).toBeVisible({ timeout: 10000 });
                await btnCotizar.click();

                // Formulario de Cotización del Proveedor:
                // Según ProviderQuotationForm.tsx, hay Inputs numéricos genéricos sin Label estricto,
                // usaremos la indexación de Number Inputs:
                // [0] = Cantidad Ítem Servicio (default 1)
                // [1] = Precio Unitario Servicio (placeholder 0)
                // [2] = Precio Unitario Logística (placeholder 0)
                // [3] = Días Entrega (default 3)

                const numInputs = vendorPage.locator('input[type="number"]');

                // Llenamos la Descripción de Servicio
                await vendorPage.getByPlaceholder('Ej: Pendón Led P 1.8').fill('Sistema Line Array Automatizado');
                await numInputs.nth(1).fill('150000'); // Precio Servicio

                // Llenamos Descripción de Logística
                await vendorPage.getByPlaceholder('Ej: Transporte Ida').fill('Transporte Equipos Nocturno');
                await numInputs.nth(2).fill('35000'); // Precio Logística

                // Click Enviar Cotización
                await vendorPage.getByRole('button', { name: /Enviar Cotización al Administrador/i }).click();

                // Verificar exito de Cotización de Proveedor
                await expect(vendorPage.getByText(/Cotización enviada al administrador/i)).toBeVisible({ timeout: 15000 });
                console.log("✅ Proveedor envió la cotización (Bid) exitosamente.");

                // Evitamos cerrar la vendorPage para que Playwright trace/screenshot funcione si hay timeout final
                // =========================================================================
                // PHASE 4: ADMINISTRATOR APPROVAL & PROFIT MARGIN 
                // =========================================================================
                console.log("\\n👩‍💼 Fase 4: Administrador Revisa Bid, Aprueba Margen y Envía a Cliente...");

                adminContext = await browser.newContext();
                adminPage = await adminContext.newPage();
                await adminPage.goto('/login');
                await adminPage.waitForTimeout(3000);
                await adminPage.screenshot({ path: 'DEBUG_ADMIN_LOGIN.png' });

                // Intento robusto
                const adminEmailInput = adminPage.locator('input[type="email"]').first();
                await adminEmailInput.waitFor({ state: 'visible', timeout: 15000 });
                await adminEmailInput.fill(TADMIN.email);

                await adminPage.locator('input[type="password"]').first().fill(TADMIN.pass);
                await adminPage.locator('button[type="submit"]').first().click();
                await expect(adminPage).toHaveURL(/.*\/admin.*/, { timeout: 20000 });

                console.log("Admin reingresado. Buscando cotización en panel de control...");
                await adminPage.goto('/admin/quotations');

                // En la tabla, la cotización ya debe estar enlistada para revisión.
                // Buscar el icono Eye para entrar al detalle usando la row del Cliente:
                const adminReviewRow = adminPage.getByRole('row', { name: new RegExp(TCLIENT.email, 'i') }).first();
                await expect(adminReviewRow).toBeVisible();

                // Hacer clic en el enlace/Ojo para ver el detalle. El botón Eye tiene asChild <Link href="/admin/quotations/[id]" ...
                const viewDetailBtn = adminReviewRow.locator('a[href*="/admin/quotations/"]').first();
                await viewDetailBtn.click();

                // Esperamos que cargue la vista de Review 
                await expect(adminPage.getByText(/📦 Desglose del Proveedor/i)).toBeVisible({ timeout: 15000 });
                console.log("✅ Panel Financiero Abierto.");

                // Hacemos click en "Auto-generar con comisión"
                await adminPage.getByRole('button', { name: /Auto-generar con comisión/i }).click();

                // Esperamos el toast que dice "Líneas generadas automáticamente con comisión incluida"
                await expect(adminPage.getByText(/Líneas generadas automáticamente/i)).toBeVisible();

                // Hacemos click en "Enviar al Cliente"
                const sendClientBtn = adminPage.getByRole('button', { name: /Enviar al Cliente/i });
                await sendClientBtn.scrollIntoViewIfNeeded();
                await sendClientBtn.click();

                // Esperamos el Success Toast final
                await expect(adminPage.getByText(/Cotización enviada al cliente/i)).toBeVisible({ timeout: 20000 });

                // CRÍTICO: Esperamos que la DB y el router redirijan al admin a la tabla general
                // Esto garantiza que el Update en fase 4 terminó y salvó `priceTotal`
                await expect(adminPage).toHaveURL(/.*\/admin\/quotations$/, { timeout: 15000 });
                console.log("🚀 Fase 4 Completada: ¡Oferta lanzada al cliente exitosamente!");
                // =========================================================================
                // PHASE 5: CLIENT PAYMENT & ORDER CONFIRMATION
                // =========================================================================
                console.log("\\n💳 Fase 5: Cliente Aprueba Presupuesto Final y Realiza el Checkout...");

                await adminPage.close();

                // El cliente vuelve a ingresar
                const finalClientContext = await browser.newContext();
                const finalClientPage = await finalClientContext.newPage();

                await finalClientPage.goto('/login');
                await finalClientPage.waitForTimeout(2000);

                const finalEmailInput = finalClientPage.locator('input[type="email"]').first();
                await finalEmailInput.waitFor({ state: 'visible' });
                await finalEmailInput.fill(TCLIENT.email);

                await finalClientPage.locator('input[type="password"]').first().fill(TCLIENT.pass);
                await finalClientPage.locator('button[type="submit"]').first().click();

                await expect(finalClientPage).toHaveURL(/.*\/client.*/, { timeout: 15000 });
                console.log("Cliente re-logueado.");

                // Navega a sus cotizaciones
                await finalClientPage.goto('/client/quotations');

                // Nos aseguramos que al menos un link de detalle exista (nuestra cotizacion)
                const detalleLink = finalClientPage.locator('a[href*="/client/quotations/"]').first();
                await expect(detalleLink).toBeVisible({ timeout: 15000 });

                // Clic en Ver Cotización
                await detalleLink.click();

                // Espera a que cargue el ClientQuotationDetail
                await expect(finalClientPage.getByText(/Detalle de la Cotización/i).first()).toBeVisible({ timeout: 15000 });

                // Hace click en Aprobar y Pagar (Checkout simulado)
                // Ojo: Esperamos a que el componente PaymentSelector cargue de la API
                // Sacamos captura visual antes de que falle el test para entender en qué estado está el Frontend
                await finalClientPage.screenshot({ path: 'DEBUG_CLIENT_PAYMENT.png' });

                // Hacemos scroll hacia abajo para garantizar que carguen los elementos "Lazy-load" si los hubiera
                await finalClientPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                // Volvemos a ubicar el bloque
                 
                const sectionPago = finalClientPage.getByText(/Propuesta Económica/i).first();
                // Hacemos scroll hacia abajo de forma dramática y esperamos 1 segundo antes de la aserción
                await finalClientPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await finalClientPage.waitForTimeout(2000); // 2 segundos critical para hydration del fetch
                await finalClientPage.screenshot({ path: 'DEBUG_CLIENT_PAYMENT2.png', fullPage: true });

                console.log(`\n💳 Fase 5: Diagnóstico Interno de la API Gateways...`);
                try {
                    const apiRes = await finalClientPage.request.get('/api/payments/gateways');
                    const apiData = await apiRes.json();
                    console.log("🕵️ PRUEBA API GATEWAYS E2E DEVOLVIÓ:", apiData);
                } catch (e) { console.error("Fallo Fetch Test a /api/payments/gateways:", e); }

                // La UI ahora sÃ­ muestra 'MÃ©todo de pago' y las etiquetas
                const labelMethod = finalClientPage.getByText('Método de pago', { exact: false }).first();
                await labelMethod.waitFor({ state: 'attached', timeout: 15000 });
                await labelMethod.scrollIntoViewIfNeeded();

                // Seleccionar un MÃ©todo de Pago (Transferencia Manual) antes de proceder
                const manualTransferDiv = finalClientPage.getByText('Transferencia Manual', { exact: false }).first();
                await manualTransferDiv.waitFor({ state: 'visible', timeout: 5000 });
                await manualTransferDiv.click();

                // Oprimir botÃ³n final
                const payButton = finalClientPage.getByRole('button', { name: /Aprobar y Pagar/i }).first();
                await expect(payButton).toBeVisible();
                await payButton.click();

                // Esperamos el toast que diga Éxito o el re-enrutamiento
                await expect(finalClientPage.getByText(/exitoso|pago/i).first()).toBeVisible({ timeout: 15000 });

                console.log("🎉 EL GOLDEN FLOW SE HA COMPLETADO EL 100%");
                await finalClientPage.close();

            } catch (err) {
                // Capturar visual...
                await clientPage.screenshot({ path: 'playwright-client-error.png' }).catch(() => { });
                if (typeof adminPage !== 'undefined') {
                    await adminPage.screenshot({ path: 'playwright-admin-error.png' }).catch(() => { });
                }
                if (typeof vendorPage !== 'undefined') {
                    await vendorPage.screenshot({ path: 'playwright-vendor-error.png' }).catch(() => { });

                    // Extraer textos de error de los toasts en la página del proveedor
                    const vendorErrors = await vendorPage.evaluate(() => {
                        const toasts = Array.from(document.querySelectorAll('[data-sonner-toast]'));
                        return toasts.map(t => t.textContent).join(' | ') || 'No toasts visibles';
                    }).catch(() => 'Error leyendo error');
                    console.error("💥 VENDOR Toasts de Error:", vendorErrors);

                    // Extraer los valores de los subtotales para ver si se registró bien el cálculo
                    const TotalsData = await vendorPage.evaluate(() => {
                        const el = document.body;
                        return el ? el.innerText.substring(el.innerText.length - 300) : 'Body en blanco';
                    }).catch(() => 'Error leyendo dom');
                    console.log("📊 VENDOR Final Screen text tail:", TotalsData);
                }
                console.error("💥 TEST CAUGHT: Timeout or Assert Error en la fase", err);
                throw err;
            }
        });

        // Cerramos
        await clientContext.close();
    });
});
