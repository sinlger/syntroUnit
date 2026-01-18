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

export interface CalculationResult {
  sourceUnit: Unit
  targetUnit: Unit
  baseValue: Big
  result: string
  sRatio: Big
  tRatio: Big
  baseUnit?: Unit
}

export interface ConversionContext {
  amount: string
  sourceUnit: Unit
  targetUnit: Unit
  allUnits: Unit[]
}

export interface ConverterStrategy {
  convert(context: ConversionContext): CalculationResult | null
}

/**
 * Linear Converter (for Length, Weight, Area, Volume, etc.)
 * Formula: Target = (Value * SourceRatio) / TargetRatio
 */
export const linearConverter: ConverterStrategy = {
  convert: ({ amount, sourceUnit, targetUnit, allUnits }) => {
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
      console.error("Conversion error:", e)
      return null
    }
  }
}

/**
 * Temperature Converter
 * Handles non-linear conversions between Celsius, Fahrenheit, and Kelvin
 */
export const temperatureConverter: ConverterStrategy = {
  convert: ({ amount, sourceUnit, targetUnit, allUnits }) => {
    try {
      const val = new Big(amount)
      
      // Identify unit type by ID (assuming standard IDs or symbols)
      const getId = (u: Unit) => u.id.toLowerCase()
      const sId = getId(sourceUnit)
      const tId = getId(targetUnit)
      
      let celsiusVal: Big

      // 1. Convert to Celsius (Base)
      if (sId.includes('celsius') || sId === 'c') {
        celsiusVal = val
      } else if (sId.includes('fahrenheit') || sId === 'f') {
        // C = (F - 32) / 1.8
        celsiusVal = val.minus(32).div(1.8)
      } else if (sId.includes('kelvin') || sId === 'k') {
        // C = K - 273.15
        celsiusVal = val.minus(273.15)
      } else if (sId.includes('rankine') || sId === 'r') {
        // C = (R - 491.67) / 1.8
        celsiusVal = val.minus(491.67).div(1.8)
      } else {
        // Fallback to linear if unknown (or maybe Rankine etc. if needed later)
        celsiusVal = val.times(sourceUnit.ratio)
      }

      let resultVal: Big

      // 2. Convert Celsius to Target
      if (tId.includes('celsius') || tId === 'c') {
        resultVal = celsiusVal
      } else if (tId.includes('fahrenheit') || tId === 'f') {
        // F = C * 1.8 + 32
        resultVal = celsiusVal.times(1.8).plus(32)
      } else if (tId.includes('kelvin') || tId === 'k') {
        // K = C + 273.15
        resultVal = celsiusVal.plus(273.15)
      } else if (tId.includes('rankine') || tId === 'r') {
        // R = (C + 273.15) * 1.8
        resultVal = celsiusVal.plus(273.15).times(1.8)
      } else {
        // Fallback
        resultVal = celsiusVal.div(targetUnit.ratio || 1)
      }

      // Find base unit (Celsius)
      const baseUnit = allUnits.find(u => 
        u.id.toLowerCase().includes('celsius') || u.id === 'c'
      ) || allUnits[0]

      return {
        sourceUnit,
        targetUnit,
        baseValue: celsiusVal,
        result: resultVal.toPrecision(10).replace(/\.?0+$/, ""),
        // For temperature, ratio is not constant, providing 1 or actual ratio as placeholder
        sRatio: new Big(sourceUnit.ratio || 1),
        tRatio: new Big(targetUnit.ratio || 1),
        baseUnit
      }
    } catch (e) {
      console.error("Temperature conversion error:", e)
      return null
    }
  }
}

/**
 * Registry to manage different conversion strategies
 */
const strategies: Record<string, ConverterStrategy> = {
  // Default linear strategies (默认线性换算策略：适用于基于比例系数的转换)
  length: linearConverter,   // 长度
  weight: linearConverter,   // 重量
  area: linearConverter,     // 面积
  volume: linearConverter,   // 体积
  time: linearConverter,     // 时间
  data: linearConverter,     // 数据存储
  speed: linearConverter,    // 速度
  pressure: linearConverter, // 压力
  energy: linearConverter,   // 能量
  power: linearConverter,    // 功率
  temperature: temperatureConverter, // 温度
  
  // Default fallback (默认回退策略)
  default: linearConverter
}

export function getConverter(type: string): ConverterStrategy {
  return strategies[type] || strategies.default
}

/**
 * Register a new strategy dynamically
 */
export function registerStrategy(type: string, strategy: ConverterStrategy) {
  strategies[type] = strategy
}
