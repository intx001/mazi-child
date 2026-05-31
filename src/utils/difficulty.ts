export type Difficulty = 'easy' | 'medium' | 'hard';

export const difficulties: Record<Difficulty, { size: number, label: string, color: string, shadow: string, border: string }> = {
  easy: { size: 9, label: 'SUPER EASY', color: 'bg-[#81C784]', shadow: 'shadow-[0_6px_0_0_#66BB6A]', border: 'border-[#66BB6A]' },
  medium: { size: 15, label: 'NORMAL', color: 'bg-[#64B5F6]', shadow: 'shadow-[0_6px_0_0_#42A5F5]', border: 'border-[#42A5F5]' },
  hard: { size: 21, label: 'HARD', color: 'bg-[#E57373]', shadow: 'shadow-[0_6px_0_0_#EF5350]', border: 'border-[#EF5350]' }
};
