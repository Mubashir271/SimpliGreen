import React, {useState} from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  addInstallerType,
  deleteInstallerType,
  toggleCertificate,
} from '../../store/slices/installerTypesSlice';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';

export default function AdminInstallerTypesScreen() {
  const dispatch = useAppDispatch();
  const types = useAppSelector(s => s.installerTypes.items);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) {return;}
    dispatch(addInstallerType({id: `it${Date.now()}`, name: newName.trim(), requires_certificate: false}));
    setNewName('');
    setModalVisible(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteInstallerType(id))},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Installer Categories</Text>
          <Text style={styles.subtitle}>Manage labor types & certificate rules</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={types}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconBox}>
                <Text style={styles.icon}>🔧</Text>
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.typeName}>{item.name}</Text>
                <Text style={[
                  styles.certStatus,
                  {color: item.requires_certificate ? COLORS.warning : COLORS.textMuted},
                ]}>
                  {item.requires_certificate ? '📄 Certificate required' : 'No certificate required'}
                </Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Switch
                value={item.requires_certificate}
                onValueChange={_val => { dispatch(toggleCertificate(item.id)); }}
                trackColor={{false: COLORS.border, true: '#FCD34D'}}
                thumbColor={item.requires_certificate ? COLORS.warning : '#f4f3f4'}
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.name)}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Category</Text>
            <FormInput
              label="Category Name"
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Plumbers"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => {setModalVisible(false); setNewName('');}}
                style={styles.modalBtn}
              />
              <Button label="Add" onPress={handleAdd} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {fontSize: 20, fontWeight: '800', color: COLORS.text},
  subtitle: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  addBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
  list: {padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  cardLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  icon: {fontSize: 20},
  nameBlock: {flex: 1},
  typeName: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  certStatus: {fontSize: 12, marginTop: 2},
  cardRight: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {color: COLORS.danger, fontWeight: '700', fontSize: 13},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md},
  modalActions: {flexDirection: 'row', gap: SPACING.sm},
  modalBtn: {flex: 1},
});
