"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRightLeft, Calculator, Info } from "lucide-react"
import Big from "big.js"

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

interface UnitConverterProps {
  data: {
    groups?: UnitGroup[]
    units?: UnitGroup[]
  }
  unitType: string
  translations?: Record<string, string>
  title?: string
  uiTranslations?: {
    description?: string
    inputPlaceholder?: string
    inputLabel?: string
    inputTitle?: string
    selectSourceLabel?: string
    selectSourceTitle?: string
    swapButtonLabel?: string
    swapButtonTitle?: string
    selectTargetLabel?: string
    selectTargetTitle?: string
    convertButtonLabel?: string
    convertButtonTitle?: string
    convertButtonText?: string
    resultLabel?: string
    processTitle?: string
    formulaTitle?: string
    formulaStep1Desc?: string
    formulaStep2Desc?: string
    step1Title?: string
    step1Formula?: string
    step1Calc?: string
    step2Title?: string
    step2Formula?: string
    step2Calc?: string
    resultText?: string
    baseUnitDefault?: string
  }
  defaultSourceUnit?: string
  defaultTargetUnit?: string
}

export function UnitConverter({ data, unitType, translations = {}, title, uiTranslations = {}, defaultSourceUnit, defaultTargetUnit }: UnitConverterProps) {
  const t = {
    description: uiTranslations.description || "支持多种常用{typeName}双向转换",
    inputPlaceholder: uiTranslations.inputPlaceholder || "请输入数值",
    inputLabel: uiTranslations.inputLabel || "数值输入",
    inputTitle: uiTranslations.inputTitle || "请输入需要转换的数值",
    selectSourceLabel: uiTranslations.selectSourceLabel || "选择源单位",
    selectSourceTitle: uiTranslations.selectSourceTitle || "选择源单位",
    swapButtonLabel: uiTranslations.swapButtonLabel || "交换单位",
    swapButtonTitle: uiTranslations.swapButtonTitle || "交换源单位和目标单位",
    selectTargetLabel: uiTranslations.selectTargetLabel || "选择目标单位",
    selectTargetTitle: uiTranslations.selectTargetTitle || "选择目标单位",
    convertButtonLabel: uiTranslations.convertButtonLabel || "立即转换",
    convertButtonTitle: uiTranslations.convertButtonTitle || "点击立即开始转换",
    convertButtonText: uiTranslations.convertButtonText || "立即转换",
    resultLabel: uiTranslations.resultLabel || "转换结果",
    processTitle: uiTranslations.processTitle || "详细转换过程",
    formulaTitle: uiTranslations.formulaTitle || "核心转换公式：所有单位先统一转换为{baseUnit}，再转换为目标单位",
    formulaStep1Desc: uiTranslations.formulaStep1Desc || '1. 源单位转{baseUnit}：<span className="font-mono text-foreground">M = V × Fs</span> <span className="text-muted-foreground text-xs ml-1">(M={baseUnit}数, V=输入数值, Fs=源单位转{baseUnit}系数)</span>',
    formulaStep2Desc: uiTranslations.formulaStep2Desc || '2. {baseUnit}转目标单位：<span className="font-mono text-foreground">R = M ÷ Ft</span> <span className="text-muted-foreground text-xs ml-1">(R=结果值, M={baseUnit}数, Ft=目标单位转{baseUnit}系数)</span>',
    step1Title: uiTranslations.step1Title || "第一步：{sourceUnit} 转换为 {baseUnit}",
    step1Formula: uiTranslations.step1Formula || "已知换算系数：1 {sourceUnit} = {ratio} {baseUnit}",
    step1Calc: uiTranslations.step1Calc || "代入公式计算：{value} × {ratio} = {result} {baseUnit}",
    step2Title: uiTranslations.step2Title || "第二步：{baseUnit} 转换为 {targetUnit}",
    step2Formula: uiTranslations.step2Formula || "已知换算系数：1 {targetUnit} = {ratio} {baseUnit}",
    step2Calc: uiTranslations.step2Calc || "代入公式计算：{value} ÷ {ratio} = {result} {targetUnit}",
    resultText: uiTranslations.resultText || "转换结果：{sourceValue} {sourceUnit} = {resultValue} {targetUnit}",
    baseUnitDefault: uiTranslations.baseUnitDefault || "基准单位",
  }

  const groups = React.useMemo(() => (Array.isArray(data) ? data : data.groups || []), [data])
  const allUnits = React.useMemo(() => groups.flatMap((g) => g.units), [groups])

  const [amount, setAmount] = React.useState<string>("")
  const [fromUnitId, setFromUnitId] = React.useState<string>(defaultSourceUnit || "")
  const [toUnitId, setToUnitId] = React.useState<string>(defaultTargetUnit || "")
  const [showProcess, setShowProcess] = React.useState(true)
  const [hasConverted, setHasConverted] = React.useState(false)

  // Update state when defaults change (e.g. navigation)
  React.useEffect(() => {
    if (defaultSourceUnit) setFromUnitId(defaultSourceUnit)
    if (defaultTargetUnit) setToUnitId(defaultTargetUnit)
  }, [defaultSourceUnit, defaultTargetUnit])

  // Initialize defaults if not set
  React.useEffect(() => {
    if (allUnits.length > 0) {
      if (!fromUnitId) setFromUnitId(allUnits[0].id)
      if (!toUnitId) {
        const target = allUnits.find((u) => u.id !== (fromUnitId || allUnits[0].id)) || allUnits[0]
        setToUnitId(target.id)
      }
    }
  }, [allUnits, fromUnitId, toUnitId])

  // Reset converted state when inputs change
  React.useEffect(() => {
    setHasConverted(false)
  }, [amount, fromUnitId, toUnitId])

  const handleSwap = () => {
    setFromUnitId(toUnitId)
    setToUnitId(fromUnitId)
  }
  
  const handleConvert = () => {
    if (amount && fromUnitId && toUnitId) {
      setHasConverted(true)
    }
  }

  // Calculation Logic
  const calculation = React.useMemo(() => {
    if (!amount || !fromUnitId || !toUnitId) return null
    const sourceUnit = allUnits.find((u) => u.id === fromUnitId)
    const targetUnit = allUnits.find((u) => u.id === toUnitId)
    if (!sourceUnit || !targetUnit) return null

    try {
      const val = new Big(amount)
      const sRatio = new Big(sourceUnit.ratio)
      const tRatio = new Big(targetUnit.ratio)
      
      if (tRatio.eq(0)) return null

      // Base value (e.g. meters) = Value * SourceRatio
      const baseValue = val.times(sRatio)
      
      // Target value = BaseValue / TargetRatio
      const targetValue = baseValue.div(tRatio)
      
      const baseUnit = allUnits.find(u => u.ratio === 1)

      return {
        sourceUnit,
        targetUnit,
        baseValue,
        result: targetValue.toPrecision(10).replace(/\.?0+$/, ""),
        sRatio,
        tRatio,
        baseUnit
      }
    } catch (e) {
      return null
    }
  }, [amount, fromUnitId, toUnitId, allUnits])

  const fromUnit = allUnits.find((u) => u.id === fromUnitId)
  const toUnit = allUnits.find((u) => u.id === toUnitId)
  const typeName = title || translations[unitType] || unitType

  // Helper to get display name
  const getName = (unit: Unit | undefined) => {
    if (!unit) return ""
    return translations[unit.id] || unit.name || unit.id
  }

  // Supported units text
  const supportedUnitsText = React.useMemo(() => {
    const unitsList = allUnits.map(u => getName(u)).slice(0, 8).join("、")
    return allUnits.length > 8 ? `${unitsList}...` : unitsList
  }, [allUnits, translations])

  // Save to history
  React.useEffect(() => {
    if (hasConverted && calculation) {
      const historyItem = {
        fromVal: amount,
        fromUnitId: calculation.sourceUnit.id,
        fromUnitName: getName(calculation.sourceUnit),
        fromSymbol: calculation.sourceUnit.symbol,
        toVal: calculation.result,
        toUnitId: calculation.targetUnit.id,
        toUnitName: getName(calculation.targetUnit),
        toSymbol: calculation.targetUnit.symbol,
        timestamp: Date.now(),
        unitType: unitType,
        unitTypeName: typeName
      }
      
      try {
        const existing = JSON.parse(localStorage.getItem('conversionHistory') || '[]')
        const last = existing[0]
        // Simple duplicate check
        const isSame = last && 
           last.fromVal === historyItem.fromVal && 
           last.fromSymbol === historyItem.fromSymbol &&
           last.toSymbol === historyItem.toSymbol
           
        if (!isSame) {
            const newHistory = [historyItem, ...existing].slice(0, 10)
            localStorage.setItem('conversionHistory', JSON.stringify(newHistory))
            window.dispatchEvent(new Event('conversion-history-updated'))
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [hasConverted, calculation, unitType, typeName])

  return (
    <div className="w-full mx-auto font-sans">
      <Card className="border-slate-100 dark:border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-background rounded-sm overflow-visible">
        <CardHeader className="text-center pb-2 pt-6 space-y-1">
          <CardTitle className="text-2xl font-black text-foreground tracking-tight capitalize">
            {typeName}
          </CardTitle>
          <CardDescription className="text-muted-foreground font-medium text-sm">
            {t.description.replace('{typeName}', typeName)}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
             <div className="relative group">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 text-lg px-4 bg-background border-input focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 rounded-sm transition-all font-medium placeholder:text-muted-foreground w-full shadow-sm"
                  placeholder={t.inputPlaceholder}
                  inputMode="decimal"
                  aria-label={t.inputLabel}
                  title={t.inputTitle}
                />
             </div>

             <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <UnitSelect 
                    value={fromUnitId} 
                    onValueChange={setFromUnitId} 
                    groups={groups} 
                    translations={translations}
                    aria-label={t.selectSourceLabel}
                    title={t.selectSourceTitle}
                  />
                </div>

                <div className="flex-none">
                   <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSwap}
                      className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors shrink-0"
                      title={t.swapButtonTitle}
                      aria-label={t.swapButtonLabel}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <UnitSelect 
                    value={toUnitId} 
                    onValueChange={setToUnitId} 
                    groups={groups} 
                    translations={translations}
                    aria-label={t.selectTargetLabel}
                    title={t.selectTargetTitle}
                  />
                </div>
             </div>
          </div>

          {/* Convert Button */}
          <Button 
            className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-sm shadow-lg shadow-blue-200 dark:shadow-none transition-all hover:shadow-blue-300 active:scale-[0.98]"
            onClick={handleConvert}
            aria-label={t.convertButtonLabel}
            title={t.convertButtonTitle}
          >
            <ArrowRightLeft className="mr-2 h-5 w-5" /> {t.convertButtonText}
          </Button>

          {/* Result Section */}
          {hasConverted && calculation && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 pt-2">
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

              {/* Detailed Process Toggle */}
              <div className="mt-4">

                {showProcess && (
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
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center py-6 border-t border-slate-100 dark:border-border/50 mx-6 px-0">
           <p className="text-xs text-muted-foreground leading-relaxed text-center">
             支持单位：{supportedUnitsText}
           </p>
        </CardFooter>
      </Card>
    </div>
  )
}

function UnitSelect({ value, onValueChange, groups, translations, "aria-label": ariaLabel, title }: any) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger 
        className="h-12 w-full bg-background border-input rounded-sm focus:ring-1 focus:ring-blue-500/20 text-sm font-medium text-foreground shadow-sm"
        aria-label={ariaLabel}
        title={title}
      >
        <SelectValue placeholder="选择单位" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] rounded-sm border-border shadow-xl p-1">
        {groups.map((group: any) => (
          <SelectGroup key={group.group_id}>
            <SelectLabel className="text-[10px] uppercase text-muted-foreground font-bold px-2 py-2 mt-1 first:mt-0">
              {translations[group.group_id] || group.name || group.group_id}
            </SelectLabel>
            {group.units.map((unit: any) => (
              <SelectItem key={unit.id} value={unit.id} className="py-2.5 rounded-lg focus:bg-accent focus:text-accent-foreground cursor-pointer text-sm">
                <span className="font-medium">{translations[unit.id] || unit.name || unit.id}</span>
                <span className="ml-2 text-muted-foreground font-normal">({unit.symbol})</span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
