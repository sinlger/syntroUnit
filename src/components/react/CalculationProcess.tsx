import * as React from "react"
import { Calculator } from "lucide-react"

export interface ProcessStep {
  title: string
  formula: string
  calculation: string
}

interface CalculationProcessProps {
  title: string
  coreFormula?: {
    title: string
    steps: string[]
  }
  steps: ProcessStep[]
  resultText: string
  showProcess: boolean
}

export function CalculationProcess({ title, coreFormula, steps, resultText, showProcess }: CalculationProcessProps) {
  if (!showProcess) return null

  return (
    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100/50 dark:border-blue-900/20 space-y-6 text-sm animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-base">
        <Calculator className="w-5 h-5" />
        {title}
      </div>

      {/* Core Formula */}
      {coreFormula && (
        <div className="space-y-3">
          <h4 className="font-semibold text-blue-600 dark:text-blue-400">
            {coreFormula.title}
          </h4>
          <div className="space-y-2 pl-4 text-muted-foreground leading-relaxed">
            {coreFormula.steps.map((step, idx) => (
              <p key={idx} dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6 border-t border-blue-100 dark:border-blue-900/20 pt-6">
        {steps.map((step, index) => (
          <div key={index} className="space-y-2">
            <div className="text-blue-500 dark:text-blue-400 font-bold">
              {step.title}
            </div>
            <div className="pl-4 space-y-2 text-muted-foreground">
              <p>{step.formula}</p>
              <p>{step.calculation}</p>
            </div>
          </div>
        ))}

        {/* Result */}
        <div className="pt-2">
           <div className="text-blue-600 dark:text-blue-400 font-bold text-base">
             {resultText}
           </div>
        </div>
      </div>
    </div>
  )
}
