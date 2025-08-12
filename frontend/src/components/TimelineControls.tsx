import React from 'react';
import { TimelineControlsProps } from '../utils/types';
import './TimelineControls.css';

const TimelineControls: React.FC<TimelineControlsProps> = ({
  dropdownRef,
  registrationDropdownOpen,
  setRegistrationDropdownOpen,
  getSelectedRegistrationsText,
  handleSelectAllRegistrations,
  filteredRegistrations,
  allRegistrations,
  handleRegistrationFilter,
  clearFilters,
}) => (
  <div className='timeline-controls'>
    <div className='timeline-control-group'>
      <div className='dropdown-container' ref={dropdownRef}>
        <button
          className='dropdown-trigger'
          onClick={() => setRegistrationDropdownOpen((p) => !p)}
        >
          <span className='dropdown-text'>
            {getSelectedRegistrationsText()}
          </span>
          <span
            className={`dropdown-arrow ${registrationDropdownOpen ? 'open' : ''}`}
          >
            ▼
          </span>
        </button>
        {registrationDropdownOpen && (
          <div className='dropdown-menu'>
            <div className='dropdown-header'>
              <button
                className='select-all-btn'
                onClick={handleSelectAllRegistrations}
              >
                {filteredRegistrations.length === allRegistrations.length
                  ? '🗹 Deselect All'
                  : '☐ Select All'}
              </button>
              <button
                className='close-dropdown-btn'
                onClick={() => setRegistrationDropdownOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className='dropdown-options'>
              {allRegistrations.map((reg) => (
                <label key={reg} className='dropdown-option'>
                  <input
                    type='checkbox'
                    checked={
                      !filteredRegistrations.length ||
                      filteredRegistrations.includes(reg)
                    }
                    onChange={() => handleRegistrationFilter(reg)}
                  />
                  <span className='registration-badge-dropdown'>{reg}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    <div className='timeline-control-group'>
      <button onClick={clearFilters} className='clear-filters-btn compact'>
        Clear
      </button>
    </div>
  </div>
);

export default TimelineControls;
