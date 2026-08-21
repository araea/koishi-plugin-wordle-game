import { Ot as compareStrokes } from "../assets/词影/main.js";
import type { GameContext } from "../context";
import type { ExtraGameRecord, GameRecord } from "../types";
import { mergeDuplicates, removeDuplicates, removeLetters, uniqueSortedLowercaseLetters } from "../utils/string";
import { getIdiomInfo } from "../services/network";
import {
  countCharactersAndIndexes,
  countNumericTones,
  mergeOccurrences,
  processAllRecords,
  processPinyin,
  processPinyinArray,
  separatePinyin,
  transformRecords,
} from "../utils/pinyin";

// 生成 Wordle 棋盘的行样式（列数为 row - 1）。
export function generateStyledHtml(row: number): string {
  const styledHtml = `
<style>
        .Row-module_row__pwpBq {
            display: grid;
            grid-template-columns: repeat(${row - 1}, 1fr);
            grid-gap: 5px;
        }

        .Board-module_board__jeoPS {
            display: grid;
            grid-template-rows: repeat(${row}, 1fr);
            grid-gap: 5px;
            padding: 10px;
            box-sizing: border-box;
        }
    </style>`;

  return styledHtml;
}

// 生成 Wordle 模式的空棋盘 HTML。
export function generateEmptyGridHtml(rowNum: number, tileNum: number): string {
  let html = "";
  for (let i = 0; i < rowNum; i++) {
    html += `<div class="Row-module_row__pwpBq">`;
    for (let j = 0; j < tileNum; j++) {
      html += `
        <div>
            <div class="Tile-module_tile__UWEHN" data-state="empty"></div>
            <!--第${i + 1}行第${j + 1}列-->
        </div>`;
    }
    html += `</div>`;
  }
  return html;
}

// 生成「词影」模式的空棋盘 HTML。
export function generateEmptyGridHtmlForCiying(
  rowNum: number,
  tileNum: number,
  isBorder: boolean
): string {
  let html = "";
  for (let i = 0; i < rowNum; i++) {
    html += `<div class="relative flex items-center">
                        <div class="grid grid-cols-4 justify-items-center gap-2 svelte-n2hnfv">`;
    for (let j = 0; j < tileNum; j++) {
      html += `
        <!--第${i + 1}行第${j + 1}列-->
         <input enterkeyhint="done" disabled="" class="h-32 w-32 border-2 bg-transparent text-center font-serif text-5xl border-neutral-300 dark:border-neutral-700 ${
           isBorder ? "border-neutral-500 dark:border-neutral-500" : ""
         }" placeholder="">
                            `;
    }
    html += `   </div>
                    </div>`;
  }
  return html;
}

// 生成「汉兜」模式的空棋盘 HTML。
export function generateEmptyGridHtmlForHandle(
  rowNum: number,
  tileNum: number
): string {
  let html = "";
  for (let i = 0; i < rowNum; i++) {
    html += `<div flex="">`;
    for (let j = 0; j < tileNum; j++) {
      html += `
        <!--第${i + 1}行第${j + 1}列-->
        <div w-30="" h-30="" m2="">
            <div h-30="" w-30="" border-4="" flex="~ center" relative="" leading-1em="" font-serif=""
                 class="bg-gray-400/8">
            </div>
        </div>`;
    }
    html += `</div>`;
  }
  return html;
}

// 把一组图片 Buffer 转为 <img> 标签字符串（用于多词合成图）。
export function generateImageTags(buffers: Buffer[]): string {
  return buffers
    .map((buffer, index) => {
      const base64Image = buffer.toString("base64");
      return `    <img src="data:image/png;base64,${base64Image}" alt="图片${
        index + 1
      }">`;
    })
    .join("\n");
}

// 生成 Wordle 模式的字母方块 HTML，并更新 correct/present/absent 线索。
export async function generateLetterTilesHtml(
  g: GameContext,
  wordGuess: string,
  inputWord: string,
  channelId: string,
  wordleIndex: number,
  gameInfo: GameRecord | ExtraGameRecord
): Promise<string> {
  const wordHtml: string[] = new Array(inputWord.length);
  const letterCountMap: { [key: string]: number } = {};

  const correctLetters: string[] = gameInfo.correctLetters;
  let presentLetters = gameInfo.presentLetters;
  let absentLetters = gameInfo.absentLetters;
  let presentLettersWithIndex = gameInfo.presentLettersWithIndex;

  for (const letter of wordGuess) {
    if (letterCountMap[letter]) {
      letterCountMap[letter]++;
    } else {
      letterCountMap[letter] = 1;
    }
  }

  const lowercaseInputWord = inputWord.toLowerCase();

  // 处理 "correct"
  let htmlIndex = 0;
  for (let i = 0; i < inputWord.length; i++) {
    const letter = lowercaseInputWord[i];
    if (wordGuess[i] === letter) {
      wordHtml[
        htmlIndex
      ] = `<div><div class="Tile-module_tile__UWEHN" data-state="correct">${letter}</div></div>`;
      letterCountMap[letter]--;

      correctLetters[i] = letter;
    } else {
      wordHtml[
        htmlIndex
      ] = `<div><div class="Tile-module_tile__UWEHN" data-state="unchecked">${letter}</div></div>`;
    }
    htmlIndex++;
  }

  // 处理其他标记
  htmlIndex = 0;
  for (let i = 0; i < inputWord.length; i++) {
    const letter = lowercaseInputWord[i];
    if (wordHtml[htmlIndex].includes('data-state="unchecked"')) {
      if (wordGuess.includes(letter)) {
        if (letterCountMap[letter] > 0) {
          wordHtml[htmlIndex] = wordHtml[htmlIndex].replace(
            'data-state="unchecked"',
            'data-state="present"'
          );
          letterCountMap[letter]--;

          presentLetters += letter;
          presentLettersWithIndex.push(`${letter}-${i + 1}`);
        } else {
          wordHtml[htmlIndex] = wordHtml[htmlIndex].replace(
            'data-state="unchecked"',
            'data-state="absent"'
          );
          absentLetters += letter;
        }
      } else {
        wordHtml[htmlIndex] = wordHtml[htmlIndex].replace(
          'data-state="unchecked"',
          'data-state="absent"'
        );
        absentLetters += letter;
      }
    }
    htmlIndex++;
  }
  const setWordleGameRecord = async (collection: any, keys: any) => {
    await g.ctx.database.set(collection, keys, {
      correctLetters,
      presentLetters: uniqueSortedLowercaseLetters(presentLetters),
      absentLetters: removeLetters(
        gameInfo.wordGuess,
        uniqueSortedLowercaseLetters(absentLetters)
      ),
      presentLettersWithIndex: mergeDuplicates(presentLettersWithIndex),
    });
  };
  if (wordleIndex === 1) {
    await setWordleGameRecord("wordle_game_records", { channelId });
  } else {
    await setWordleGameRecord("extra_wordle_game_records", {
      channelId,
      wordleIndex,
    });
  }
  return wordHtml.join("\n");
}

// 生成「词影」模式的笔画方块 HTML，并更新笔画缓存与正确字母。
export async function generateLetterTilesHtmlForCiying(
  g: GameContext,
  answerIdiom: string,
  userInputIdiom: string,
  channelId: string,
  wordleIndex: number,
  gameInfo: GameRecord | ExtraGameRecord,
  isHardMode: boolean
): Promise<string> {
  const strokesData = g.data.strokesData;
  const htmlResult: string[] = [
    `<div class="relative flex items-center">
<div class="grid grid-cols-4 justify-items-center gap-2 svelte-n2hnfv">`,
  ];
  const strokesHtmlCache: string[][] = gameInfo.strokesHtmlCache;
  const correctLetters: string[] = gameInfo.correctLetters;
  const previousGuess: string[] = gameInfo.previousGuess;
  const previousGuessIdioms: string[] = gameInfo.previousGuessIdioms;
  const defaultModeSettings = {
    keepShadow: !0,
    correctThreshold: 0.5,
    presentThreshold: 1,
    shiftFactor: 0.7,
    idiomLimit: 2e3,
  };
  const hardModeSettings = {
    keepShadow: !1,
    correctThreshold: 0.3,
    presentThreshold: 1,
    shiftFactor: 0.7,
  };
  const strokeConfig = isHardMode ? hardModeSettings : defaultModeSettings;
  for (let i = 0; i < answerIdiom.length; i++) {
    const compareResult = compareStrokes(
      strokesData[answerIdiom[i]],
      strokesData[userInputIdiom[i]],
      null,
      strokeConfig
    );
    compareResult.match = answerIdiom[i] === userInputIdiom[i];
    if (compareResult.match || correctLetters[i] !== "*") {
      correctLetters[i] = answerIdiom[i];
      compareResult.shadows = [];
      for (const stroke of strokesData[answerIdiom[i]].strokes) {
        compareResult.shadows.push({
          stroke,
          shiftX: 0,
          shiftY: 0,
          distance: 0,
        });
      }
      compareResult.match = true;
    }
    htmlResult.push(` <button class="transition-transform betterhover:hover:scale-y-90">
                                <div class="flex h-32 w-32 items-center justify-center border-neutral-400 dark:border-neutral-600 ${
                                  compareResult.match
                                    ? "bg-correct"
                                    : "border-2"
                                }"
                                     style="">
                                    <svg viewBox="0 0 1024 1024" class="h-24 w-24">
                                        <g transform="scale(1, -1) translate(0, -900)">
                                        ${
                                          compareResult.match ||
                                          previousGuessIdioms.includes(
                                            userInputIdiom
                                          ) ||
                                          isHardMode
                                            ? ""
                                            : strokesHtmlCache[i].join("\n")
                                        }`);

    for (let shadow of compareResult.shadows) {
      if (!shadow.stroke) {
        continue;
      }

      const theStrokePath = `  <path d="${shadow.stroke}"
                                                  opacity="${
                                                    (strokeConfig.presentThreshold -
                                                      Math.max(
                                                        shadow.distance,
                                                        strokeConfig.correctThreshold
                                                      )) /
                                                    (strokeConfig.presentThreshold -
                                                      strokeConfig.correctThreshold)
                                                  }"
                                                  transform="translate(${
                                                    shadow.shiftX
                                                  }, ${shadow.shiftY})"
                                                  class="${
                                                    compareResult.match
                                                      ? "fill-white"
                                                      : shadow.distance === 0
                                                      ? "fill-correct"
                                                      : "dark:fill-white"
                                                  }"></path>
                                           `;
      htmlResult.push(theStrokePath);
      if (!previousGuess.includes(`${userInputIdiom[i]}-${i}`)) {
        strokesHtmlCache[i].push(theStrokePath);
      }
    }
    htmlResult.push(`</g>
                                    </svg>
                                </div>
                            </button>`);
  }

  htmlResult.push(`</div>
</div>`);
  const userInputIdiomArray = userInputIdiom
    .split("")
    .map((char, index) => `${char}-${index}`);
  userInputIdiomArray.forEach((charIndex) => {
    if (!previousGuess.includes(charIndex)) {
      previousGuess.push(charIndex);
    }
  });
  if (!previousGuessIdioms.includes(userInputIdiom)) {
    previousGuessIdioms.push(userInputIdiom);
  }
  const setWordleGameRecord = async (collection: any, keys: any) => {
    await g.ctx.database.set(collection, keys, {
      strokesHtmlCache,
      correctLetters,
      previousGuess,
      previousGuessIdioms,
    });
  };
  if (wordleIndex === 1) {
    await setWordleGameRecord("wordle_game_records", { channelId });
  } else {
    await setWordleGameRecord("extra_wordle_game_records", {
      channelId,
      wordleIndex,
    });
  }
  return htmlResult.join("\n");
}

// 生成「汉兜」模式的拼音方块 HTML，并更新汉字、拼音、声调线索。
export async function generateLetterTilesHtmlForHandle(
  g: GameContext,
  answerIdiom: string,
  userInputIdiom: string,
  channelId: string,
  wordleIndex: number,
  gameInfo: GameRecord | ExtraGameRecord,
  answerPinyin: string,
  userInputPinyin: string
) {
  const correctLetters: string[] = gameInfo.correctLetters;
  let presentLetters = gameInfo.presentLetters;
  let absentLetters = gameInfo.absentLetters;
  let presentLettersWithIndex = gameInfo.presentLettersWithIndex;
  let correctPinyinsWithIndex = gameInfo.correctPinyinsWithIndex;
  let presentPinyinsWithIndex = gameInfo.presentPinyinsWithIndex;
  let absentPinyins = gameInfo.absentPinyins;
  let correctTonesWithIndex = gameInfo.correctTonesWithIndex;
  let presentTonesWithIndex = gameInfo.presentTonesWithIndex;
  let absentTones = gameInfo.absentTones;
  let presentPinyins = gameInfo.presentPinyins;
  let presentTones = gameInfo.presentTones;

  interface WordInfo {
    word: string;
    pinyin: string[];
  }

  if (!userInputPinyin) {
    const userInputIdiomInfo = await getIdiomInfo(g, userInputIdiom);
    userInputPinyin = userInputIdiomInfo.pinyin;
  }

  // 拼音转换 分离音标 string[][]
  const processedUserInputPinyin = processPinyin(userInputPinyin);
  const processedAnswerIdiomPinyin = processPinyin(answerPinyin);

  // 总信息
  const userInputIdiomAllRecords: WordInfo[] = userInputIdiom
    .split("")
    .map((char, index) => {
      const pinyinArray = processedUserInputPinyin[index].map((p) => {
        const [pinyin, status = ""] = p.split("-");
        return `${pinyin}-absent${status ? `-${status}-absent` : ""}`;
      });
      return { word: `${char}-absent`, pinyin: pinyinArray };
    });

  // 汉字统计
  const userInputIdiomCharCount = countCharactersAndIndexes(userInputIdiom);
  const answerIdiomCharCount = countCharactersAndIndexes(answerIdiom);
  // 声母、韵母、整体认读音节统计
  const userInputPinyinOccurrences = processPinyinArray(
    processedUserInputPinyin
  );
  const answerIdiomPinyinOccurrences = processPinyinArray(
    processedAnswerIdiomPinyin
  );

  const userInputPinyinAllOccurrences = mergeOccurrences(
    userInputPinyinOccurrences
  );
  const answerIdiomPinyinAllOccurrences = mergeOccurrences(
    answerIdiomPinyinOccurrences
  );
  // 声调统计
  const userInputTones = countNumericTones(processedUserInputPinyin);
  const answerIdiomTones = countNumericTones(processedAnswerIdiomPinyin);
  const answerIdiomTonesCopy = answerIdiomTones;

  for (const char in userInputIdiomCharCount) {
    if (char in answerIdiomCharCount) {
      const userInputCharInfo = userInputIdiomCharCount[char];
      const answerCharInfo = answerIdiomCharCount[char];

      const commonIndexes = userInputCharInfo.indexes.filter((index) =>
        answerCharInfo.indexes.includes(index)
      );

      commonIndexes.forEach((index) => {
        // correct
        userInputIdiomAllRecords[index].word = userInputIdiomAllRecords[
          index
        ].word.replace(/-\w+$/g, "-correct");
        correctLetters[index] =
          userInputIdiomAllRecords[index].word.split("-")[0];

        userInputCharInfo.count -= 1;
        userInputCharInfo.indexes = userInputCharInfo.indexes.filter(
          (i) => i !== index
        );

        answerCharInfo.count -= 1;
        answerCharInfo.indexes = answerCharInfo.indexes.filter(
          (i) => i !== index
        );
      });

      userInputCharInfo.indexes.forEach((userIndex) => {
        if (
          !answerCharInfo.indexes.includes(userIndex) &&
          answerCharInfo.count > 0
        ) {
          // present
          userInputIdiomAllRecords[userIndex].word = userInputIdiomAllRecords[
            userIndex
          ].word.replace(/-\w+$/g, "-present");

          presentLetters +=
            userInputIdiomAllRecords[userIndex].word.split("-")[0];
          presentLettersWithIndex.push(
            `${userInputIdiomAllRecords[userIndex].word.split("-")[0]}-${
              userIndex + 1
            }`
          );
          answerCharInfo.count -= 1;
        }
      });
    } else {
      // absent
      absentLetters += char;
    }
  }

  for (const element in userInputPinyinAllOccurrences) {
    if (element in answerIdiomPinyinAllOccurrences) {
      const userInputElementInfo = userInputPinyinAllOccurrences[element];
      const answerElementInfo = answerIdiomPinyinAllOccurrences[element];

      const commonPositions = userInputElementInfo.positions.filter(
        (position) => answerElementInfo.positions.includes(position)
      );

      commonPositions.forEach((position) => {
        // correct
        const pinyinArray = userInputIdiomAllRecords[position].pinyin
          .map((pinyin) => {
            return pinyin.split("-")[0];
          })
          .join("");

        const matchIndex = pinyinArray.indexOf(element);
        if (matchIndex !== -1) {
          for (let i = matchIndex; i < matchIndex + element.length; i++) {
            userInputIdiomAllRecords[position].pinyin[i] =
              userInputIdiomAllRecords[position].pinyin[i].replace(
                "absent",
                "correct"
              );
          }
        }

        correctPinyinsWithIndex.push(`${element}-${position + 1}`);

        userInputElementInfo.count -= 1;
        userInputElementInfo.positions =
          userInputElementInfo.positions.filter((i) => i !== position);

        answerElementInfo.count -= 1;
        answerElementInfo.positions = answerElementInfo.positions.filter(
          (i) => i !== position
        );
      });

      userInputElementInfo.positions.forEach((userPosition) => {
        if (
          !answerElementInfo.positions.includes(userPosition) &&
          answerElementInfo.count > 0
        ) {
          // present
          const pinyinArray = userInputIdiomAllRecords[userPosition].pinyin
            .map((pinyin) => {
              return pinyin.split("-")[0];
            })
            .join("");

          const matchIndex = pinyinArray.indexOf(element);
          if (matchIndex !== -1) {
            for (let i = matchIndex; i < matchIndex + element.length; i++) {
              userInputIdiomAllRecords[userPosition].pinyin[i] =
                userInputIdiomAllRecords[userPosition].pinyin[i].replace(
                  "absent",
                  "present"
                );
            }
          }
          presentPinyins.push(element);
          presentPinyinsWithIndex.push(`${element}-${userPosition + 1}`);
          answerElementInfo.count -= 1;
        }
      });
    } else {
      absentPinyins.push(element);
    }
  }

  for (const tone in userInputTones) {
    if (tone in answerIdiomTones) {
      // correct
      const userInputToneInfo = userInputTones[tone];
      const answerToneInfo = answerIdiomTones[tone];

      const commonPositions = userInputToneInfo.positions.filter((position) =>
        answerToneInfo.positions.includes(position)
      );

      commonPositions.forEach((position) => {
        const matchIndex = userInputIdiomAllRecords[
          position
        ].pinyin.findIndex((pinyin) => pinyin.includes(`-${tone}-absent`));
        if (matchIndex !== -1) {
          userInputIdiomAllRecords[position].pinyin[matchIndex] =
            userInputIdiomAllRecords[position].pinyin[matchIndex].replace(
              `-${tone}-absent`,
              `-${tone}-correct`
            );
        }
        correctTonesWithIndex.push(`第${tone}声-${position + 1}`);
        userInputToneInfo.count -= 1;
        userInputToneInfo.positions = userInputToneInfo.positions.filter(
          (i) => i !== position
        );

        answerToneInfo.count -= 1;
        answerToneInfo.positions = answerToneInfo.positions.filter(
          (i) => i !== position
        );
      });

      userInputToneInfo.positions.forEach((userPosition) => {
        if (
          !answerToneInfo.positions.includes(userPosition) &&
          answerToneInfo.count > 0
        ) {
          // present
          const pinyinArray = userInputIdiomAllRecords[userPosition].pinyin;
          const matchIndex = pinyinArray.findIndex((pinyin) =>
            pinyin.includes(`-${tone}-absent`)
          );
          if (matchIndex !== -1) {
            userInputIdiomAllRecords[userPosition].pinyin[matchIndex] =
              pinyinArray[matchIndex].replace(
                `-${tone}-absent`,
                `-${tone}-present`
              );
          }
          presentTones.push(`第${tone}声`);
          presentTonesWithIndex.push(`第${tone}声-${userPosition + 1}`);
          answerToneInfo.count -= 1;
        }
      });
    } else {
      absentTones.push(`第${tone}声`);
    }
  }

  const processedRecords = processAllRecords(userInputIdiomAllRecords);

  const processedRecords2 = transformRecords(processedRecords);

  const htmlResult: string[] = [`<div flex="">`];
  for (const record of processedRecords2) {
    const wordValue = record.word.value;
    const statusMap: { [key: string]: string } = {
      absent: "op80",
      present: "text-mis",
      correct: "text-ok",
    };

    let wordStatus = record.word.status;
    wordStatus = statusMap[wordStatus] || wordStatus;

    const statusMap2: { [key: string]: string } = {
      absent: "op35",
      present: "text-mis",
      correct: "text-ok",
    };
    const pinyin = record.pinyin;
    const separatedPinyin = separatePinyin(record);
    const initial = record.initial;
    const final = record.final;
    const toneValue = record.tune.value;
    const toneStatus = record.tune.status;
    const tonesPaths = [
      "0",
      // 第 1 声
      '<path d="M3.35 8C2.60442 8 2 8.60442 2 9.35V10.35C2 11.0956 2.60442 11.7 3.35 11.7H17.35C18.0956 11.7 18.7 11.0956 18.7 10.35V9.35C18.7 8.60442 18.0956 8 17.35 8H3.35Z" fill="currentColor"></path>',
      // 第 2 声
      '<path d="M16.581 3.71105C16.2453 3.27254 15.6176 3.18923 15.1791 3.52498L3.26924 12.6439C2.83073 12.9796 2.74743 13.6073 3.08318 14.0458L4.29903 15.6338C4.63478 16.0723 5.26244 16.1556 5.70095 15.8199L17.6108 6.70095C18.0493 6.3652 18.1327 5.73754 17.7969 5.29903L16.581 3.71105Z" fill="currentColor"></path>',
      // 第 3 声
      '<path d="M1.70711 7.70712C1.31658 7.3166 1.31658 6.68343 1.70711 6.29291L2.41421 5.5858C2.80474 5.19528 3.4379 5.19528 3.82843 5.5858L9.31502 11.0724C9.70555 11.4629 10.3387 11.4629 10.7292 11.0724L16.2158 5.5858C16.6064 5.19528 17.2395 5.19528 17.63 5.5858L18.3372 6.29291C18.7277 6.68343 18.7277 7.3166 18.3372 7.70712L10.7292 15.315C10.3387 15.7056 9.70555 15.7056 9.31502 15.315L1.70711 7.70712Z" fill="currentColor"></path>',
      // 第 4 声
      '<path d="M4.12282 3.71105C4.45857 3.27254 5.08623 3.18923 5.52474 3.52498L17.4346 12.6439C17.8731 12.9796 17.9564 13.6073 17.6207 14.0458L16.4048 15.6338C16.0691 16.0723 15.4414 16.1556 15.0029 15.8199L3.09303 6.70095C2.65452 6.3652 2.57122 5.73754 2.90697 5.29903L4.12282 3.71105Z" fill="currentColor"></path>',
    ];
    const html: string[] = [
      `<div w-30="" h-30="" m2="">
                    <div h-30="" w-30="" border-2="" flex="~ center" relative="" leading-1em="" em="" font-serif=""
                         class="bg-gray-400/8 border-transparent">
                        <div absolute="" text-5xl="" leading-1em="" class="${wordStatus} top-12">${wordValue}</div>
                        <div absolute="" font-mono="" text-center="" left-0="" right-0="" font-100="" flex=""
                             flex-col="" items-center="" class="top-14px" text-2xl="">
                            <div relative="" ma="" items-start="" flex="~ x-center">
                                ${
                                  separatedPinyin.initials.length > 0
                                    ? `<div class="${
                                        statusMap2[
                                          separatedPinyin.initials[0].status
                                        ]
                                      }" mx-1px="">${initial}</div>`
                                    : ""
                                }
<div mx-1px="" flex="">`,
    ];
    for (const final of separatedPinyin.finals) {
      if (!final.isHasTone) {
        html.push(
          `<div class="${statusMap2[final.status]}">${final.value}</div>`
        );
      } else {
        html.push(`                  <div relative="">
                                        <div class="${
                                          statusMap2[final.status]
                                        }">${final.value === "i" ? "ı" : final.value}</div>
                                        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                                             class="${
                                               statusMap2[toneStatus]
                                             }" absolute="" w="86%" left="8%"
                                             style="bottom: 1.5rem;">
                                            ${tonesPaths[toneValue]}
                                        </svg>
                                    </div>`);
      }
    }
    html.push(`</div>
                            </div>
                        </div>
                    </div>
                </div>`);
    htmlResult.push(html.join("\n"));
  }
  htmlResult.push(`</div>`);

  const pinyinSet = new Set(
    Object.keys(answerIdiomPinyinOccurrences.initialsOccurrences).concat(
      Object.keys(answerIdiomPinyinOccurrences.finalsOccurrences)
    )
  );

  const filteredAbsentPinyins = absentPinyins.filter(
    (pinyin) => !pinyinSet.has(pinyin)
  );
  absentTones.forEach((tone, index) => {
    const toneNumber = tone.match(/\d+/);
    if (toneNumber) {
      const key = toneNumber[0];
      if (answerIdiomTonesCopy[key]) {
        absentTones.splice(index, 1);
      }
    }
  });
  const setWordleGameRecord = async (collection: any, keys: any) => {
    await g.ctx.database.set(collection, keys, {
      correctLetters,
      presentLetters: removeDuplicates(presentLetters),
      absentLetters: removeLetters(
        gameInfo.wordGuess,
        removeDuplicates(absentLetters)
      ),
      presentLettersWithIndex: mergeDuplicates(presentLettersWithIndex),
      correctPinyinsWithIndex: mergeDuplicates(correctPinyinsWithIndex),
      presentPinyinsWithIndex: mergeDuplicates(presentPinyinsWithIndex),
      correctTonesWithIndex: mergeDuplicates(correctTonesWithIndex),
      presentTonesWithIndex: mergeDuplicates(presentTonesWithIndex),
      presentPinyins: mergeDuplicates(presentPinyins),
      presentTones: mergeDuplicates(presentTones),
      absentPinyins: mergeDuplicates(filteredAbsentPinyins),
      absentTones: mergeDuplicates(absentTones),
    });
  };
  if (wordleIndex === 1) {
    await setWordleGameRecord("wordle_game_records", { channelId });
  } else {
    await setWordleGameRecord("extra_wordle_game_records", {
      channelId,
      wordleIndex,
    });
  }

  return htmlResult.join("\n");
}
