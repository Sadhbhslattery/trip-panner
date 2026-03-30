import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { categories as categoriesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useContext, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripContext } from '../_layout';

const COLOUR_OPTIONS = ['#D4537E', '#C084FC', '#F59E0B', '#34D399', '#818CF8', '#F97316', '#64748B', '#0EA5E9'];
const ICON_OPTIONS = ['🍹', '💅', '🍽️', '🎲', '💃', '🎨', '🚐', '🏨', '🎤', '🛥️', '🎀', '🧖'];

export default function CategoriesScreen() {
  const context = useContext(TripContext);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [selectedColour, setSelectedColour] = useState(COLOUR_OPTIONS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);

  if (!context) return null;
  const { categories, setCategories } = context;

  const resetForm = () => {
    setName('');
    setSelectedColour(COLOUR_OPTIONS[0]);
    setSelectedIcon(ICON_OPTIONS[0]);
    setEditingId(null);
    setShowForm(false);
  };

  const startEditing = (catId: number) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setName(cat.name);
    setSelectedColour(cat.colour);
    setSelectedIcon(cat.icon);
    setEditingId(catId);
    setShowForm(true);
  };

  const saveCategory = async () => {
    if (!name) return;

    if (editingId) {
      await db.update(categoriesTable).set({ name, colour: selectedColour, icon: selectedIcon }).where(eq(categoriesTable.id, editingId));
    } else {
      await db.insert(categoriesTable).values({ userId: 1, name, colour: selectedColour, icon: selectedIcon });
    }

    const rows = await db.select().from(categoriesTable);
    setCategories(rows);
    resetForm();
  };

  const deleteCategory = async (catId: number) => {
    Alert.alert('Delete Category', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(categoriesTable).where(eq(categoriesTable.id, catId));
          const rows = await db.select().from(categoriesTable);
          setCategories(rows);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Categories" subtitle={`${categories.length} categories`} />

      {!showForm ? (
        <PrimaryButton label="+ New Category" onPress={() => setShowForm(true)} />
      ) : null}

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Category' : 'New Category'}</Text>
          <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Karaoke" />

          <Text style={styles.pickerLabel}>Colour</Text>
          <View style={styles.optionRow}>
            {COLOUR_OPTIONS.map((c) => (
              <Pressable key={c} style={[styles.colourSwatch, { backgroundColor: c }, selectedColour === c && styles.swatchSelected]} onPress={() => setSelectedColour(c)} />
            ))}
          </View>

          <Text style={styles.pickerLabel}>Icon</Text>
          <View style={styles.optionRow}>
            {ICON_OPTIONS.map((ic) => (
              <Pressable key={ic} style={[styles.iconOption, selectedIcon === ic && styles.iconSelected]} onPress={() => setSelectedIcon(ic)}>
                <Text style={styles.iconText}>{ic}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.formButtons}>
            <PrimaryButton label={editingId ? 'Save Changes' : 'Create'} onPress={saveCategory} />
            <View style={styles.spacer}>
              <PrimaryButton label="Cancel" variant="secondary" onPress={resetForm} />
            </View>
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.catCard}>
            <View style={styles.catHeader}>
              <View style={[styles.dot, { backgroundColor: cat.colour }]} />
              <Text style={styles.catName}>{cat.icon} {cat.name}</Text>
            </View>
            <View style={styles.catActions}>
              <Pressable onPress={() => startEditing(cat.id)}>
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => deleteCategory(cat.id)}>
                <Text style={styles.deleteLink}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FFF8FA', flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  formCard: { backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 14, borderWidth: 1, marginTop: 12, padding: 14 },
  formTitle: { color: '#1F1126', fontSize: 17, fontWeight: '700', marginBottom: 10 },
  pickerLabel: { color: '#334155', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  colourSwatch: { borderRadius: 16, height: 32, width: 32 },
  swatchSelected: { borderColor: '#1F1126', borderWidth: 2.5 },
  iconOption: { alignItems: 'center', backgroundColor: '#FFF0F5', borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  iconSelected: { backgroundColor: '#FCE7F3', borderColor: '#D4537E', borderWidth: 2 },
  iconText: { fontSize: 18 },
  formButtons: { marginTop: 12 },
  spacer: { marginTop: 10 },
  listContent: { paddingBottom: 24, paddingTop: 14 },
  catCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#F0C6D4', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, padding: 14 },
  catHeader: { alignItems: 'center', flexDirection: 'row' },
  dot: { borderRadius: 6, height: 12, marginRight: 10, width: 12 },
  catName: { color: '#1F1126', fontSize: 16, fontWeight: '600' },
  catActions: { flexDirection: 'row', gap: 14 },
  editLink: { color: '#D4537E', fontSize: 13, fontWeight: '600' },
  deleteLink: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});
