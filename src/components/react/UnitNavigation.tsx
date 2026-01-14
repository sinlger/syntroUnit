"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

// Automatically load all unit configuration files from src/unit
const unitFiles = import.meta.glob('@/unit/*.json', { eager: true })

// Extract available unit types from filenames
const unitTypes = Object.keys(unitFiles).map((path) => {
  // Extract filename without extension (e.g., "length" from "/src/unit/length.json")
  const fileName = path.split('/').pop()?.replace('.json', '')
  return fileName
}).filter(Boolean) as string[]

interface UnitNavigationProps {
  lang: string
  currentUnit?: string
  translations?: Record<string, string>
}

export function UnitNavigation({ lang, currentUnit, translations = {} }: UnitNavigationProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {unitTypes.map((unit) => {
        const isActive = unit === currentUnit
        const displayName = translations[unit] || unit
        
        return (
          <a 
            key={unit} 
            href={`/${lang}/${unit}`} 
            className="group block outline-none"
          >
            <Card className={cn(
              "h-full transition-all duration-200 hover:shadow-md border-slate-200",
              isActive 
                ? "bg-blue-600 border-blue-600 text-white shadow-blue-200" 
                : "bg-white hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
            )}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <span className={cn(
                  "font-bold text-sm sm:text-base capitalize truncate",
                  isActive ? "text-white" : "text-slate-700 group-hover:text-blue-700"
                )}>
                  {displayName}
                </span>
                
                {!isActive && (
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                )}
              </CardContent>
            </Card>
          </a>
        )
      })}
    </div>
  )
}
