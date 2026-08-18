import * as Haptics from 'expo-haptics';

export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;

// Espelha o hapticsEnabled do SettingsContext num valor módulo-level, pra que
// call sites que não são componentes (funções soltas, callbacks de gesto via
// runOnJS) possam checar sem precisar de useContext.
let hapticsEnabled = true;

export function setHapticsEnabledFlag(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function triggerImpact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): void {
  if (hapticsEnabled) Haptics.impactAsync(style);
}

export function triggerNotification(type: Haptics.NotificationFeedbackType): void {
  if (hapticsEnabled) Haptics.notificationAsync(type);
}
