import type { Activity, Category, Trip } from '@/app/_layout';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function escapeCsvField(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportTripToCSV(
  trip: Trip,
  activities: Activity[],
  categories: Category[]
): Promise<void> {
  const tripActivities = activities.filter((a) => a.tripId === trip.id);
  const total = tripActivities.reduce((sum, a) => sum + a.cost, 0);
  const perPerson = trip.guestCount > 0 ? Math.round(total / trip.guestCount) : 0;

  const headers = ['Date', 'Activity', 'Category', 'Duration (mins)', 'Cost (€)', 'Notes'];
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

  const safeName = trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const file = new File(Paths.document, `${safeName}_plan.csv`);

  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: `Share ${trip.name} plan`,
      UTI: 'public.comma-separated-values-text',
    });
  }
}