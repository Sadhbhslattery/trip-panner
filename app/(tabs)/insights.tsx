import ScreenHeader from '@/components/ui/screen-header';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

type ViewMode = 'category' | 'trip' | 'targets';

export default function InsightsScreen() {
  const context = useContext(TripContext);
  const [viewMode, setViewMode] = useState<ViewMode>('category');

  if (!context) return null;
  const { trips, activities, categories, targets } = context;

  // ---- Category breakdown ----
  const categoryData = categories.map((cat) => {
    const catActivities = activities.filter((a) => a.categoryId === cat.id);
    const totalMinutes = catActivities.reduce((sum, a) => sum + a.duration, 0);
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      colour: cat.colour,
      count: catActivities.length,
      totalMinutes,
    };
  });

  const maxMinutes = Math.max(...categoryData.map((c) => c.totalMinutes), 1);

  // ---- Trip summary ----
  const tripData = trips.map((trip) => {
    const tripActs = activities.filter((a) => a.tripId === trip.id);
    const totalMin = tripActs.reduce((sum, a) => sum + a.duration, 0);
    return {
      id: trip.id,
      name: trip.name,
      activityCount: tripActs.length,
      totalMinutes: totalMin,
      totalHours: (totalMin / 60).toFixed(1),
    };
  });

  // ---- Target progress ----
  const targetData = targets.map((target) => {
    const relevantActivities = target.categoryId
      ? activities.filter((a) => a.categoryId === target.categoryId)
      : activities;

    const current = relevantActivities.length;
    const progress = Math.min(current / target.targetValue, 1);
    const catName = target.categoryId
      ? categories.find((c) => c.id === target.categoryId)?.name || 'Unknown'
      : 'All categories';

    return {
      id: target.id,
      label: `${catName} (${target.targetType})`,
      current,
      goal: target.targetValue,
      progress,
      met: current >= target.targetValue,
    };
  });

  // ---- Overall stats ----
  const totalActivities = activities.length;
  const totalMinutes = activities.reduce((sum, a) => sum + a.duration, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Insights" subtitle={`${totalActivities} activities · ${totalHours} hours total`} />

      <View style={styles.tabRow}>
        {(['category', 'trip', 'targets'] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            style={[styles.tab, viewMode === mode && styles.tabActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.tabText, viewMode === mode && styles.tabTextActive]}>
              {mode === 'category' ? 'By Category' : mode === 'trip' ? 'By Trip' : 'Targets'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {viewMode === 'category' ? (
          <>
            <Text style={styles.chartTitle}>Time spent by category (minutes)</Text>
            {categoryData.map((cat) => (
              <View key={cat.id} style={styles.barRow}>
                <Text style={styles.barLabel}>
                  {cat.icon} {cat.name}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: cat.colour,
                        width: `${(cat.totalMinutes / maxMinutes) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{cat.totalMinutes}m</Text>
              </View>
            ))}

            <Text style={[styles.chartTitle, { marginTop: 28 }]}>Activity count by category</Text>
            {categoryData.map((cat) => (
              <View key={cat.id} style={styles.statRow}>
                <View style={[styles.dot, { backgroundColor: cat.colour }]} />
                <Text style={styles.statLabel}>{cat.name}</Text>
                <Text style={styles.statValue}>{cat.count}</Text>
              </View>
            ))}
          </>
        ) : null}

        {viewMode === 'trip' ? (
          <>
            <Text style={styles.chartTitle}>Trip summaries</Text>
            {tripData.map((trip) => (
              <View key={trip.id} style={styles.tripStatCard}>
                <Text style={styles.tripStatName}>{trip.name}</Text>
                <View style={styles.tripStatRow}>
                  <Text style={styles.tripStatLabel}>Activities</Text>
                  <Text style={styles.tripStatValue}>{trip.activityCount}</Text>
                </View>
                <View style={styles.tripStatRow}>
                  <Text style={styles.tripStatLabel}>Total time</Text>
                  <Text style={styles.tripStatValue}>{trip.totalHours} hrs</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        {viewMode === 'targets' ? (
          <>
            <Text style={styles.chartTitle}>Target progress</Text>
            {targetData.length === 0 ? (
              <Text style={styles.emptyText}>No targets set yet.</Text>
            ) : null}
            {targetData.map((t) => (
              <View key={t.id} style={styles.targetCard}>
                <View style={styles.targetHeader}>
                  <Text style={styles.targetLabel}>{t.label}</Text>
                  <Text style={[styles.targetStatus, t.met ? styles.targetMet : styles.targetUnmet]}>
                    {t.met ? 'Met!' : `${t.goal - t.current} to go`}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${t.progress * 100}%`,
                        backgroundColor: t.met ? '#2E9E6B' : '#3B8BD4',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {t.current} / {t.goal}
                </Text>
              </View>
            ))}
          </>
        ) : null}
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tab: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  tabText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 30,
    paddingTop: 16,
  },
  chartTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  barRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  barLabel: {
    color: '#374151',
    fontSize: 13,
    width: 110,
  },
  barTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    flex: 1,
    height: 18,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 6,
    height: 18,
  },
  barValue: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'right',
    width: 45,
  },
  statRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    marginRight: 8,
    width: 10,
  },
  statLabel: {
    color: '#374151',
    flex: 1,
    fontSize: 14,
  },
  statValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  tripStatCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  tripStatName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  tripStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tripStatLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  tripStatValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  targetCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  targetLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  targetStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  targetMet: {
    color: '#2E9E6B',
  },
  targetUnmet: {
    color: '#D4853A',
  },
  progressTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 6,
    height: 12,
  },
  progressText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});
