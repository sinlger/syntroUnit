import Big from "big.js"
import type { Unit } from "@/lib/converter"

export function normalizeTempId(id: string) {
  const lower = id.toLowerCase()
  if (lower.includes('celsius') || lower === 'c') return 'c'
  if (lower.includes('fahrenheit') || lower === 'f') return 'f'
  if (lower.includes('kelvin') || lower === 'k') return 'k'
  if (lower.includes('rankine') || lower === 'r') return 'r'
  return null
}

export const TEMP_FORMULAS: Record<string, { formula: (s: string, t: string) => string, key: string }> = {
  'c_f': { formula: (s, t) => `${t} = (${s} × 1.8) + 32`, key: 'formula.temp.c_to_f' },
  'c_k': { formula: (s, t) => `${t} = ${s} + 273.15`, key: 'formula.temp.c_to_k' },
  'c_r': { formula: (s, t) => `${t} = (${s} + 273.15) × 1.8`, key: 'formula.temp.c_to_r' },
  'f_c': { formula: (s, t) => `${t} = (${s} - 32) / 1.8`, key: 'formula.temp.f_to_c' },
  'f_k': { formula: (s, t) => `${t} = (${s} - 32) / 1.8 + 273.15`, key: 'formula.temp.f_to_k' },
  'f_r': { formula: (s, t) => `${t} = ${s} + 459.67`, key: 'formula.temp.f_to_r' },
  'k_c': { formula: (s, t) => `${t} = ${s} - 273.15`, key: 'formula.temp.k_to_c' },
  'k_f': { formula: (s, t) => `${t} = (${s} - 273.15) × 1.8 + 32`, key: 'formula.temp.k_to_f' },
  'k_r': { formula: (s, t) => `${t} = ${s} × 1.8`, key: 'formula.temp.k_to_r' },
  'r_c': { formula: (s, t) => `${t} = (${s} - 491.67) / 1.8`, key: 'formula.temp.r_to_c' },
  'r_f': { formula: (s, t) => `${t} = ${s} - 459.67`, key: 'formula.temp.r_to_f' },
  'r_k': { formula: (s, t) => `${t} = ${s} / 1.8`, key: 'formula.temp.r_to_k' },
}

export function getFormulaText(
  unitType: string, 
  source: Unit, 
  target: Unit, 
  sourceName: string, 
  targetName: string,
  t: (key: any) => string
): { formula: string, desc: string } {
  if (unitType === 'temperature') {
    const sId = normalizeTempId(source.id)
    const tId = normalizeTempId(target.id)
    
    if (sId && tId) {
      const config = TEMP_FORMULAS[`${sId}_${tId}`]
      if (config) {
        return {
          formula: config.formula(source.symbol, target.symbol),
          desc: t(config.key)
            .replace('{source}', sourceName)
            .replace('{target}', targetName)
        }
      }
    }
  }

  // Default Linear
  try {
    const sRatio = new Big(source.ratio)
    const tRatio = new Big(target.ratio)
    if (!tRatio.eq(0)) {
      const factor = sRatio.div(tRatio)
      const factorStr = factor.toPrecision(6).replace(/\.?0+$/, "")
      
      return { 
        formula: `${target.symbol} = ${source.symbol} × ${factorStr}`, 
        desc: t('formula.linear.multiply')
          .replace('{source}', sourceName)
          .replace('{target}', targetName)
          .replace('{factor}', factorStr)
      }
    }
  } catch (e) {}

  return { formula: '', desc: '' }
}
