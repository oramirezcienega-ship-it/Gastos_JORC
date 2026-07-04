'use client'
import { UploadZone } from '@/components/upload/UploadZone'
import { Info, Download } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">Subir estado de cuenta</h1>
      <p className="text-gray-500 text-sm mb-6">
        Importa tus movimientos desde Excel o PDF.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-5">
        <UploadZone />
      </div>

      {/* Template download */}
      <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 font-medium text-sm mb-1">Plantilla Excel (recomendado)</p>
            <p className="text-gray-400 text-xs mb-3">
              Usa esta plantilla para garantizar que el sistema lea tus datos correctamente.
              Copia tus movimientos del banco y pégalos en las columnas indicadas.
            </p>
            <a
              href="/plantilla-gastos.xlsx"
              download
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar plantilla
            </a>
          </div>
        </div>
      </div>

      {/* Format info */}
      <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400 space-y-2">
            <p className="text-indigo-300 font-medium">Columnas requeridas en el Excel</p>
            <table className="w-full text-xs border-separate border-spacing-y-1">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left pr-4">Columna</th>
                  <th className="text-left pr-4">Formato</th>
                  <th className="text-left">Ejemplo</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr>
                  <td className="pr-4 font-mono text-indigo-300">Fecha</td>
                  <td className="pr-4">DD/MM/AAAA</td>
                  <td>01/06/2026</td>
                </tr>
                <tr>
                  <td className="pr-4 font-mono text-indigo-300">Descripcion</td>
                  <td className="pr-4">Texto libre</td>
                  <td>OXXO Gasolina</td>
                </tr>
                <tr>
                  <td className="pr-4 font-mono text-indigo-300">Monto</td>
                  <td className="pr-4">Número positivo</td>
                  <td>500.00</td>
                </tr>
                <tr>
                  <td className="pr-4 font-mono text-indigo-300">Tipo</td>
                  <td className="pr-4 text-gray-500">Opcional</td>
                  <td className="text-gray-500">gasto / ingreso / inversion</td>
                </tr>
              </tbody>
            </table>
            <p className="text-gray-600 text-xs pt-1">
              PDF también soportado — funciona con la mayoría de bancos MX (BBVA, Santander, Banamex, Banorte).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
