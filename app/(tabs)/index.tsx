import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

export default function IndexScreen() {
  const router = useRouter();
  const context = useContext(TripContext);
  const [searchText, setSearchText] = useState('');

  if (!context) return null;

  const { trips, activities } = context;

  const filteredTrips = trips.filter((trip) => {
    const query = searchText.toLowerCase();
    return (
      trip.name.toLowerCase().includes(query) ||
      trip.destination.toLowerCase().includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="My Trips"
        subtitle={`${trips.length} trips planned`}
      />

      <PrimaryButton
        label="+ Add Trip"
        onPress={() => router.push('/add-trip')}
      />

      <TextInput
        style={styles.searchBar}
        placeholder="Search trips..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTrips.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchText ? 'No trips match your search.' : 'No trips yet. Add one!'}
          </Text>
        ) : null}

        {filteredTrips.map((trip) => {
          const tripActivities = activities.filter((a) => a.tripId === trip.id);
          return (
            <Pressable
              key={trip.id}
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/trip/[id]', params: { id: trip.id.toString() } })
              }
            >
              <Text style={styles.tripName}>{trip.name}</Text>
              <Text style={styles.destination}>{trip.destination}</Text>

              <View style={styles.tags}>
                <InfoTag label="From" value={trip.startDate} />
                <InfoTag label="To" value={trip.endDate} />
              </View>

              <Text style={styles.activityCount}>
                {tripActivities.length}{' '}
                {tripActivities.length === 1 ? 'activity' : 'activities'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  tripName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  destination: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  activityCount: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    marginTop: 30,
    textAlign: 'center',
  },
});
