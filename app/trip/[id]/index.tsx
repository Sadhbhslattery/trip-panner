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
  const totalCost = tripActivities.reduce((sum, a) => sum + a.cost, 0);
  const perPerson = trip.guestCount > 0 ? Math.round(totalCost / trip.guestCount) : 0;
  const budgetLeft = trip.budget - totalCost;
  const budgetPercent = trip.budget > 0 ? Math.min((totalCost / trip.budget) * 100, 100) : 0;

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
          <InfoTag label="Guests" value={trip.guestCount.toString()} />
        </View>

        {trip.notes ? (
          <Text style={styles.notes}>{trip.notes}</Text>
        ) : null}

        {/* Budget summary card */}
        <View style={styles.budgetCard}>
          <Text style={styles.budgetTitle}>Budget</Text>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Total spent</Text>
            <Text style={styles.budgetValue}>€{totalCost}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Per person ({trip.guestCount} guests)</Text>
            <Text style={styles.budgetValue}>€{perPerson}</Text>
          </View>
          {trip.budget > 0 ? (
            <>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Budget</Text>
                <Text style={styles.budgetValue}>€{trip.budget}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${budgetPercent}%`,
                      backgroundColor: budgetLeft >= 0 ? '#2E9E6B' : '#DC2626',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.budgetRemaining, budgetLeft < 0 && styles.overBudget]}>
                {budgetLeft >= 0 ? `€${budgetLeft} remaining` : `€${Math.abs(budgetLeft)} over budget!`}
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.buttonRow}>
          <PrimaryButton
            compact
            label="Edit Hen"
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
          <Text style={styles.emptyText}>No activities yet. Start planning!</Text>
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
              {activity.duration > 0 ? (
                <Text style={styles.metaText}>{activity.duration} min</Text>
              ) : null}
              <Text style={[styles.metaText, { color: getCategoryColour(activity.categoryId) }]}>
                {getCategoryName(activity.categoryId)}
              </Text>
            </View>

            <View style={styles.activityCostRow}>
              <Text style={styles.activityCost}>€{activity.cost}</Text>
              {trip.guestCount > 0 ? (
                <Text style={styles.activityPerPerson}>
                  (€{Math.round(activity.cost / trip.guestCount)}/person)
                </Text>
              ) : null}
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
          <PrimaryButton label="Delete Hen" variant="danger" onPress={deleteTrip} />
          <View style={styles.spacer} />
          <PrimaryButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFF8FA',
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
    fontStyle: 'italic',
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0C6D4',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  budgetTitle: {
    color: '#1F1126',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  budgetValue: {
    color: '#1F1126',
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    height: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 6,
    height: 10,
  },
  budgetRemaining: {
    color: '#2E9E6B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  overBudget: {
    color: '#DC2626',
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
    color: '#1F1126',
    fontSize: 20,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0C6D4',
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
    color: '#1F1126',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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
  activityCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  activityCost: {
    color: '#1F1126',
    fontSize: 15,
    fontWeight: '700',
  },
  activityPerPerson: {
    color: '#9CA3AF',
    fontSize: 12,
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
    color: '#D4537E',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteLink: {
    color: '#DC2626',
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
