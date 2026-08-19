import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Text as SvgText } from 'react-native-svg';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../constants/theme';
import type { ExerciseCategory } from '../data/exerciseDatabase';

type BodyView = 'frente' | 'costas';

// ---- geometria ------------------------------------------------------------
// viewBox fixo 300x700. Todas as peças são <Path> com curvas (C = bezier
// cúbica) pra ficar orgânico — nada de retângulo/elipse pra tronco/membros.
// Peças pareadas (ombro, braço, perna) são desenhadas só do lado esquerdo e
// espelhadas em x=150 via mirrorPathX, pra não duplicar números à mão.
const CENTER_X = 150;

function mirrorPathX(d: string, centerX: number): string {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === 'M' || t === 'L') {
      const x = Number(tokens[i + 1]);
      out.push(t, String(2 * centerX - x), tokens[i + 2]);
      i += 3;
    } else if (t === 'C') {
      const nums = tokens.slice(i + 1, i + 7).map(Number);
      const mirrored = nums.map((n, idx) => (idx % 2 === 0 ? 2 * centerX - n : n));
      out.push('C', ...mirrored.map(String));
      i += 7;
    } else {
      out.push('Z');
      i += 1;
    }
  }
  return out.join(' ');
}

// Partes de base, não-tocáveis (cabeça, pescoço, tronco, antebraços, mãos,
// pés) — sempre na cor "corpo", servem de fundo contínuo pras regiões
// tocáveis, desenhadas por cima.
const NECK_D =
  'M134,92 C133,102 135,113 139,120 L161,120 C165,113 167,102 166,92 C158,95 142,95 134,92 Z';

const TORSO_BASE_D =
  'M132,120 C108,124 90,150 90,178 C90,212 100,248 108,282 C112,302 100,322 84,340 ' +
  'L216,340 C200,322 188,302 192,282 C200,248 210,212 210,178 C210,150 192,124 168,120 ' +
  'C158,117 142,117 132,120 Z';

const FOREARM_L_D =
  'M52,348 C48,375 46,405 49,432 C51,452 55,464 61,470 L79,470 C84,464 87,452 88,432 ' +
  'C90,405 88,375 84,348 C76,343 60,343 52,348 Z';
const FOREARM_R_D = mirrorPathX(FOREARM_L_D, CENTER_X);

// Regiões tocáveis — cada uma é um <Path> próprio.
const DELTOID_L_D =
  'M58,142 C46,148 40,165 42,185 C44,205 58,218 78,216 C94,214 102,200 100,182 ' +
  'C98,164 88,148 72,140 C67,138 62,140 58,142 Z';
const DELTOID_R_D = mirrorPathX(DELTOID_L_D, CENTER_X);

const CHEST_D =
  'M104,140 C108,128 132,120 150,132 C168,120 192,128 196,140 C202,160 200,192 196,215 ' +
  'C188,232 168,238 150,236 C132,238 112,232 104,215 C100,192 98,160 104,140 Z';

const ABDOMEN_D =
  'M106,244 C102,244 100,256 101,270 C102,290 104,308 110,322 C120,330 180,330 190,322 ' +
  'C196,308 198,290 199,270 C200,256 198,244 194,244 C175,240 125,240 106,244 Z';

const COSTAS_D =
  'M128,128 C108,132 96,155 96,180 C96,212 104,246 112,280 C116,300 106,320 92,336 ' +
  'L208,336 C194,320 184,300 188,280 C196,246 204,212 204,180 C204,155 192,132 172,128 ' +
  'C160,125 140,125 128,128 Z';

const UPPER_ARM_L_D =
  'M50,198 C45,225 42,260 44,295 C45,315 48,332 54,344 L84,344 C90,332 93,315 94,295 ' +
  'C96,260 93,225 88,198 C78,190 60,190 50,198 Z';
const UPPER_ARM_R_D = mirrorPathX(UPPER_ARM_L_D, CENTER_X);

const LEG_FRONT_L_D =
  'M86,344 C80,380 78,420 82,460 C85,485 92,498 100,502 C94,515 90,535 88,565 ' +
  'C86,595 88,618 96,636 C102,648 116,650 126,644 C133,638 134,622 132,600 ' +
  'C130,570 128,540 130,510 C132,475 134,440 132,405 C130,375 124,352 114,344 ' +
  'C104,340 94,341 86,344 Z';
const LEG_FRONT_R_D = mirrorPathX(LEG_FRONT_L_D, CENTER_X);

const LEG_BACK_UPPER_L_D =
  'M86,344 C80,380 78,420 82,460 C85,485 92,498 100,502 L132,502 C134,475 134,440 132,405 ' +
  'C130,375 124,352 114,344 C104,340 94,341 86,344 Z';
const LEG_BACK_UPPER_R_D = mirrorPathX(LEG_BACK_UPPER_L_D, CENTER_X);

const LEG_BACK_LOWER_L_D =
  'M82,504 C78,525 76,548 80,572 C83,598 87,618 93,634 C99,648 114,652 126,644 ' +
  'C133,638 134,622 132,600 C133,590 132,560 128,535 C126,515 122,500 116,495 L104,502 ' +
  'C100,503 87,504 82,504 Z';
const LEG_BACK_LOWER_R_D = mirrorPathX(LEG_BACK_LOWER_L_D, CENTER_X);

// Linhas decorativas (sem preenchimento, só contorno) — sugerem a divisão do
// peitoral em dois lóbulos e do abdômen em blocos, sem precisar de hitboxes
// separadas por lóbulo/bloco (a região inteira continua sendo uma só, um
// único toque seleciona a categoria inteira).
const CHEST_DETAIL_D = 'M150,132 C148,165 149,205 150,236';
const ABDOMEN_DETAIL_LINES = [
  'M150,248 L150,326',
  'M118,268 Q150,272 182,268',
  'M116,292 Q150,297 184,292',
  'M118,314 Q150,318 182,314',
];

type BodyRegion = {
  category: ExerciseCategory;
  paths: string[];
  labelX: number;
  labelY: number;
};

// Ombro é compartilhado entre as duas vistas — território válido dos dois
// lados (frente e costas usam o mesmo deltoide).
const OMBRO_REGION: BodyRegion = {
  category: 'Ombro',
  paths: [DELTOID_L_D, DELTOID_R_D],
  labelX: 150,
  labelY: 132,
};

const FRONT_REGIONS: BodyRegion[] = [
  OMBRO_REGION,
  { category: 'Peito', paths: [CHEST_D], labelX: 150, labelY: 182 },
  { category: 'Bíceps', paths: [UPPER_ARM_L_D, UPPER_ARM_R_D], labelX: 24, labelY: 268 },
  { category: 'Abdômen', paths: [ABDOMEN_D], labelX: 150, labelY: 286 },
  { category: 'Perna', paths: [LEG_FRONT_L_D, LEG_FRONT_R_D], labelX: 150, labelY: 500 },
];

const BACK_REGIONS: BodyRegion[] = [
  OMBRO_REGION,
  { category: 'Costas', paths: [COSTAS_D], labelX: 150, labelY: 232 },
  { category: 'Tríceps', paths: [UPPER_ARM_L_D, UPPER_ARM_R_D], labelX: 24, labelY: 268 },
  {
    category: 'Posterior',
    paths: [LEG_BACK_UPPER_L_D, LEG_BACK_UPPER_R_D],
    labelX: 150,
    labelY: 420,
  },
  {
    category: 'Panturrilha',
    paths: [LEG_BACK_LOWER_L_D, LEG_BACK_LOWER_R_D],
    labelX: 150,
    labelY: 578,
  },
];

// ---- cor --------------------------------------------------------------
// A região tocável precisa se distinguir do resto do corpo com um leve
// contraste. Misturar cardBorder com muted funciona nos dois temas: no
// escuro o resultado fica mais claro que o corpo (muted é mais claro que
// cardBorder ali); no claro fica mais escuro (muted é mais escuro que
// cardBorder ali) — em ambos os casos, mais visível contra o fundo.
function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}
function mixColors(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(a.r + (b.r - a.r) * t)}${toHex(a.g + (b.g - a.g) * t)}${toHex(a.b + (b.b - a.b) * t)}`;
}

type Props = {
  activeCategory: ExerciseCategory | null;
  onSelectCategory: (category: ExerciseCategory) => void;
};

export default function MuscleBodySelector({ activeCategory, onSelectCategory }: Props) {
  const { COLORS } = useTheme();
  const [view, setView] = useState<BodyView>('frente');
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const regionBase = useMemo(() => mixColors(COLORS.cardBorder, COLORS.muted, 0.4), [COLORS]);
  const regions = view === 'frente' ? FRONT_REGIONS : BACK_REGIONS;
  const activeRegions = regions.filter((r) => r.category === activeCategory);

  return (
    <View>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleChip, view === 'frente' && styles.toggleChipActive]}
          onPress={() => setView('frente')}
        >
          <Text style={[styles.toggleText, view === 'frente' && styles.toggleTextActive]}>
            Frente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleChip, view === 'costas' && styles.toggleChipActive]}
          onPress={() => setView('costas')}
        >
          <Text style={[styles.toggleText, view === 'costas' && styles.toggleTextActive]}>
            Costas
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.svgWrap}>
        <Svg width="100%" height={320} viewBox="0 0 300 700">
          {/* Base do corpo — cabeça, pescoço, tronco, antebraços, mãos, pés.
              Não são tocáveis; ficam por baixo das regiões musculares. */}
          <Ellipse cx={150} cy={55} rx={32} ry={36} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />
          <Path d={NECK_D} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />
          <Path d={TORSO_BASE_D} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />

          {/* Pés — a perna em si (tocável) já cobre o contorno inteiro do
              quadril ao tornozelo, seja como peça única (frente) ou duas
              peças emendadas (costas), então só os pés precisam de base. */}
          <Ellipse cx={108} cy={655} rx={27} ry={15} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />
          <Ellipse cx={192} cy={655} rx={27} ry={15} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />

          <Path d={FOREARM_L_D} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />
          <Path d={FOREARM_R_D} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />
          <Ellipse cx={70} cy={485} rx={15} ry={21} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />
          <Ellipse cx={230} cy={485} rx={15} ry={21} fill={COLORS.cardBorder} stroke={COLORS.bg} strokeWidth={1.5} />

          {/* Regiões tocáveis */}
          {regions.flatMap((region) => {
            const selected = activeCategory === region.category;
            const fill = selected ? COLORS.accent : regionBase;
            return region.paths.map((d, i) => (
              <Path
                key={`${region.category}-${i}`}
                d={d}
                fill={fill}
                stroke={COLORS.bg}
                strokeWidth={1.5}
                onPress={() => onSelectCategory(region.category)}
              />
            ));
          })}

          {/* Detalhes estáticos (linhas do peitoral/abdômen) — só na frente */}
          {view === 'frente' && (
            <>
              {/* pointerEvents="none": sem isso, essas linhas finas capturam o
                  toque (mesmo sem onPress) e bloqueiam o clique na região por
                  baixo — reproduzível clicando bem no centro do abdômen, onde
                  a linha vertical (linea alba) fica exatamente sob o dedo. */}
              <Path d={CHEST_DETAIL_D} fill="none" stroke={COLORS.bg} strokeWidth={1.2} pointerEvents="none" />
              {ABDOMEN_DETAIL_LINES.map((d, i) => (
                <Path key={`ab-${i}`} d={d} fill="none" stroke={COLORS.bg} strokeWidth={1.2} pointerEvents="none" />
              ))}
            </>
          )}

          {activeRegions.map((region) => (
            <SvgText
              key={`label-${region.category}`}
              x={region.labelX}
              y={region.labelY}
              fontSize={15}
              fontWeight="bold"
              fill="#FFFFFF"
              textAnchor="middle"
              pointerEvents="none"
            >
              {region.category}
            </SvgText>
          ))}
        </Svg>
      </View>
    </View>
  );
}

function makeStyles(COLORS: ThemeColors) {
  return StyleSheet.create({
    toggleRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.sm },
    toggleChip: {
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: COLORS.card,
    },
    toggleChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    toggleText: { color: COLORS.muted, fontSize: 11.5, fontWeight: '700' },
    toggleTextActive: { color: '#FFFFFF' },
    svgWrap: { alignItems: 'center' },
  });
}
