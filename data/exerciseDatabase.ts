export type ExerciseCategory =
  | 'Peito' | 'Costas' | 'Ombro' | 'Bíceps' | 'Tríceps'
  | 'Perna' | 'Posterior' | 'Panturrilha' | 'Abdômen' | 'Cardio';

export type ExerciseDBEntry = {
  id: string;
  name: string;
  category: ExerciseCategory;
};

export const EXERCISE_DATABASE: ExerciseDBEntry[] = [
  // Peito
  { id: 'peito-supino-reto-barra', name: 'Supino reto (barra)', category: 'Peito' },
  { id: 'peito-supino-reto-halteres', name: 'Supino reto (halteres)', category: 'Peito' },
  { id: 'peito-supino-inclinado-barra', name: 'Supino inclinado (barra)', category: 'Peito' },
  { id: 'peito-supino-inclinado-halteres', name: 'Supino inclinado (halteres)', category: 'Peito' },
  { id: 'peito-supino-declinado', name: 'Supino declinado', category: 'Peito' },
  { id: 'peito-supino-inclinado-maquina', name: 'Supino inclinado na máquina', category: 'Peito' },
  { id: 'peito-crucifixo-reto', name: 'Crucifixo reto (halteres)', category: 'Peito' },
  { id: 'peito-crucifixo-inclinado', name: 'Crucifixo inclinado (halteres)', category: 'Peito' },
  { id: 'peito-crucifixo-maquina', name: 'Crucifixo na máquina (peck deck)', category: 'Peito' },
  { id: 'peito-cross-over', name: 'Cross over (polia)', category: 'Peito' },
  { id: 'peito-flexao', name: 'Flexão de braço', category: 'Peito' },
  { id: 'peito-pullover', name: 'Pullover', category: 'Peito' },

  // Costas
  { id: 'costas-puxada-aberta', name: 'Puxada alta pegada aberta', category: 'Costas' },
  { id: 'costas-puxada-fechada', name: 'Puxada alta pegada fechada', category: 'Costas' },
  { id: 'costas-puxada-supinada', name: 'Puxada alta pegada supinada', category: 'Costas' },
  { id: 'costas-remada-curvada-barra', name: 'Remada curvada (barra)', category: 'Costas' },
  { id: 'costas-remada-cavalinho', name: 'Remada cavalinho', category: 'Costas' },
  { id: 'costas-remada-unilateral', name: 'Remada unilateral (halter)', category: 'Costas' },
  { id: 'costas-remada-baixa', name: 'Remada baixa (polia)', category: 'Costas' },
  { id: 'costas-remada-maquina', name: 'Remada na máquina', category: 'Costas' },
  { id: 'costas-pulldown', name: 'Pulldown (polia alta)', category: 'Costas' },
  { id: 'costas-barra-fixa', name: 'Barra fixa', category: 'Costas' },
  { id: 'costas-levantamento-terra', name: 'Levantamento terra', category: 'Costas' },
  { id: 'costas-hiperextensao', name: 'Hiperextensão lombar', category: 'Costas' },
  { id: 'costas-pullup-assistido', name: 'Pull-up assistido (máquina)', category: 'Costas' },

  // Ombro
  { id: 'ombro-desenvolvimento-militar', name: 'Desenvolvimento militar (barra)', category: 'Ombro' },
  { id: 'ombro-desenvolvimento-halteres', name: 'Desenvolvimento com halteres', category: 'Ombro' },
  { id: 'ombro-desenvolvimento-smith', name: 'Desenvolvimento no smith', category: 'Ombro' },
  { id: 'ombro-desenvolvimento-maquina', name: 'Desenvolvimento na máquina', category: 'Ombro' },
  { id: 'ombro-elevacao-lateral', name: 'Elevação lateral', category: 'Ombro' },
  { id: 'ombro-elevacao-frontal', name: 'Elevação frontal', category: 'Ombro' },
  { id: 'ombro-crucifixo-invertido-halteres', name: 'Crucifixo invertido (halteres)', category: 'Ombro' },
  { id: 'ombro-crucifixo-invertido-maquina', name: 'Crucifixo invertido na máquina', category: 'Ombro' },
  { id: 'ombro-face-pull', name: 'Face pull', category: 'Ombro' },
  { id: 'ombro-encolhimento', name: 'Encolhimento de ombros (trapézio)', category: 'Ombro' },
  { id: 'ombro-remada-alta', name: 'Remada alta', category: 'Ombro' },

  // Bíceps
  { id: 'biceps-rosca-direta-reta', name: 'Rosca direta (barra reta)', category: 'Bíceps' },
  { id: 'biceps-rosca-direta-w', name: 'Rosca direta (barra W)', category: 'Bíceps' },
  { id: 'biceps-rosca-alternada', name: 'Rosca alternada (halteres)', category: 'Bíceps' },
  { id: 'biceps-rosca-martelo', name: 'Rosca martelo', category: 'Bíceps' },
  { id: 'biceps-rosca-concentrada', name: 'Rosca concentrada', category: 'Bíceps' },
  { id: 'biceps-rosca-scott', name: 'Rosca Scott (barra W)', category: 'Bíceps' },
  { id: 'biceps-rosca-cabo', name: 'Rosca no cabo (polia)', category: 'Bíceps' },
  { id: 'biceps-rosca-21', name: 'Rosca 21', category: 'Bíceps' },
  { id: 'biceps-rosca-inversa', name: 'Rosca inversa', category: 'Bíceps' },

  // Tríceps
  { id: 'triceps-testa', name: 'Tríceps testa (barra W)', category: 'Tríceps' },
  { id: 'triceps-corda', name: 'Tríceps corda (polia)', category: 'Tríceps' },
  { id: 'triceps-frances', name: 'Tríceps francês (halter)', category: 'Tríceps' },
  { id: 'triceps-coice', name: 'Tríceps coice (halter)', category: 'Tríceps' },
  { id: 'triceps-paralelas', name: 'Mergulho em paralelas', category: 'Tríceps' },
  { id: 'triceps-supino-fechado', name: 'Supino fechado', category: 'Tríceps' },
  { id: 'triceps-maquina', name: 'Tríceps na máquina', category: 'Tríceps' },
  { id: 'triceps-unilateral-polia', name: 'Extensão de tríceps unilateral (polia)', category: 'Tríceps' },

  // Perna
  { id: 'perna-agachamento-livre', name: 'Agachamento livre', category: 'Perna' },
  { id: 'perna-agachamento-hack', name: 'Agachamento hack', category: 'Perna' },
  { id: 'perna-agachamento-smith', name: 'Agachamento no smith', category: 'Perna' },
  { id: 'perna-agachamento-bulgaro', name: 'Agachamento búlgaro', category: 'Perna' },
  { id: 'perna-leg-press', name: 'Leg press 45°', category: 'Perna' },
  { id: 'perna-cadeira-extensora', name: 'Cadeira extensora', category: 'Perna' },
  { id: 'perna-avanco', name: 'Avanço (afundo)', category: 'Perna' },
  { id: 'perna-passada', name: 'Passada', category: 'Perna' },
  { id: 'perna-cadeira-adutora', name: 'Cadeira adutora', category: 'Perna' },

  // Posterior / Glúteos
  { id: 'posterior-stiff-barra', name: 'Stiff (barra)', category: 'Posterior' },
  { id: 'posterior-stiff-halteres', name: 'Stiff (halteres)', category: 'Posterior' },
  { id: 'posterior-mesa-flexora', name: 'Mesa flexora', category: 'Posterior' },
  { id: 'posterior-cadeira-flexora', name: 'Cadeira flexora', category: 'Posterior' },
  { id: 'posterior-terra-romeno', name: 'Levantamento terra romeno', category: 'Posterior' },
  { id: 'posterior-hip-thrust', name: 'Elevação pélvica (hip thrust)', category: 'Posterior' },
  { id: 'posterior-cadeira-abdutora', name: 'Cadeira abdutora', category: 'Posterior' },
  { id: 'posterior-gluteo-polia', name: 'Glúteo na polia (coice)', category: 'Posterior' },

  // Panturrilha
  { id: 'panturrilha-em-pe', name: 'Panturrilha em pé', category: 'Panturrilha' },
  { id: 'panturrilha-sentado', name: 'Panturrilha sentado', category: 'Panturrilha' },
  { id: 'panturrilha-leg-press', name: 'Panturrilha no leg press', category: 'Panturrilha' },

  // Abdômen
  { id: 'abdomen-supra', name: 'Abdominal supra', category: 'Abdômen' },
  { id: 'abdomen-infra', name: 'Abdominal infra', category: 'Abdômen' },
  { id: 'abdomen-prancha', name: 'Prancha', category: 'Abdômen' },
  { id: 'abdomen-crunch-cabo', name: 'Abdominal na polia (crunch cabo)', category: 'Abdômen' },
  { id: 'abdomen-elevacao-pernas', name: 'Elevação de pernas', category: 'Abdômen' },
  { id: 'abdomen-obliquo', name: 'Abdominal oblíquo', category: 'Abdômen' },
  { id: 'abdomen-rotacao-tronco', name: 'Rotação de tronco na máquina', category: 'Abdômen' },

  // Cardio
  { id: 'cardio-esteira', name: 'Esteira', category: 'Cardio' },
  { id: 'cardio-bicicleta', name: 'Bicicleta ergométrica', category: 'Cardio' },
  { id: 'cardio-eliptico', name: 'Elíptico', category: 'Cardio' },
  { id: 'cardio-escada', name: 'Escada (stairmaster)', category: 'Cardio' },
  { id: 'cardio-corda-naval', name: 'Corda naval', category: 'Cardio' },
  { id: 'cardio-remo', name: 'Remo (ergômetro)', category: 'Cardio' },
];
