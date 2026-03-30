import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { categories as categoriesTable } from '@/db/schema';
import { useColors } from '@/hooks/useColors';
import { eq } from 'drizzle-orm';
import { useContext, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

const COLOURS = ['#D4537E', '#C084FC', '#F59E0B', '#34D399', '#818CF8', '#F97316', '#64748B', '#0EA5E9'];
const ICONS = ['🍹', '💅', '🍽️', '🎲', '💃', '🎨', '🚐', '🏨', '🎤', '🛥️', '🎀', '🧖'];

export default function CategoriesScreen() {
  const context = useContext(TripContext);
  const c = useColors();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [colour, setColour] = useState(COLOURS[0]);
  const [icon, setIcon] = useState(ICONS[0]);

  if (!context) return null;
  const { categories, setCategories } = context;

  const reset = () => { setName(''); setColour(COLOURS[0]); setIcon(ICONS[0]); setEditingId(null); setShowForm(false); };

  const startEdit = (id: number) => {
    const cat = categories.find((x) => x.id === id);
    if (!cat) return;
    setName(cat.name); setColour(cat.colour); setIcon(cat.icon); setEditingId(id); setShowForm(true);
  };

  const save = async () => {
    if (!name) return;
    if (editingId) { await db.update(categoriesTable).set({ name, colour, icon }).where(eq(categoriesTable.id, editingId)); }
    else { await db.insert(categoriesTable).values({ userId: 1, name, colour, icon }); }
    setCategories(await db.select().from(categoriesTable)); reset();
  };

  const del = (id: number) => {
    Alert.alert('Delete Category', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await db.delete(categoriesTable).where(eq(categoriesTable.id, id)); setCategories(await db.select().from(categoriesTable)); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Categories" subtitle={`${categories.length} categories`} />
      {!showForm ? <PrimaryButton label="+ New Category" onPress={() => setShowForm(true)} /> : null}
      {showForm ? (
        <View style={[styles.form, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.formTitle, { color: c.text }]}>{editingId ? 'Edit Category' : 'New Category'}</Text>
          <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Karaoke" />
          <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Colour</Text>
          <View style={styles.row}>
            {COLOURS.map((cl) => (
              <Pressable key={cl} style={[styles.swatch, { backgroundColor: cl }, colour === cl && { borderColor: c.text, borderWidth: 2.5 }]} onPress={() => setColour(cl)} />
            ))}
          </View>
          <Text style={{ color: c.textSoft, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 }}>Icon</Text>
          <View style={styles.row}>
            {ICONS.map((ic) => (
              <Pressable key={ic} style={[styles.iconBtn, { backgroundColor: c.accentSoft }, icon === ic && { borderColor: c.accent, borderWidth: 2 }]} onPress={() => setIcon(ic)}>
                <Text style={{ fontSize: 18 }}>{ic}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ marginTop: 12 }}>
            <PrimaryButton label={editingId ? 'Save Changes' : 'Create'} onPress={save} />
            <View style={{ marginTop: 10 }}><PrimaryButton label="Cancel" variant="secondary" onPress={reset} /></View>
          </View>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={{ paddingBottom: 24, paddingTop: 14 }} showsVerticalScrollIndicator={false}>
        {categories.map((cat) => (
          <View key={cat.id} style={[styles.catCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.dot, { backgroundColor: cat.colour }]} />
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{cat.icon} {cat.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable onPress={() => startEdit(cat.id)}><Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>Edit</Text></Pressable>
              <Pressable onPress={() => del(cat.id)}><Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>Delete</Text></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  form: { borderRadius: 14, borderWidth: 1, marginTop: 12, padding: 14 },
  formTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  swatch: { borderRadius: 16, height: 32, width: 32 },
  iconBtn: { alignItems: 'center', borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  catCard: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, padding: 14 },
  dot: { borderRadius: 6, height: 12, marginRight: 10, width: 12 },
});
