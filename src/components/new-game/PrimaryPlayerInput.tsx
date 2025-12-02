'use client'

import { FC } from 'react'

interface PrimaryPlayerInputProps {
  value: string
  onChange: (value: string) => void
  helperText?: string
  label?: string
  inputId?: string
}

const PrimaryPlayerInput: FC<PrimaryPlayerInputProps> = ({
  value,
  onChange,
  helperText,
  label = 'Tu nombre',
  inputId = 'primary-player-name'
}) => {
  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-base"
        placeholder="Ingresa tu nombre"
        required
        id={inputId}
      />
      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}

export default PrimaryPlayerInput
