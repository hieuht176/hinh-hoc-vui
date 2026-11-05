export interface AngleTypeDef {
  id: string
  name: string
  range: string
  example: number
  description: string
  color: string
}

export const ANGLE_TYPES: AngleTypeDef[] = [
  {
    id: 'acute',
    name: 'Góc nhọn',
    range: '0° < góc < 90°',
    example: 50,
    description: 'Góc có số đo lớn hơn 0° và nhỏ hơn 90° — trông "nhọn", hẹp hơn góc vuông.',
    color: '#6366f1',
  },
  {
    id: 'right',
    name: 'Góc vuông',
    range: 'góc = 90°',
    example: 90,
    description: 'Góc có số đo đúng bằng 90°. Thường được đánh dấu bằng một hình vuông nhỏ ở đỉnh góc.',
    color: '#0ea5e9',
  },
  {
    id: 'obtuse',
    name: 'Góc tù',
    range: '90° < góc < 180°',
    example: 130,
    description: 'Góc có số đo lớn hơn 90° và nhỏ hơn 180° — rộng hơn góc vuông nhưng chưa thành đường thẳng.',
    color: '#f97316',
  },
  {
    id: 'straight',
    name: 'Góc bẹt',
    range: 'góc = 180°',
    example: 180,
    description: 'Góc có số đo đúng bằng 180° — hai cạnh của góc nằm thẳng hàng, tạo thành một đường thẳng.',
    color: '#e11d48',
  },
  {
    id: 'reflex',
    name: 'Góc lõm',
    range: '180° < góc < 360°',
    example: 260,
    description: 'Góc có số đo lớn hơn 180° và nhỏ hơn 360° — "phần góc lớn hơn" ở phía bên kia của hai cạnh. (Phần mở rộng: chương trình lớp 6 chỉ học các góc từ 0° đến 180°.)',
    color: '#8b5cf6',
  },
]

export function classifyAngle(deg: number): AngleTypeDef | null {
  const d = ((deg % 360) + 360) % 360
  if (d <= 0) return null
  if (d < 90) return ANGLE_TYPES[0]
  if (d === 90) return ANGLE_TYPES[1]
  if (d < 180) return ANGLE_TYPES[2]
  if (d === 180) return ANGLE_TYPES[3]
  return ANGLE_TYPES[4]
}
