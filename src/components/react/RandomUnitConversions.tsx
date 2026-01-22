"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Unit {
  id: string
  symbol: string
  ratio: number
  name?: string
}

export interface UnitGroup {
  group_id: string
  name?: string
  units: Unit[]
}

interface RandomUnitConversionsProps {
  data: {
    groups?: UnitGroup[]
    units?: UnitGroup[]
  }
  unitType: string
  lang: string
  translations?: Record<string, string>
  title?: string
  conversionFormat?: string
}

export function RandomUnitConversions({ 
  data, 
  unitType, 
  lang, 
  translations = {}, 
  title = "随机转换", 
  conversionFormat = "{source} to {target}" 
}: RandomUnitConversionsProps) {
  const groups = React.useMemo(() => (Array.isArray(data) ? data : data.groups || []), [data])
  const allUnits = React.useMemo(() => groups.flatMap((g) => g.units || []).filter(u => u && u.id), [groups])

  // Simple seeded random function to ensure server/client consistency
  const seededRandom = React.useCallback((seed: number) => {
    const m = 0x80000000;
    const a = 1103515245;
    const c = 12345;
    let state = seed ? seed : Math.floor(Math.random() * (m - 1));
    return function() {
        state = (a * state + c) % m;
        return state / (m - 1);
    }
  }, []);

  // Generate 20 random conversion pairs
  const randomPairs = React.useMemo(() => {
    if (allUnits.length < 2) return []
    
    // Create a seed based on unitType string
    let seed = 0;
    for (let i = 0; i < unitType.length; i++) {
        seed = ((seed << 5) - seed) + unitType.charCodeAt(i);
        seed |= 0;
    }
    const rand = seededRandom(Math.abs(seed));

    const pairs: { source: Unit, target: Unit }[] = []
    const seen = new Set<string>()
    
    while (pairs.length < 20) {
      const source = allUnits[Math.floor(rand() * allUnits.length)]
      const target = allUnits[Math.floor(rand() * allUnits.length)]
      
      if (source.id !== target.id) {
        const key = `${source.id}-${target.id}`
        if (!seen.has(key)) {
          seen.add(key)
          pairs.push({ source, target })
        }
      }
      
      // Safety break to prevent infinite loops if few units
      if (seen.size >= allUnits.length * (allUnits.length - 1)) break
    }
    
    return pairs
  }, [allUnits, unitType, seededRandom])

  if (randomPairs.length === 0) return null

  return (
    <Card className="border-slate-100 dark:border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-background overflow-hidden py-0 gap-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-border/50 space-y-0 py-3 px-4">
        <div className="flex items-center gap-2 text-foreground">
            <Shuffle className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-bold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-50 dark:bg-border/50">
          {randomPairs.map(({ source, target }) => {
            const sourceName = translations[source.id] || source.name || source.id
            const targetName = translations[target.id] || target.name || target.id
            const linkText = conversionFormat
              .replace('{source}', sourceName)
              .replace('{target}', targetName)
            
            return (
              <a 
                key={`${source.id}-${target.id}`}
                href={`/${lang}/${unitType}/${source.id}-to-${target.id}`}
                className="flex items-center justify-between py-3 px-4 transition-colors group hover:bg-muted/50 cursor-pointer bg-background"
              >
                 <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {linkText} <span className="text-xs opacity-70 ml-1">({source.symbol}-to-{target.symbol})</span>
                    </span>
                 </div>
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
