import type { CardioSessionResult } from '../../context/CardioTimerContext';
import { CARDIO_ACTIVITIES } from './ActivityCarousel';

const CLOSE_ENOUGH_SECONDS = 60;

type FinishFeedback = { title: string; message: string };

export function buildFinishFeedback(
  result: CardioSessionResult,
  activityIndex: number
): FinishFeedback {
  const minutes = Math.round(result.durationSeconds / 60);
  const activityLabel = CARDIO_ACTIVITIES[activityIndex]?.label ?? 'cardio';
  const hasTarget = result.targetSeconds > 0;

  if (hasTarget && result.diffSeconds > CLOSE_ENOUGH_SECONDS) {
    const extraMinutes = Math.round(result.diffSeconds / 60);
    return {
      title: 'Mandou bem! 💪',
      message: `Você fez ${extraMinutes} min a mais do que o combinado.`,
    };
  }

  if (hasTarget && result.diffSeconds < -CLOSE_ENOUGH_SECONDS) {
    const shortMinutes = Math.round(Math.abs(result.diffSeconds) / 60);
    const targetMinutes = Math.round(result.targetSeconds / 60);
    return {
      title: 'Quase lá',
      message: `Você fez ${shortMinutes} min a menos do que o combinado hoje (${targetMinutes} min).`,
    };
  }

  return {
    title: 'Sessão registrada',
    message: `Você treinou ${minutes} min de ${activityLabel} hoje.`,
  };
}
