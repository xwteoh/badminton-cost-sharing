'use client'

import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { money, formatMoney } from '@/lib/calculations/money'
import { cn } from '@/lib/utils/cn'

interface Player {
  id: string
  name: string
  phone_number: string
  balance: number
}

interface CreditTransferModalProps {
  players: Player[]
  fromPlayer: Player | null
  isOpen: boolean
  onClose: () => void
  onTransfer: (fromPlayerId: string, toPlayerId: string, amount: number, notes: string) => Promise<void>
  loading?: boolean
}

export function CreditTransferModal({
  players,
  fromPlayer,
  isOpen,
  onClose,
  onTransfer,
  loading = false
}: CreditTransferModalProps) {
  const [toPlayerId, setToPlayerId] = useState('')
  const [amount, setAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setToPlayerId('')
      setAmount(0)
      setNotes('')
      setErrors({})
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    
    if (!fromPlayer) {
      newErrors.fromPlayer = 'From player is required'
    }
    
    if (!toPlayerId) {
      newErrors.toPlayerId = 'To player is required'
    }
    
    if (!amount || amount <= 0) {
      newErrors.amount = 'Transfer amount must be greater than 0'
    }
    
    // No balance restrictions - organizer has full control over transfers
    
    if (fromPlayer && toPlayerId === fromPlayer.id) {
      newErrors.toPlayerId = 'Cannot transfer credit to the same player'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      await onTransfer(fromPlayer!.id, toPlayerId, amount, notes)
      onClose()
    } catch (error) {
      console.error('Error transferring credit:', error)
    }
  }

  if (!isOpen) return null

  // Filter available players (exclude the from player)
  const availableToPlayers = players.filter(p => p.id !== fromPlayer?.id)

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300"
      style={{
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Transfer Credit</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* From Player */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Player
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{fromPlayer?.name}</p>
                  <p className="text-sm text-gray-600">{fromPlayer?.phone_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Available Credit</p>
                  <p className={cn(
                    'font-bold text-lg',
                    fromPlayer && fromPlayer.balance < 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {fromPlayer ? formatMoney(fromPlayer.balance) : '$0.00'}
                  </p>
                </div>
              </div>
            </div>
            {errors.fromPlayer && (
              <p className="text-sm text-red-600 mt-1">{errors.fromPlayer}</p>
            )}
          </div>

          {/* To Player */}
          <div>
            <label htmlFor="toPlayerId" className="block text-sm font-medium text-gray-700 mb-2">
              To Player *
            </label>
            <select
              id="toPlayerId"
              value={toPlayerId}
              onChange={(e) => setToPlayerId(e.target.value)}
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                errors.toPlayerId && "border-red-500"
              )}
            >
              <option value="">Select a player</option>
              {availableToPlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} - {player.phone_number}
                </option>
              ))}
            </select>
            {errors.toPlayerId && (
              <p className="text-sm text-red-600 mt-1">{errors.toPlayerId}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Amount *
            </label>
            <MoneyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
              className={cn(
                "w-full",
                errors.amount && "border-red-500"
              )}
            />
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for credit transfer..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-xl hover:-translate-y-1 transform"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
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
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Transferring...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">💸</span>
                    <span>Transfer Credit</span>
                  </>
                )}
              </span>
            </Button>
            
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 transform"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                color: '#374151',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                minHeight: '48px',
                paddingLeft: '32px',
                paddingRight: '32px'
              }}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span className="text-xl">✕</span>
                <span>Cancel</span>
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}