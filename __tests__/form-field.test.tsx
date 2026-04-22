/**
 * FormField Component Test (Rubric: Testing — 2 of 3 required tests)
 * 
 * Validates that the reusable FormField component:
 * 1. Renders the provided label and placeholder correctly
 * 2. Fires its onChangeText callback when user input is simulated
 * 3. Falls back to using the label as placeholder when no explicit  placeholder prop is supplied (bonus test — confirms the default
 *behaviour that other screens rely on)
 *
 * Strategy:
 * - React Native Testing Library [R11] renders components in a JSDOM-equivalent environment, allowing us to query by text and
 * placeholder the same way a user would locate them.
 * - useColors is mocked with minimal stub values so the component can render without pulling in the full theme/context stack.
 * - fireEvent.changeText simulates a real user typing into the TextInput.
 */

import FormField from '@/components/ui/form-field';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// Stub useColors so FormField can render without the full theme context
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    text: '#000',
    textSoft: '#666',
    textFaint: '#999',
    input: '#fff',
    inputBorder: '#ccc',
  }),
}));

describe('FormField', () => {
  it('renders with the provided label and placeholder', () => {
    const { getByText, getByPlaceholderText } = render(
      <FormField
        label="Destination"
        value=""
        onChangeText={() => {}}
        placeholder="Where to?"
      />
    );
    // The label text should appear above the input
    expect(getByText('Destination')).toBeTruthy();
    // The placeholder should be set on the TextInput
    expect(getByPlaceholderText('Where to?')).toBeTruthy();
  });

  it('fires onChangeText when the user types', () => {
    const handleChange = jest.fn();
    const { getByPlaceholderText } = render(
      <FormField
        label="Destination"
        value=""
        onChangeText={handleChange}
        placeholder="Where to?"
      />
    );
    // Simulate typing — fireEvent.changeText is the RNTL equivalent of a real keystroke
    fireEvent.changeText(getByPlaceholderText('Where to?'), 'Galway');
    expect(handleChange).toHaveBeenCalledWith('Galway');
  });

  it('falls back to the label as placeholder when none provided', () => {
    // When no placeholder is supplied, the label is used as the placeholder.
    // This is the behaviour Add Activity and Edit screens rely on.
    const { getByPlaceholderText } = render(
      <FormField label="Trip Name" value="" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Trip Name')).toBeTruthy();
  });
});