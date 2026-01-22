"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table as TableIcon, Calculator, ArrowRight } from "lucide-react"
import { getConverter, type Unit } from "@/lib/converter"
import { useTranslations } from "@/i18n/utils"
import { getFormulaText } from "@/lib/formulas"

interface ConversionTableProps {
  sourceUnit: Unit
  targetUnit: Unit
  lang: string
  translations?: Record<string, string>
  title?: string
  format?: string // "{value} {unit} = {result} {targetUnit}"
  unitType?: string
}

const STANDARD_VALUES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
  200
]

export function ConversionTable({ 
  sourceUnit, 
  targetUnit, 
  translations = {}, 
  title,
  unitType = 'default',
  lang
}: ConversionTableProps) {
  
  const t = useTranslations(lang as any)
  const sourceName = translations[sourceUnit.id] || sourceUnit.name || sourceUnit.id
  const targetName = translations[targetUnit.id] || targetUnit.name || targetUnit.id
  
  const tableTitle = React.useMemo(() => {
    const format = title || "{source} - {target}"
    return format
      .replace('{source}', sourceName)
      .replace('{target}', targetName)
  }, [title, sourceName, targetName])

  const conversions = React.useMemo(() => {
    if (!sourceUnit || !targetUnit) return []
    
    const strategy = getConverter(unitType)

    return STANDARD_VALUES.map(val => {
       try {
         const res = strategy.convert({
           amount: val.toString(),
           sourceUnit,
           targetUnit,
           allUnits: [] // Not strictly needed for result string
         })
         
         if (res) {
           return {
             value: val,
             result: res.result
           }
         }
       } catch (e) {
         console.error(e)
       }
       return null
    }).filter(Boolean) as { value: number, result: string }[]
  }, [sourceUnit, targetUnit, unitType])

  const formulaInfo = React.useMemo(() => {
    return getFormulaText(unitType, sourceUnit, targetUnit, sourceName, targetName, t)
  }, [unitType, sourceUnit, targetUnit, sourceName, targetName, t])

  if (conversions.length === 0) return null

  return (
    <div className="space-y-4">
      <Card className="border-slate-100 dark:border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-background overflow-hidden py-0 gap-0">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-border/50 space-y-0 py-3 px-4">
          <div className="flex items-center gap-2 text-foreground">
              <TableIcon className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-bold">{tableTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-px bg-slate-50 dark:bg-border/50">
            {conversions.map((item) => (
              <div 
                key={item.value} 
                className="flex items-center justify-between py-3 px-4 bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="font-mono font-medium text-primary">
                  {item.value} <span className="text-sm text-muted-foreground font-normal ml-1">{sourceName}</span>
                </div>
                <div className="text-muted-foreground mx-2">=</div>
                <div className="font-mono font-medium text-foreground">
                  {item.result} <span className="text-sm text-muted-foreground font-normal ml-1">{targetName}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {formulaInfo.formula && (
        <Card className="border-slate-100 dark:border-border shadow-sm bg-background p-4">
           <div className="flex items-start gap-3">
             <div className="bg-primary/10 p-2 rounded-lg mt-0.5">
               <Calculator className="w-4 h-4 text-primary" />
             </div>
             <div>
               <h4 className="font-semibold text-sm text-foreground mb-1">{t('components.conversion_table.formula_title')}</h4>
               <p className="font-mono text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit mb-2">
                 {formulaInfo.formula}
               </p>
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <ArrowRight className="w-3 h-3" />
                 <span>{formulaInfo.desc}</span>
               </div>
             </div>
           </div>
        </Card>
      )}
    </div>
  )
}
