'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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

  const setCurrentPatient = (p: Patient | null) => {
    setCurrentPatientState(p)
    if (p) {
      sessionStorage.setItem('phygo_current_patient', JSON.stringify(p))
    } else {
      sessionStorage.removeItem('phygo_current_patient')
    }
  }

  return (
    <PatientContext.Provider value={{ currentPatient, setCurrentPatient }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatientContext() {
  return useContext(PatientContext)
}