import * as React from "react"
import { CalculationResult as CalculationResultType, Unit } from "@/lib/converter"

interface CalculationResultProps {
  t: {
    resultLabel: string
  }
  calculation: CalculationResultType
  amount: string
  fromUnit?: Unit
  toUnit?: Unit
}

export function CalculationResult({ t, calculation, amount, fromUnit, toUnit }: CalculationResultProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl transition-all duration-300 bg-blue-600 dark:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none ring-4 ring-blue-50 dark:ring-blue-900/20">
      <div className="px-6 py-5 min-h-[80px] flex flex-col items-center justify-center text-center">
          <div className="text-blue-100 dark:text-blue-200 text-xs font-medium mb-1 uppercase tracking-wider">{t.resultLabel}</div>
          <div className="text-white text-3xl font-bold break-all leading-tight">
            {calculation.result} <span className="text-lg font-normal opacity-80">{toUnit?.symbol}</span>
          </div>
          <div className="mt-2 text-blue-100/80 text-sm">
            {amount} {fromUnit?.symbol} = {calculation.result} {toUnit?.symbol}
          </div>
      </div>
    </div>
  )
}
