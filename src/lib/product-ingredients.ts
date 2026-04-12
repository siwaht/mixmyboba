import { getCachedJson } from '@/lib/settings-cache'

export interface KeyIngredient {
  name: string
  icon: string
  benefit: string
}

export interface FunctionalBenefit {
  icon: string
  title: string
  desc: string
}

export interface NutritionHighlights {
  calories: string
  sugar: string
  protein: string
  fiber: string
}

export interface ProductIngredientData {
  ingredients: string
  keyIngredients: KeyIngredient[]
  functionalBenefits: FunctionalBenefit[]
  nutritionHighlights: NutritionHighlights
}

export interface GlobalIngredientData {
  headline: string
  subline: string
  badges: { icon: string; label: string }[]
  neverList: string[]
}

interface IngredientsFile {
  global: GlobalIngredientData
  products: Record<string, ProductIngredientData>
}

const defaultData: IngredientsFile = { global: { headline: '', subline: '', badges: [], neverList: [] }, products: {} }

export async function getProductIngredients(slug: string): Promise<ProductIngredientData | null> {
  const data = await getCachedJson<IngredientsFile>('product-ingredients.json', defaultData)
  return data.products[slug] || null
}

export async function getGlobalIngredientData(): Promise<GlobalIngredientData> {
  const data = await getCachedJson<IngredientsFile>('product-ingredients.json', defaultData)
  return data.global
}
