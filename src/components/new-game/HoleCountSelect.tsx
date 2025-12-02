'use client'

import { FC } from 'react'
import { UseFormRegister } from 'react-hook-form'
import { GameFormData } from '@/app/game/new/types'

interface HoleCountSelectProps {
  register: UseFormRegister<GameFormData>
  disabled?: boolean
  className?: string
  options?: Array<{ label: string; value: number }>
}

const HoleCountSelect: FC<HoleCountSelectProps> = ({
  register,
  disabled = false,
  className,
  options = [
    { value: 9, label: '9 hoyos' },
    { value: 18, label: '18 hoyos' },
    { value: 36, label: '36 hoyos' }
  ]
}) => {
  const defaultClasses =
    'w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-base'
  const disabledClasses = 'disabled:opacity-30 disabled:cursor-not-allowed'
  const resolvedClassName =
    `${className ?? defaultClasses} ${disabled ? disabledClasses : ''}`.trim()

  return (
    <div>
      <label
        htmlFor="holeCount"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Número de hoyos
      </label>
      <select
        id="holeCount"
        disabled={disabled}
        {...register('holeCount', { valueAsNumber: true })}
        className={resolvedClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default HoleCountSelect
