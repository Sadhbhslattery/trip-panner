import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { activities as activitiesTable, trips as tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../../_layout';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(TripContext);

  if (!context) return null;

  const { trips, setTrips, activities, setActivities, categories } = context;

  const trip = trips.find((t) => t.id === Number(id));
  if (!trip) return null;

  const tripActivities = activities.filter((a) => a.tripId === trip.id);

  const getCategoryName = (categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  const getCategoryColour = (categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.colour : '#9CA3AF';
  };

  const getCategoryIcon = (categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.icon : '📌';
  };

  const deleteTrip = async () => {
    await db.delete(activitiesTable).where(eq(activitiesTable.tripId, Number(id)));
    await db.delete(tripsTable).where(eq(tripsTable.id, Number(id)));

    const tripRows = await db.select().from(tripsTable);
    const activityRows = await db.select().from(activitiesTable);
    setTrips(tripRows);
    setActivities(activityRows);
    router.back();
  };

  const deleteActivity = async (activityId: number) => {
    await db.delete(activitiesTable).where(eq(activitiesTable.id, activityId));
    const activityRows = await db.select().from(activitiesTable);
    setActivities(activityRows);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title={trip.name} subtitle={trip.destination} />

        <View style={styles.tags}>
          <InfoTag label="From" value={trip.startDate} />
          <InfoTag label="To" value={trip.endDate} />
        </View>

        {trip.notes ? (
          <Text style={styles.notes}>{trip.notes}</Text>
        ) : null}

        <View style={styles.buttonRow}>
          <PrimaryButton
            compact
            label="Edit Trip"
            onPress={() =>
              router.push({ pathname: '/trip/[id]/edit', params: { id } })
            }
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Activities ({tripActivities.length})
          </Text>
          <PrimaryButton
            compact
            label="+ Add"
            onPress={() =>
              router.push({
                pathname: '/trip/[id]/add-activity',
                params: { id },
              })
            }
          />
        </View>

        {tripActivities.length === 0 ? (
          <Text style={styles.emptyText}>No activities yet. Add one!</Text>
        ) : null}

        {tripActivities.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: getCategoryColour(activity.categoryId) },
                ]}
              />
              <Text style={styles.activityName}>
                {getCategoryIcon(activity.categoryId)} {activity.name}
              </Text>
            </View>

            <View style={styles.activityMeta}>
              <Text style={styles.metaText}>{activity.date}</Text>
              <Text style={styles.metaText}>{activity.duration} min</Text>
              <Text style={[styles.metaText, { color: getCategoryColour(activity.categoryId) }]}>
                {getCategoryName(activity.categoryId)}
              </Text>
            </View>

            {activity.notes ? (
              <Text style={styles.activityNotes}>{activity.notes}</Text>
            ) : null}

            <View style={styles.activityButtons}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/activity/[id]/edit',
                    params: { id: activity.id.toString() },
                  })
                }
              >
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => deleteActivity(activity.id)}>
                <Text style={styles.deleteLink}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={styles.bottomButtons}>
          <PrimaryButton label="Delete Trip" variant="danger" onPress={deleteTrip} />
          <View style={styles.spacer} />
          <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    padding: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  notes: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  activityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  categoryDot: {
    borderRadius: 6,
    height: 12,
    marginRight: 8,
    width: 12,
  },
  activityName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  metaText: {
    color: '#6B7280',
    fontSize: 13,
  },
  activityNotes: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 6,
  },
  activityButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  editLink: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteLink: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomButtons: {
    marginTop: 24,
    paddingBottom: 30,
  },
  spacer: {
    height: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});
