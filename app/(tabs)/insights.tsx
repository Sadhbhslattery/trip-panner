import ScreenHeader from '@/components/ui/screen-header';
import { useColors } from '@/hooks/useColors';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

type Mode = 'spending' | 'time' | 'hens' | 'targets';

export default function InsightsScreen() {
  const context = useContext(TripContext);
  const c = useColors();
  const [mode, setMode] = useState<Mode>('spending');

  if (!context) return null;
  const { trips, activities, categories, targets } = context;

  const totalAll = activities.reduce((s, a) => s + a.cost, 0);

  const spending = categories.map((cat) => {
    const acts = activities.filter((a) => a.categoryId === cat.id);
    return { ...cat, total: acts.reduce((s, a) => s + a.cost, 0) };
  }).filter((x) => x.total > 0);
  const maxSpend = Math.max(...spending.map((x) => x.total), 1);

  const time = categories.map((cat) => {
    const acts = activities.filter((a) => a.categoryId === cat.id);
    return { ...cat, mins: acts.reduce((s, a) => s + a.duration, 0) };
  }).filter((x) => x.mins > 0);
  const maxMin = Math.max(...time.map((x) => x.mins), 1);

  const hens = trips.map((t) => {
    const acts = activities.filter((a) => a.tripId === t.id);
    const cost = acts.reduce((s, a) => s + a.cost, 0);
    return { ...t, cost, pp: t.guestCount > 0 ? Math.round(cost / t.guestCount) : 0, left: t.budget - cost, acts: acts.length };
  });

  const tgts = targets.map((t) => {
    const rel = t.categoryId ? activities.filter((a) => a.categoryId === t.categoryId) : activities;
    const catName = t.categoryId ? categories.find((x) => x.id === t.categoryId)?.name || '?' : 'All';
    return { id: t.id, label: `${catName} (${t.targetType})`, cur: rel.length, goal: t.targetValue, met: rel.length >= t.targetValue };
  });

  const tabs: { key: Mode; label: string }[] = [
    { key: 'spending', label: 'Spending' }, { key: 'time', label: 'Time' },
    { key: 'hens', label: 'By Hen' }, { key: 'targets', label: 'Targets' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Insights" subtitle={`€${totalAll} across ${trips.length} hens`} />
      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable key={t.key}
            style={[styles.tab, { backgroundColor: c.card, borderColor: c.border }, mode === t.key && { backgroundColor: c.accent, borderColor: c.accent }]}
            onPress={() => setMode(t.key)}>
            <Text style={[{ color: c.textSoft, fontSize: 13, fontWeight: '600' }, mode === t.key && { color: '#FFF' }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, paddingTop: 16 }}>
        {mode === 'spending' ? spending.map((cat) => (
          <View key={cat.id} style={styles.barRow}>
            <Text style={{ color: c.textSoft, fontSize: 13, width: 110 }}>{cat.icon} {cat.name}</Text>
            <View style={[styles.track, { backgroundColor: c.trackBg }]}>
              <View style={[styles.fill, { backgroundColor: cat.colour, width: `${(cat.total / maxSpend) * 100}%` }]} />
            </View>
            <Text style={{ color: c.textFaint, fontSize: 12, width: 50, textAlign: 'right' }}>€{cat.total}</Text>
          </View>
        )) : null}
        {mode === 'time' ? time.map((cat) => (
          <View key={cat.id} style={styles.barRow}>
            <Text style={{ color: c.textSoft, fontSize: 13, width: 110 }}>{cat.icon} {cat.name}</Text>
            <View style={[styles.track, { backgroundColor: c.trackBg }]}>
              <View style={[styles.fill, { backgroundColor: cat.colour, width: `${(cat.mins / maxMin) * 100}%` }]} />
            </View>
            <Text style={{ color: c.textFaint, fontSize: 12, width: 50, textAlign: 'right' }}>{cat.mins}m</Text>
          </View>
        )) : null}
        {mode === 'hens' ? hens.map((h) => (
          <View key={h.id} style={[styles.henCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>{h.name}</Text>
            <View style={styles.henRow}><Text style={{ color: c.textSoft }}>Total</Text><Text style={{ color: c.text, fontWeight: '600' }}>€{h.cost}</Text></View>
            <View style={styles.henRow}><Text style={{ color: c.textSoft }}>Per person ({h.guestCount})</Text><Text style={{ color: c.text, fontWeight: '600' }}>€{h.pp}</Text></View>
            <View style={styles.henRow}><Text style={{ color: c.textSoft }}>Activities</Text><Text style={{ color: c.text, fontWeight: '600' }}>{h.acts}</Text></View>
            {h.budget > 0 ? (
              <>
                <View style={[styles.progTrack, { backgroundColor: c.trackBg }]}>
                  <View style={[styles.progFill, { width: `${Math.min((h.cost / h.budget) * 100, 100)}%`, backgroundColor: h.left >= 0 ? c.success : c.danger }]} />
                </View>
                <Text style={{ color: h.left >= 0 ? c.success : c.danger, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                  {h.left >= 0 ? `€${h.left} of €${h.budget} left` : `€${Math.abs(h.left)} over €${h.budget}`}
                </Text>
              </>
            ) : null}
          </View>
        )) : null}
        {mode === 'targets' ? tgts.map((t) => (
          <View key={t.id} style={[styles.henCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{t.label}</Text>
              <Text style={{ color: t.met ? c.success : '#D4853A', fontSize: 13, fontWeight: '700' }}>{t.met ? 'Done!' : `${t.goal - t.cur} to go`}</Text>
            </View>
            <View style={[styles.progTrack, { backgroundColor: c.trackBg }]}>
              <View style={[styles.progFill, { width: `${Math.min((t.cur / t.goal) * 100, 100)}%`, backgroundColor: t.met ? c.success : c.accent }]} />
            </View>
            <Text style={{ color: c.textFaint, fontSize: 12, marginTop: 4 }}>{t.cur} / {t.goal}</Text>
          </View>
        )) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tab: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  barRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  track: { borderRadius: 6, flex: 1, height: 18, marginHorizontal: 8, overflow: 'hidden' },
  fill: { borderRadius: 6, height: 18 },
  henCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 14 },
  henRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progTrack: { borderRadius: 6, height: 10, marginTop: 8, overflow: 'hidden' },
  progFill: { borderRadius: 6, height: 10 },
});
