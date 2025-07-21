/**
 * Player Service Tests
 * Purpose: Comprehensive test coverage for player management operations
 * Critical for production: Ensures data integrity and business logic correctness
 */

// Mock the Supabase client creation
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
}

jest.mock('@/lib/supabase/client', () => ({
  createClientSupabaseClient: jest.fn(() => mockSupabase),
}))

import { PlayerService } from '../players'

describe('PlayerService', () => {
  let playerService: PlayerService
  const mockOrganizerId = '123e4567-e89b-12d3-a456-426614174000'
  const mockPlayerId = '123e4567-e89b-12d3-a456-426614174001'

  beforeEach(() => {
    playerService = new PlayerService()
    jest.clearAllMocks()
  })

  describe('getAllPlayers', () => {
    it('should fetch all players for organizer', async () => {
      const mockPlayers = [
        { id: mockPlayerId, name: 'John Doe', phone_number: '+6591234567' },
        { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Jane Smith', phone_number: '+6591234568' },
      ]

      mockSupabase.single.mockResolvedValue({ data: mockPlayers, error: null })

      const result = await playerService.getAllPlayers(mockOrganizerId)

      expect(mockSupabase.from).toHaveBeenCalledWith('players')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('organizer_id', mockOrganizerId)
      expect(mockSupabase.order).toHaveBeenCalledWith('name')
      expect(result).toEqual(mockPlayers)
    })

    it('should handle database errors gracefully', async () => {
      const mockError = { message: 'Database connection failed' }
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      await expect(playerService.getAllPlayers(mockOrganizerId)).rejects.toThrow(
        'Failed to fetch players: Database connection failed'
      )
    })

    it('should validate organizer ID parameter', async () => {
      await expect(playerService.getAllPlayers('')).rejects.toThrow(
        'Organizer ID is required'
      )

      await expect(playerService.getAllPlayers(null as any)).rejects.toThrow(
        'Organizer ID is required'
      )
    })
  })

  describe('getPlayer', () => {
    it('should fetch single player by ID', async () => {
      const mockPlayer = { 
        id: mockPlayerId, 
        name: 'John Doe', 
        phone_number: '+6591234567',
        organizer_id: mockOrganizerId
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: mockPlayer, error: null })

      const result = await playerService.getPlayer(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.from).toHaveBeenCalledWith('players')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('organizer_id', mockOrganizerId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockPlayerId)
      expect(result).toEqual(mockPlayer)
    })

    it('should return null for non-existent player', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await playerService.getPlayer(mockOrganizerId, mockPlayerId)

      expect(result).toBeNull()
    })
  })

  describe('createPlayer', () => {
    it('should create new player with valid data', async () => {
      const newPlayer = {
        name: 'New Player',
        phone_number: '+6591234569',
        organizer_id: mockOrganizerId,
        notes: 'Test notes'
      }

      const createdPlayer = { 
        ...newPlayer, 
        id: mockPlayerId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.select.mockResolvedValue({ data: [createdPlayer], error: null })

      const result = await playerService.createPlayer(newPlayer)

      expect(mockSupabase.from).toHaveBeenCalledWith('players')
      expect(mockSupabase.insert).toHaveBeenCalledWith(newPlayer)
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(result).toEqual(createdPlayer)
    })

    it('should validate required fields', async () => {
      const invalidPlayer = {
        phone_number: '+6591234569',
        organizer_id: mockOrganizerId,
      }

      await expect(playerService.createPlayer(invalidPlayer as any)).rejects.toThrow(
        'Player name is required'
      )
    })

    it('should validate phone number format', async () => {
      const invalidPlayer = {
        name: 'Test Player',
        phone_number: 'invalid-phone',
        organizer_id: mockOrganizerId,
      }

      await expect(playerService.createPlayer(invalidPlayer)).rejects.toThrow(
        'Invalid phone number format'
      )
    })

    it('should handle duplicate phone number errors', async () => {
      const duplicatePlayer = {
        name: 'Duplicate Player',
        phone_number: '+6591234567',
        organizer_id: mockOrganizerId,
      }

      const mockError = { 
        code: '23505', // PostgreSQL unique violation
        message: 'duplicate key value violates unique constraint'
      }

      mockSupabase.select.mockResolvedValue({ data: null, error: mockError })

      await expect(playerService.createPlayer(duplicatePlayer)).rejects.toThrow(
        'Player with this phone number already exists'
      )
    })
  })

  describe('updatePlayer', () => {
    it('should update existing player', async () => {
      const updateData = {
        name: 'Updated Name',
        notes: 'Updated notes'
      }

      const updatedPlayer = {
        id: mockPlayerId,
        name: 'Updated Name',
        phone_number: '+6591234567',
        organizer_id: mockOrganizerId,
        notes: 'Updated notes',
        is_active: true,
        updated_at: new Date().toISOString()
      }

      mockSupabase.select.mockResolvedValue({ data: [updatedPlayer], error: null })

      const result = await playerService.updatePlayer(mockOrganizerId, mockPlayerId, updateData)

      expect(mockSupabase.from).toHaveBeenCalledWith('players')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('organizer_id', mockOrganizerId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockPlayerId)
      expect(result).toEqual(updatedPlayer)
    })

    it('should prevent updating to duplicate phone number', async () => {
      const updateData = {
        phone_number: '+6591234568' // Existing phone number
      }

      const mockError = { 
        code: '23505',
        message: 'duplicate key value violates unique constraint'
      }

      mockSupabase.select.mockResolvedValue({ data: null, error: mockError })

      await expect(
        playerService.updatePlayer(mockOrganizerId, mockPlayerId, updateData)
      ).rejects.toThrow('Phone number already exists')
    })
  })

  describe('togglePlayerStatus', () => {
    it('should deactivate active player', async () => {
      const deactivatedPlayer = {
        id: mockPlayerId,
        name: 'John Doe',
        is_active: false,
        updated_at: new Date().toISOString()
      }

      mockSupabase.select.mockResolvedValue({ data: [deactivatedPlayer], error: null })

      const result = await playerService.togglePlayerStatus(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(String)
      })
      expect(result).toEqual(deactivatedPlayer)
    })

    it('should activate inactive player', async () => {
      // First call to check current status
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: { is_active: false }, error: null })
      
      const activatedPlayer = {
        id: mockPlayerId,
        name: 'John Doe', 
        is_active: true,
        updated_at: new Date().toISOString()
      }

      mockSupabase.select.mockResolvedValue({ data: [activatedPlayer], error: null })

      const result = await playerService.togglePlayerStatus(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_active: true,
        updated_at: expect.any(String)
      })
      expect(result).toEqual(activatedPlayer)
    })
  })

  describe('deletePlayer', () => {
    it('should soft delete player with existing balances', async () => {
      // Mock player has balance history
      mockSupabase.single
        .mockResolvedValueOnce({ data: { has_balance_history: true }, error: null })

      const deactivatedPlayer = {
        id: mockPlayerId,
        is_active: false,
        updated_at: new Date().toISOString()
      }

      mockSupabase.select.mockResolvedValue({ data: [deactivatedPlayer], error: null })

      const result = await playerService.deletePlayer(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(String)
      })
      expect(result.deleted).toBe(false) // Soft delete
      expect(result.player).toEqual(deactivatedPlayer)
    })

    it('should hard delete player without balance history', async () => {
      // Mock player has no balance history
      mockSupabase.single
        .mockResolvedValueOnce({ data: { has_balance_history: false }, error: null })

      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const result = await playerService.deletePlayer(mockOrganizerId, mockPlayerId)

      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(result.deleted).toBe(true) // Hard delete
      expect(result.player).toBeNull()
    })
  })

  describe('searchPlayers', () => {
    it('should search players by name', async () => {
      const searchResults = [
        { id: mockPlayerId, name: 'John Doe', phone_number: '+6591234567' }
      ]

      mockSupabase.single.mockResolvedValue({ data: searchResults, error: null })

      const result = await playerService.searchPlayers(mockOrganizerId, 'John')

      expect(mockSupabase.from).toHaveBeenCalledWith('players')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      // Should search in name field
      expect(result).toEqual(searchResults)
    })

    it('should search players by phone number', async () => {
      const searchResults = [
        { id: mockPlayerId, name: 'John Doe', phone_number: '+6591234567' }
      ]

      mockSupabase.single.mockResolvedValue({ data: searchResults, error: null })

      const result = await playerService.searchPlayers(mockOrganizerId, '91234567')

      expect(result).toEqual(searchResults)
    })

    it('should return empty results for no matches', async () => {
      mockSupabase.single.mockResolvedValue({ data: [], error: null })

      const result = await playerService.searchPlayers(mockOrganizerId, 'NonExistent')

      expect(result).toEqual([])
    })
  })
})