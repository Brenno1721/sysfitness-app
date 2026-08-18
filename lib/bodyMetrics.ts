import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { apiGet, apiPost } from './api';

// Local store: only photo associations (by API entry id). Namespaced por userId —
// dado local, sem isso a foto de uma conta aparece associada à medida de outra.
const photosStorageKey = (userId: string) => `body:photos:${userId}`;

export type BodyMeasurements = {
  waist?: number; // cintura, cm
  chest?: number; // peito, cm
  arm?: number; // braço, cm
  thigh?: number; // coxa, cm
  hip?: number; // quadril, cm
};

export type BodyMetricEntry = {
  id: string;
  date: string; // ISO
  weight?: number; // kg
  measurements?: BodyMeasurements;
  photoUri?: string; // caminho local permanente, se houver foto
};

// Internal shape of the API response (flat fields, no measurements nesting)
type ApiBodyMetric = {
  id: string;
  date: string;
  weight?: number | null;
  waist?: number | null;
  chest?: number | null;
  arm?: number | null;
  thigh?: number | null;
  hip?: number | null;
};

// Local photo entries keyed by the corresponding API entry id
type LocalPhotoEntry = { id: string; photoUri: string };

async function getLocalPhotos(userId: string): Promise<LocalPhotoEntry[]> {
  const raw = await AsyncStorage.getItem(photosStorageKey(userId));
  return raw ? JSON.parse(raw) : [];
}

function apiToLocal(entry: ApiBodyMetric, photos: LocalPhotoEntry[]): BodyMetricEntry {
  const photo = photos.find((p) => p.id === entry.id);
  const measurements: BodyMeasurements = {};
  if (entry.waist) measurements.waist = entry.waist;
  if (entry.chest) measurements.chest = entry.chest;
  if (entry.arm) measurements.arm = entry.arm;
  if (entry.thigh) measurements.thigh = entry.thigh;
  if (entry.hip) measurements.hip = entry.hip;

  return {
    id: entry.id,
    date: entry.date,
    weight: entry.weight ?? undefined,
    measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
    photoUri: photo?.photoUri,
  };
}

export async function getBodyMetrics(userId: string): Promise<BodyMetricEntry[]> {
  const [apiEntries, localPhotos] = await Promise.all([
    apiGet<ApiBodyMetric[]>('/body-metrics'),
    getLocalPhotos(userId),
  ]);
  // API already returns sorted by date desc
  return apiEntries.map((e) => apiToLocal(e, localPhotos));
}

export async function addBodyMetric(
  userId: string,
  entry: Omit<BodyMetricEntry, 'id'>
): Promise<void> {
  // Send only the fields that have values to satisfy the API's "at least one field" check
  const payload: Record<string, number> = {};
  if (entry.weight) payload.weight = entry.weight;
  if (entry.measurements?.waist) payload.waist = entry.measurements.waist;
  if (entry.measurements?.chest) payload.chest = entry.measurements.chest;
  if (entry.measurements?.arm) payload.arm = entry.measurements.arm;
  if (entry.measurements?.thigh) payload.thigh = entry.measurements.thigh;
  if (entry.measurements?.hip) payload.hip = entry.measurements.hip;

  const created = await apiPost<ApiBodyMetric>('/body-metrics', payload);

  if (entry.photoUri) {
    const photos = await getLocalPhotos(userId);
    photos.push({ id: created.id, photoUri: entry.photoUri });
    await AsyncStorage.setItem(photosStorageKey(userId), JSON.stringify(photos));
  }
}

export async function deleteBodyMetric(userId: string, id: string): Promise<void> {
  // No DELETE endpoint on the API — only the local photo association is cleaned up.
  const photos = await getLocalPhotos(userId);
  const photoEntry = photos.find((p) => p.id === id);
  if (photoEntry?.photoUri) {
    const file = new File(photoEntry.photoUri);
    if (file.exists) file.delete();
  }
  await AsyncStorage.setItem(
    photosStorageKey(userId),
    JSON.stringify(photos.filter((p) => p.id !== id))
  );
}

export async function clearLocalBodyMetricPhotos(userId: string): Promise<void> {
  const photos = await getLocalPhotos(userId);
  for (const entry of photos) {
    if (!entry.photoUri) continue;
    try {
      await FileSystem.deleteAsync(entry.photoUri, { idempotent: true });
    } catch {
      // Ignore delete errors during reset cleanup
    }
  }
  await AsyncStorage.removeItem(photosStorageKey(userId));
}

// expo-file-system (v19+) é síncrono pra operações de File/Directory — sem await aqui.
function getPhotosDirectory(): Directory {
  const dir = new Directory(Paths.document, 'progress-photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function launchAndCopy(source: 'camera' | 'library'): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permission.status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Ative a permissão nas configurações do sistema pra usar essa opção.'
    );
    return null;
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || result.assets.length === 0) return null;

  // O cache do picker pode ser limpo pelo sistema — copia pra um destino permanente.
  const destination = new File(getPhotosDirectory(), `${Date.now()}.jpg`);
  new File(result.assets[0].uri).copy(destination);
  return destination.uri;
}

export function pickAndSavePhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Adicionar foto',
      'Escolha a origem da foto',
      [
        { text: 'Câmera', onPress: () => launchAndCopy('camera').then(resolve) },
        { text: 'Galeria', onPress: () => launchAndCopy('library').then(resolve) },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
}
