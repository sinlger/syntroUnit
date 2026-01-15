"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, History, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

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
}

export function RecentConversions({ translations = {}, unitTranslations = {} }: RecentConversionsProps) {
  const t = {
    title: translations.title || "最近换算",
    noHistory: translations.noHistory || "暂无换算记录",
    clearHistory: translations.clearHistory || "清空记录",
    equalsHowMany: translations.equalsHowMany || "等于多少"
  }

  const [history, setHistory] = React.useState<HistoryItem[]>([])

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('conversionHistory')
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load history", e)
    }
  }

  React.useEffect(() => {
    loadHistory()
    
    const handleUpdate = () => loadHistory()
    window.addEventListener('conversion-history-updated', handleUpdate)
    return () => window.removeEventListener('conversion-history-updated', handleUpdate)
  }, [])

  const clearHistory = () => {
    localStorage.removeItem('conversionHistory')
    setHistory([])
    window.dispatchEvent(new Event('conversion-history-updated'))
  }

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
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearHistory}
            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title={t.clearHistory}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50 dark:divide-border/50">
          {history.map((item, i) => {
             const fromName = (item.fromUnitId && unitTranslations[item.fromUnitId]) || item.fromUnitName || item.fromSymbol
             const toName = (item.toUnitId && unitTranslations[item.toUnitId]) || item.toUnitName || item.toSymbol
             
             return (
             <div key={item.timestamp + i} className="py-3 px-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <p className="text-sm text-foreground font-medium">
                    {item.fromVal} {fromName} {t.equalsHowMany} {toName}？
                </p>
             </div>
             )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
