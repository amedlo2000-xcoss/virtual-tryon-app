import { createContext, useContext } from 'react'

export const TryOnContext = createContext(null)

export function useTryOn() {
  return useContext(TryOnContext)
}