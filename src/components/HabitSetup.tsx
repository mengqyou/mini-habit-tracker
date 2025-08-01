import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Habit, HabitLevel } from '../types';

interface HabitSetupProps {
  onHabitCreate: (habit: Habit) => void;
  onHabitUpdate?: (habit: Habit) => void;
  editingHabit?: Habit | null;
  existingHabits?: Habit[];
}

export const HabitSetup: React.FC<HabitSetupProps> = ({ 
  onHabitCreate, 
  onHabitUpdate, 
  editingHabit,
  existingHabits = []
}) => {
  const [habitName, setHabitName] = useState(editingHabit?.name || '');
  const [habitDescription, setHabitDescription] = useState(editingHabit?.description || '');
  const [levels, setLevels] = useState<Omit<HabitLevel, 'id'>[]>(
    editingHabit?.levels.map(level => ({
      name: level.name,
      description: level.description,
      value: level.value
    })) || [
      { name: 'Basic', description: '', value: 1 },
      { name: 'Good', description: '', value: 2 },
      { name: 'Excellent', description: '', value: 3 },
    ]
  );

  const updateLevel = (index: number, field: keyof Omit<HabitLevel, 'id'>, value: string | number) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  const saveHabit = () => {
    console.log('🔵 [HabitSetup] saveHabit called, habitName:', habitName.trim());
    console.log('🔵 [HabitSetup] existingHabits:', existingHabits.map(h => h.name));
    
    if (!habitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    // Check for duplicate habit names (only when creating new habits or changing name)
    const trimmedName = habitName.trim();
    const isDuplicateName = existingHabits.some(habit => 
      habit.name.toLowerCase() === trimmedName.toLowerCase() && 
      habit.id !== editingHabit?.id
    );
    
    console.log('🔵 [HabitSetup] isDuplicateName:', isDuplicateName, 'for name:', trimmedName);
    
    if (isDuplicateName) {
      console.log('🔵 [HabitSetup] Showing duplicate name alert');
      Alert.alert(
        'Duplicate Habit Name', 
        `A habit named "${trimmedName}" already exists. Please choose a different name.`
      );
      return;
    }

    const invalidLevels = levels.some(level => !level.name.trim() || !level.description.trim());
    if (invalidLevels) {
      Alert.alert('Error', 'Please fill in all level names and descriptions');
      return;
    }

    if (editingHabit && onHabitUpdate) {
      // Update existing habit
      const updatedHabit: Habit = {
        ...editingHabit,
        name: habitName.trim(),
        description: habitDescription.trim(),
        levels: levels.map((level, index) => ({
          ...level,
          id: editingHabit.levels[index]?.id || `${Date.now()}-${index}`,
        })),
      };
      onHabitUpdate(updatedHabit);
    } else {
      // Create new habit
      const habit: Habit = {
        id: Date.now().toString(),
        name: habitName.trim(),
        description: habitDescription.trim(),
        levels: levels.map((level, index) => ({
          ...level,
          id: `${Date.now()}-${index}`,
        })),
        createdAt: new Date(),
        status: 'active',
      };
      onHabitCreate(habit);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {editingHabit ? 'Edit Your Habit' : 'Create Your Habit'}
        </Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Habit Name *</Text>
        <TextInput
          style={styles.input}
          value={habitName}
          onChangeText={setHabitName}
          placeholder="e.g., Reading Books"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={habitDescription}
          onChangeText={setHabitDescription}
          placeholder="Optional description of your habit"
          multiline
        />
      </View>

      <Text style={styles.sectionTitle}>Completion Levels</Text>
      
      {levels.map((level, index) => (
        <View key={index} style={styles.levelContainer}>
          <Text style={styles.levelTitle}>Level {index + 1}</Text>
          
          <View style={styles.section}>
            <Text style={styles.label}>Level Name *</Text>
            <TextInput
              style={styles.input}
              value={level.name}
              onChangeText={(text) => updateLevel(index, 'name', text)}
              placeholder="e.g., Basic, Good, Excellent"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.input}
              value={level.description}
              onChangeText={(text) => updateLevel(index, 'description', text)}
              placeholder="e.g., Read 2 pages, Read 30 pages, Read 60+ pages"
              multiline
            />
          </View>
        </View>
      ))}

        <TouchableOpacity style={styles.createButton} onPress={saveHabit}>
          <Text style={styles.createButtonText}>
            {editingHabit ? 'Update Habit' : 'Create Habit'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Extra padding for keyboard
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#333',
  },
  levelContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});