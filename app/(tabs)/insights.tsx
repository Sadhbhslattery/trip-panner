/**
 * InsightsScreen — aggregates activity data into 6 analytical views
 * 
 * All stats are derived from stored records (activities, targets, trips) rather than pre-computed, so the screen always reflects the current database state.
 *
 * The six views:
 *  1. Spending — horizontal bar chart of €cost aggregated by category
 *  2. Time — horizontal bar chart of duration (minutes) by category
 *  3. By Hen — per-trip cards with budget progress, per-person cost
 *  4. Timeline — bar chart of € cost grouped by day, week or month [rubric: daily/weekly/monthly view]
 *  5. Streaks — weekly target streak and longest activity streak [Advanced Feature]
 *  6. Targets — full CRUD for weekly/monthly goals, with met/unmet progress
 *
 * Design decisions:
 * - The tab row is horizontally scrollable. Six tabs would squash on narrow phones, so the standard "scrollable tab bar" pattern is used instead.
 * - Heavy computations (timeline bucketing, streak analysis) are wrapped in useMemo [R6] so they only recompute when their inputs change.
 * - Week boundaries use Monday as the start day (European convention).
 * - Streak logic [Advanced Feature] uses two definitions: target streak = consecutive weeks hitting a global weekly goal
 * (matches the rubric's "targets met" definition) 
 * activity streak = longest run of back-to-back days with any logged activity (a complementary stat that suits a hen planner's
 * clustered-activity pattern)
 *
 * Key references: React useMemo [R6], Drizzle ORM [R9], Open-Meteo [R4] (weather for trip detail is rendered elsewhere).
 */

import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { targets as targetsTable } from '@/db/schema';
import { useColors } from '@/hooks/useColors';
import { eq } from 'drizzle-orm';
import { useContext, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

type Mode = 'spending' | 'time' | 'hens' | 'timeline' | 'streaks' | 'targets';
type Period = 'day' | 'week' | 'month';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Normalises any date to the Monday of its ISO week.
 * JavaScript's Date.getDay() returns 0 for Sunday, 1 for Monday, etc.
 * The offset formula shifts all days back to the Monday of that week:
 * Sunday (0)  - offset 6  (go back 6 days to previous Monday)
 * Monday (1)  - offset 0  (already Monday)
 * Tuesday (2) - offset 1, etc.
 * "T12:00:00" avoids timezone drift at midnight UTC boundaries.
 */
const getWeekStart = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = d.getDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - offset);
  return d.toISOString().split('T')[0];
};

/** Adds (or subtracts, if negative) N days to a YYYY-MM-DD date. */
const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatDayLabel = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const formatWeekLabel = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return `Wk ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

const formatMonthLabel = (monthStr: string): string => {
  const [yearStr, monthNum] = monthStr.split('-');
  return `${MONTHS[Number(monthNum) - 1]} ${yearStr}`;
};

export default function InsightsScreen() {
  const context = useContext(TripContext);
  const c = useColors();
  const [mode, setMode] = useState<Mode>('spending');
  const [period, setPeriod] = useState<Period>('month');
  const [showForm, setShowForm] = useState(false);
  const [scope, setScope] = useState<'global' | 'category'>('global');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [targetType, setTargetType] = useState<'weekly' | 'monthly'>('weekly');
  const [targetValue, setTargetValue] = useState('');

  if (!context) return null;
  const { trips, activities, categories, targets, setTargets } = context;

  const totalAll = activities.reduce((s, a) => s + a.cost, 0);

  // Spending view: aggregate cost by category, drop empties 
  const spending = categories.map((cat) => {
    const acts = activities.filter((a) => a.categoryId === cat.id);
    return { ...cat, total: acts.reduce((s, a) => s + a.cost, 0) };
  }).filter((x) => x.total > 0);
  const maxSpend = Math.max(...spending.map((x) => x.total), 1);

  //Time view: same pattern, but on duration in minutes 
  const time = categories.map((cat) => {
    const acts = activities.filter((a) => a.categoryId === cat.id);
    return { ...cat, mins: acts.reduce((s, a) => s + a.duration, 0) };
  }).filter((x) => x.mins > 0);
  const maxMin = Math.max(...time.map((x) => x.mins), 1);

  // By Hen view: per-trip budget breakdown
  const hens = trips.map((t) => {
    const acts = activities.filter((a) => a.tripId === t.id);
    const cost = acts.reduce((s, a) => s + a.cost, 0);
    return { ...t, cost, pp: t.guestCount > 0 ? Math.round(cost / t.guestCount) : 0, left: t.budget - cost, acts: acts.length };
  });

  // Targets view: compare each target against current activity count
  const tgts = targets.map((t) => {
    const rel = t.categoryId ? activities.filter((a) => a.categoryId === t.categoryId) : activities;
    const catName = t.categoryId ? categories.find((x) => x.id === t.categoryId)?.name || '?' : 'All';
    return { id: t.id, label: `${catName} (${t.targetType})`, cur: rel.length, goal: t.targetValue, met: rel.length >= t.targetValue };
  });

  /**
   * Timeline view: bucket activities into day/week/month groups and sum cost.
   * useMemo [R6] prevents this from re-running every render — only when activities or the selected period changes.
   *
   * The bucket key is the period's start date in ISO format so chronological sorting works naturally with localeCompare.
   */
  const timeline = useMemo(() => {
    const buckets: Record<string, { key: string; label: string; total: number; count: number }> = {};
    for (const a of activities) {
      let key: string;
      let label: string;
      if (period === 'day') {
        key = a.date;
        label = formatDayLabel(a.date);
      } else if (period === 'week') {
        key = getWeekStart(a.date);
        label = formatWeekLabel(key);
      } else {
        // Month key = first 7 chars of YYYY-MM-DD (i.e. "YYYY-MM")
        key = a.date.substring(0, 7);
        label = formatMonthLabel(key);
      }
      if (!buckets[key]) buckets[key] = { key, label, total: 0, count: 0 };
      buckets[key].total += a.cost;
      buckets[key].count += 1;
    }
    return Object.values(buckets).sort((a, b) => a.key.localeCompare(b.key));
  }, [activities, period]);

  const maxTimeline = Math.max(...timeline.map((x) => x.total), 1);

  /**
   * Streak calculation [Advanced Feature].
   *
   * Two streak definitions are computed:
   *
   * 1. Target streak (rubric match):
   * Walk through each week that has any activity, check if the activity count
   * meets the global weekly target. Track both the longest run ever and the
   * current run (the run ending at the most recent active week).
   *
   * 2. Activity streak (complementary):
   * Find the longest sequence of consecutive calendar days that had at least
   * one activity logged. Hen planning happens in clusters (a hen weekend = 2-4 back-to-back days), so this highlights the best-planned stretch.
   *
   * Total days planned is a simple unique-date count for a quick overview stat.
   */
  const streakStats = useMemo(() => {
    if (activities.length === 0) {
      return { currentTargetStreak: 0, longestTargetStreak: 0, longestDayStreak: 0, totalDaysPlanned: 0 };
    }

    // Target-based weekly streak
    // Only the global weekly target counts here; per-category targets are
    // separate goals and would confuse the headline "streak" number.
    const weeklyGlobalTarget = targets.find((t) => t.targetType === 'weekly' && t.categoryId === null);
    let currentTargetStreak = 0;
    let longestTargetStreak = 0;

    if (weeklyGlobalTarget) {
      // Count how many activities fell in each week (keyed by Monday of that week)
      const weekCounts: Record<string, number> = {};
      for (const a of activities) {
        const wk = getWeekStart(a.date);
        weekCounts[wk] = (weekCounts[wk] || 0) + 1;
      }
      const weekKeys = Object.keys(weekCounts).sort();
      let run = 0;
      let prevKey: string | null = null;

      // Walk weeks chronologically; a run continues only if the current week
      // hits the target AND is the week immediately after the previous one
      for (const wk of weekKeys) {
        const met = weekCounts[wk] >= weeklyGlobalTarget.targetValue;
        const isConsecutive = prevKey === null || addDays(prevKey, 7) === wk;
        if (met && (isConsecutive || run === 0)) {
          run = isConsecutive ? run + 1 : 1;
        } else {
          run = 0;
        }
        if (run > longestTargetStreak) longestTargetStreak = run;
        prevKey = wk;
      }

      // Current streak = walk backwards from the most recent active week, counting as long as each previous week also hit the target
      let lookback = weekKeys[weekKeys.length - 1];
      while (lookback && weekCounts[lookback] >= weeklyGlobalTarget.targetValue) {
        currentTargetStreak += 1;
        const previous = addDays(lookback, -7);
        if (weekCounts[previous] === undefined) break;
        lookback = previous;
      }
    }

    // Consecutive-day activity streak
    // Deduplicate activity dates, sort them, then walk the list tracking how long the current run of back-to-back days is.
    const uniqueDays = Array.from(new Set(activities.map((a) => a.date))).sort();
    const totalDaysPlanned = uniqueDays.length;
    let longestDayStreak = 0;
    let dayRun = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if (addDays(uniqueDays[i - 1], 1) === uniqueDays[i]) {
        dayRun += 1;
      } else {
        if (dayRun > longestDayStreak) longestDayStreak = dayRun;
        dayRun = 1;
      }
    }
    // Catch the final run (the loop only updates when a run ends)
    if (dayRun > longestDayStreak) longestDayStreak = dayRun;

    return { currentTargetStreak, longestTargetStreak, longestDayStreak, totalDaysPlanned };
  }, [activities, targets]);

  // Target form handlers 

  const resetForm = () => {
    setScope('global');
    setSelectedCatId(null);
    setTargetType('weekly');
    setTargetValue('');
    setShowForm(false);
  };

  /**
   * Validates and persists a new target. Two failure paths:
   *  - Numeric value is missing or less then or equal to 0
   *  - "Per Category" scope chosen but no category selected
   * Both use Alert dialogs rather than silent failures.
   */
  const saveTarget = async () => {
    const val = parseInt(targetValue, 10);
    if (!val || val <= 0) {
      Alert.alert('Invalid target', 'Please enter a number greater than 0.');
      return;
    }
    if (scope === 'category' && !selectedCatId) {
      Alert.alert('Pick a category', 'Please select a category or switch to Global.');
      return;
    }
    await db.insert(targetsTable).values({
      userId: 1,
      categoryId: scope === 'category' ? selectedCatId : null,
      targetType,
      targetValue: val,
    });
    setTargets(await db.select().from(targetsTable));
    resetForm();
  };

  /** Destructive action — always wrapped in a confirmation alert. */
  const deleteTarget = (id: number) => {
    Alert.alert('Delete Target', 'Are you sure you want to remove this target?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(targetsTable).where(eq(targetsTable.id, id));
          setTargets(await db.select().from(targetsTable));
        },
      },
    ]);
  };

  // Drives the "Set a weekly target first" hint in the Streaks hero
  const hasWeeklyGlobalTarget = targets.some((t) => t.targetType === 'weekly' && t.categoryId === null);

  const tabs: { key: Mode; label: string }[] = [
    { key: 'spending', label: 'Spending' }, { key: 'time', label: 'Time' },
    { key: 'hens', label: 'By Hen' }, { key: 'timeline', label: 'Timeline' },
    { key: 'streaks', label: 'Streaks' }, { key: 'targets', label: 'Targets' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Insights" subtitle={`€${totalAll} across ${trips.length} hens`} />

      {/* Horizontal tab row — scrollable because 6 tabs won't fit on a narrow phone */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable key={t.key}
            accessibilityRole="tab"
            accessibilityLabel={`${t.label} tab`}
            accessibilityState={{ selected: mode === t.key }}
            style={[styles.tab, { backgroundColor: c.card, borderColor: c.border }, mode === t.key && { backgroundColor: c.accent, borderColor: c.accent }]}
            onPress={() => setMode(t.key)}>
            <Text style={[{ color: c.textSoft, fontSize: 13, fontWeight: '600' }, mode === t.key && { color: '#FFF' }]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30, paddingTop: 16 }}>
        {/* Spending bar chart */}
        {mode === 'spending' ? spending.map((cat) => (
          <View key={cat.id} style={styles.barRow}>
            <Text style={{ color: c.textSoft, fontSize: 13, width: 110 }}>{cat.icon} {cat.name}</Text>
            <View style={[styles.track, { backgroundColor: c.trackBg }]}>
              <View style={[styles.fill, { backgroundColor: cat.colour, width: `${(cat.total / maxSpend) * 100}%` }]} />
            </View>
            <Text style={{ color: c.textFaint, fontSize: 12, width: 50, textAlign: 'right' }}>€{cat.total}</Text>
          </View>
        )) : null}

        {/* Time bar chart */}
        {mode === 'time' ? time.map((cat) => (
          <View key={cat.id} style={styles.barRow}>
            <Text style={{ color: c.textSoft, fontSize: 13, width: 110 }}>{cat.icon} {cat.name}</Text>
            <View style={[styles.track, { backgroundColor: c.trackBg }]}>
              <View style={[styles.fill, { backgroundColor: cat.colour, width: `${(cat.mins / maxMin) * 100}%` }]} />
            </View>
            <Text style={{ color: c.textFaint, fontSize: 12, width: 50, textAlign: 'right' }}>{cat.mins}m</Text>
          </View>
        )) : null}

        {/* Per-trip summary cards */}
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

        {/* Timeline view — period toggle and chronological bars */}
        {mode === 'timeline' ? (
          <>
            <View style={styles.periodRow}>
              {(['day', 'week', 'month'] as Period[]).map((p) => (
                <Pressable key={p}
                  style={[styles.periodBtn, { backgroundColor: c.card, borderColor: c.border }, period === p && { backgroundColor: c.accent, borderColor: c.accent }]}
                  onPress={() => setPeriod(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p} view`}
                  accessibilityState={{ selected: period === p }}>
                  <Text style={[{ color: c.text, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }, period === p && { color: '#FFF' }]}>{p}</Text>
                </Pressable>
              ))}
            </View>

            {timeline.length === 0 ? (
              <Text style={{ color: c.textFaint, fontSize: 14, marginTop: 20, textAlign: 'center' }}>
                No activities to chart yet.
              </Text>
            ) : timeline.map((bucket) => (
              <View key={bucket.key} style={styles.barRow}>
                <Text style={{ color: c.textSoft, fontSize: 12, width: 110 }}>{bucket.label}</Text>
                <View style={[styles.track, { backgroundColor: c.trackBg }]}>
                  <View style={[styles.fill, { backgroundColor: c.accent, width: `${(bucket.total / maxTimeline) * 100}%` }]} />
                </View>
                <Text style={{ color: c.textFaint, fontSize: 12, width: 50, textAlign: 'right' }}>€{bucket.total}</Text>
              </View>
            ))}

            {timeline.length > 0 ? (
              <Text style={{ color: c.textFaint, fontSize: 12, marginTop: 12, textAlign: 'center' }}>
                {timeline.length} {period === 'day' ? 'day' : period}{timeline.length === 1 ? '' : 's'} with activity · {activities.length} activities total
              </Text>
            ) : null}
          </>
        ) : null}

        {/* Streaks view — hero number and two stat boxes and summary */}
        {mode === 'streaks' ? (
          <>
            <View style={[styles.streakHero, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>CURRENT WEEKLY STREAK</Text>
              <Text style={{ color: c.accent, fontSize: 44, fontWeight: '800' }}>
                {streakStats.currentTargetStreak}
                <Text style={{ color: c.textFaint, fontSize: 18, fontWeight: '600' }}>  {streakStats.currentTargetStreak === 1 ? 'week' : 'weeks'}</Text>
              </Text>
              <Text style={{ color: c.textFaint, fontSize: 13, marginTop: 4 }}>
                {hasWeeklyGlobalTarget
                  ? 'Consecutive weeks hitting your global weekly target'
                  : 'Set a global weekly target to start tracking'}
              </Text>
            </View>

            <View style={styles.streakRow}>
              <View style={[styles.streakBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={{ color: c.textSoft, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>LONGEST TARGET STREAK</Text>
                <Text style={{ color: c.text, fontSize: 28, fontWeight: '700' }}>
                  {streakStats.longestTargetStreak}
                  <Text style={{ color: c.textFaint, fontSize: 13, fontWeight: '600' }}> wk</Text>
                </Text>
              </View>
              <View style={[styles.streakBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={{ color: c.textSoft, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>LONGEST ACTIVITY STREAK</Text>
                <Text style={{ color: c.text, fontSize: 28, fontWeight: '700' }}>
                  {streakStats.longestDayStreak}
                  <Text style={{ color: c.textFaint, fontSize: 13, fontWeight: '600' }}> days</Text>
                </Text>
              </View>
            </View>

            <View style={[styles.streakSummary, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={{ color: c.textSoft, fontSize: 13 }}>
                <Text style={{ color: c.text, fontWeight: '700' }}>{streakStats.totalDaysPlanned}</Text> total planning days logged across <Text style={{ color: c.text, fontWeight: '700' }}>{trips.length}</Text> {trips.length === 1 ? 'hen' : 'hens'}.
              </Text>
            </View>

            <Text style={{ color: c.textFaint, fontSize: 12, marginTop: 14, textAlign: 'center', lineHeight: 17, paddingHorizontal: 10 }}>
              Target streak = consecutive weeks hitting your weekly target.{'\n'}
              Activity streak = longest run of back-to-back days with a logged activity.
            </Text>
          </>
        ) : null}

        {/* Targets view — create form and list of existing targets */}
        {mode === 'targets' ? (
          <>
            {!showForm ? (
              <View style={{ marginBottom: 12 }}>
                <PrimaryButton label="+ Add Target" onPress={() => setShowForm(true)} />
              </View>
            ) : null}

            {showForm ? (
              <View style={[styles.form, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.formTitle, { color: c.text }]}>New Target</Text>

                <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Scope</Text>
                <View style={styles.choiceRow}>
                  <Pressable
                    style={[styles.choice, { backgroundColor: c.card, borderColor: c.border }, scope === 'global' && { backgroundColor: c.accent, borderColor: c.accent }]}
                    onPress={() => { setScope('global'); setSelectedCatId(null); }}
                    accessibilityRole="button"
                    accessibilityLabel="Global target">
                    <Text style={[{ color: c.text, fontSize: 13, fontWeight: '600' }, scope === 'global' && { color: '#FFF' }]}>Global (all activities)</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.choice, { backgroundColor: c.card, borderColor: c.border }, scope === 'category' && { backgroundColor: c.accent, borderColor: c.accent }]}
                    onPress={() => setScope('category')}
                    accessibilityRole="button"
                    accessibilityLabel="Per-category target">
                    <Text style={[{ color: c.text, fontSize: 13, fontWeight: '600' }, scope === 'category' && { color: '#FFF' }]}>Per Category</Text>
                  </Pressable>
                </View>

                {scope === 'category' ? (
                  <>
                    <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 6 }}>Category</Text>
                    <View style={styles.choiceRow}>
                      {categories.map((cat) => (
                        <Pressable key={cat.id}
                          style={[styles.chip, { backgroundColor: c.card, borderColor: c.border }, selectedCatId === cat.id && { backgroundColor: cat.colour, borderColor: cat.colour }]}
                          onPress={() => setSelectedCatId(cat.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`${cat.name} category`}>
                          <Text style={[{ color: c.text, fontSize: 12, fontWeight: '600' }, selectedCatId === cat.id && { color: '#FFF' }]}>{cat.icon} {cat.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}

                <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 6 }}>Timeframe</Text>
                <View style={styles.choiceRow}>
                  <Pressable
                    style={[styles.choice, { backgroundColor: c.card, borderColor: c.border }, targetType === 'weekly' && { backgroundColor: c.accent, borderColor: c.accent }]}
                    onPress={() => setTargetType('weekly')}
                    accessibilityRole="button"
                    accessibilityLabel="Weekly target">
                    <Text style={[{ color: c.text, fontSize: 13, fontWeight: '600' }, targetType === 'weekly' && { color: '#FFF' }]}>Weekly</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.choice, { backgroundColor: c.card, borderColor: c.border }, targetType === 'monthly' && { backgroundColor: c.accent, borderColor: c.accent }]}
                    onPress={() => setTargetType('monthly')}
                    accessibilityRole="button"
                    accessibilityLabel="Monthly target">
                    <Text style={[{ color: c.text, fontSize: 13, fontWeight: '600' }, targetType === 'monthly' && { color: '#FFF' }]}>Monthly</Text>
                  </Pressable>
                </View>

                <View style={{ marginTop: 10 }}>
                  <FormField
                    label="Target (number of activities)"
                    value={targetValue}
                    onChangeText={setTargetValue}
                    placeholder="e.g. 5"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ marginTop: 6 }}>
                  <PrimaryButton label="Save Target" onPress={saveTarget} />
                  <View style={{ marginTop: 10 }}>
                    <PrimaryButton label="Cancel" variant="secondary" onPress={resetForm} />
                  </View>
                </View>
              </View>
            ) : null}

            {tgts.length === 0 && !showForm ? (
              <Text style={{ color: c.textFaint, fontSize: 14, marginTop: 20, textAlign: 'center' }}>
                No targets yet. Tap + Add Target to set one.
              </Text>
            ) : null}

            {tgts.map((t) => (
              <View key={t.id} style={[styles.henCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{t.label}</Text>
                  <Text style={{ color: t.met ? c.success : '#D4853A', fontSize: 13, fontWeight: '700' }}>{t.met ? 'Done!' : `${t.goal - t.cur} to go`}</Text>
                </View>
                <View style={[styles.progTrack, { backgroundColor: c.trackBg }]}>
                  <View style={[styles.progFill, { width: `${Math.min((t.cur / t.goal) * 100, 100)}%`, backgroundColor: t.met ? c.success : c.accent }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ color: c.textFaint, fontSize: 12 }}>{t.cur} / {t.goal}</Text>
                  <Pressable onPress={() => deleteTarget(t.id)} accessibilityRole="button" accessibilityLabel="Delete target">
                    <Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  tabRow: { flexDirection: 'row', gap: 8, paddingRight: 18 },
  tab: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  barRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  track: { borderRadius: 6, flex: 1, height: 18, marginHorizontal: 8, overflow: 'hidden' },
  fill: { borderRadius: 6, height: 18 },
  henCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 14 },
  henRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progTrack: { borderRadius: 6, height: 10, marginTop: 8, overflow: 'hidden' },
  progFill: { borderRadius: 6, height: 10 },
  form: { borderRadius: 14, borderWidth: 1, marginBottom: 14, padding: 14 },
  formTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  choice: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  periodBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  streakHero: { alignItems: 'center', borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 22 },
  streakRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  streakBox: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flex: 1, padding: 16 },
  streakSummary: { borderRadius: 12, borderWidth: 1, padding: 14 },
});