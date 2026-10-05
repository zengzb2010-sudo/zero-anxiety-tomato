// =====================================================================
// 花园元素与科目的联动规则：
// 数学多 → 长几何图形；语文多 → 长小书本；其他 → 随机小花/小草/小太阳
// 所有元素永久保留，绝对没有枯萎、死亡、消失机制
// =====================================================================
export const SUBJECT_ELEMENTS = {
  语文: ['book'],
  数学: ['triangle', 'circle', 'square'], // 随机几何图形
  英语: ['letter'],
  物理: ['bolt'],
  化学: ['flask'],
  生物: ['leaf'],
  历史: ['scroll'],
  地理: ['mountain'],
  政治: ['flag'],
  其他: ['flower', 'grass', 'sun'],
}

// 元素类型 → 展示名（用于掉落提示和图鉴）
export const ELEMENT_LABELS = {
  book: '小书本',
  triangle: '小三角',
  circle: '小圆点',
  square: '小方块',
  letter: '字母块',
  bolt: '小闪电',
  flask: '小锥形瓶',
  leaf: '小叶子',
  scroll: '小卷轴',
  mountain: '小山峰',
  flag: '小红旗',
  flower: '小花花',
  grass: '小绿草',
  sun: '小太阳',
}