"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { 
  ArrowRight, 
  Ruler, 
  Scale, 
  Square, 
  LayoutGrid, 
  Thermometer, 
  Clock, 
  Zap, 
  Database,
  Box,
  Droplets
} from "lucide-react"

// Automatically load all unit configuration files from src/unit
const unitFiles = import.meta.glob('@/unit/*.json', { eager: true })

// Extract available unit types from filenames
const unitTypes = Object.keys(unitFiles).map((path) => {
  const fileName = path.split('/').pop()?.replace('.json', '')
  return fileName
}).filter(Boolean) as string[]

const iconMap: Record<string, React.ComponentType<any>> = {
  length: Ruler,
  weight: Scale,
  area: Square,
  volume: Box,
  temperature: Thermometer,
  time: Clock,
  speed: Zap,
  digital: Database,
  liquid: Droplets,
  // default
  default: LayoutGrid
}

interface UnitNavigationProps {
  lang: string
  currentUnit?: string
  translations?: Record<string, string>
  title?: string
}

export function UnitNavigation({ lang, currentUnit, translations = {}, title = "更多转换" }: UnitNavigationProps) {
  return (
    <Card className="border-slate-100 dark:border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-background overflow-hidden py-0 gap-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-border/50 space-y-0 py-3 px-4">
        <div className="flex items-center gap-2 text-foreground">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-bold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50 dark:divide-border/50">
          {unitTypes.map((unit) => {
            const isActive = unit === currentUnit
            const displayName = translations[unit] || unit
            const Icon = iconMap[unit] || iconMap.default
            
            return (
              <a 
                key={unit} 
                href={`/${lang}/${unit}`} 
                className={cn(
                  "flex items-center justify-between py-3 px-4 transition-colors group relative",
                  isActive 
                    ? "bg-blue-50/60 dark:bg-blue-900/10 cursor-default pointer-events-none" 
                    : "hover:bg-muted/50 cursor-pointer"
                )}
              >
                 {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                 )}
                 <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                        isActive ? "bg-blue-100 dark:bg-blue-900/30 text-primary" : "bg-muted text-muted-foreground group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-primary"
                    )}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className={cn(
                        "text-sm font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                        {displayName}
                    </span>
                 </div>
                 
                 {!isActive && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                 )}
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
