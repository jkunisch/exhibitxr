'use client';

import React, { useState, useMemo } from 'react';

interface RoiCalculatorProps {
  industryName: string;
  defaultSkuCount?: number;
}

export default function RoiCalculator({ industryName, defaultSkuCount = 10 }: RoiCalculatorProps) {
  const [skuCount, setSkuCount] = useState(defaultSkuCount);
  
  // Algorithmus: Vergleich klassische Agentur vs. 3D-Snap
  // Agentur: ca. 800€ - 1500€ pro Modell, 2 Wochen Zeit
  // 3D-Snap: ca. 1€ - 10€ pro Modell (Credits), 60 Sekunden Zeit
  
  const stats = useMemo(() => {
    const agencyCostPerSku = 1200;
    const snapCostPerSku = 5; // Durchschnittlicher Credit-Wert
    
    const agencyTimePerSku = 14; // Tage
    const snapTimePerSku = 1 / 1440; // 1 Minute in Tagen
    
    return {
      agencyTotal: skuCount * agencyCostPerSku,
      snapTotal: skuCount * snapCostPerSku,
      savings: skuCount * (agencyCostPerSku - snapCostPerSku),
      timeSaved: Math.round(skuCount * agencyTimePerSku),
    };
  }, [skuCount]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">ROI Kalkulator für {industryName}</h3>
        <p className="text-sm text-zinc-500">Berechnen Sie Ihr Einsparungspotenzial im Vergleich zur herkömmlichen Modellierung.</p>
      </div>

      <div className="space-y-6 mb-10">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-zinc-300">Anzahl der Produkte (SKUs)</label>
            <span className="text-white font-bold">{skuCount}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="500" 
            value={skuCount}
            onChange={(e) => setSkuCount(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-black/40 rounded-xl border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-tighter mb-1">Kosten Agentur</p>
          <p className="text-2xl font-light text-red-500/80">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.agencyTotal)}
          </p>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-zinc-400 uppercase tracking-tighter mb-1">Kosten 3D-Snap</p>
          <p className="text-2xl font-bold text-green-400">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.snapTotal)}
          </p>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Gesamtersparnis</p>
            <p className="text-3xl font-black text-white">
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.savings)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">Zeitvorteil</p>
            <p className="text-xl font-bold text-zinc-200">~{stats.timeSaved} Tage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
