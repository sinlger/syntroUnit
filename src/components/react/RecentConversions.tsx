"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, History, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HistoryItem {
  fromVal: string
  fromUnitName: string
  fromSymbol: string
  toVal: string
  toUnitName: string
  toSymbol: string
  timestamp: number
  unitType: string
  unitTypeName: string
}

export function RecentConversions() {
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
      <Card className="border-slate-100 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2 text-slate-800">
                <History className="w-4 h-4 text-blue-500" />
                <CardTitle className="text-base font-bold">最近换算</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="py-8 text-center text-slate-400 text-sm">
            暂无换算记录
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-50 space-y-0">
        <div className="flex items-center gap-2 text-slate-800">
            <History className="w-4 h-4 text-blue-500" />
            <CardTitle className="text-base font-bold">最近换算</CardTitle>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearHistory}
            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="清空记录"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {history.map((item, i) => (
             <div key={item.timestamp + i} className="p-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {item.unitTypeName}
                    </span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="flex-1 min-w-0 truncate font-medium">
                        {item.fromVal} <span className="text-slate-500 text-xs font-normal">{item.fromSymbol}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0 truncate font-medium text-right text-blue-600">
                        {item.toVal} <span className="text-blue-400 text-xs font-normal">{item.toSymbol}</span>
                    </div>
                </div>
             </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
