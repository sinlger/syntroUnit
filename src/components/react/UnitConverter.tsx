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
}

export function UnitConverter({ data, unitType, translations = {}, title }: UnitConverterProps) {
  const groups = React.useMemo(() => (Array.isArray(data) ? data : data.groups || []), [data])
  const allUnits = React.useMemo(() => groups.flatMap((g) => g.units), [groups])

  const [amount, setAmount] = React.useState<string>("")
  const [fromUnitId, setFromUnitId] = React.useState<string>("")
  const [toUnitId, setToUnitId] = React.useState<string>("")
  const [showProcess, setShowProcess] = React.useState(true)
  const [hasConverted, setHasConverted] = React.useState(false)

  // Initialize defaults
  React.useEffect(() => {
    if (allUnits.length > 0) {
      if (!fromUnitId) setFromUnitId(allUnits[0].id)
      if (!toUnitId) {
        const target = allUnits.find((u) => u.id !== allUnits[0].id) || allUnits[0]
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
        fromUnitName: getName(calculation.sourceUnit),
        fromSymbol: calculation.sourceUnit.symbol,
        toVal: calculation.result,
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
      <Card className="border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white rounded-sm overflow-visible">
        <CardHeader className="text-center pb-2 pt-8 space-y-2">
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight capitalize">
            {typeName}
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium text-base">
            支持多种常用{typeName}双向转换
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
                  className="h-14 text-lg px-4 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 rounded-sm transition-all font-medium placeholder:text-slate-400 w-full shadow-sm"
                  placeholder="请输入数值"
                  inputMode="decimal"
                  aria-label="数值输入"
                  title="请输入需要转换的数值"
                />
             </div>

             <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <UnitSelect 
                    value={fromUnitId} 
                    onValueChange={setFromUnitId} 
                    groups={groups} 
                    translations={translations}
                    aria-label="选择源单位"
                    title="选择源单位"
                  />
                </div>

                <div className="flex-none">
                   <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSwap}
                      className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors shrink-0"
                      title="交换单位"
                      aria-label="交换源单位和目标单位"
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
                    aria-label="选择目标单位"
                    title="选择目标单位"
                  />
                </div>
             </div>
          </div>

          {/* Convert Button */}
          <Button 
            className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-sm shadow-lg shadow-blue-200 transition-all hover:shadow-blue-300 active:scale-[0.98]"
            onClick={handleConvert}
            aria-label="立即转换"
            title="点击立即开始转换"
          >
            <ArrowRightLeft className="mr-2 h-5 w-5" /> 立即转换
          </Button>

          {/* Result Section */}
          {hasConverted && calculation && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 pt-2">
              <div className="relative overflow-hidden rounded-2xl transition-all duration-300 bg-blue-600 shadow-lg shadow-blue-200 ring-4 ring-blue-50">
                <div className="px-6 py-5 min-h-[80px] flex flex-col items-center justify-center text-center">
                    <div className="text-blue-100 text-xs font-medium mb-1 uppercase tracking-wider">转换结果</div>
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
                  <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100/50 space-y-6 text-sm animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                      <Calculator className="w-5 h-5" />
                      详细转换过程
                    </div>

                    {/* Core Formula */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-600">
                        核心转换公式：所有单位先统一转换为{getName(calculation.baseUnit) || "基准单位"}，再转换为目标单位
                      </h4>
                      <div className="space-y-2 pl-4 text-slate-600 leading-relaxed">
                        <p>1. 源单位转{getName(calculation.baseUnit) || "基准单位"}：<span className="font-mono text-slate-800">M = V × Fs</span> <span className="text-slate-400 text-xs ml-1">(M={getName(calculation.baseUnit) || "基准单位"}数, V=输入数值, Fs=源单位转{getName(calculation.baseUnit) || "基准单位"}系数)</span></p>
                        <p>2. {getName(calculation.baseUnit) || "基准单位"}转目标单位：<span className="font-mono text-slate-800">R = M ÷ Ft</span> <span className="text-slate-400 text-xs ml-1">(R=结果值, M={getName(calculation.baseUnit) || "基准单位"}数, Ft=目标单位转{getName(calculation.baseUnit) || "基准单位"}系数)</span></p>
                      </div>
                    </div>

                    <div className="space-y-6 border-t border-blue-100 pt-6">
                      {/* Step 1 */}
                      <div className="space-y-2">
                        <div className="text-blue-500 font-bold">第一步：{getName(calculation.sourceUnit)} 转换为 {getName(calculation.baseUnit) || "基准单位"}</div>
                        <div className="pl-4 space-y-2 text-slate-600">
                          <p>已知换算系数：1 {getName(calculation.sourceUnit)} = {calculation.sRatio.toString()} {getName(calculation.baseUnit) || "基准单位"}</p>
                          <p>代入公式计算：{amount} × {calculation.sRatio.toString()} = {calculation.baseValue.toString()} {getName(calculation.baseUnit) || "基准单位"}</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="space-y-2">
                        <div className="text-blue-500 font-bold">第二步：{getName(calculation.baseUnit) || "基准单位"} 转换为 {getName(calculation.targetUnit)}</div>
                        <div className="pl-4 space-y-2 text-slate-600">
                          <p>已知换算系数：1 {getName(calculation.targetUnit)} = {calculation.tRatio.toString()} {getName(calculation.baseUnit) || "基准单位"}</p>
                          <p>代入公式计算：{calculation.baseValue.toString()} ÷ {calculation.tRatio.toString()} = {calculation.result} {getName(calculation.targetUnit)}</p>
                        </div>
                      </div>

                      {/* Result */}
                      <div className="pt-2">
                         <div className="text-blue-600 font-bold text-base">
                           转换结果：{amount} {getName(calculation.sourceUnit)} = {calculation.result} {getName(calculation.targetUnit)}
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center py-6 border-t border-slate-100 mx-6 px-0">
           <p className="text-xs text-slate-400 leading-relaxed text-center">
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
        className="h-12 w-full bg-white border-slate-200 rounded-sm focus:ring-1 focus:ring-blue-500/20 text-sm font-medium text-slate-700 shadow-sm"
        aria-label={ariaLabel}
        title={title}
      >
        <SelectValue placeholder="选择单位" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] rounded-sm border-slate-100 shadow-xl p-1">
        {groups.map((group: any) => (
          <SelectGroup key={group.group_id}>
            <SelectLabel className="text-[10px] uppercase text-slate-400 font-bold px-2 py-2 mt-1 first:mt-0">
              {translations[group.group_id] || group.name || group.group_id}
            </SelectLabel>
            {group.units.map((unit: any) => (
              <SelectItem key={unit.id} value={unit.id} className="py-2.5 rounded-lg focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-sm">
                <span className="font-medium">{translations[unit.id] || unit.name || unit.id}</span>
                <span className="ml-2 text-slate-400 font-normal">({unit.symbol})</span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
