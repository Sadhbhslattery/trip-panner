import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { activities as activitiesTable, trips as tripsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
