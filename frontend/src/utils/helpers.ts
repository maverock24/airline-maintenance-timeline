// src/utils/helpers.ts
export const getStatusSymbol = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed': return '✅';
    case 'in progress': return '🔧';
    case 'open': return '📋';
    case 'cancelled': return '❌';
    default: return '📝';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed': return '#38a169'; // Muted green
    case 'in progress': return '#d69e2e'; // Muted amber
    case 'open': return '#3182ce'; // Muted blue
    case 'cancelled': return '#e53e3e'; // Muted red
    default: return '#718096'; // Muted gray
  }
};