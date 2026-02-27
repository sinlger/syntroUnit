"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { History } from "lucide-react"

interface HistoryItem {
  fromVal: string
  fromUnitId?: string
  fromUnitName: string
  fromSymbol: string
  toVal: string
  toUnitId?: string
  toUnitName: string
  toSymbol: string
  timestamp: number
  unitType: string
  unitTypeName: string
}

interface RecentConversionsProps {
  translations?: {
    title?: string
    noHistory?: string
    clearHistory?: string
    equalsHowMany?: string
  }
  unitTranslations?: Record<string, string>
  lang?: string
  unitType?: string
}

export function RecentConversions({ translations = {}, unitTranslations = {}, lang = 'en', unitType }: RecentConversionsProps) {
  const t = {
    title: translations.title || "最近换算",
    noHistory: translations.noHistory || "暂无换算记录",
    equalsHowMany: translations.equalsHowMany || "等于多少"
  }

  const [history, setHistory] = React.useState<HistoryItem[]>([])

  const loadHistory = async () => {
    try {
      const url = unitType ? `/api/recent-conversions?type=${unitType}` : '/api/recent-conversions'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const mapped: HistoryItem[] = data.map((item: any) => ({
          fromVal: item.source_value,
          fromUnitId: item.source_unit,
          fromUnitName: unitTranslations[item.source_unit] || item.source_unit,
          fromSymbol: item.source_unit,
          toVal: item.target_value || '?',
          toUnitId: item.target_unit,
          toUnitName: unitTranslations[item.target_unit] || item.target_unit,
          toSymbol: item.target_unit,
          timestamp: item.last_updated,
          unitType: item.unit_type || '',
          unitTypeName: unitTranslations[item.unit_type] || item.unit_type || ''
        }))
        setHistory(mapped)
      }
    } catch (e) {
      console.error("Failed to load history", e)
    }
  }

  React.useEffect(() => {
    loadHistory()
    
    // Refresh every 30s or on specific events if needed
    const interval = setInterval(loadHistory, 30000)
    return () => clearInterval(interval)
  }, [unitTranslations, unitType])

  // Removed clearHistory functionality as it is now server-side driven

  if (history.length === 0) {
    return (
      <Card className="border-slate-100 dark:border-border shadow-sm bg-background py-0 gap-0">
        <CardHeader className="pb-3 pt-4 border-b border-slate-50 dark:border-border/50">
            <div className="flex items-center gap-2 text-foreground">
                <History className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-bold">{t.title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {t.noHistory}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-100 dark:border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-background overflow-hidden py-3 gap-0">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-border/50 space-y-0 py-3 px-4">
        <div className="flex items-center gap-2 text-foreground">
            <History className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-bold">{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50 dark:divide-border/50">
          {history.map((item, i) => {
             const fromName = (item.fromUnitId && unitTranslations[item.fromUnitId]) || item.fromUnitName || item.fromSymbol
             const toName = (item.toUnitId && unitTranslations[item.toUnitId]) || item.toUnitName || item.toSymbol
             
             return (
             <div key={item.timestamp + i} className="py-3 px-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <a href={`/${lang}/${item.unitType}/${item.fromUnitId}-to-${item.toUnitId}/${item.fromVal}${item.fromUnitId}-to-${item.toUnitId}`} className="block">
                    <p className="text-sm text-foreground font-medium">
                        {item.fromVal} {fromName} {t.equalsHowMany} {toName}？
                    </p>
                </a>
             </div>
             )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
