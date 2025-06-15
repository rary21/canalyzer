'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { DBCDatabase, ParseResult } from '@/types/dbc'

interface DBCContextType {
  dbcData: DBCDatabase | null
  parseResult: ParseResult | null
  setDBCData: (data: DBCDatabase | null) => void
  setParseResult: (result: ParseResult | null) => void
  fileName: string | null
  setFileName: (name: string | null) => void
}

const DBCContext = createContext<DBCContextType | undefined>(undefined)

export function DBCProvider({ children }: { children: ReactNode }) {
  const [dbcData, setDBCData] = useState<DBCDatabase | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <DBCContext.Provider value={{
      dbcData,
      parseResult,
      setDBCData,
      setParseResult,
      fileName,
      setFileName
    }}>
      {children}
    </DBCContext.Provider>
  )
}

export function useDBCContext() {
  const context = useContext(DBCContext)
  if (context === undefined) {
    throw new Error('useDBCContext must be used within a DBCProvider')
  }
  return context
}