import ScreenHeader from '@/components/ui/screen-header';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

type ViewMode = 'spending' | 'time' | 'hens' | 'targets';

export default function InsightsScreen() {
  const context = useContext(TripContext);
  const [viewMode, setViewMode] = useState<ViewMode>('spending');

  if (!context) return null;
  const { trips, activities, categories, targets } = context;

  // ---- Spending by category ----
  const spendingData = categories.map((cat) => {
    const catActivities = activities.filter((a) => a.categoryId === cat.id);
    const totalCost = catActivities.reduce((sum, a) => sum + a.cost, 0);
    return { id: cat.id, name: cat.name, icon: cat.icon, colour: cat.colour, totalCost, count: catActivities.length };
  }).filter((c) => c.totalCost > 0);

  const maxSpend = Math.max(...spendingData.map((c) => c.totalCost), 1);
  const totalSpendAll = activities.reduce((sum, a) => sum + a.cost, 0);

  // ---- Time by category ----
  const timeData = categories.map((cat) => {
    const catActivities = activities.filter((a) => a.categoryId === cat.id);
    const totalMinutes = catActivities.reduce((sum, a) => sum + a.duration, 0);
    return { id: cat.id, name: cat.name, icon: cat.icon, colour: cat.colour, totalMinutes, count: catActivities.length };
  }).filter((c) => c.totalMinutes > 0);

  const maxMinutes = Math.max(...timeData.map((c) => c.totalMinutes), 1);

  // ---- Per-hen budget comparison ----
  const henData = trips.map((trip) => {
    const tripActs = activities.filter((a) => a.tripId === trip.id);
    const totalCost = tripActs.reduce((sum, a) => sum + a.cost, 0);
    const perPerson = trip.guestCount > 0 ? Math.round(totalCost / trip.guestCount) : 0;
    const budgetLeft = trip.budget - totalCost;
    return {
      id: trip.id, name: trip.name, totalCost, perPerson,
      budget: trip.budget, budgetLeft, guestCount: trip.guestCount,
      activityCount: tripActs.length,
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
      id: target.id, label: `${catName} (${target.targetType})`,
      current, goal: target.targetValue, progress, met: current >= target.targetValue,
    };
  });

  const tabs: { key: ViewMode; label: string }[] = [
    { key: 'spending', label: 'Spending' },
    { key: 'time', label: 'Time' },
    { key: 'hens', label: 'By Hen' },
    { key: 'targets', label: 'Targets' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Insights" subtitle={`€${totalSpendAll} total across ${trips.length} hens`} />

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, viewMode === tab.key && styles.tabActive]}
            onPress={() => setViewMode(tab.key)}
          >
            <Text style={[styles.tabText, viewMode === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {viewMode === 'spending' ? (
          <>
            <Text style={styles.chartTitle}>Spending by category</Text>
            {spendingData.length === 0 ? (
              <Text style={styles.emptyText}>No spending logged yet.</Text>
            ) : null}
            {spendingData.map((cat) => (
              <View key={cat.id} style={styles.barRow}>
                <Text style={styles.barLabel}>{cat.icon} {cat.name}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { backgroundColor: cat.colour, width: `${(cat.totalCost / maxSpend) * 100}%` }]}
                  />
                </View>
                <Text style={styles.barValue}>€{cat.totalCost}</Text>
              </View>
            ))}
          </>
        ) : null}

        {viewMode === 'time' ? (
          <>
            <Text style={styles.chartTitle}>Time by category (minutes)</Text>
            {timeData.length === 0 ? (
              <Text style={styles.emptyText}>No durations logged yet.</Text>
            ) : null}
            {timeData.map((cat) => (
              <View key={cat.id} style={styles.barRow}>
                <Text style={styles.barLabel}>{cat.icon} {cat.name}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { backgroundColor: cat.colour, width: `${(cat.totalMinutes / maxMinutes) * 100}%` }]}
                  />
                </View>
                <Text style={styles.barValue}>{cat.totalMinutes}m</Text>
              </View>
            ))}
          </>
        ) : null}

        {viewMode === 'hens' ? (
          <>
            <Text style={styles.chartTitle}>Budget by hen</Text>
            {henData.map((hen) => (
              <View key={hen.id} style={styles.henCard}>
                <Text style={styles.henName}>{hen.name}</Text>
                <View style={styles.henRow}>
                  <Text style={styles.henLabel}>Total cost</Text>
                  <Text style={styles.henValue}>€{hen.totalCost}</Text>
                </View>
                <View style={styles.henRow}>
                  <Text style={styles.henLabel}>Per person ({hen.guestCount} guests)</Text>
                  <Text style={styles.henValue}>€{hen.perPerson}</Text>
                </View>
                <View style={styles.henRow}>
                  <Text style={styles.henLabel}>Activities</Text>
                  <Text style={styles.henValue}>{hen.activityCount}</Text>
                </View>
                {hen.budget > 0 ? (
                  <>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min((hen.totalCost / hen.budget) * 100, 100)}%`,
                            backgroundColor: hen.budgetLeft >= 0 ? '#2E9E6B' : '#DC2626',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.budgetNote, hen.budgetLeft < 0 && styles.overBudget]}>
                      {hen.budgetLeft >= 0
                        ? `€${hen.budgetLeft} of €${hen.budget} remaining`
                        : `€${Math.abs(hen.budgetLeft)} over the €${hen.budget} budget`}
                    </Text>
                  </>
                ) : null}
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
                    {t.met ? 'Done!' : `${t.goal - t.current} to go`}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${t.progress * 100}%`, backgroundColor: t.met ? '#2E9E6B' : '#D4537E' }]}
                  />
                </View>
                <Text style={styles.progressText}>{t.current} / {t.goal}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FFF8FA', flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tab: { backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  tabActive: { backgroundColor: '#D4537E', borderColor: '#D4537E' },
  tabText: { color: '#334155', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { paddingBottom: 30, paddingTop: 16 },
  chartTitle: { color: '#1F1126', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  barRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  barLabel: { color: '#374151', fontSize: 13, width: 110 },
  barTrack: { backgroundColor: '#F3F4F6', borderRadius: 6, flex: 1, height: 18, marginHorizontal: 8, overflow: 'hidden' },
  barFill: { borderRadius: 6, height: 18 },
  barValue: { color: '#6B7280', fontSize: 12, textAlign: 'right', width: 50 },
  henCard: { backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 14 },
  henName: { color: '#1F1126', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  henRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  henLabel: { color: '#6B7280', fontSize: 14 },
  henValue: { color: '#1F1126', fontSize: 14, fontWeight: '600' },
  progressTrack: { backgroundColor: '#F3F4F6', borderRadius: 6, height: 10, marginTop: 8, overflow: 'hidden' },
  progressFill: { borderRadius: 6, height: 10 },
  budgetNote: { color: '#2E9E6B', fontSize: 13, fontWeight: '600', marginTop: 4 },
  overBudget: { color: '#DC2626' },
  targetCard: { backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 14 },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  targetLabel: { color: '#1F1126', fontSize: 14, fontWeight: '600' },
  targetStatus: { fontSize: 13, fontWeight: '700' },
  targetMet: { color: '#2E9E6B' },
  targetUnmet: { color: '#D4853A' },
  progressText: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
});
