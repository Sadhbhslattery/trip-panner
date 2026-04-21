import FormField from '@/components/ui/form-field';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

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
    expect(getByText('Destination')).toBeTruthy();
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
    fireEvent.changeText(getByPlaceholderText('Where to?'), 'Galway');
    expect(handleChange).toHaveBeenCalledWith('Galway');
  });

  it('falls back to the label as placeholder when none provided', () => {
    const { getByPlaceholderText } = render(
      <FormField label="Trip Name" value="" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Trip Name')).toBeTruthy();
  });
});