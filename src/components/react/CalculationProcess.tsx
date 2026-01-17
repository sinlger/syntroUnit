import * as React from "react"
import { Calculator } from "lucide-react"
import type { Unit, CalculationResult } from "@/lib/converter"

interface CalculationProcessProps {
  t: {
    processTitle: string
    formulaTitle: string
    baseUnitDefault: string
    formulaStep1Desc: string
    formulaStep2Desc: string
    step1Title: string
    step1Formula: string
    step1Calc: string
    step2Title: string
    step2Formula: string
    step2Calc: string
    resultText: string
  }
  calculation: CalculationResult
  amount: string
  getName: (unit: Unit | undefined) => string
  showProcess: boolean
}

export function CalculationProcess({ t, calculation, amount, getName, showProcess }: CalculationProcessProps) {
  if (!showProcess) return null

  return (
    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100/50 dark:border-blue-900/20 space-y-6 text-sm animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-base">
        <Calculator className="w-5 h-5" />
        {t.processTitle}
      </div>

      {/* Core Formula */}
      <div className="space-y-3">
        <h4 className="font-semibold text-blue-600 dark:text-blue-400">
          {t.formulaTitle.replace('{baseUnit}', getName(calculation.baseUnit) || t.baseUnitDefault)}
        </h4>
        <div className="space-y-2 pl-4 text-muted-foreground leading-relaxed">
          <p dangerouslySetInnerHTML={{ __html: t.formulaStep1Desc.replace(/\{baseUnit\}/g, getName(calculation.baseUnit) || t.baseUnitDefault) }} />
          <p dangerouslySetInnerHTML={{ __html: t.formulaStep2Desc.replace(/\{baseUnit\}/g, getName(calculation.baseUnit) || t.baseUnitDefault) }} />
        </div>
      </div>

      <div className="space-y-6 border-t border-blue-100 dark:border-blue-900/20 pt-6">
        {/* Step 1 */}
        <div className="space-y-2">
          <div className="text-blue-500 dark:text-blue-400 font-bold">
            {t.step1Title
              .replace('{sourceUnit}', getName(calculation.sourceUnit))
              .replace('{baseUnit}', getName(calculation.baseUnit) || t.baseUnitDefault)}
          </div>
          <div className="pl-4 space-y-2 text-muted-foreground">
            <p>{t.step1Formula
              .replace('{sourceUnit}', getName(calculation.sourceUnit))
              .replace('{ratio}', calculation.sRatio.toString())
              .replace('{baseUnit}', getName(calculation.baseUnit) || t.baseUnitDefault)}</p>
            <p>{t.step1Calc
              .replace('{value}', amount)
              .replace('{ratio}', calculation.sRatio.toString())
              .replace('{result}', calculation.baseValue.toString())
              .replace('{baseUnit}', getName(calculation.baseUnit) || t.baseUnitDefault)}</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <div className="text-blue-500 dark:text-blue-400 font-bold">
            {t.step2Title
              .replace('{baseUnit}', getName(calculation.baseUnit) || t.baseUnitDefault)
              .replace('{targetUnit}', getName(calculation.targetUnit))}
          </div>
          <div className="pl-4 space-y-2 text-muted-foreground">
            <p>{t.step2Formula
              .replace('{targetUnit}', getName(calculation.targetUnit))
              .replace('{ratio}', calculation.tRatio.toString())
              .replace('{baseUnit}', getName(calculation.baseUnit) || t.baseUnitDefault)}</p>
            <p>{t.step2Calc
              .replace('{value}', calculation.baseValue.toString())
              .replace('{ratio}', calculation.tRatio.toString())
              .replace('{result}', calculation.result)
              .replace('{targetUnit}', getName(calculation.targetUnit))}</p>
          </div>
        </div>

        {/* Result */}
        <div className="pt-2">
           <div className="text-blue-600 dark:text-blue-400 font-bold text-base">
             {t.resultText
               .replace('{sourceValue}', amount)
               .replace('{sourceUnit}', getName(calculation.sourceUnit))
               .replace('{resultValue}', calculation.result)
               .replace('{targetUnit}', getName(calculation.targetUnit))}
           </div>
        </div>
      </div>
    </div>
  )
}
