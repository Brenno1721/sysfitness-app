import { useEffect, useMemo } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const DEFAULT_PARTICLE_COUNT = 9;

type Particle = { angle: number; distance: number; color: string };

function generateParticles(colors: string[], count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5,
    distance: 55 + Math.random() * 35,
    color: colors[i % colors.length],
  }));
}

function ParticleDot({ angle, distance, color }: Particle) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 8,
          height: 8,
          borderRadius: 4,
          marginLeft: -4,
          marginTop: -4,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// Precisa ser renderizado dentro de um View pai com largura/altura definidas
// (position: relative por padrão) — as partículas se posicionam via left/top
// 50% relativos a esse pai e saem de lá em direções aleatórias.
export default function CelebrationParticles({
  colors,
  count = DEFAULT_PARTICLE_COUNT,
}: {
  colors: string[];
  count?: number;
}) {
  const particles = useMemo(
    () => generateParticles(colors, count),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      {particles.map((p, i) => (
        <ParticleDot key={i} angle={p.angle} distance={p.distance} color={p.color} />
      ))}
    </>
  );
}
