'use client'

import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { money, type MoneyInput as MoneyInputType } from '@/lib/calculations/money'
import { cn } from '@/lib/utils/cn'

export interface Player {
  id: string
  name: string
  phone?: string
  currentBalance: MoneyInputType // Positive = owes money (debt), Negative = has credit
  isActive: boolean
  is_temporary?: boolean
}

export interface PaymentFormData {
  paymentDate: string
  playerId: string
  amount: string
  paymentMethod: 'cash' | 'paynow' | 'bank_transfer' | 'other'
  reference: string
  notes: string
}

export interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void
  loading?: boolean
  organizerId: string
  initialData?: Partial<PaymentFormData>
  players?: Player[]
}

const PAYMENT_METHODS = [
  { value: 'paynow', label: 'PayNow', icon: '📱' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '💳' }
] as const

export function PaymentForm({ 
  onSubmit, 
  loading = false, 
  organizerId,
  initialData,
  players = []
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentDate: new Date().toISOString().split('T')[0], // Today
    playerId: '',
    amount: '',
    paymentMethod: 'paynow',
    reference: '',
    notes: '',
    ...initialData
  })

  const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({})
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  // Filter players who owe money (positive balance) for quick selection
  const playersWithDebt = players.filter(p => money(p.currentBalance).isPositive() && p.isActive)

  useEffect(() => {
    if (formData.playerId) {
      const player = players.find(p => p.id === formData.playerId)
      setSelectedPlayer(player || null)
    } else {
      setSelectedPlayer(null)
    }
  }, [formData.playerId, players])

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PaymentFormData, string>> = {}

    // Required fields
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required'
    if (!formData.playerId) newErrors.playerId = 'Player selection is required'
    if (!formData.amount) newErrors.amount = 'Payment amount is required'

    // Validate amount
    if (formData.amount && !money(formData.amount).isPositive()) {
      newErrors.amount = 'Payment amount must be greater than 0'
    }

    // Validate reference for electronic payments
    if (['paynow', 'bank_transfer'].includes(formData.paymentMethod) && !formData.reference.trim()) {
      newErrors.reference = `Reference is required for ${formData.paymentMethod === 'paynow' ? 'PayNow' : 'bank transfer'}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit(formData)
  }

  const quickSelectPlayer = (player: Player) => {
    handleInputChange('playerId', player.id)
    
    // Auto-fill amount with outstanding debt if player owes money
    if (money(player.currentBalance).isPositive()) {
      const owedAmount = money(player.currentBalance).toString()
      handleInputChange('amount', owedAmount)
    }
  }

  const newBalanceAfterPayment = selectedPlayer && formData.amount 
    ? money(selectedPlayer.currentBalance).sub(money(formData.amount))
    : null

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Payment Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => handleInputChange('paymentDate', e.target.value)}
              className={cn(
                'w-full h-12 px-3 py-2 border rounded-lg text-base text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                errors.paymentDate ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.paymentDate && (
              <p className="text-sm text-red-600 mt-1">{errors.paymentDate}</p>
            )}
          </div>

          {/* Payment Amount */}
          <MoneyInput
            label="Payment Amount *"
            value={formData.amount}
            onChange={(value, isValid) => handleInputChange('amount', value)}
            placeholder="25.00"
            error={errors.amount}
            helperText="Amount received from player"
          />
        </div>
      </div>

      {/* Player Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Player</h3>
        
        {/* Quick Selection for Players with Debt */}
        {playersWithDebt.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Players with outstanding balance:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {playersWithDebt.map(player => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => quickSelectPlayer(player)}
                  className={cn(
                    'p-3 text-left border rounded-lg transition-all',
                    'hover:border-primary hover:bg-primary/5',
                    formData.playerId === player.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 flex items-center space-x-1">
                        <span>{player.name}</span>
                        {player.is_temporary && <span className="text-orange-500">👤</span>}
                      </p>
                      <p className="text-sm text-gray-500">{player.phone || (player.is_temporary ? 'Drop-in player' : 'No phone')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Owes:</p>
                      <MoneyDisplay 
                        value={money(player.currentBalance).abs()} 
                        size="sm" 
                        className="text-red-600 font-medium"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full Player Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player *
          </label>
          <select
            value={formData.playerId}
            onChange={(e) => handleInputChange('playerId', e.target.value)}
            className={cn(
              'w-full h-12 px-3 py-2 border rounded-lg text-base text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              errors.playerId ? 'border-red-500' : 'border-gray-300'
            )}
          >
            <option value="">Select a player...</option>
            {players.filter(p => p.isActive).map(player => (
              <option key={player.id} value={player.id}>
                {player.name} {player.phone && `(${player.phone})`} {player.is_temporary && '👤'} - Balance: ${money(player.currentBalance).toString()}
              </option>
            ))}
          </select>
          {errors.playerId && (
            <p className="text-sm text-red-600 mt-1">{errors.playerId}</p>
          )}
        </div>

        {/* Selected Player Balance Info */}
        {selectedPlayer && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900 flex items-center space-x-1">
                  <span>{selectedPlayer.name}</span>
                  {selectedPlayer.is_temporary && <span className="text-orange-500">👤</span>}
                </p>
                <p className="text-sm text-blue-700">
                  {selectedPlayer.is_temporary ? 'Drop-in player' : 'Current Balance:'}
                </p>
              </div>
              <div className="text-right">
                <MoneyDisplay 
                  value={selectedPlayer.currentBalance} 
                  size="lg" 
                  className={cn(
                    'font-bold',
                    money(selectedPlayer.currentBalance).isPositive() 
                      ? 'text-red-600'  // Positive = debt
                      : money(selectedPlayer.currentBalance).isNegative()
                      ? 'text-green-600' // Negative = credit
                      : 'text-gray-600'
                  )}
                />
                <p className="text-xs text-blue-600">
                  {money(selectedPlayer.currentBalance).isPositive() 
                    ? 'Owes money' 
                    : money(selectedPlayer.currentBalance).isNegative()
                    ? 'Has credit'
                    : 'Even balance'
                  }
                </p>
              </div>
            </div>
            
            {/* New Balance Preview */}
            {newBalanceAfterPayment && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-700">New balance after payment:</p>
                  <MoneyDisplay 
                    value={newBalanceAfterPayment} 
                    size="lg" 
                    className={cn(
                      'font-bold',
                      newBalanceAfterPayment.isPositive() 
                        ? 'text-red-600'  // Still owes money
                        : newBalanceAfterPayment.isNegative()
                        ? 'text-green-600' // Has credit
                        : 'text-gray-600'  // Even balance
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PAYMENT_METHODS.map(method => (
            <button
              key={method.value}
              type="button"
              onClick={() => handleInputChange('paymentMethod', method.value)}
              className={cn(
                'p-3 text-center border rounded-lg transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                formData.paymentMethod === method.value
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900'
              )}
            >
              <div className="text-2xl mb-1">{method.icon}</div>
              <p className="text-sm font-medium">{method.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Reference & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference {['paynow', 'bank_transfer'].includes(formData.paymentMethod) && '*'}
          </label>
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => handleInputChange('reference', e.target.value)}
            placeholder={
              formData.paymentMethod === 'paynow' ? 'PayNow reference number' :
              formData.paymentMethod === 'bank_transfer' ? 'Transaction reference' :
              'Optional reference'
            }
            className={cn(
              'w-full h-12 px-3 py-2 border rounded-lg text-base text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              errors.reference ? 'border-red-500' : 'border-gray-300'
            )}
          />
          {errors.reference && (
            <p className="text-sm text-red-600 mt-1">{errors.reference}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional notes about this payment..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-xl hover:-translate-y-1 transform"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            color: 'white',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            minHeight: '48px',
            paddingLeft: '32px',
            paddingRight: '32px'
          }}
        >
          <span className="relative z-10 flex items-center space-x-2">
            <span className="text-xl">💰</span>
            <span>{loading ? 'Recording...' : 'Record Payment'}</span>
          </span>
        </Button>
      </div>
    </form>
  )
}