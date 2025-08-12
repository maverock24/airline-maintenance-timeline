import { getStatusSymbol, getStatusColor } from '../../utils/helpers';

describe('Helper Functions', () => {
  describe('getStatusSymbol', () => {
    it('returns correct symbol for completed status', () => {
      expect(getStatusSymbol('completed')).toBe('✅');
      expect(getStatusSymbol('Completed')).toBe('✅');
      expect(getStatusSymbol('COMPLETED')).toBe('✅');
    });

    it('returns correct symbol for in progress status', () => {
      expect(getStatusSymbol('in progress')).toBe('🔧');
      expect(getStatusSymbol('In Progress')).toBe('🔧');
      expect(getStatusSymbol('IN PROGRESS')).toBe('🔧');
    });

    it('returns correct symbol for open status', () => {
      expect(getStatusSymbol('open')).toBe('📋');
      expect(getStatusSymbol('Open')).toBe('📋');
      expect(getStatusSymbol('OPEN')).toBe('📋');
    });

    it('returns correct symbol for cancelled status', () => {
      expect(getStatusSymbol('cancelled')).toBe('❌');
      expect(getStatusSymbol('Cancelled')).toBe('❌');
      expect(getStatusSymbol('CANCELLED')).toBe('❌');
    });

    it('returns default symbol for unknown status', () => {
      expect(getStatusSymbol('unknown')).toBe('📝');
      expect(getStatusSymbol('pending')).toBe('📝');
      expect(getStatusSymbol('')).toBe('📝');
    });
  });

  describe('getStatusColor', () => {
    it('returns correct color for completed status', () => {
      expect(getStatusColor('completed')).toBe('#38a169');
      expect(getStatusColor('Completed')).toBe('#38a169');
      expect(getStatusColor('COMPLETED')).toBe('#38a169');
    });

    it('returns correct color for in progress status', () => {
      expect(getStatusColor('in progress')).toBe('#d69e2e');
      expect(getStatusColor('In Progress')).toBe('#d69e2e');
      expect(getStatusColor('IN PROGRESS')).toBe('#d69e2e');
    });

    it('returns correct color for open status', () => {
      expect(getStatusColor('open')).toBe('#3182ce');
      expect(getStatusColor('Open')).toBe('#3182ce');
      expect(getStatusColor('OPEN')).toBe('#3182ce');
    });

    it('returns correct color for cancelled status', () => {
      expect(getStatusColor('cancelled')).toBe('#e53e3e');
      expect(getStatusColor('Cancelled')).toBe('#e53e3e');
      expect(getStatusColor('CANCELLED')).toBe('#e53e3e');
    });

    it('returns default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('#718096');
      expect(getStatusColor('pending')).toBe('#718096');
      expect(getStatusColor('')).toBe('#718096');
    });
  });

  describe('Case insensitive behavior', () => {
    it('handles mixed case status strings correctly', () => {
      expect(getStatusSymbol('CoMpLeTeD')).toBe('✅');
      expect(getStatusColor('CoMpLeTeD')).toBe('#38a169');

      expect(getStatusSymbol('iN pRoGrEsS')).toBe('🔧');
      expect(getStatusColor('iN pRoGrEsS')).toBe('#d69e2e');
    });
  });
});
