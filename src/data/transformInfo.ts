import type { TransformType, TransformParams } from '../utils/transform2d'

export interface TransformInfo {
  id: TransformType
  name: string
  description: string
  properties: string[]
  formula: (p: TransformParams) => string
}

export const TRANSFORM_INFO: Record<TransformType, TransformInfo> = {
  translate: {
    id: 'translate',
    name: 'Phép tịnh tiến',
    description:
      'Phép tịnh tiến theo vector v(dx, dy) biến mỗi điểm M(x, y) thành điểm M\'(x + dx, y + dy), tức là "trượt" toàn bộ hình theo đúng một vector không đổi.',
    properties: [
      'Bảo toàn khoảng cách: hình ảnh và hình gốc bằng nhau (M\'N\' = MN)',
      'Biến đoạn thẳng thành đoạn thẳng song song hoặc trùng với đoạn ban đầu',
      'Không làm đổi hướng, không xoay hình',
    ],
    formula: (p) => `M(x, y) → M'(x + ${p.translate.dx}, y + ${p.translate.dy})`,
  },
  rotate: {
    id: 'rotate',
    name: 'Phép quay',
    description:
      'Phép quay tâm I, góc α biến điểm M thành điểm M\' sao cho IM\' = IM và góc lượng giác (IM, IM\') = α. Toàn bộ hình xoay quanh tâm I một góc α.',
    properties: [
      'Bảo toàn khoảng cách đến tâm quay: IM\' = IM',
      'Bảo toàn kích thước và hình dạng của hình',
      'Góc quay 180° chính là phép đối xứng tâm',
    ],
    formula: (p) => `M'(x', y') với x' = ${p.rotate.cx} + (x−${p.rotate.cx})cosα − (y−${p.rotate.cy})sinα, y' = ${p.rotate.cy} + (x−${p.rotate.cx})sinα + (y−${p.rotate.cy})cosα, α = ${p.rotate.angleDeg}°`,
  },
  'point-symmetry': {
    id: 'point-symmetry',
    name: 'Phép đối xứng tâm',
    description:
      'Phép đối xứng tâm I biến điểm M thành điểm M\' sao cho I là trung điểm của MM\'. Đây chính là phép quay tâm I với góc quay 180°.',
    properties: [
      'I là trung điểm của MM\' với mọi điểm M',
      'Bảo toàn khoảng cách và hình dạng',
      'Là trường hợp đặc biệt của phép quay (góc 180°)',
    ],
    formula: (p) => `M'(x', y') với x' = 2×${p['point-symmetry'].cx} − x, y' = 2×${p['point-symmetry'].cy} − y`,
  },
  'axis-symmetry': {
    id: 'axis-symmetry',
    name: 'Phép đối xứng trục',
    description:
      'Phép đối xứng qua đường thẳng d (đi qua gốc O, hợp với trục Ox một góc φ) biến điểm M thành điểm M\' sao cho d là đường trung trực của đoạn MM\'.',
    properties: [
      'd là đường trung trực của MM\' với mọi điểm M',
      'Bảo toàn khoảng cách và hình dạng, nhưng đảo chiều hình (ảnh gương)',
      'φ = 0° ứng với trục Ox, φ = 90° ứng với trục Oy, φ = 45° ứng với đường y = x',
    ],
    formula: (p) =>
      `M'(x', y') với x' = x·cos(2φ) + y·sin(2φ), y' = x·sin(2φ) − y·cos(2φ), φ = ${p['axis-symmetry'].axisAngleDeg}°`,
  },
  'rotational-symmetry': {
    id: 'rotational-symmetry',
    name: 'Phép đối xứng quay',
    description:
      'Một hình có đối xứng quay bậc n nếu quay hình quanh chính tâm của nó một góc 360°/n (hoặc bội số của góc đó) thì hình trùng khít lên chính nó. Khác với phép quay thông thường (tạo ảnh ở một vị trí khác), ở đây tâm quay luôn là tâm của chính hình.',
    properties: [
      'Góc quay nhỏ nhất để hình tự trùng khít gọi là góc quay cơ bản, bằng 360°/n với n là bậc đối xứng quay',
      'Hình tròn có bậc đối xứng quay vô hạn — mọi góc quay đều cho ảnh trùng khít',
      'Đa giác đều n cạnh luôn có bậc đối xứng quay đúng bằng n',
    ],
    formula: (p) =>
      `M'(x', y') với x' = cx + (x−cx)cosα − (y−cy)sinα, y' = cy + (x−cx)sinα + (y−cy)cosα, (cx,cy) = tâm hình, α = ${p.rotate.angleDeg}°`,
  },
}
