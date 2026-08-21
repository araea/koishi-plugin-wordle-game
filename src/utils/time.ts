// 时间相关格式化工具。

// 把秒数格式化为「用时：x 分 x 秒」或「用时：x 秒」。
export function formatGameDuration(elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  if (minutes > 0) {
    return `用时：${minutes} 分 ${seconds} 秒`;
  } else {
    return `用时：${seconds} 秒`;
  }
}

// 把秒数格式化为「x 分 x 秒」或「x 秒」（无「用时：」前缀）。
export function formatGameDuration2(elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  if (minutes > 0) {
    return `${minutes} 分 ${seconds} 秒`;
  } else {
    return `${seconds} 秒`;
  }
}

// 计算从开始到当前的时间差，格式化为「用时：【x 分 x 秒】」。
export function calculateGameDuration(
  startTime: number,
  currentTime: number
): string {
  const elapsedMilliseconds = currentTime - startTime;
  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  if (minutes > 0) {
    return `用时：【${minutes} 分 ${seconds} 秒】`;
  } else {
    return `用时：【${seconds} 秒】`;
  }
}
