/**
 * SettingsPage - Paramètres de l'établissement
 */

import { Settings, Building2, Palette, Database } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export default function SettingsPage() {
  const { business, modules } = useBusiness();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
          <Settings className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="text-slate-400">Configuration de l'établissement</p>
        </div>
      </div>

      {/* Business Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Établissement</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Nom</label>
            <p className="text-white">{business?.name || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-slate-400">Devise</label>
            <p className="text-white">{business?.currency || 'EUR'}</p>
          </div>
          <div>
            <label className="text-sm text-slate-400">ID Business</label>
            <p className="text-slate-500 font-mono text-sm">{business?.id}</p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Modules activés</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(modules).map(([key, value]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border ${
                value
                  ? 'bg-emerald-600/10 border-emerald-600/50 text-emerald-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-500'
              }`}
            >
              <span className="capitalize font-medium">{key}</span>
              <span className="ml-2">{value ? '✓' : '✗'}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Les modules sont configurés dans la table `businesses` (colonne JSONB `modules`).
        </p>
      </div>

      {/* Design */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Design System</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Thème actuel : <span className="text-white font-medium">Midnight Luxe</span>
        </p>
        <div className="mt-4 flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-resto" title="Resto"></div>
          <div className="w-10 h-10 rounded-lg bg-hotel" title="Hotel"></div>
          <div className="w-10 h-10 rounded-lg bg-sommelier" title="Sommelier"></div>
          <div className="w-10 h-10 rounded-lg bg-danger" title="Danger"></div>
        </div>
      </div>
    </div>
  );
}
