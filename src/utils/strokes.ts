// 「词影」模式的笔画比对。
// 原先这段逻辑来自词影前端打包产物 assets/词影/main.js 的 Ot 导出，
// 现全部重写为插件内部逻辑：只保留比对本身，去掉随行的前端 UI 与依赖。

// 笔画中位线上的一个点，坐标系与字体一致（1024 × 1024）。
export type StrokePoint = [number, number];

// 单个汉字的笔画数据：strokes 是各笔的 svg path，medians 是各笔的中位线。
export interface CharacterStrokes {
  strokes: string[];
  medians: StrokePoint[][];
}

// 比对结果里的一笔影子：用哪一笔的 path、偏移多少、离答案多远。
export interface StrokeShadow {
  stroke: string;
  distance: number;
  shiftX: number;
  shiftY: number;
}

export interface StrokeCompareConfig {
  // 低于该距离视为完全命中
  correctThreshold: number;
  // 初始距离，同时是透明度的上界
  presentThreshold: number;
  // 影子相对形心的位移系数
  shiftFactor: number;
}

export interface StrokeCompareResult {
  shadows: StrokeShadow[];
  match: boolean;
  percent: number;
}

// 「词影」默认模式与困难模式的比对阈值。
export const defaultStrokeConfig: StrokeCompareConfig = {
  correctThreshold: 0.5,
  presentThreshold: 1,
  shiftFactor: 0.7,
};

export const hardStrokeConfig: StrokeCompareConfig = {
  correctThreshold: 0.3,
  presentThreshold: 1,
  shiftFactor: 0.7,
};

// 两点距离。
function pointDistance(a: StrokePoint, b: StrokePoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

// 由 from 指向 to 的向量。
function vectorBetween(from: StrokePoint, to: StrokePoint): StrokePoint {
  return [to[0] - from[0], to[1] - from[1]];
}

// 把向量缩放到指定长度，零向量会得到 NaN，调用处不产生零向量。
function scaleVector(vector: StrokePoint, length: number): StrokePoint {
  const factor = length / Math.hypot(vector[0], vector[1]);
  return [vector[0] * factor, vector[1] * factor];
}

// 折线总长度。
function polylineLength(points: StrokePoint[]): number {
  let total = 0;
  for (let i = 0; i + 1 < points.length; i += 1) {
    total += pointDistance(points[i], points[i + 1]);
  }
  return total;
}

// 按线段长度加权的形心。
function polylineCentroid(points: StrokePoint[]): StrokePoint {
  const total = polylineLength(points);
  const center: StrokePoint = [0, 0];
  for (let i = 0; i + 1 < points.length; i += 1) {
    const weight = pointDistance(points[i], points[i + 1]) / total;
    for (let axis = 0; axis < 2; axis += 1) {
      center[axis] += ((points[i][axis] + points[i + 1][axis]) / 2) * weight;
    }
  }
  return center;
}

// 从 origin 出发沿 direction 走 factor 步。
function pointAlong(
  origin: StrokePoint,
  direction: StrokePoint,
  factor: number
): StrokePoint {
  return [origin[0] + direction[0] * factor, origin[1] + direction[1] * factor];
}

// 两段等速直线之间距离平方的积分，step 是参数化步长。
function segmentSquaredDistance(
  startA: StrokePoint,
  directionA: StrokePoint,
  startB: StrokePoint,
  directionB: StrokePoint,
  step: number
): number {
  let sum = 0;
  for (let axis = 0; axis < 2; axis += 1) {
    const offset = startB[axis] - startA[axis];
    const drift = (directionB[axis] - directionA[axis]) * step;
    sum += (offset * offset + offset * drift + (drift * drift) / 3) * step;
  }
  return sum;
}

// 一笔相对自身形心的离散程度，用作比对时的尺度基准。
function medianRadius(points: StrokePoint[]): number {
  const center = polylineCentroid(points);
  const total = polylineLength(points);
  let sum = 0;
  for (let i = 0; i + 1 < points.length; i += 1) {
    const step = pointDistance(points[i], points[i + 1]) / total;
    const direction = scaleVector(vectorBetween(points[i], points[i + 1]), total);
    sum += segmentSquaredDistance(points[i], direction, center, [0, 0], step);
  }
  return Math.sqrt(sum) / 1024;
}

// 两条中位线的距离：从形心反向拉开 shiftFactor 后，沿折线同步推进积分。
function medianDistance(
  pointsA: StrokePoint[],
  pointsB: StrokePoint[],
  shiftFactor: number
): number {
  let sum = 0;
  const lengthA = polylineLength(pointsA);
  const lengthB = polylineLength(pointsB);
  const centerA = polylineCentroid(pointsA);
  const centerB = polylineCentroid(pointsB);
  let currentA = pointAlong(pointsA[0], centerA, -shiftFactor);
  let currentB = pointAlong(pointsB[0], centerB, -shiftFactor);
  let indexA = 1;
  let indexB = 1;
  while (indexA < pointsA.length && indexB < pointsB.length) {
    const nextA = pointAlong(pointsA[indexA], centerA, -shiftFactor);
    const nextB = pointAlong(pointsB[indexB], centerB, -shiftFactor);
    const stepA = pointDistance(currentA, nextA) / lengthA;
    const stepB = pointDistance(currentB, nextB) / lengthB;
    const directionA = scaleVector(vectorBetween(currentA, nextA), lengthA);
    const directionB = scaleVector(vectorBetween(currentB, nextB), lengthB);
    if (stepA === stepB) {
      sum += segmentSquaredDistance(currentA, directionA, currentB, directionB, stepA);
      currentA = nextA;
      currentB = nextB;
      indexA += 1;
      indexB += 1;
    } else if (stepA < stepB) {
      sum += segmentSquaredDistance(currentA, directionA, currentB, directionB, stepA);
      currentA = nextA;
      currentB = pointAlong(currentB, directionB, stepA);
      indexA += 1;
    } else {
      sum += segmentSquaredDistance(currentA, directionA, currentB, directionB, stepB);
      currentA = pointAlong(currentA, directionA, stepB);
      currentB = nextB;
      indexB += 1;
    }
  }
  return Math.sqrt(sum) / 1024;
}

/**
 * 比对答案字与猜测字的笔画。
 * 答案的每一笔都在猜测字里找最接近的一笔：足够近就采用答案自身的笔画（全亮），
 * 否则取猜测字的笔画并按形心差平移，作为半透明的影子。
 */
export function compareStrokes(
  answer: CharacterStrokes,
  input: CharacterStrokes,
  shadows: { shadows: StrokeShadow[] } | null,
  config: StrokeCompareConfig
): StrokeCompareResult {
  const result: StrokeShadow[] = [
    ...(shadows?.shadows ||
      answer.medians.map(() => ({
        stroke: "",
        distance: config.presentThreshold,
        shiftX: 0,
        shiftY: 0,
      }))),
  ];

  let matchedCount = 0;
  for (let i = 0; i < answer.medians.length; i += 1) {
    let isCorrect = false;
    const radius = medianRadius(answer.medians[i]);
    for (let j = 0; j < input.medians.length; j += 1) {
      const distance =
        medianDistance(answer.medians[i], input.medians[j], config.shiftFactor) /
        radius;
      if (distance < config.correctThreshold) {
        isCorrect = true;
      }
      if (distance < result[i].distance) {
        if (distance < config.correctThreshold) {
          result[i] = {
            stroke: answer.strokes[i],
            distance: 0,
            shiftX: 0,
            shiftY: 0,
          };
        } else {
          const centerAnswer = polylineCentroid(answer.medians[i]);
          const centerInput = polylineCentroid(input.medians[j]);
          result[i] = {
            stroke: input.strokes[j],
            distance,
            shiftX: (centerAnswer[0] - centerInput[0]) * config.shiftFactor,
            shiftY: (centerAnswer[1] - centerInput[1]) * config.shiftFactor,
          };
        }
      }
    }
    if (isCorrect) {
      matchedCount += 1;
    }
  }

  return {
    shadows: result,
    match: false,
    percent: matchedCount / answer.medians.length,
  };
}
