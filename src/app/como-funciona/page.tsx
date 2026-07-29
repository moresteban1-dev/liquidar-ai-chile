import type { Metadata } from 'next';
import { Search, UserCheck, TrendingUp, PackageCheck, Shield, CreditCard, Truck, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cómo Funciona — Liquidar Platform Chile',
  description:
    'Aprende cómo funciona Liquidar Platform. Registra tu RUT, explora lotes, puja con Proxy Bid y recibe en tu región de Chile.',
};

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Explora Lotes Disponibles',
    description:
      'Navega cientos de lotes de liquidación organizados por categoría. Electrónica, ropa, muebles, herramientas y más, provenientes directamente de Falabella, Ripley, Paris, Lider, Sodimac y Corona.',
    details: [
      'Filtra por categoría, precio y región',
      'Ve el tiempo restante en tiempo real',
      'Compara precios con el precio de lista original',
      'Lee la descripción detallada de cada lote',
    ],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    number: '02',
    icon: UserCheck,
    title: 'Regístrate con tu RUT',
    description:
      'Crea tu cuenta en menos de 2 minutos. Solo necesitas tu RUT chileno, nombre, email y contraseña. Verificamos tu identidad para garantizar la seguridad de la plataforma.',
    details: [
      'Ingresa tu RUT con validación automática',
      'Confirma tu email con un código',
      'Agrega tu dirección de envío',
      'Listo para pujar',
    ],
    color: 'from-amber-500 to-orange-600',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Puja con Proxy Bid',
    description:
      'Define tu precio máximo y el sistema pujará automáticamente hasta ese monto. No necesitas estar frente a la pantalla. Si alguien supera tu máximo, te notificamos por email para que puedas subir tu puja.',
    details: [
      'Ingresa el máximo que estás dispuesto a pagar',
      'El sistema puja por ti automáticamente',
      'Recibes notificación si te superan',
      'Puedes subir tu máximo en cualquier momento',
    ],
    color: 'from-emerald-500 to-teal-600',
  },
  {
    number: '04',
    icon: PackageCheck,
    title: 'Gana, Paga y Recibe',
    description:
      'Si ganas, tienes 48 horas para completar el pago. Acepta Transbank WebpayPlus, Khipu (transferencia automática) o transferencia bancaria manual. Luego coordinamos el envío a tu región.',
    details: [
      'Paga con Transbank, Khipu o transferencia',
      'Coordina retiro o envío a tu región',
      'Sigue el estado en tu dashboard',
      'Garantía de autenticidad del lote',
    ],
    color: 'from-purple-500 to-violet-600',
  },
];

const FAQS = [
  {
    q: '¿Qué es un Proxy Bid?',
    a: 'Es una puja automática. Defines el máximo que pagarías y el sistema incrementa tu puja automáticamente cuando alguien te supera, siempre hasta tu límite. Así no tienes que estar pendiente en todo momento.',
  },
  {
    q: '¿Cuál es el incremento mínimo de puja?',
    a: 'Cada lote tiene un incremento mínimo definido por el vendedor, generalmente entre $1.000 y $50.000 CLP, dependiendo del valor del lote.',
  },
  {
    q: '¿Cómo pago si gano un lote?',
    a: 'Tienes 48 horas para pagar. Aceptamos Transbank WebpayPlus (tarjetas débito/crédito), Khipu (transferencia bancaria automática) y transferencia manual a los bancos más comunes de Chile.',
  },
  {
    q: '¿Los lotes llegan a mi región?',
    a: 'Sí, hacemos envíos a las 16 regiones de Chile. El costo varía según la distancia desde el punto de origen del lote.',
  },
  {
    q: '¿Qué pasa si el lote no está como se describía?',
    a: 'Tenemos un proceso de disputa. Si el lote tiene diferencias significativas respecto a la descripción, puedes reportarlo y evaluamos cada caso individualmente.',
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Guía completa</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">¿Cómo Funciona Liquidar?</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            En 4 pasos simples consigues increíbles descuentos en lotes de liquidación de los mejores retailers de Chile.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-20">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="bg-card border border-white/8 rounded-2xl p-6 md:p-8 hover:border-white/15 transition-colors"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                    <step.icon className="w-7 h-7 text-white" aria-hidden="true" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-muted-foreground tracking-widest">PASO {step.number}</span>
                  </div>
                  <h2 className="text-white font-bold text-xl mb-3">{step.title}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">{step.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-white/70">
                        <span className="text-amber-400 mt-0.5 flex-shrink-0">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Métodos de Pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: CreditCard,
                name: 'Transbank WebpayPlus',
                desc: 'Tarjetas de débito y crédito. Visa, Mastercard, Redcompra.',
                badge: 'Principal',
                color: 'text-blue-400',
              },
              {
                icon: TrendingUp,
                name: 'Khipu',
                desc: 'Transferencia bancaria automática. Rápido y seguro.',
                badge: 'Popular',
                color: 'text-emerald-400',
              },
              {
                icon: Truck,
                name: 'Transferencia Manual',
                desc: 'Banco Estado, Santander, BCI, Scotiabank. Verificación en 24h.',
                badge: 'Alternativa',
                color: 'text-amber-400',
              },
            ].map((method) => (
              <div
                key={method.name}
                className="bg-card border border-white/8 rounded-2xl p-5 text-center hover:border-white/15 transition-colors"
              >
                <method.icon className={`w-8 h-8 ${method.color} mx-auto mb-3`} aria-hidden="true" />
                <div className="text-white font-semibold mb-1">{method.name}</div>
                <div className="text-muted-foreground text-xs">{method.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-400" aria-hidden="true" />
            Preguntas Frecuentes
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-card border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-colors"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-white font-medium select-none list-none">
                  {faq.q}
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform duration-200 text-xl font-light flex-shrink-0 ml-4">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-white/5">
                  <p className="pt-3">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-br from-amber-900/30 to-orange-900/20 border border-amber-500/20 rounded-2xl p-10">
          <Shield className="w-10 h-10 text-amber-400 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-white font-bold text-2xl mb-2">¿Listo para empezar?</h3>
          <p className="text-muted-foreground mb-6">Regístrate gratis y accede a cientos de lotes de liquidación.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/registro"
              className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors"
            >
              Crear cuenta gratis
            </a>
            <a
              href="/subastas"
              className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold rounded-xl transition-colors"
            >
              Ver subastas activas
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
