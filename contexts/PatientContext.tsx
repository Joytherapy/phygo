'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

type Patient = { id: string; name: string }

type PatientContextValue = {
  currentPatient: Patient | null
  setCurrentPatient: (p: Patient | null) => void
}

const defaultValue: PatientContextValue = {
  currentPatient: null,
  setCurrentPatient: () => {},
}

const PatientContext = createContext<PatientContextValue>(defaultValue)

export function PatientProvider({ children }: { children: ReactNode }) {
  const [currentPatient, setCurrentPatientState] = useState<Patient | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('phygo_current_patient')
    if (stored) {
      try {
        setCurrentPatientState(JSON.parse(stored))
      } catch {
        sessionStorage.removeItem('phygo_current_patient')
      }
    }
  }, [])

  // Stable identity: pages list setCurrentPatient in their effect dependencies,
  // so a new function on every render would re-run those effects (and their
  // Supabase queries) in an endless loop.
  const setCurrentPatient = useCallback((p: Patient | null) => {
    setCurrentPatientState(p)
    if (p) {
      sessionStorage.setItem('phygo_current_patient', JSON.stringify(p))
    } else {
      sessionStorage.removeItem('phygo_current_patient')
    }
  }, [])
  const value = useMemo(() => ({ currentPatient, setCurrentPatient }), [currentPatient, setCurrentPatient])

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatientContext() {
  return useContext(PatientContext)
}