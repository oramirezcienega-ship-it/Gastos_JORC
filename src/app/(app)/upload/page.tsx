'use client'
import { UploadZone } from '@/components/upload/UploadZone'
import { FileText, Info } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">Subir estado de cuenta</h1>
      <p className="text-gray-500 text-sm mb-6">
        Importa tus movimientos desde PDF o Excel. El sistema extrae las transacciones automáticamente.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-5">
        <UploadZone />
      </div>

      <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400 space-y-1.5">
            <p className="text-indigo-300 font-medium">Formatos soportados</p>
            <p>• <strong className="text-gray-300">PDF</strong> — Estados de cuenta de bancos MX (BBVA, Santander, Banamex, HSBC, Banorte, etc.)</p>
            <p>• <strong className="text-gray-300">Excel / CSV</strong> — Exportaciones de cualquier banco. Columnas requeridas: <code className="text-indigo-300">Fecha, Descripcion, Monto</code></p>
            <p className="text-gray-500 text-xs mt-2">
              Después de subir, el sistema procesa el archivo en segundos. Las transacciones aparecerán en el dashboard.
              Puedes editar, categorizar y asignar a negocios desde la vista de Transacciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
