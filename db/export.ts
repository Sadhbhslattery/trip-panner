/**
 * CSV Export (Advanced Feature no.5)
 * Exports a  single hen's full activity plan as a CSV file and hands it to the OS share sheet
 * so the user can send it to WhatsApp, Mail, Drive etc. 
 * 
 * Design decisions:
 *  - uses the new SDK 54 object orientated 'file'/'paths' API from expo file system rather than
 * the deprecated string path helpers [R1]. the new API is recommended for any project targeting SDK 52 plus.
 *  - files are written into the app's document directory, which on both iOS and androif is scoped to the app. 
 * This keeps user data private and respects the 'local only by default' privacy from the brief. 
 *  - CSV escaping follows RFC 4180 [R2]: fields containing commas, quotes or newlines are wrapped in double quotes, with embedded quotes doubled.  
 * Without this, a note like 'Dinner, 7:30pm' would break the file. 
 * - A trip summary block is added at the bottom so the person reading it see the headline numnbers 
 * (total, per person, budget) without scrolling back up. 
 * 
 * Key references: expo-file-system docs [R1], expo-sharing docs [R3], RFC 4180 CSV specification [R2]
 */

import type { Activity, Category, Trip } from '@/app/_layout';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** 
 * Escapes a single CSV field per RFC 4180 [R2].
 * Only fields containing commas, quotes or newlines need wrapping.
 * Embedded double quotes are doubled (`"` to `""`).
 */
function escapeCsvField(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a CSV string for a single trip and passes it to the OS share sheet.
 * If sharing is unavailable (rare - e.g. a simulator without a share sheet),
 * the file is still written to disk but not surfaced to the user.
 */
export async function exportTripToCSV(
  trip: Trip,
  activities: Activity[],
  categories: Category[]
): Promise<void> {
// Derive only the activities for this specific trip
  const tripActivities = activities.filter((a) => a.tripId === trip.id);
  const total = tripActivities.reduce((sum, a) => sum + a.cost, 0);
  const perPerson = trip.guestCount > 0 ? Math.round(total / trip.guestCount) : 0;

// CSV header row — must match the order of fields below
  const headers = ['Date', 'Activity', 'Category', 'Duration (mins)', 'Cost (€)', 'Notes'];
    // One row per activity, with category looked up by id and all fields escaped
  const rows = tripActivities.map((a) => {
    const cat = categories.find((c) => c.id === a.categoryId);
    return [
      a.date,
      escapeCsvField(a.name),
      escapeCsvField(cat?.name ?? 'Uncategorised'),
      a.duration.toString(),
      a.cost.toString(),
      escapeCsvField(a.notes),
    ].join(',');
  });

// Summary block appended at the bottom of the CSV for quick reference
  const summary = [
    '',
    `Trip,${escapeCsvField(trip.name)}`,
    `Destination,${escapeCsvField(trip.destination)}`,
    `Dates,${trip.startDate} to ${trip.endDate}`,
    `Guests,${trip.guestCount}`,
    `Total Cost,€${total}`,
    `Per Person,€${perPerson}`,
    `Budget,€${trip.budget}`,
  ].join('\n');

  const csv = [headers.join(','), ...rows, summary].join('\n');

  // File name is derived from the hen name, stripped of any non-alphanumerics
  // to stay safe across both iOS and Android file systems
  const safeName = trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  // SDK 54 object API: File/Paths replaces the old documentDirectory string [R1]
  const file = new File(Paths.document, `${safeName}_plan.csv`);

  // Overwrite any previous export for this hen
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  // Hand the file to the OS share sheet [R3]
  // UTI is the iOS uniform type identifier for CSV, Android ignores it
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: `Share ${trip.name} plan`,
      UTI: 'public.comma-separated-values-text',
    });
  }
}