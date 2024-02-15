// noinspection CssUnresolvedCustomProperty

import {Context, h, Schema} from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import {} from 'koishi-plugin-monetary'
import {} from 'koishi-plugin-markdown-to-image-service'
import * as path from 'path';
import * as fs from 'fs';

export const inject = {
  required: ['monetary', 'database', 'puppeteer'],
  optional: ['markdownToImage'],
}
export const name = 'wordle-game'
export const usage = `## 🎣 使用

- 启动必要的服务。您需要启用 \`monetary\`，\`database\` 和 \`puppeteer\` 插件，以实现货币系统，数据存储和图片生成的功能。
- 建议自行添加指令别名，以方便您和您的用户使用。
- 享受猜单词游戏吧！😊

## 🎳 游戏指令

以下是该插件提供的指令列表:

### 游戏操作

- \`wordleGame.加入 [money:number]\` - 加入游戏，可选参数为投入的货币数额。
- \`wordleGame.退出\` - 退出游戏，只能在游戏未开始时使用。
- \`wordleGame.结束\` - 结束游戏，只能在游戏已开始时使用。

### 游戏模式

- \`wordleGame.开始 [guessWordLength:number]\` - 开始游戏引导，可选参数为猜单词的长度。
- \`wordleGame.开始.经典\` - 开始经典猜单词游戏，需要投入货币，赢了有奖励。
  - \`--hard\` - 指令的选项，困难模式，后续猜单词必须使用前面正确或出现的字母。
- \`wordleGame.开始.CET4/6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL [guessWordLength:number]\` -
  开始猜不同考试/类别的单词游戏，可选参数为猜单词的长度。
  - \`--hard\` - 指令的选项，困难模式，后续猜单词必须使用前面正确或出现的字母。

### 游戏操作

- \`wordleGame.猜 [inputWord:text]\` - 猜单词，参数为输入的单词。
- \`wordleGame.查询进度\` - 查询当前游戏进度。

### 数据查询

- \`wordleGame.查询单词 [targetWord:text]\` - 在 ALL 词库中查询单词信息（翻译）。
- \`wordleGame.查询玩家记录 [targetUser:text]\` - 查询玩家记录，可选参数为目标玩家的 at 信息。
- \`wordleGame.排行榜 [number:number]\` - 查看排行榜，可选参数为排行榜的人数。
- \`wordleGame.排行榜.损益/总.胜场/总.输场/经典/CET4/CET6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL.胜场/输场 [number:number]\` -
  查看不同模式的玩家排行榜，可选参数为排行榜的人数。`

// pz* pzx*
export interface Config {
  defaultMaxLeaderboardEntries: number
  defaultWordLengthForGuessing: number
  maxInvestmentCurrency: number
  defaultRewardMultiplier: number

  allowNonPlayersToGuess: boolean
  enableWordGuessMiddleware: boolean
  shouldPromptWordLengthInput: boolean
  shouldPromptForWordLengthOnNonClassicStart: boolean

  enableWordGuessTimeLimit: boolean
  wordGuessTimeLimitInSeconds: number

  imageType: "png" | "jpeg" | "webp"
  isTextToImageConversionEnabled: boolean
}

export const Config: Schema<Config> = Schema.intersect([

  Schema.object({
    defaultMaxLeaderboardEntries: Schema.number().min(0).default(10).description(`显示排行榜时默认的最大人数。`),
    defaultWordLengthForGuessing: Schema.number().min(1).default(5).description(`非经典游戏模式下，默认的猜单词长度。`),
    maxInvestmentCurrency: Schema.number().min(0).default(50).description(`加入游戏时可投入的最大货币数额。`),
    defaultRewardMultiplier: Schema.number().min(0).default(2).description(`猜单词经典模式赢了之后奖励的货币倍率。`),
  }).description('游戏设置'),


  Schema.intersect([
    Schema.object({
      allowNonPlayersToGuess: Schema.boolean().default(true).description(`是否允许未加入游戏的玩家进行猜单词的操作，开启后可以无需加入直接开始。`),
      enableWordGuessMiddleware: Schema.boolean().default(true).description(`是否开启猜单词指令无前缀的中间件。`),
      shouldPromptWordLengthInput: Schema.boolean().default(true).description(`是否在开始游戏引导中提示输入猜单词的长度，不开启则为默认长度。`),
      shouldPromptForWordLengthOnNonClassicStart: Schema.boolean().default(false).description(`是否在开始非经典模式时提示输入猜单词的长度，不开启则为默认长度。`),
    }).description('游戏行为设置'),
    Schema.object({
      enableWordGuessTimeLimit: Schema.boolean().default(false).description(`是否开启猜单词游戏作答时间限制功能。`),
    }),
    Schema.union([
      Schema.object({
        enableWordGuessTimeLimit: Schema.const(true).required(),
        wordGuessTimeLimitInSeconds: Schema.number().min(0).default(120).description(` 猜单词游戏作答时间，单位是秒。`),
      }),
      Schema.object({}),
    ]),
    Schema.object({
      imageType: Schema.union(['png', 'jpeg', 'webp']).default('png').description(`发送的图片类型。`),
      isTextToImageConversionEnabled: Schema.boolean().default(false).description(`是否开启将文本转为图片的功能（可选），如需启用，需要启用 \`markdownToImage\` 服务。`),
    }),
  ])
]) as any;

declare module 'koishi' {
  interface Tables {
    wordle_game_records: GameRecord
    wordle_gaming_player_records: GamingPlayer
    wordle_player_records: PlayerRecord
    monetary: Monetary
  }
}

// jk*
interface Monetary {
  uid: number
  currency: string
  value: number
}

export interface GameRecord {
  id: number
  channelId: string
  isStarted: boolean
  gameMode: string
  wordGuessHtmlCache: string
  remainingGuessesCount: number
  wordAnswerChineseDefinition: string
  guessWordLength: number
  wordGuess: string
  isRunning: boolean
  isHardMode: boolean
  correctLetters: string[]
  presentLetters: string
  absentLetters: string
  timestamp: number
}

export interface GamingPlayer {
  id: number
  channelId: string
  userId: string
  username: string
  money: number
}

export interface PlayerRecord {
  id: number
  userId: string
  username: string
  win: number
  lose: number
  moneyChange: number
  wordGuessCount: number
  stats: PlayerStats;
}

interface WordData {
  word: string;
  translation: string;
  wordCount: number;
}

interface PlayerStats {
  经典?: WinLoseStats;
  CET4?: WinLoseStats;
  CET6?: WinLoseStats;
  GMAT?: WinLoseStats;
  GRE?: WinLoseStats;
  IELTS?: WinLoseStats;
  SAT?: WinLoseStats;
  TOEFL?: WinLoseStats;
  考研?: WinLoseStats;
  专八?: WinLoseStats;
  专四?: WinLoseStats;
  ALL?: WinLoseStats;
}

interface WinLoseStats {
  win: number;
  lose: number;
  // fastestWordGuessTime: number;
}

const initialStats: PlayerStats = {
  经典: {win: 0, lose: 0},
  CET4: {win: 0, lose: 0},
  CET6: {win: 0, lose: 0},
  GMAT: {win: 0, lose: 0},
  GRE: {win: 0, lose: 0},
  IELTS: {win: 0, lose: 0},
  SAT: {win: 0, lose: 0},
  TOEFL: {win: 0, lose: 0},
  考研: {win: 0, lose: 0},
  专八: {win: 0, lose: 0},
  专四: {win: 0, lose: 0},
  ALL: {win: 0, lose: 0},
};

export function apply(ctx: Context, config: Config) {
  // tzb*
  ctx.model.extend('wordle_game_records', {
    id: 'unsigned',
    channelId: 'string',
    isStarted: 'boolean',
    remainingGuessesCount: 'unsigned',
    wordAnswerChineseDefinition: 'string',
    wordGuess: 'string',
    wordGuessHtmlCache: 'text',
    guessWordLength: 'unsigned',
    gameMode: 'string',
    isRunning: 'boolean',
    timestamp: {type: 'integer', length: 20},
    correctLetters: 'list',
    presentLetters: 'string',
    absentLetters: 'string',
    isHardMode: 'boolean',
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('wordle_gaming_player_records', {
    id: 'unsigned',
    channelId: 'string',
    username: 'string',
    money: 'unsigned',
    userId: 'string',
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('wordle_player_records', {
    id: 'unsigned',
    username: 'string',
    userId: 'string',
    lose: 'unsigned',
    win: 'unsigned',
    moneyChange: 'double',
    wordGuessCount: 'unsigned',
    stats: {type: 'json', initial: initialStats}
  }, {
    primary: 'id',
    autoInc: true,
  })
  // zjj*
  ctx.middleware(async (session, next) => {
    const {channelId, content} = session;
    if (!config.enableWordGuessMiddleware) {
      return await next();
    }

    const gameInfo = await getGameInfo(channelId);
    // 未开始
    if (!gameInfo.isStarted) {
      return await next();
    }

    // 判断输入
    if (!/^[a-zA-Z]+$/.test(content)) {
      return await next();
    }
    if (content.length !== gameInfo.guessWordLength) {
      return await next();
    }

    await session.execute(`wordleGame.猜 ${content}`);
    return;
  });
  // wordleGame帮助
  ctx.command('wordleGame', '猜单词游戏帮助')
    .action(async ({session}) => {
      await session.execute(`wordleGame -h`)
    })
  // wordleGame.加入 j* jr*
  ctx.command('wordleGame.加入 [money:number]', '加入游戏')
    .action(async ({session}, money = 0) => {
      const {channelId, userId, username, user} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      const gameInfo = await getGameInfo(channelId)
      const isInGame = await isPlayerInGame(channelId, userId);
      if (gameInfo.isStarted) {
        if (!isInGame) {
          return await sendMessage(session, `【@${username}】\n不好意思你来晚啦~\n游戏已经开始了呢！`)
        } else {
          // 生成 html 字符串
          const emptyGridHtml = generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
          const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          // 图
          const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
          // 返回提示和游戏进程图
          return await sendMessage(session, `【@${username}】\n你已经在游戏里了哦~\n且游戏正在进行中，加油！\n${h.image(imageBuffer, `image/${config.imageType}`)}`)
        }
      }
      // 判断输入
      if (typeof money !== 'number' || money < 0) {
        return await sendMessage(session, `【@${username}】\n真是个傻瓜呢~\n投个钱也要别人教你嘛！`);
      }
      // 不能超过最大投入金额
      if (money > config.maxInvestmentCurrency) {
        return await sendMessage(session, `【@${username}】\n咱们这是小游戏呀...\n不许玩这么大！\n当前的最大投入金额为：【${config.maxInvestmentCurrency}】`);
      }
      // @ts-ignore
      const uid = user.id;
      let getUserMonetary = await ctx.database.get('monetary', {uid});
      if (getUserMonetary.length === 0) {
        await ctx.database.create('monetary', {uid, value: 0, currency: 'default'});
        getUserMonetary = await ctx.database.get('monetary', {uid})
      }
      const userMonetary = getUserMonetary[0]
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      // 修改金额
      if (isInGame) {
        // 余额够
        if (userMonetary.value >= money) {
          await ctx.database.set('wordle_gaming_player_records', {channelId, userId}, {money});
          return await sendMessage(session, `【@${username}】\n修改投入金额成功！\n当前投入金额为：【${money}】\n当前玩家人数：${numberOfPlayers} 名！`);
        } else {
          // 余额不够
          await ctx.database.set('wordle_gaming_player_records', {channelId, userId}, {money: userMonetary.value});
          return await sendMessage(session, `【@${username}】\n修改投入金额成功！\n不过好像余额不足啦！\n投入金额已修正为：【${userMonetary.value}】\n当前玩家人数：${numberOfPlayers} 名！`);
        }
      }
      // 加入游戏
      // money 为 0
      if (money === 0) {
        await ctx.database.create('wordle_gaming_player_records', {channelId, userId, username, money});
        // 有余额
        if (userMonetary.value > 0) {
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n如果您想玩的模式为：【经典】\n那您可以带上货币数额再加入一次！\n当前的最大投入金额为：【${config.maxInvestmentCurrency}】\n当前奖励倍率为：【${config.defaultRewardMultiplier}】\n当前玩家人数：${numberOfPlayers + 1} 名！`);
        } else {
          // 没余额
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n加油哇，祝您好运！\n当前玩家人数：${numberOfPlayers + 1} 名！`);
        }
      } else {
        // money !== 0
        // 余额足够
        if (userMonetary.value >= money) {
          await ctx.database.create('wordle_gaming_player_records', {channelId, userId, username, money});
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！您投入的金额为：【${money}】\n当前奖励倍率为：【${config.defaultRewardMultiplier}】\n当前玩家人数：${numberOfPlayers + 1} 名！`);
        } else {
          // 余额不够
          await ctx.database.create('wordle_gaming_player_records', {
            channelId,
            userId,
            username,
            money: userMonetary.value
          });
          return await sendMessage(session, `【@${username}】\n您成功加入游戏了！\n不过好像余额不足啦！\n投入金额已修正为：【${userMonetary.value}】\n当前玩家人数：${numberOfPlayers + 1} 名！`);
        }
      }
      // .action
    })
  // wordleGame.退出 q* tc*
  ctx.command('wordleGame.退出', '退出游戏')
    .action(async ({session}) => {
      const {channelId, userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始啦！\n无法进行此操作！`);
      }
      // 玩家
      const isInGame = await isPlayerInGame(channelId, userId);
      if (!isInGame) {
        return await sendMessage(session, `【@${username}】\n您还没加入游戏呢！\n怎么退出？`);
      }
      // 退出
      await ctx.database.remove('wordle_gaming_player_records', {channelId, userId})
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      return await sendMessage(session, `【@${username}】\n您成功退出游戏啦！\n那就让我们下次再见吧~\n剩余玩家人数：${numberOfPlayers} 名！`);
      // .action
    })
  // wordleGame.结束 s* js*
  ctx.command('wordleGame.结束', '结束游戏')
    .action(async ({session}) => {
      const {channelId, userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏还没开始哦~怎么结束呐？`);
      }
      // 结束
      await endGame(channelId)
      return await sendMessage(session, `【@${username}】\n由于您执行了操作：【结束】\n游戏已结束！\n${generateGameEndMessage(gameInfo)}`);
      // .action
    })
  // wordleGame.开始 s* ks*
  ctx.command('wordleGame.开始 [guessWordLength:number]', '开始游戏引导')
    .option('hard', '--hard 困难模式', {fallback: false})
    .action(async ({session, options}, guessWordLength = config.defaultWordLengthForGuessing) => {
      const {channelId, userId, username} = session;
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username);
      // 游戏状态
      const gameInfo = await getGameInfo(channelId);
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`);
      }
      // 提示输入
      await sendMessage(session, `【@${username}】\n当前可以开始的游戏模式如下：\n${exams.map((exam, index) => `${index + 1}. ${exam}`).join('\n')}\n请输入您想开始的【序号】或【模式名】：`);
      const userInput = await session.prompt();
      if (!userInput) return await sendMessage(session, `【@${username}】\n输入超时！`);
      // 判断 userInput 是否为有效输入
      const selectedExam = isNaN(parseInt(userInput)) ? userInput.toUpperCase() : exams[parseInt(userInput) - 1];
      if (exams.includes(selectedExam)) {
        if (config.shouldPromptWordLengthInput && selectedExam !== '经典') {
          await sendMessage(session, `【@${username}】\n请输入猜单词的长度：`);
          const userInput = await session.prompt();
          if (!userInput) return await sendMessage(session, `【@${username}】\n输入超时！`);
          guessWordLength = parseInt(userInput)
        }
        return await session.execute(`wordleGame.开始.${selectedExam}${options.hard ? ` --hard ` : ` `}${guessWordLength}`);
      } else {
        return await sendMessage(session, `【@${username}】\n无效的输入！`);
      }
      // .action
    });
  // wordleGame.开始.经典 jd*
  ctx.command('wordleGame.开始.经典', '开始经典猜单词游戏')
    .option('hard', '--hard 困难模式', {fallback: false})
    .action(async ({session, options}) => {
      const {channelId, userId, username, platform, timestamp} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`);
      }
      // 人数
      const numberOfPlayers = await getNumberOfPlayers(channelId);
      if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
        return await sendMessage(session, `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜单词】\n请先加入游戏吧~`);
      }
      // 经典扣钱
      const getPlayers = await ctx.database.get('wordle_gaming_player_records', {channelId})
      for (const thisGamingPlayer of getPlayers) {
        const {userId, money} = thisGamingPlayer
        if (money === 0) {
          continue;
        }
        const uid = await getPlayerUid(platform, userId);
        const [userMonetary] = await ctx.database.get('monetary', {uid})
        const value = userMonetary.value - money
        await ctx.database.set('monetary', {uid}, {value})
        // 更新货币变动记录
        const [playerInfo] = await ctx.database.get('wordle_player_records', {userId})
        await ctx.database.set('wordle_player_records', {userId}, {moneyChange: playerInfo.moneyChange - money})
      }
      // 开始游戏
      // 选待猜单词
      // const filePath = path.join(__dirname, '词汇', '经典_5_14855.json');
      //
      // const jsonContent = fs.readFileSync(filePath, 'utf-8');
      // const words: string[] = JSON.parse(jsonContent);
      //
      // function getRandomWord(): string {
      //   const randomIndex = Math.floor(Math.random() * words.length);
      //   return words[randomIndex].toLowerCase();
      // }

      const classicWordList = `ABACK ABASE ABATE ABBEY ABBOT ABHOR ABIDE ABLED ABODE ABORT ABOUT ABOVE ABUSE ABYSS ACORN ACRID ACTOR ACUTE ADAGE ADAPT ADEPT ADMIN ADMIT ADOBE ADOPT ADORE ADORN ADULT AFFIX AFIRE AFOOT AFOUL AFTER AGAIN AGAPE AGATE AGENT AGILE AGING AGLOW AGONY AGORA AGREE AHEAD AIDER AISLE ALARM ALBUM ALERT ALGAE ALIBI ALIEN ALIGN ALIKE ALIVE ALLAY ALLEY ALLOT ALLOW ALLOY ALOFT ALONE ALONG ALOOF ALOUD ALPHA ALTAR ALTER AMASS AMAZE AMBER AMBLE AMEND AMISS AMITY AMONG AMPLE AMPLY AMUSE ANGEL ANGER ANGLE ANGRY ANGST ANIME ANKLE ANNEX ANNOY ANNUL ANODE ANTIC ANVIL AORTA APART APHID APING APNEA APPLE APPLY APRON APTLY ARBOR ARDOR ARENA ARGUE ARISE ARMOR AROMA AROSE ARRAY ARROW ARSON ARTSY ASCOT ASHEN ASIDE ASKEW ASSAY ASSET ATOLL ATONE ATTIC AUDIO AUDIT AUGUR AUNTY AVAIL AVERT AVIAN AVOID AWAIT AWAKE AWARD AWARE AWASH AWFUL AWOKE AXIAL AXIOM AXION AZURE BACON BADGE BADLY BAGEL BAGGY BAKER BALER BALMY BANAL BANJO BARGE BARON BASAL BASIC BASIL BASIN BASIS BASTE BATCH BATHE BATON BATTY BAWDY BAYOU BEACH BEADY BEARD BEAST BEECH BEEFY BEFIT BEGAN BEGAT BEGET BEGIN BEGUN BEING BELCH BELIE BELLE BELLY BELOW BENCH BERET BERRY BERTH BESET BETEL BEVEL BEZEL BIBLE BICEP BIDDY BIGOT BILGE BILLY BINGE BINGO BIOME BIRCH BIRTH BISON BITTY BLACK BLADE BLAME BLAND BLANK BLARE BLAST BLAZE BLEAK BLEAT BLEED BLEEP BLEND BLESS BLIMP BLIND BLINK BLISS BLITZ BLOAT BLOCK BLOKE BLOND BLOOD BLOOM BLOWN BLUER BLUFF BLUNT BLURB BLURT BLUSH BOARD BOAST BOBBY BONEY BONGO BONUS BOOBY BOOST BOOTH BOOTY BOOZE BOOZY BORAX BORNE BOSOM BOSSY BOTCH BOUGH BOULE BOUND BOWEL BOXER BRACE BRAID BRAIN BRAKE BRAND BRASH BRASS BRAVE BRAVO BRAWL BRAWN BREAD BREAK BREED BRIAR BRIBE BRICK BRIDE BRIEF BRINE BRING BRINK BRINY BRISK BROAD BROIL BROKE BROOD BROOK BROOM BROTH BROWN BRUNT BRUSH BRUTE BUDDY BUDGE BUGGY BUGLE BUILD BUILT BULGE BULKY BULLY BUNCH BUNNY BURLY BURNT BURST BUSED BUSHY BUTCH BUTTE BUXOM BUYER BYLAW CABAL CABBY CABIN CABLE CACAO CACHE CACTI CADDY CADET CAGEY CAIRN CAMEL CAMEO CANAL CANDY CANNY CANOE CANON CAPER CAPUT CARAT CARGO CAROL CARRY CARVE CASTE CATCH CATER CATTY CAULK CAUSE CAVIL CEASE CEDAR CELLO CHAFE CHAFF CHAIN CHAIR CHALK CHAMP CHANT CHAOS CHARD CHARM CHART CHASE CHASM CHEAP CHEAT CHECK CHEEK CHEER CHESS CHEST CHICK CHIDE CHIEF CHILD CHILI CHILL CHIME CHINA CHIRP CHOCK CHOIR CHOKE CHORD CHORE CHOSE CHUCK CHUMP CHUNK CHURN CHUTE CIDER CIGAR CINCH CIRCA CIVIC CIVIL CLACK CLAIM CLAMP CLANG CLANK CLASH CLASP CLASS CLEAN CLEAR CLEAT CLEFT CLERK CLICK CLIFF CLIMB CLING CLINK CLOAK CLOCK CLONE CLOSE CLOTH CLOUD CLOUT CLOVE CLOWN CLUCK CLUED CLUMP CLUNG COACH COAST COBRA COCOA COLON COLOR COMET COMFY COMIC COMMA CONCH CONDO CONIC COPSE CORAL CORER CORNY COUCH COUGH COULD COUNT COUPE COURT COVEN COVER COVET COVEY COWER COYLY CRACK CRAFT CRAMP CRANE CRANK CRASH CRASS CRATE CRAVE CRAWL CRAZE CRAZY CREAK CREAM CREDO CREED CREEK CREEP CREME CREPE CREPT CRESS CREST CRICK CRIED CRIER CRIME CRIMP CRISP CROAK CROCK CRONE CRONY CROOK CROSS CROUP CROWD CROWN CRUDE CRUEL CRUMB CRUMP CRUSH CRUST CRYPT CUBIC CUMIN CURIO CURLY CURRY CURSE CURVE CURVY CUTIE CYBER CYCLE CYNIC DADDY DAILY DAIRY DAISY DALLY DANCE DANDY DATUM DAUNT DEALT DEATH DEBAR DEBIT DEBUG DEBUT DECAL DECAY DECOR DECOY DECRY DEFER DEIGN DEITY DELAY DELTA DELVE DEMON DEMUR DENIM DENSE DEPOT DEPTH DERBY DETER DETOX DEUCE DEVIL DIARY DICEY DIGIT DILLY DIMLY DINER DINGO DINGY DIODE DIRGE DIRTY DISCO DITCH DITTO DITTY DIVER DIZZY DODGE DODGY DOGMA DOING DOLLY DONOR DONUT DOPEY DOUBT DOUGH DOWDY DOWEL DOWNY DOWRY DOZEN DRAFT DRAIN DRAKE DRAMA DRANK DRAPE DRAWL DRAWN DREAD DREAM DRESS DRIED DRIER DRIFT DRILL DRINK DRIVE DROIT DROLL DRONE DROOL DROOP DROSS DROVE DROWN DRUID DRUNK DRYER DRYLY DUCHY DULLY DUMMY DUMPY DUNCE DUSKY DUSTY DUTCH DUVET DWARF DWELL DWELT DYING EAGER EAGLE EARLY EARTH EASEL EATEN EATER EBONY ECLAT EDICT EDIFY EERIE EGRET EIGHT EJECT EKING ELATE ELBOW ELDER ELECT ELEGY ELFIN ELIDE ELITE ELOPE ELUDE EMAIL EMBED EMBER EMCEE EMPTY ENACT ENDOW ENEMA ENEMY ENJOY ENNUI ENSUE ENTER ENTRY ENVOY EPOCH EPOXY EQUAL EQUIP ERASE ERECT ERODE ERROR ERUPT ESSAY ESTER ETHER ETHIC ETHOS ETUDE EVADE EVENT EVERY EVICT EVOKE EXACT EXALT EXCEL EXERT EXILE EXIST EXPEL EXTOL EXTRA EXULT EYING FABLE FACET FAINT FAIRY FAITH FALSE FANCY FANNY FARCE FATAL FATTY FAULT FAUNA FAVOR FEAST FECAL FEIGN FELLA FELON FEMME FEMUR FENCE FERAL FERRY FETAL FETCH FETID FETUS FEVER FEWER FIBER FIBRE FICUS FIELD FIEND FIERY FIFTH FIFTY FIGHT FILER FILET FILLY FILMY FILTH FINAL FINCH FINER FIRST FISHY FIXER FIZZY FJORD FLACK FLAIL FLAIR FLAKE FLAKY FLAME FLANK FLARE FLASH FLASK FLECK FLEET FLESH FLICK FLIER FLING FLINT FLIRT FLOAT FLOCK FLOOD FLOOR FLORA FLOSS FLOUR FLOUT FLOWN FLUFF FLUID FLUKE FLUME FLUNG FLUNK FLUSH FLUTE FLYER FOAMY FOCAL FOCUS FOGGY FOIST FOLIO FOLLY FORAY FORCE FORGE FORGO FORTE FORTH FORTY FORUM FOUND FOYER FRAIL FRAME FRANK FRAUD FREAK FREED FREER FRESH FRIAR FRIED FRILL FRISK FRITZ FROCK FROND FRONT FROST FROTH FROWN FROZE FRUIT FUDGE FUGUE FULLY FUNGI FUNKY FUNNY FUROR FURRY FUSSY FUZZY GAFFE GAILY GAMER GAMMA GAMUT GASSY GAUDY GAUGE GAUNT GAUZE GAVEL GAWKY GAYER GAYLY GAZER GECKO GEEKY GEESE GENIE GENRE GHOST GHOUL GIANT GIDDY GIPSY GIRLY GIRTH GIVEN GIVER GLADE GLAND GLARE GLASS GLAZE GLEAM GLEAN GLIDE GLINT GLOAT GLOBE GLOOM GLORY GLOSS GLOVE GLYPH GNASH GNOME GODLY GOING GOLEM GOLLY GONAD GONER GOODY GOOEY GOOFY GOOSE GORGE GOUGE GOURD GRACE GRADE GRAFT GRAIL GRAIN GRAND GRANT GRAPE GRAPH GRASP GRASS GRATE GRAVE GRAVY GRAZE GREAT GREED GREEN GREET GRIEF GRILL GRIME GRIMY GRIND GRIPE GROAN GROIN GROOM GROPE GROSS GROUP GROUT GROVE GROWL GROWN GRUEL GRUFF GRUNT GUARD GUAVA GUESS GUEST GUIDE GUILD GUILE GUILT GUISE GULCH GULLY GUMBO GUMMY GUPPY GUSTO GUSTY GYPSY HABIT HAIRY HALVE HANDY HAPPY HARDY HAREM HARPY HARRY HARSH HASTE HASTY HATCH HATER HAUNT HAUTE HAVEN HAVOC HAZEL HEADY HEARD HEART HEATH HEAVE HEAVY HEDGE HEFTY HEIST HELIX HELLO HENCE HERON HILLY HINGE HIPPO HIPPY HITCH HOARD HOBBY HOIST HOLLY HOMER HONEY HONOR HORDE HORNY HORSE HOTEL HOTLY HOUND HOUSE HOVEL HOVER HOWDY HUMAN HUMID HUMOR HUMPH HUMUS HUNCH HUNKY HURRY HUSKY HUSSY HUTCH HYDRO HYENA HYMEN HYPER ICILY ICING IDEAL IDIOM IDIOT IDLER IDYLL IGLOO ILIAC IMAGE IMBUE IMPEL IMPLY INANE INBOX INCUR INDEX INEPT INERT INFER INGOT INLAY INLET INNER INPUT INTER INTRO IONIC IRATE IRONY ISLET ISSUE ITCHY IVORY JAUNT JAZZY JELLY JERKY JETTY JEWEL JIFFY JOINT JOIST JOKER JOLLY JOUST JUDGE JUICE JUICY JUMBO JUMPY JUNTA JUNTO JUROR KAPPA KARMA KAYAK KEBAB KHAKI KINKY KIOSK KITTY KNACK KNAVE KNEAD KNEED KNEEL KNELT KNIFE KNOCK KNOLL KNOWN KOALA KRILL LABEL LABOR LADEN LADLE LAGER LANCE LANKY LAPEL LAPSE LARGE LARVA LASSO LATCH LATER LATHE LATTE LAUGH LAYER LEACH LEAFY LEAKY LEANT LEAPT LEARN LEASE LEASH LEAST LEAVE LEDGE LEECH LEERY LEFTY LEGAL LEGGY LEMON LEMUR LEPER LEVEL LEVER LIBEL LIEGE LIGHT LIKEN LILAC LIMBO LIMIT LINEN LINER LINGO LIPID LITHE LIVER LIVID LLAMA LOAMY LOATH LOBBY LOCAL LOCUS LODGE LOFTY LOGIC LOGIN LOOPY LOOSE LORRY LOSER LOUSE LOUSY LOVER LOWER LOWLY LOYAL LUCID LUCKY LUMEN LUMPY LUNAR LUNCH LUNGE LUPUS LURCH LURID LUSTY LYING LYMPH LYNCH LYRIC MACAW MACHO MACRO MADAM MADLY MAFIA MAGIC MAGMA MAIZE MAJOR MAKER MAMBO MAMMA MAMMY MANGA MANGE MANGO MANGY MANIA MANIC MANLY MANOR MAPLE MARCH MARRY MARSH MASON MASSE MATCH MATEY MAUVE MAXIM MAYBE MAYOR MEALY MEANT MEATY MECCA MEDAL MEDIA MEDIC MELEE MELON MERCY MERGE MERIT MERRY METAL METER METRO MICRO MIDGE MIDST MIGHT MILKY MIMIC MINCE MINER MINIM MINOR MINTY MINUS MIRTH MISER MISSY MOCHA MODAL MODEL MODEM MOGUL MOIST MOLAR MOLDY MONEY MONTH MOODY MOOSE MORAL MORON MORPH MOSSY MOTEL MOTIF MOTOR MOTTO MOULT MOUND MOUNT MOURN MOUSE MOUTH MOVER MOVIE MOWER MUCKY MUCUS MUDDY MULCH MUMMY MUNCH MURAL MURKY MUSHY MUSIC MUSKY MUSTY MYRRH NADIR NAIVE NANNY NASAL NASTY NATAL NAVAL NAVEL NEEDY NEIGH NERDY NERVE NEVER NEWER NEWLY NICER NICHE NIECE NIGHT NINJA NINNY NINTH NOBLE NOBLY NOISE NOISY NOMAD NOOSE NORTH NOSEY NOTCH NOVEL NUDGE NURSE NUTTY NYLON NYMPH OAKEN OBESE OCCUR OCEAN OCTAL OCTET ODDER ODDLY OFFAL OFFER OFTEN OLDEN OLDER OLIVE OMBRE OMEGA ONION ONSET OPERA OPINE OPIUM OPTIC ORBIT ORDER ORGAN OTHER OTTER OUGHT OUNCE OUTDO OUTER OUTGO OVARY OVATE OVERT OVINE OVOID OWING OWNER OXIDE OZONE PADDY PAGAN PAINT PALER PALSY PANEL PANIC PANSY PAPAL PAPER PARER PARKA PARRY PARSE PARTY PASTA PASTE PASTY PATCH PATIO PATSY PATTY PAUSE PAYEE PAYER PEACE PEACH PEARL PECAN PEDAL PENAL PENCE PENNE PENNY PERCH PERIL PERKY PESKY PESTO PETAL PETTY PHASE PHONE PHONY PHOTO PIANO PICKY PIECE PIETY PIGGY PILOT PINCH PINEY PINKY PINTO PIPER PIQUE PITCH PITHY PIVOT PIXEL PIXIE PIZZA PLACE PLAID PLAIN PLAIT PLANE PLANK PLANT PLATE PLAZA PLEAD PLEAT PLIED PLIER PLUCK PLUMB PLUME PLUMP PLUNK PLUSH POESY POINT POISE POKER POLAR POLKA POLYP POOCH POPPY PORCH POSER POSIT POSSE POUCH POUND POUTY POWER PRANK PRAWN PREEN PRESS PRICE PRICK PRIDE PRIED PRIME PRIMO PRINT PRIOR PRISM PRIVY PRIZE PROBE PRONE PRONG PROOF PROSE PROUD PROVE PROWL PROXY PRUDE PRUNE PSALM PUBIC PUDGY PUFFY PULPY PULSE PUNCH PUPAL PUPIL PUPPY PUREE PURER PURGE PURSE PUSHY PUTTY PYGMY QUACK QUAIL QUAKE QUALM QUARK QUART QUASH QUASI QUEEN QUEER QUELL QUERY QUEST QUEUE QUICK QUIET QUILL QUILT QUIRK QUITE QUOTA QUOTE QUOTH RABBI RABID RACER RADAR RADII RADIO RAINY RAISE RAJAH RALLY RALPH RAMEN RANCH RANDY RANGE RAPID RARER RASPY RATIO RATTY RAVEN RAYON RAZOR REACH REACT READY REALM REARM REBAR REBEL REBUS REBUT RECAP RECUR RECUT REEDY REFER REFIT REGAL REHAB REIGN RELAX RELAY RELIC REMIT RENAL RENEW REPAY REPEL REPLY RERUN RESET RESIN RETCH RETRO RETRY REUSE REVEL REVUE RHINO RHYME RIDER RIDGE RIFLE RIGHT RIGID RIGOR RINSE RIPEN RIPER RISEN RISER RISKY RIVAL RIVER RIVET ROACH ROAST ROBIN ROBOT ROCKY RODEO ROGER ROGUE ROOMY ROOST ROTOR ROUGE ROUGH ROUND ROUSE ROUTE ROVER ROWDY ROWER ROYAL RUDDY RUDER RUGBY RULER RUMBA RUMOR RUPEE RURAL RUSTY SADLY SAFER SAINT SALAD SALLY SALON SALSA SALTY SALVE SALVO SANDY SANER SAPPY SASSY SATIN SATYR SAUCE SAUCY SAUNA SAUTE SAVOR SAVOY SAVVY SCALD SCALE SCALP SCALY SCAMP SCANT SCARE SCARF SCARY SCENE SCENT SCION SCOFF SCOLD SCONE SCOOP SCOPE SCORE SCORN SCOUR SCOUT SCOWL SCRAM SCRAP SCREE SCREW SCRUB SCRUM SCUBA SEDAN SEEDY SEGUE SEIZE SEMEN SENSE SEPIA SERIF SERUM SERVE SETUP SEVEN SEVER SEWER SHACK SHADE SHADY SHAFT SHAKE SHAKY SHALE SHALL SHALT SHAME SHANK SHAPE SHARD SHARE SHARK SHARP SHAVE SHAWL SHEAR SHEEN SHEEP SHEER SHEET SHEIK SHELF SHELL SHIED SHIFT SHINE SHINY SHIRE SHIRK SHIRT SHOAL SHOCK SHONE SHOOK SHOOT SHORE SHORN SHORT SHOUT SHOVE SHOWN SHOWY SHREW SHRUB SHRUG SHUCK SHUNT SHUSH SHYLY SIEGE SIEVE SIGHT SIGMA SILKY SILLY SINCE SINEW SINGE SIREN SISSY SIXTH SIXTY SKATE SKIER SKIFF SKILL SKIMP SKIRT SKULK SKULL SKUNK SLACK SLAIN SLANG SLANT SLASH SLATE SLAVE SLEEK SLEEP SLEET SLEPT SLICE SLICK SLIDE SLIME SLIMY SLING SLINK SLOOP SLOPE SLOSH SLOTH SLUMP SLUNG SLUNK SLURP SLUSH SLYLY SMACK SMALL SMART SMASH SMEAR SMELL SMELT SMILE SMIRK SMITE SMITH SMOCK SMOKE SMOKY SMOTE SNACK SNAIL SNAKE SNAKY SNARE SNARL SNEAK SNEER SNIDE SNIFF SNIPE SNOOP SNORE SNORT SNOUT SNOWY SNUCK SNUFF SOAPY SOBER SOGGY SOLAR SOLID SOLVE SONAR SONIC SOOTH SOOTY SORRY SOUND SOUTH SOWER SPACE SPADE SPANK SPARE SPARK SPASM SPAWN SPEAK SPEAR SPECK SPEED SPELL SPELT SPEND SPENT SPERM SPICE SPICY SPIED SPIEL SPIKE SPIKY SPILL SPILT SPINE SPINY SPIRE SPITE SPLAT SPLIT SPOIL SPOKE SPOOF SPOOK SPOOL SPOON SPORE SPORT SPOUT SPRAY SPREE SPRIG SPUNK SPURN SPURT SQUAD SQUAT SQUIB STACK STAFF STAGE STAID STAIN STAIR STAKE STALE STALK STALL STAMP STAND STANK STARE STARK START STASH STATE STAVE STEAD STEAK STEAL STEAM STEED STEEL STEEP STEER STEIN STERN STICK STIFF STILL STILT STING STINK STINT STOCK STOIC STOKE STOLE STOMP STONE STONY STOOD STOOL STOOP STORE STORK STORM STORY STOUT STOVE STRAP STRAW STRAY STRIP STRUT STUCK STUDY STUFF STUMP STUNG STUNK STUNT STYLE SUAVE SUGAR SUING SUITE SULKY SULLY SUMAC SUNNY SUPER SURER SURGE SURLY SUSHI SWAMI SWAMP SWARM SWASH SWATH SWEAR SWEAT SWEEP SWEET SWELL SWEPT SWIFT SWILL SWINE SWING SWIRL SWISH SWOON SWOOP SWORD SWORE SWORN SWUNG SYNOD SYRUP TABBY TABLE TABOO TACIT TACKY TAFFY TAINT TAKEN TAKER TALLY TALON TAMER TANGO TANGY TAPER TAPIR TARDY TAROT TASTE TASTY TATTY TAUNT TAWNY TEACH TEARY TEASE TEDDY TEETH TEMPO TENET TENOR TENSE TENTH TEPEE TEPID TERRA TERSE TESTY THANK THEFT THEIR THEME THERE THESE THETA THICK THIEF THIGH THING THINK THIRD THONG THORN THOSE THREE THREW THROB THROW THRUM THUMB THUMP THYME TIARA TIBIA TIDAL TIGER TIGHT TILDE TIMER TIMID TIPSY TITAN TITHE TITLE TOAST TODAY TODDY TOKEN TONAL TONGA TONIC TOOTH TOPAZ TOPIC TORCH TORSO TORUS TOTAL TOTEM TOUCH TOUGH TOWEL TOWER TOXIC TOXIN TRACE TRACK TRACT TRADE TRAIL TRAIN TRAIT TRAMP TRASH TRAWL TREAD TREAT TREND TRIAD TRIAL TRIBE TRICE TRICK TRIED TRIPE TRITE TROLL TROOP TROPE TROUT TROVE TRUCE TRUCK TRUER TRULY TRUMP TRUNK TRUSS TRUST TRUTH TRYST TUBAL TUBER TULIP TULLE TUMOR TUNIC TURBO TUTOR TWANG TWEAK TWEED TWEET TWICE TWINE TWIRL TWIST TWIXT TYING UDDER ULCER ULTRA UMBRA UNCLE UNCUT UNDER UNDID UNDUE UNFED UNFIT UNIFY UNION UNITE UNITY UNLIT UNMET UNSET UNTIE UNTIL UNWED UNZIP UPPER UPSET URBAN URINE USAGE USHER USING USUAL USURP UTILE UTTER VAGUE VALET VALID VALOR VALUE VALVE VAPID VAPOR VAULT VAUNT VEGAN VENOM VENUE VERGE VERSE VERSO VERVE VICAR VIDEO VIGIL VIGOR VILLA VINYL VIOLA VIPER VIRAL VIRUS VISIT VISOR VISTA VITAL VIVID VIXEN VOCAL VODKA VOGUE VOICE VOILA VOMIT VOTER VOUCH VOWEL VYING WACKY WAFER WAGER WAGON WAIST WAIVE WALTZ WARTY WASTE WATCH WATER WAVER WAXEN WEARY WEAVE WEDGE WEEDY WEIGH WEIRD WELCH WELSH WENCH WHACK WHALE WHARF WHEAT WHEEL WHELP WHERE WHICH WHIFF WHILE WHINE WHINY WHIRL WHISK WHITE WHOLE WHOOP WHOSE WIDEN WIDER WIDOW WIDTH WIELD WIGHT WILLY WIMPY WINCE WINCH WINDY WISER WISPY WITCH WITTY WOKEN WOMAN WOMEN WOODY WOOER WOOLY WOOZY WORDY WORLD WORRY WORSE WORST WORTH WOULD WOUND WOVEN WRACK WRATH WREAK WRECK WREST WRING WRIST WRITE WRONG WROTE WRUNG WRYLY YACHT YEARN YEAST YIELD YOUNG YOUTH ZEBRA ZESTY ZONAL`

      // 将单词列表分割为数组
      const wordArray: string[] = classicWordList.split(' ');

      // 随机选择一个单词并小写化
      const randomWord: string = wordArray[Math.floor(Math.random() * wordArray.length)].toLowerCase();

      const isHardMode = options.hard;

      const correctLetters: string[] = new Array(5).fill('*');

      await ctx.database.set('wordle_game_records', {channelId}, {
        isStarted: true,
        wordGuess: randomWord,
        wordAnswerChineseDefinition: '',
        remainingGuessesCount: 6,
        guessWordLength: 5,
        gameMode: '经典',
        timestamp: timestamp,
        isHardMode: isHardMode,
        correctLetters: correctLetters,
        presentLetters: '',
        absentLetters: '',
      })


      // 游戏图
      const emptyGridHtml = generateEmptyGridHtml(6, 5);
      const styledHtml = generateStyledHtml(6);
      const imageBuffer = await generateImage(styledHtml, emptyGridHtml);
      return await sendMessage(session, `游戏开始！\n当前游戏模式为：【经典${isHardMode ? '（困难）' : ''}】\n单词长度为：【5】\n猜单词机会为：【6】\n待猜单词数量为：【2315】${config.enableWordGuessTimeLimit ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒` : ''}\n${h.image(imageBuffer, `image/${config.imageType}`)}`);

      // .action
    })
  const exams = [
    "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL"
  ];
  exams.forEach((exam) => {
    if (exam !== "经典") {
      // 10* fjd*
      ctx.command(`wordleGame.开始.${exam} [guessWordLength:number]`, `开始猜${exam}单词游戏`)
        .option('hard', '--hard 困难模式', {fallback: false})
        .action(async ({session, options}, guessWordLength = config.defaultWordLengthForGuessing) => {
          return startWordleGame(exam, guessWordLength, session, options);
        });
    }
  })
  // wordleGame.猜 c* cdc*
  ctx.command('wordleGame.猜 [inputWord:text]', '猜单词')
    .action(async ({session}, inputWord) => {
      const {channelId, userId, username, platform, timestamp} = session
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      // 操作太快
      if (gameInfo.isRunning === true) {
        return await sendMessage(session, `【@${username}】\n操作太快了哦~\n再试一次吧！`);
      }
      // 运行状态
      await setGuessRunningStatus(channelId, true)
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (!gameInfo.isStarted) {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `【@${username}】\n游戏还没开始呢！`);
      }
      // 作答时间限制
      if (config.enableWordGuessTimeLimit) {
        const timeDifferenceInSeconds = (timestamp - gameInfo.timestamp) / 1000; // 将时间戳转换为秒

        if (timeDifferenceInSeconds > config.wordGuessTimeLimitInSeconds) {
          // 生成 html 字符串
          const emptyGridHtml = generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
          const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          // 图
          const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
          // 玩家记录输
          await updatePlayerRecordsLose(channelId, gameInfo)
          await endGame(channelId)
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~\n${h.image(imageBuffer, `image/${config.imageType}`)}`)
        }
      }
      // 玩家不在游戏中
      const isInGame = await isPlayerInGame(channelId, userId);
      if (!isInGame) {
        if (!config.allowNonPlayersToGuess) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n没加入游戏的话~不能猜哦！`);
        } else {
          // 更新玩家记录表中的用户名
          await updateNameInPlayerRecord(userId, username)
          await ctx.database.create('wordle_gaming_player_records', {channelId, userId, username, money: 0})
        }
      }
      const {correctLetters, presentLetters, isHardMode, absentLetters} = gameInfo;
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(inputWord)) {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`);
      }
      if (inputWord.length !== gameInfo.guessWordLength) {
        await setGuessRunningStatus(channelId, false)
        const usernameMention = `【@${username}】`;
        const inputLengthMessage = `输入的单词长度不对哦！\n您的输入为：【${inputWord}】\n它的长度为：【${inputWord.length}】\n待猜单词的长度为：【${gameInfo.guessWordLength}】`;
        const presentLettersWithoutAsterisk = uniqueSortedLowercaseLetters(presentLetters);
        const progressMessage = `当前进度：【${correctLetters.join('')}】${presentLettersWithoutAsterisk.length === 0 ? `` : `\n且包含字母：【${presentLettersWithoutAsterisk}】`}`;

        return await sendMessage(session, `${usernameMention}\n${inputLengthMessage}\n${progressMessage}`);
      }
      // 小写化
      const lowercaseInputWord = inputWord.toLowerCase();
      // 困难模式
      let isInputWordWrong = false;
      if (isHardMode && (correctLetters.some(letter => letter !== '*') || presentLetters.length !== 0)) {
        // 包含
        const lettersInUserInput: string[] = lowercaseInputWord.split('').filter(letter => presentLetters.includes(letter) && letter !== '*');
        if (mergeSameLetters(lettersInUserInput).length !== presentLetters.length) {
          isInputWordWrong = true;
        }
        // 正确
        for (let i = 0; i < lowercaseInputWord.length; i++) {
          if (correctLetters[i] !== '*' && correctLetters[i] !== lowercaseInputWord[i]) {
            isInputWordWrong = true;
          }
        }
        if (isInputWordWrong) {
          await setGuessRunningStatus(channelId, false);
          return await sendMessage(session, `【@${username}】\n当前难度为：【困难】\n【困难】：后续猜单词需要使用之前正确或出现的字母。\n您输入的单词字母不符合要求！\n您的输入为：【${inputWord}】\n单词字母要求：【${correctLetters.join('')}】${presentLetters.length === 0 ? `` : `\n包含字母：【${presentLetters}】\n不包含字母：【${absentLetters}】`}`);
        }
      }

      // 是否存在该单词
      const fileData = getJsonFilePathAndWordCountByLength('ALL', gameInfo.guessWordLength);
      const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
      // 判断胜
      let isWin = false
      if (lowercaseInputWord === gameInfo.wordGuess) {
        isWin = true
      } else {
        // 寻找
        const foundWord = jsonData.find((entry) => entry.word.toLowerCase() === lowercaseInputWord);
        if (!foundWord) {
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n你确定存在这样的单词吗？`);
        }
      }
      // 生成 html 字符串
      const letterTilesHtml = '<div class="Row-module_row__pwpBq">' + await generateLetterTilesHtml(gameInfo.wordGuess, inputWord, channelId) + '</div>';
      const emptyGridHtml = generateEmptyGridHtml(gameInfo.remainingGuessesCount - 1, gameInfo.guessWordLength);
      const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
      // 图
      const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`);
      // 判断负
      let isLose = false
      if (gameInfo.remainingGuessesCount - 1 === 0) {
        isLose = true
      }
      // 更新游戏记录
      await ctx.database.set('wordle_game_records', {channelId}, {
        remainingGuessesCount: gameInfo.remainingGuessesCount - 1,
        wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
      })
      // 处理赢
      if (isWin) {
        let finalSettlementString: string = ''
        // 经典有收入
        if (gameInfo.gameMode === '经典') {
          finalSettlementString = await processNonZeroMoneyPlayers(channelId, platform);
        }
        // 玩家记录赢
        await updatePlayerRecordsWin(channelId, gameInfo)
        // 增加该玩家猜出单词的次数
        const [playerRecord] = await ctx.database.get('wordle_player_records', {userId})
        await ctx.database.set('wordle_player_records', {userId}, {wordGuessCount: playerRecord.wordGuessCount + 1})

        await endGame(channelId)
        return await sendMessage(session, `【@${username}】\n太棒了，你猜出来了！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n${generateGameEndMessage(gameInfo)}\n${finalSettlementString === '' ? '' : `最终结算结果如下：\n${finalSettlementString}`}`);
      }
      // 处理输
      if (isLose) {
        // 玩家记录输
        await updatePlayerRecordsLose(channelId, gameInfo)
        await endGame(channelId)
        return await sendMessage(session, `很遗憾，你们没有猜出来！\n但没关系~下次加油哇！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n答案是：【${gameInfo.wordGuess}】${gameInfo.wordAnswerChineseDefinition !== '' ? `\n单词释义如下：\n${gameInfo.wordAnswerChineseDefinition}` : ''}`);
      }
      // 继续
      await setGuessRunningStatus(channelId, false)
      return await sendMessage(session, `${h.image(imageBuffer, `image/${config.imageType}`)}`)
      // .action
    })
  // wordleGame.查询玩家记录 cx*
  ctx.command('wordleGame.查询玩家记录 [targetUser:text]', '查询玩家记录')
    .action(async ({session}, targetUser) => {
      let {userId, username} = session
      if (targetUser) {
        const userIdRegex = /<at id="([^"]+)"(?: name="([^"]+)")?\/>/;
        const match = targetUser.match(userIdRegex);
        userId = match?.[1] ?? userId;
        username = match?.[2] ?? username;
      }
      const targetUserRecord = await ctx.database.get('wordle_player_records', {userId})
      if (targetUserRecord.length === 0) {
        await ctx.database.create('wordle_player_records', {
          userId,
          username,
        })
        return sendMessage(session, `查询对象：${username}
无任何游戏记录。`)
      }
      const {win, lose, moneyChange, wordGuessCount, stats} = targetUserRecord[0]
      const queryInfo = `
查询对象：${username}
猜出单词次数：${wordGuessCount} 次
总胜场：${win} 次
总输场：${lose} 次
损益为：${moneyChange} 点
详细统计信息：
经典 - 胜: ${stats.经典?.win}, 负: ${stats.经典?.lose}
CET4 - 胜: ${stats.CET4?.win}, 负: ${stats.CET4?.lose}
CET6 - 胜: ${stats.CET6?.win}, 负: ${stats.CET6?.lose}
GMAT - 胜: ${stats.GMAT?.win}, 负: ${stats.GMAT?.lose}
GRE - 胜: ${stats.GRE?.win}, 负: ${stats.GRE?.lose}
IELTS - 胜: ${stats.IELTS?.win}, 负: ${stats.IELTS?.lose}
SAT - 胜: ${stats.SAT?.win}, 负: ${stats.SAT?.lose}
TOEFL - 胜: ${stats.TOEFL?.win}, 负: ${stats.TOEFL?.lose}
考研 - 胜: ${stats.考研?.win}, 负: ${stats.考研?.lose}
专八 - 胜: ${stats.专八?.win}, 负: ${stats.专八?.lose}
专四 - 胜: ${stats.专四?.win}, 负: ${stats.专四?.lose}
ALL - 胜: ${stats.ALL?.win}, 负: ${stats.ALL?.lose}
`;

      return sendMessage(session, queryInfo);
    })
  // wordleGame.查询单词 cxdc*
  ctx.command('wordleGame.查询单词 [targetWord:text]', '查询ALL词库中的单词信息')
    .action(async ({session}, targetWord) => {
      let {userId, username} = session
      targetWord = targetWord.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查询的单词】或【取消】：`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入超时！`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查询单词操作已取消。`);
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`);
      }
      const fileData = getJsonFilePathAndWordCountByLength('ALL', targetWord.length);
      const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));

      // 小写化
      const lowercaseTargetWord = targetWord.toLowerCase();

      // 寻找
      const foundWord = jsonData.find((entry) => entry.word.toLowerCase() === lowercaseTargetWord);
      if (!foundWord) {
        return await sendMessage(session, `【@${username}】\n未在ALL词库中找到该单词。`);
      }
      return sendMessage(session, `查询对象：【${targetWord}】\n单词释义如下：\n${foundWord.translation.replace(/\\r/g, '\r').replace(/\\n/g, '\n')}`);
    })
  // wordleGame.查询进度 jd* cxjd*
  ctx.command('wordleGame.查询进度', '查询当前游戏进度')
    .action(async ({session}) => {
      const {channelId, userId, username, user, timestamp} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      const gameInfo = await getGameInfo(channelId)
      // 未开始
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏还没开始呢~\n开始后再来查询进度吧！`)
      }
      // 返回信息
      const {correctLetters, presentLetters, isHardMode, gameMode, guessWordLength, absentLetters} = gameInfo;
      const usernameMention = `【@${username}】`;
      const inputLengthMessage = `待猜单词的长度为：【${guessWordLength}】`;
      const progressMessage = `当前进度：【${correctLetters.join('')}】${presentLetters.length === 0 ? '' : `\n包含字母：【${presentLetters}】\n不包含字母：【${absentLetters}】`}`;
      const timeDifferenceInSeconds = (timestamp - gameInfo.timestamp) / 1000;

      let message = `${usernameMention}\n当前游戏模式为：【${gameMode}${isHardMode ? '（困难）' : ''}】`;
      if (config.enableWordGuessTimeLimit) {
        message += `\n剩余作答时间：【${timeDifferenceInSeconds}】秒`;
      }
      message += `\n${inputLengthMessage}\n${progressMessage}`;

      return await sendMessage(session, message);

      // .action
    })

  const rankType = [
    "总", "损益", "猜出单词次数", "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL"
  ];

// r* phb*
  ctx.command('wordleGame.排行榜 [number:number]', '查看排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }

      await sendMessage(session, `当前可查看排行榜如下：
${rankType.map((type, index) => `${index + 1}. ${type}`).join('\n')}
请输入想要查看的【排行榜名】或【序号】：`);

      const userInput = await session.prompt();
      if (!userInput) return sendMessage(session, `输入超时。`);

      // 处理用户输入
      const userInputNumber = parseInt(userInput);
      if (!isNaN(userInputNumber) && userInputNumber > 0 && userInputNumber <= rankType.length) {
        const rankName = rankType[userInputNumber - 1];
        await session.execute(`wordleGame.排行榜.${rankName} ${number}`);
      } else if (rankType.includes(userInput)) {
        await session.execute(`wordleGame.排行榜.${userInput} ${number}`);
      } else {
        return sendMessage(session, `无效的输入。`);
      }
    });

  const rankType2 = [
    "总", "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL"
  ];

  rankType2.forEach(type => {
    // phb*
    ctx.command(`wordleGame.排行榜.${type} [number:number]`, `查看${type}排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        const rankType3 = [
          "胜场", "输场"
        ];
        await sendMessage(session, `当前可查看排行榜如下：
${rankType3.map((type, index) => `${index + 1}. ${type}`).join('\n')}
请输入想要查看的【类型名】或【序号】：`);

        const userInput = await session.prompt();
        if (!userInput) return sendMessage(session, `输入超时。`);

        // 处理用户输入
        const userInputNumber = parseInt(userInput);
        if (!isNaN(userInputNumber) && userInputNumber > 0 && userInputNumber <= rankType3.length) {
          const rankName = rankType3[userInputNumber - 1];
          await session.execute(`wordleGame.排行榜.${type}.${rankName} ${number}`);
        } else if (rankType3.includes(userInput)) {
          await session.execute(`wordleGame.排行榜.${type}.${userInput} ${number}`);
        } else {
          return sendMessage(session, `无效的输入。`);
        }
      });
  });
  // sy*
  ctx.command('wordleGame.排行榜.损益 [number:number]', '查看玩家损益排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'moneyChange', 'moneyChange', '玩家损益排行榜', number);
    });
  // ccdccs*
  ctx.command('wordleGame.排行榜.猜出单词次数 [number:number]', '查看玩家猜出单词次数排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'wordGuessCount', 'wordGuessCount', '玩家猜出单词次数排行榜', number);
    });
  // zsc*
  ctx.command('wordleGame.排行榜.总.胜场 [number:number]', '查看玩家总胜场排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'win', 'win', '玩家总胜场排行榜', number);
    });
  // zsc*
  ctx.command('wordleGame.排行榜.总.输场 [number:number]', '查看玩家总输场排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'lose', 'lose', '查看玩家总输场排行榜', number);
    });
  const rankType4 = [
    "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL"
  ];
  // 注册胜场排行榜指令
  rankType4.forEach((type) => {
    ctx.command(`wordleGame.排行榜.${type}.胜场 [number:number]`, `查看${type}胜场排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});

        // 将 getPlayers 按照当前类型的胜场次数降序排序
        getPlayers.sort((a, b) => (b.stats[type]?.win || 0) - (a.stats[type]?.win || 0));

        // 形成一个类似于字符串排行榜的数组
        const leaderboard: string[] = getPlayers.slice(0, number).map((player, index) => `${index + 1}. ${player.username}：${player.stats[type]?.win} 次`);

        const result = `${type}模式胜场排行榜：\n${leaderboard.join('\n')}`;
        return await sendMessage(session, result);
      });
  });
  // 注册输场排行榜指令
  rankType4.forEach((type) => {
    ctx.command(`wordleGame.排行榜.${type}.输场 [number:number]`, `查看${type}输场排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});

        // 将 getPlayers 按照当前类型的输场次数降序排序
        getPlayers.sort((a, b) => (b.stats[type]?.lose || 0) - (a.stats[type]?.lose || 0));

        // 形成一个类似于字符串排行榜的数组
        const leaderboard: string[] = getPlayers.slice(0, number).map((player, index) => `${index + 1}. ${player.username}：${player.stats[type]?.lose} 次`);

        const result = `${type}模式输场排行榜：\n${leaderboard.join('\n')}`;
        return await sendMessage(session, result);
      });
  });

  // ch*
  async function generateLetterTilesHtml(wordGuess: string, inputWord: string, channelId: string): Promise<string> {
    const wordHtml: string[] = new Array(inputWord.length);
    const letterCountMap: { [key: string]: number } = {};

    const gameInfo = await getGameInfo(channelId)
    const correctLetters: string[] = gameInfo.correctLetters;
    let presentLetters = gameInfo.presentLetters
    let absentLetters = gameInfo.absentLetters


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
        wordHtml[htmlIndex] = `<div><div class="Tile-module_tile__UWEHN" data-state="correct">${letter}</div></div>`;
        letterCountMap[letter]--;

        correctLetters[i] = letter;
      } else {
        wordHtml[htmlIndex] = `<div><div class="Tile-module_tile__UWEHN" data-state="unchecked">${letter}</div></div>`;
      }
      htmlIndex++;
    }

    // 处理其他标记
    htmlIndex = 0;
    for (let i = 0; i < inputWord.length; i++) {
      const letter = lowercaseInputWord[i];
      if (wordHtml[htmlIndex].includes("data-state=\"unchecked\"")) {
        if (wordGuess.includes(letter)) {
          if (letterCountMap[letter] > 0) {
            wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"present\"");
            letterCountMap[letter]--;

            presentLetters += letter;
          } else {
            wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"absent\"");
            absentLetters += letter;
          }
        } else {
          wordHtml[htmlIndex] = wordHtml[htmlIndex].replace("data-state=\"unchecked\"", "data-state=\"absent\"");
          absentLetters += letter;
        }
      }
      htmlIndex++;
    }

    await ctx.database.set('wordle_game_records', {channelId}, {
      correctLetters,
      presentLetters: uniqueSortedLowercaseLetters(presentLetters),
      absentLetters: uniqueSortedLowercaseLetters(absentLetters),
    })
    return wordHtml.join("\n");
  }

  async function setGuessRunningStatus(channelId: string, isRunning: boolean): Promise<void> {
    await ctx.database.set('wordle_game_records', {channelId}, {isRunning});
  }

  async function endGame(channelId: string) {
    await Promise.all([
      ctx.database.remove('wordle_gaming_player_records', {channelId}),
      ctx.database.remove('wordle_game_records', {channelId}),
      await setGuessRunningStatus(channelId, false),
    ]);
  }

  async function getLeaderboard(session: any, type: string, sortField: string, title: string, number: number) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {})
    const sortedPlayers = getPlayers.sort((a, b) => b[sortField] - a[sortField])
    const topPlayers = sortedPlayers.slice(0, number)

    let result = `${title}：\n`;
    topPlayers.forEach((player, index) => {
      result += `${index + 1}. ${player.username}：${player[sortField]} ${(type === 'moneyChange') ? '点' : '次'}\n`
    })
    return await sendMessage(session, result);
  }

  async function updatePlayerRecordsLose(channelId: string, gameInfo: GameRecord) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get('wordle_gaming_player_records', {channelId});

    for (const player of gamingPlayers) {
      const playerInfo: PlayerRecord = (await ctx.database.get('wordle_player_records', {userId: player.userId}))[0];
      const updatedLose = playerInfo.lose + 1;
      const gameMode = gameInfo.gameMode as keyof PlayerStats;
      playerInfo.stats[gameMode].lose += 1;
      await ctx.database.set('wordle_player_records', {userId: player.userId}, {
        stats: playerInfo.stats,
        lose: updatedLose
      });
    }
  }

  async function updatePlayerRecordsWin(channelId: string, gameInfo: GameRecord) {
    const gamingPlayers: GamingPlayer[] = await ctx.database.get('wordle_gaming_player_records', {channelId});

    for (const player of gamingPlayers) {
      const playerInfo: PlayerRecord = (await ctx.database.get('wordle_player_records', {userId: player.userId}))[0];
      const updatedWin = playerInfo.win + 1;
      const gameMode = gameInfo.gameMode as keyof PlayerStats;
      playerInfo.stats[gameMode].win += 1;
      await ctx.database.set('wordle_player_records', {userId: player.userId}, {
        stats: playerInfo.stats,
        win: updatedWin
      });
    }
  }

  async function processNonZeroMoneyPlayers(channelId: string, platform: string) {
    const getPlayers = await ctx.database.get('wordle_gaming_player_records', {channelId});
    const settlementRecords: string[] = [];

    for (const thisGamingPlayer of getPlayers) {
      const {userId, money, username} = thisGamingPlayer;

      if (money === 0) {
        continue;
      }

      const uid = await getPlayerUid(platform, userId);
      const rewardMultiplier = config.defaultRewardMultiplier;
      const gainAmount = money * rewardMultiplier;

      await ctx.monetary.gain(uid, gainAmount);

      // 更新货币变动记录
      const [playerInfo] = await ctx.database.get('wordle_player_records', {userId});
      const updatedMoneyChange = playerInfo.moneyChange + gainAmount;
      await ctx.database.set('wordle_player_records', {userId}, {moneyChange: updatedMoneyChange});

      // 为投入货币不是零的玩家生成结算字符串并添加到结算记录数组
      const settlementString = `【${username}】：【+${gainAmount}】`;
      settlementRecords.push(settlementString);
    }

    // 将结算记录数组组合成一个最终结算字符串
    return settlementRecords.join('\n');
  }

  async function updateGamingPlayerRecords(channelId: string) {
    // 非经典还钱
    const getPlayers = await ctx.database.get('wordle_gaming_player_records', {channelId});
    for (const thisGamingPlayer of getPlayers) {
      const {userId, money} = thisGamingPlayer;
      if (money === 0) {
        continue;
      }
      await ctx.database.set('wordle_gaming_player_records', {channelId, userId}, {money: 0});
    }
  }

  async function setWordleGameRecord(channelId: string, guessWordLength: number, result: any, gameMode: string, timestamp: number, options) {
    const isHardMode = options.hard;
    const correctLetters: string[] = new Array(guessWordLength).fill('*');
    await ctx.database.set('wordle_game_records', {channelId}, {
      isStarted: true,
      wordGuess: result.word,
      wordAnswerChineseDefinition: result.translation,
      remainingGuessesCount: guessWordLength + 1,
      guessWordLength: guessWordLength,
      gameMode: gameMode,
      timestamp: timestamp,
      isHardMode: isHardMode,
      correctLetters: correctLetters,
      presentLetters: '',
      absentLetters: '',
    });
  }

  async function generateImage(styledHtml: string, gridHtml: string): Promise<Buffer> {
    const page = await ctx.puppeteer.page();
    await page.setViewport({width: 611, height: 731, deviceScaleFactor: 1})
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `${htmlPrefix}
    ${styledHtml}
    ${htmlAfterStyle}
    <div class="Board-module_board__jeoPS" style="width: 600px; height: 720px;">
      ${gridHtml}
    </div>
    ${htmlSuffix}`;


    await page.setContent(html, {waitUntil: 'load'});
    const imageBuffer = await page.screenshot({fullPage: true, type: config.imageType});
    await page.close();

    return imageBuffer;
  }

  async function getPlayerUid(platform: string, userId: string): Promise<number> {
    const user = await getUserFromDatabase(platform, userId);
    return user.id;
  }

  async function getUserFromDatabase(platform: string, userId: string) {
    return await ctx.database.getUser(platform, userId);
  }

  async function getNumberOfPlayers(channelId: string): Promise<number> {
    const playerRecords = await ctx.database.get('wordle_gaming_player_records', {channelId});
    return playerRecords.length;
  }

  async function isPlayerInGame(channelId: string, userId: string): Promise<boolean> {
    const getPlayer = await ctx.database.get('wordle_gaming_player_records', {channelId, userId});
    return getPlayer.length !== 0;
  }

  async function getGameInfo(channelId: string): Promise<GameRecord> {
    let gameRecord = await ctx.database.get('wordle_game_records', {channelId});
    if (gameRecord.length === 0) {
      await ctx.database.create('wordle_game_records', {
        channelId,
        isStarted: false,
      });
      gameRecord = await ctx.database.get('wordle_game_records', {channelId});
    }
    return gameRecord[0];
  }

  async function updateNameInPlayerRecord(userId: string, username: string): Promise<void> {
    const userRecord = await ctx.database.get('wordle_player_records', {userId});
    if (userRecord.length === 0) {
      await ctx.database.create('wordle_player_records', {
        userId,
        username,
      });
    } else if (username !== userRecord[0].username) {
      await ctx.database.set('wordle_player_records', {userId}, {username});
    }
  }

  // csh*
  async function sendMessage(session: any, message: any): Promise<void> {
    if (config.isTextToImageConversionEnabled) {
      const lines = message.split('\n');
      const isOnlyImgTag = lines.length === 1 && lines[0].trim().startsWith('<img');
      if (isOnlyImgTag) {
        await session.send(message);
      } else {
        const modifiedMessage = lines
          .map((line) => {
            if (line.trim() !== '' && !line.includes('<img')) {
              return `# ${line}`;
            } else {
              return line + '\n';
            }
          })
          .join('\n');
        const imageBuffer = await ctx.markdownToImage.convertToImage(modifiedMessage);
        await session.send(h.image(imageBuffer, 'image/png'));
      }
    } else {
      await session.send(message);
    }
  }

  // sh*
  async function startWordleGame(command: string, guessWordLength: number, session: any, options: any) {
    const {channelId, userId, username, timestamp} = session;

    // 更新玩家记录表中的用户名
    await updateNameInPlayerRecord(userId, username);

    if (config.shouldPromptForWordLengthOnNonClassicStart) {
      await sendMessage(session, `【@${username}】\n请输入猜单词的长度：`);
      const userInput = await session.prompt();
      if (!userInput) return await sendMessage(session, `【@${username}】\n输入超时！`);
      guessWordLength = parseInt(userInput)
    }

    // 判断输入
    if (typeof guessWordLength !== 'number' || !isValidGuessWordLength(command, guessWordLength)) {
      return await sendMessage(session, `【@${username}】\n无效的单词长度参数！\n${command}单词长度可选值范围：${getValidGuessWordLengthRange(command)}`);
    }

    // 游戏状态
    const gameInfo = await getGameInfo(channelId);
    if (gameInfo.isStarted) {
      return await sendMessage(session, `【@${username}】\n游戏已经开始了哦~`);
    }

    // 人数
    const numberOfPlayers = await getNumberOfPlayers(channelId);
    if (numberOfPlayers < 1 && !config.allowNonPlayersToGuess) {
      return await sendMessage(session, `【@${username}】\n没人玩的说...\n且当前配置为：\n【不允许没有加入的玩家猜单词】\n先加入游戏吧~`);
    }

    // 非经典还钱
    await updateGamingPlayerRecords(channelId);

    // 开始游戏
    const result = getRandomWordTranslation(command, guessWordLength);
    await setWordleGameRecord(channelId, guessWordLength, result, command, timestamp, options);

    // 生成并发送游戏图
    const emptyGridHtml = generateEmptyGridHtml(guessWordLength + 1, guessWordLength);
    const styledHtml = generateStyledHtml(guessWordLength + 1);
    const imageBuffer = await generateImage(styledHtml, emptyGridHtml);
    const isHardMode = options.hard;
    return await sendMessage(session, `游戏开始！\n当前游戏模式为：【${command}${isHardMode ? '（困难）' : ''}】\n单词长度为：【${guessWordLength}】\n猜单词机会为：【${guessWordLength + 1}】\n待猜单词数量为：【${result.wordCount}】${config.enableWordGuessTimeLimit ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒` : ''}\n${h.image(imageBuffer, `image/${config.imageType}`)}`);
  }

  // apply
}

// hs*
function uniqueSortedLowercaseLetters(input: string): string {
  const uniqueLetters = Array.from(new Set(input.toLowerCase().match(/[a-z]/g)));
  return uniqueLetters.sort().join('');
}

function mergeSameLetters(arr: string[]): string[] {
  const seen: { [key: string]: boolean } = {};
  const result: string[] = [];

  for (let i = 0; i < arr.length; i++) {
    const currentLetter = arr[i];
    if (!seen[currentLetter]) {
      result.push(currentLetter);
      seen[currentLetter] = true;
    }
  }

  return result;
}

// function countNonAsteriskChars(arr: string[]): number {
//   arr = mergeSameLetters(arr)
//   let count = 0;
//   for (let char of arr) {
//     if (char !== '*') {
//       count++;
//     }
//   }
//   return count;
// }

function generateGameEndMessage(gameInfo: GameRecord): string {
  return `答案是：【${gameInfo.wordGuess}】${gameInfo.wordAnswerChineseDefinition !== '' ? `\n单词释义如下：\n${gameInfo.wordAnswerChineseDefinition}` : ''}`;
}

function getRandomWordTranslation(command: string, guessWordLength: number): WordData {
  const fileData = getJsonFilePathAndWordCountByLength(command, guessWordLength);
  if (command === "ALL") {
    const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
    const randomIndex = Math.floor(Math.random() * jsonData.length);
    const randomWordData = jsonData[randomIndex];
    return {
      word: randomWordData.word.toLowerCase(),
      translation: randomWordData.translation.replace(/\\r/g, '\r').replace(/\\n/g, '\n'),
      wordCount: jsonData.length
    };
  } else {
    const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
    const words = Object.keys(jsonData);
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const translation = jsonData[randomWord]['中释'].trim();
    return {word: randomWord.toLowerCase(), translation, wordCount: fileData.wordCount};
  }
}

function getJsonFilePathAndWordCountByLength(command: string, guessWordLength: number): {
  filePath: string;
  wordCount: number
} | null {
  const folderPath = path.join(__dirname, '词汇', command);
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const match = file.match(new RegExp(`${command}_(\\d+)_(\\d+)\\.json`));
    if (match && match[1] && match[2]) {
      const length = parseInt(match[1]);
      const wordCount = parseInt(match[2]);
      if (length === guessWordLength) {
        return {filePath: path.join(folderPath, file), wordCount};
      }
    }
  }
  return null;
}

function isValidGuessWordLength(command: string, guessWordLength: number): boolean {
  switch (command) {
    case 'CET4':
      return guessWordLength >= 1 && guessWordLength <= 15;
    case 'CET6':
      return (guessWordLength >= 3 && guessWordLength <= 16) || guessWordLength === 18;
    case 'GMAT':
      return guessWordLength >= 3 && guessWordLength <= 18;
    case 'GRE':
      return (guessWordLength >= 3 && guessWordLength <= 16) || guessWordLength === 1;
    case 'IELTS':
      return (guessWordLength >= 2 && guessWordLength <= 15) || guessWordLength === 17;
    case 'SAT':
      return guessWordLength >= 3 && guessWordLength <= 16;
    case 'TOEFL':
      return (guessWordLength >= 2 && guessWordLength <= 17) || guessWordLength === 20;
    case '考研':
      return guessWordLength >= 2 && guessWordLength <= 15;
    case '专八':
      return guessWordLength >= 1 && guessWordLength <= 18;
    case '专四':
      return (guessWordLength >= 2 && guessWordLength <= 16) || guessWordLength === 18;
    case 'ALL':
      return (guessWordLength >= 1 && guessWordLength <= 35) || guessWordLength === 45 || guessWordLength === 52;
    default:
      return false;
  }
}

function getValidGuessWordLengthRange(command: string): string {
  switch (command) {
    case 'CET4':
      return '【1 ~ 15】';
    case 'CET6':
      return '【3 ~ 16, 18】';
    case 'GMAT':
      return '【3 ~ 18】';
    case 'GRE':
      return '【1, 3 ~ 16】';
    case 'IELTS':
      return '【2 ~ 15, 17】';
    case 'SAT':
      return '【3 ~ 16】';
    case 'TOEFL':
      return '【2 ~ 17, 20】';
    case '考研':
      return '【2 ~ 15】';
    case '专八':
      return '【1 ~ 18】';
    case '专四':
      return '【2 ~ 16, 18】';
    case 'ALL':
      return '【1 ~ 35, 45, 52】';
    default:
      return '';
  }
}

function generateStyledHtml(row: number): string {
  // noinspection CssInvalidFunction
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

        .driveToMore .DriveToMoreContent-module_gridContainer__vWpCc {
            display: grid;
            grid-auto-columns: 1fr;
            grid-template-columns: repeat(${row}, 91px) 10px;
            grid-column-gap: 10px;
            grid-auto-flow: column;
            width: 100%;
            margin-left: 25px;
        }

        .pz-desktop .driveToMore .DriveToMoreContent-module_gridContainer__vWpCc {
            grid-template-columns: repeat(${(row - 1) % 2 !== 0 ? Math.floor((row - 1) / 2) + 1 : Math.floor(row / 2)}, 91px);
            grid-template-rows: repeat(${Math.floor((row - 1) / 2)}, 91px);
            grid-row-gap: 10px;
            margin: 10px 0 30px;
        }

        .driveToMore .DriveToMoreContent-module_gridContainer__vWpCc.DriveToMoreContent-module_gamesStack__pnYB2 {
            grid-template-columns: repeat(${(row - 1) % 2 !== 0 ? Math.floor((row - 1) / 2) + 1 : Math.floor(row / 2)}, 91px);
            grid-template-rows: repeat(${Math.floor((row - 1) / 2)}, 91px);
            grid-row-gap: 10px;
            margin: 10px 0 30px;
        }
    </style>`;

  return styledHtml;
}

function generateEmptyGridHtml(rowNum: number, tileNum: number): string {
  let html = '';
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

// html*
const htmlSuffix = `</div>
      </main>
    </div>
  </div>
</div>
</body>
</html>
`
const htmlPrefix = `<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wordle</title>

  <style>

    @media (min-width: 444px) {
      .expandToRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .mobileColumn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .visually-hidden {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .pz-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%;
      padding-bottom: 20px;
      margin: 4% 0;
      font: -apple-system-body;
      font-family: nyt-franklin
    }

    .pz-error__message {
      text-align: center;
      padding: 30px
    }

    .pz-error__message h1 {
      font-style: normal;
      font-size: 2em;
      font-size: min(2em, 90px);
      line-height: 1.15;
      font-weight: 700;
      margin-bottom: 25px
    }

    .pz-error__message p {
      font-size: 1.125em;
      line-height: 1.39;
      margin-bottom: 30px;
      max-width: 510px
    }

    .pz-error__icon {
      background-repeat: no-repeat;
      background-size: contain;
      display: block;
      margin-bottom: 30px;
      max-width: 300px
    }


    .pz-error__stack-trace {
      margin: 20px;
      padding: 20px;
      border: 1px solid #959595
    }

    .pz-error__stack-trace pre {
      white-space: normal
    }

    .pz-error__link {
      color: #000;
      text-decoration: underline
    }

    .pz-error__link:hover {
      text-decoration: none
    }

    .pz-error__button {
      display: inline-block;
      color: #fff;
      background-color: #000;
      border: 1px solid #dcdcdc;
      cursor: pointer;
      padding: 15px 25px;
      transition: background-color 150ms;
      margin: 0 auto;
      margin-bottom: 10px;
      border-radius: 1.5em;
      font-size: 1em
    }

    /*! normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css */
    button, input, optgroup, select, textarea {
      font-family: inherit;
      font-size: 100%;
      line-height: 1.15;
      margin: 0
    }

    button, input {
      overflow: visible
    }

    button, select {
      text-transform: none
    }

    button, [type=button], [type=reset], [type=submit] {
      -webkit-appearance: button
    }

    html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video {
      margin: 0;
      padding: 0;
      border: 0;
      font-size: 100%;
      font: inherit;
      vertical-align: baseline
    }

    article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {
      display: block
    }

    body {
      line-height: 1
    }

    ol, ul {
      list-style: none
    }

    blockquote, q {
      quotes: none
    }

    blockquote:before, blockquote:after, q:before, q:after {
      content: "";
      content: none
    }

    table {
      border-collapse: collapse;
      border-spacing: 0
    }

    .flexContainer {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    @media (min-width: 444px) {
      .expandToRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .mobileColumn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .visually-hidden {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    @font-face {
      font-family: "nyt-franklin";
      src: url("./franklin-normal-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal
    }

    .pz-footer.dimmed, .pz-header.dimmed, .pz-content.dimmed, .wordle-app-header.dimmed, #wordle-app-game.dimmed {
      opacity: .6
    }

    .ccpa-snackbar {
      margin: auto;
      padding: 10px 20px;
      right: 16px;
      bottom: 16px;
      left: 16px;
      position: fixed;
      background: #333;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, .25);
      border-radius: 2px;
      z-index: 99999
    }

    .ccpa-snackbar__header, .ccpa-snackbar.error, .ccpa-snackbar__description {
      font-family: "nyt-franklin";
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 19px;
      color: #fff;
      -webkit-margin-before: 0px;
      margin-block-start: 0px;
      -webkit-margin-after: 0px;
      margin-block-end: 0px
    }

    .ccpa-snackbar__description {
      color: #a4a4a4
    }

    .ccpa-snackbar__container {
      display: flex;
      align-items: center;
      letter-spacing: .147368px;
      color: #fff
    }

    @media (min-width: 768px) {
      .ccpa-snackbar {
        right: 50px;
        left: auto;
        bottom: 50px;
        width: 480px
      }
    }

    .pz-icon {
      background-size: contain;
      background-repeat: no-repeat;
      display: inline-block;
      min-height: 20px;
      min-width: 20px;
      margin-right: 8px
    }

    .pz-icon-right {
      margin-right: unset;
      margin-left: 8px
    }

    .flexContainer {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    @media (min-width: 444px) {
      .expandToRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .mobileColumn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .visually-hidden {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .pz-offline-ticker {
      background-color: #959595;
      color: #fff;
      font-size: .875em;
      height: 0;
      opacity: 0;
      overflow: hidden;
      padding: 0;
      text-align: center;
      transition: all .5s ease-in-out
    }

    .pz-offline-ticker.is-offline {
      height: auto;
      opacity: 1;
      padding: 12px 0
    }

    .pz-offline-ticker .offline-ticker-dismiss {
      position: absolute;
      right: 8px;
      top: 8px;
      cursor: pointer
    }

    :root {
      --green: #6aaa64;
      --green-4: #538d4e;
      --wordle-high-contrast-green: #58a351;
      --spellingBeeYellow: #f7da21;
      --miniCrosswordBlue: #95befa;
      --connectionsPeriwinkle: #b4a8ff;
      --sudoku-orange: #fb9b00;
      --tiles-green: #b5e352;
      --dailyCrosswordBlue: #6493e6;
      --yellow-3: #c9b458;
      --yellow-4: #b59f3b;
      --newsGray-10: #dfdfdf;
      --newsGray-100: #121212;
      --newsGray-85: #363636;
      --gray-3: #ccc;
      --gray-4: #dcdcdc;
      --gray-6: #f4f4f4;
      --gray-13: #d3d6da;
      --gray-18: #787c7e;
      --gray-19: #878a8c;
      --gray-20: #edeff1;
      --gray-21: #f6f7f8;
      --gray-22: #e3e3e1;
      --gray-23: #a6a6a6;
      --gray-24: #818384;
      --gray-25: #565758;
      --gray-26: #3a3a3c;
      --gray-27: #424242;
      --gray-28: #59595a;
      --gray-29: #afafaf;
      --black: #000;
      --white: #fff;
      --newsDarkContentPrimary: #f8f8f8;
      --wordleBlack: #212121;
      --wordleBlack-2: #272729;
      --wordleBlack-3: #1a1a1b;
      --wordleBlack-4: #121213;
      --wordleBlack-5: #2f2f31;
      --linkBlue: #346eb7;
      --linkDarkBlue: #6ba1dd;
      --orange: #f5793a;
      --blue: #85c0f9;
      --outlineBlue: #2671dc;
      --svg-arrow-fill: var(--white);
      --svg-arrow-stroke: var(--black);
      --svg-arrow-fill-hover: var(--black);
      --svg-arrow-stroke-hover: var(--white)
    }

    :root {
      --color-tone-1: var(--black);
      --color-tone-2: var(--gray-18);
      --color-tone-3: var(--gray-19);
      --color-tone-4: var(--gray-13);
      --color-tone-5: var(--gray-20);
      --color-tone-6: var(--gray-21);
      --color-tone-7: var(--white);
      --color-tone-8: var(--newsGray-100);
      --color-tone-9: var(--newsGray-10);
      --color-tone-10: var(--black);
      --color-tone-11: var(--gray-18);
      --color-tone-12: var(--newsGray-85);
      --color-nav-hover: var(--gray-6);
      --opacity-50: rgba(255, 255, 255, 0.5);
      --error-background: var(--gray-22);
      --icon-disabled: var(--gray-23);
      --background-gray: var(--gray-29);
      --inline-links: var(--linkBlue);
      --warning-red: #d0021b
    }

    .dark {
      --color-tone-1: var(--newsDarkContentPrimary);
      --color-tone-2: var(--gray-24);
      --color-tone-3: var(--gray-25);
      --color-tone-4: var(--gray-26);
      --color-tone-5: var(--wordleBlack-2);
      --color-tone-6: var(--wordleBlack-3);
      --color-tone-7: var(--wordleBlack-4);
      --color-tone-8: var(--newsDarkContentPrimary);
      --color-tone-9: var(--gray-27);
      --color-tone-10: var(--newsGray-10);
      --color-tone-11: var(--newsGray-10);
      --color-tone-12: var(--newsGray-10);
      --color-nav-hover: var(--wordleBlack-5);
      --opacity-50: rgba(0, 0, 0, 0.5);
      --error-background: var(--color-tone-7);
      --icon-disabled: var(--gray-28);
      --svg-arrow-fill: var(--black);
      --svg-arrow-stroke: var(--white);
      --svg-arrow-fill-hover: var(--white);
      --svg-arrow-stroke-hover: var(--black);
      --inline-links: var(--linkDarkBlue);
      --warning-red: #ea7980
    }

    :root, .dark {
      --color-background: var(--color-tone-7)
    }

    :root {
      --color-present: var(--yellow-3);
      --color-correct: var(--green);
      --color-absent: var(--color-tone-2);
      --tile-text-color: var(--color-tone-7);
      --key-text-color: var(--color-tone-1);
      --key-evaluated-text-color: var(--color-tone-7);
      --key-bg: var(--color-tone-4);
      --key-bg-present: var(--color-present);
      --key-bg-correct: var(--color-correct);
      --key-bg-absent: var(--color-absent);
      --key-evaluated-text-color: var(--color-tone-7);
      --key-evaluated-text-color-absent: var(--white);
      --modal-content-bg: var(--color-tone-7);
      --outline-focus: var(--outlineBlue);
      --color-correct-high-contrast: var(--wordle-high-contrast-green)
    }

    @font-face {
      font-family: "nyt-franklin";
      src: url("./franklin-normal-700.woff2") format("woff2");
      font-weight: 700;
      font-style: normal
    }

    html {
      height: 100%
    }

    body {
      height: 100%;
      background-color: var(--color-background);
      margin: 0;
      padding: 0;
      overflow-y: hidden
    }

    body.scrollable {
      overflow-y: unset
    }

    html, body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale
    }

    button:focus-visible, a:focus-visible {
      outline: 2px solid var(--outline-focus)
    }

    @media (min-width: 415px) {
      :root {
        --header-height: 65px
      }
    }

    @media (min-width: 1024px) {
      :root {
        --header-padding-x: 24px
      }
    }

    @media (min-width: 768px) {
      :root {
        --header-padding-x: 20px
      }
    }

    .pz-play-tab .pz-hide-play-tab, .pz-newsreader.pz-ios .pz-hide-newsreader-ios, .pz-newsreader.pz-android .pz-hide-newsreader-android, .pz-newsreader .pz-hide-newsreader, .pz-games-app-ios .pz-hide-games-app-ios, .pz-games-app-android .pz-hide-games-app-android, .pz-games-app .pz-hide-games-app, body:not(.pz-hybrid) .pz-hide-web {
      display: none
    }

    /*# sourceMappingURL=wordle.e3c9f95c41d06668a615.css.map*/

  </style>
  <style>
    .MomentSystem-module_moment__G9hyw {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0
    }

    .MomentSystem-module_momentExit__ssPqu {
      opacity: 1
    }

    .MomentSystem-module_momentExitActive__DuPSj {
      opacity: 0;
      transition: opacity 400ms
    }

    .MomentSystem-module_momentEnter__pKkpt {
      opacity: 0
    }

    .MomentSystem-module_momentEnterActive__UJVVz {
      opacity: 1;
      transition: opacity 400ms
    }

    .LandscapeWarning-module_landscapeWarning__MFIwn {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: var(--horizontal-warning-z-index);
      background-color: var(--white);
      text-align: center;
      padding-top: 55px
    }

    .LandscapeWarning-module_landscapeWarning__MFIwn i {
      height: 30%;
      width: 20%;
      margin: 2rem
    }

    .LandscapeWarning-module_landscapeWarning__MFIwn p {
      font-family: "nyt-franklin";
      font-weight: 500;
      margin: 0;
      font-size: 16px;
      font-size: 1rem;
      line-height: 20.8px;
      line-height: 1.3rem
    }

    .LandscapeWarning-module_landscapeWarning__MFIwn span {
      font-family: "nyt-franklin";
      font-weight: 700
    }

    .LandscapeWarning-module_darkMode__Y36XD {
      background-color: #000;
      color: #fff
    }

    .LandscapeWarning-module_rotate__Qrx4Q {
      background-size: contain;
      background-repeat: no-repeat;
      display: inline-block;
      min-height: 20px;
      min-width: 20px;
      margin-right: 8px;
      background-image: var(--icon-rotate-wordle)
    }

    .BackButton-module_backButton__W2d63 {
      background: rgba(0, 0, 0, 0);
      border: 0;
      padding: 0
    }

    .BackButton-module_backButton__W2d63:before {
      content: "";
      background: var(--hybrid-back) center no-repeat;
      background-position-x: 0px;
      display: block;
      height: 45px;
      padding: 0px 15px;
      opacity: 1
    }

    .BackButton-module_backButton__W2d63:active:before {
      opacity: .5
    }

    .dark .BackButton-module_backButton__W2d63:before {
      background: var(--hybrid-back-dark-mode) center no-repeat;
      background-position-x: 0px
    }

    .BackButton-module_backButtonText__myVSA {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0)
    }

    .NonDismissalBanner-module_flexContainer__jYZL0 {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .NonDismissalBanner-module_expandToRow__f5g7t {
    }

    @media (min-width: 444px) {
      .NonDismissalBanner-module_expandToRow__f5g7t {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .NonDismissalBanner-module_mobileColumn__eekI7 {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .NonDismissalBanner-module_visually-hidden__EuwSz {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }


    .NonDismissalBanner-module_banner__CqPDp button.NonDismissalBanner-module_iconButton__hwSOB {
      order: 3;
      background: #fff;
      border: 0;
      cursor: pointer;
      margin: auto
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG {
      display: flex;
      flex: 2;
      align-items: center;
      font-family: "nyt-franklin";
      font-size: 16px;
      font-size: 1rem;
      line-height: 20.8px;
      line-height: 1.3rem
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG i {
      min-height: 35px;
      min-width: 35px
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG.NonDismissalBanner-module_bannerMessageIcon__xCwfD {
      align-items: flex-start
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG.NonDismissalBanner-module_bannerMessageIcon__xCwfD i {
      min-height: 20px;
      min-width: 20px
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl {
      flex: 1;
      margin-left: .5rem
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl .NonDismissalBanner-module_clickArea__oNUnX {
      height: 26px;
      padding: 4px 0
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl h3 {
      font-size: 14px;
      font-size: 0.875rem;
      line-height: 18.2px;
      line-height: 1.1375rem;
      font-weight: 700;
      margin: 0
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl h3.NonDismissalBanner-module_bannerMessageTitle__BJkZ4 {
      text-transform: uppercase
    }

    .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl p {
      font-size: 16px;
      font-size: 1rem;
      line-height: 20.8px;
      line-height: 1.3rem
    }

    .NonDismissalBanner-module_banner__CqPDp a {
      color: inherit;
      text-decoration: none
    }


    .NonDismissalBanner-module_multiIconBannerTest__t8tvf.NonDismissalBanner-module_relative__fMePO {
      position: relative
    }

    .NonDismissalBanner-module_multiIconBannerTest__t8tvf button.NonDismissalBanner-module_iconButtonTest__oaGgl {
      background: #fff;
      border: 0;
      cursor: pointer;
      padding: 0
    }

    .NonDismissalBanner-module_multiIconBannerTest__t8tvf button.NonDismissalBanner-module_iconButtonTest__oaGgl i {
      margin-right: 0
    }

    .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerInformationTest__Q0Dqp {
      align-items: center;
      font-family: "nyt-franklin";
      margin: auto;
      font-size: 16px;
      font-size: 1rem;
      line-height: 20.8px;
      line-height: 1.3rem;
      text-align: center
    }

    .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerInformationTest__Q0Dqp i {
      min-height: 25px;
      min-width: 25px
    }

    .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerBodyTest__UrtZZ {
      flex: 1
    }

    .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerBodyTest__UrtZZ h3 {
      font-size: .85rem;
      font-weight: 700;
      margin: 0
    }

    .NonDismissalBanner-module_multiIconBannerTest__t8tvf a {
      color: inherit;
      text-decoration: none
    }

    .LargeCTABanner-module_flexContainer__fXybs {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .LargeCTABanner-module_expandToRow__Rfjkn {
    }

    @media (min-width: 444px) {
      .LargeCTABanner-module_expandToRow__Rfjkn {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .LargeCTABanner-module_mobileColumn__kb9qG {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .LargeCTABanner-module_visually-hidden__j0wgs {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .LargeCTABanner-module_banner__Wrm0P {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      background-color: #fff;
      min-height: 275px;
      position: fixed;
      bottom: 0;
      width: 100%;
      border-top-left-radius: 13px;
      border-top-right-radius: 13px;
      color: #000;
      margin-top: 10px
    }

    .LargeCTABanner-module_banner__Wrm0P.LargeCTABanner-module_relative__vctEf {
      position: relative
    }

    .LargeCTABanner-module_headline__Kv4ow {
      font: 700 2.25rem/2.375rem nyt-karnakcondensed, Georgia;
      text-align: center;
      padding: 0 35px
    }

    .LargeCTABanner-module_smallHeadline__xt_vz {
      font: 700 0.9375rem/1.125rem nyt-franklin, Arial;
      margin-top: 5px
    }

    .LargeCTABanner-module_headline__Kv4ow + .LargeCTABanner-module_inlineGames__fenqr {
      margin-top: 15px
    }

    .LargeCTABanner-module_playButton__if85L {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      font: 600 1rem nyt-franklin, Arial;
      border: solid 1px #000;
      border-radius: 24px;
      padding: 10px 22px
    }

    .LargeCTABanner-module_inlineGames__fenqr + .LargeCTABanner-module_playButton__if85L {
      margin-top: 20px
    }

    .LargeCTABanner-module_playButton__if85L i {
      width: 27px;
      height: 27px;
      border-radius: 7px
    }

    .LargeCTABanner-module_iconTextWrapper__goI7a {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap
    }

    .LargeCTABanner-module_iconTextWrapper__goI7a + i {
      position: absolute;
      right: 10px
    }

    .LargeCTABanner-module_imageOverlay__E2_A0 {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      min-height: 94px;
      position: fixed;
      bottom: 0;
      width: 100%;
      background-color: #fff
    }

    .Skip-module_skipButton__m8KJ8 {
      font-family: "nyt-franklin";
      font-weight: 700;
      display: flex;
      justify-content: flex-end;
      align-self: flex-end;
      align-items: center;
      padding-top: 12px;
      padding-right: 20px;
      padding-bottom: 14px;
      width: 100%;
      background-color: #e3e3e1;
      z-index: 99;
      max-height: var(--inter-ad-skip-button-height);
      animation: Skip-module_fade__XWqBH 0.75s 1
    }

    .Skip-module_skipButton__m8KJ8 svg {
      margin-left: .5rem
    }

    .Skip-module_skipButtonPlaceholder__j1_60 {
      height: 52px
    }

    :root {
      --inter-ad-skip-button-height: 52px;
      --inter-ad-top-bar-height: 34px;
      --inter-ad-bottom-bar-height: 24px
    }

    .AdInterstitial-module_interstitialPlaceholder__t7Hqq:before {
      content: "advertisement";
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #363636;
      font-size: 12px;
      border: 1px solid #363636;
      padding: 12px 18px;
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: AdInterstitial-module_fadeIn__wjfza .5s ease-in-out
    }

    .AdInterstitial-module_ad__BAtlW {
      max-height: calc(100dvh - (var(--inter-ad-skip-button-height) + var(--inter-ad-top-bar-height) + var(--inter-ad-bottom-bar-height)))
    }

    .AdInterstitial-module_adSlug__lH065 {
      margin: auto;
      width: 100%;
      min-height: 250px;
      text-align: center;
      opacity: 0
    }

    .AdInterstitial-module_adSlug__lH065 h3 {
      font-family: "nyt-franklin";
      font-weight: 500;
      font-size: 12px;
      line-height: 12px;
      margin: 12px auto 10px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #5a5a5a;
      font-style: normal
    }

    .AdInterstitial-module_adSlug__lH065.AdInterstitial-module_adSlugVisible__rYpip {
      padding-bottom: 24px;
      background-color: #f8f8f8;
      opacity: 1
    }

    .AdInterstitial-module_fluid__yLAYp {
      width: 100%
    }

    .AdInterstitial-module_modalOverlay__LZ_UW {
      display: flex;
      flex-direction: column;
      position: fixed;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      padding: 0;
      border: none;
      justify-content: space-between;
      align-items: center;
      background-color: #e3e3e1;
      z-index: var(--modal-z-index)
    }

    .Welcome-module_flexContainer__lAdec {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .Welcome-module_expandToRow__QqRrS {
    }

    @media (min-width: 444px) {
      .Welcome-module_expandToRow__QqRrS {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .Welcome-module_mobileColumn__CEB1a {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .Welcome-module_visually-hidden__F4bCv {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .Welcome-module_flexCenter__HiNsS {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap
    }

    .Welcome-module_regiwallText__w0FKl {
      letter-spacing: 0;
      text-transform: none;
      text-align: center;
      display: block
    }

    .Welcome-module_regiwallText_heading__hG9eI {
      font: 700 36px nyt-karnakcondensed, Georgia;
      line-height: 115%;
      margin: 8px 0
    }

    .Welcome-module_regiwallText_heading_condensed__wApvE {
      font: 400 28px nyt-karnak, Georgia;
      line-height: 115%;
      margin: .5em 0
    }

    @media (max-height: 548px) {
      .driveToMore .Welcome-module_regiwallText_heading_condensed__wApvE {
        margin: .25em
      }
    }

    @media (min-width: 768px)and (max-width: 1025px) {
      .Welcome-module_regiwallText_heading_condensed__wApvE {
        font-size: 32px
      }
    }

    @media (min-width: 1025px) {
      .Welcome-module_regiwallText_heading_condensed__wApvE {
        font-size: 36px
      }
    }

    .Welcome-module_regiwallText_subheading__NPTj1 {
      font: 400 24px nyt-karnak, Georgia;
      line-height: 120%
    }

    .Welcome-module_regiwallText_link__KEauX {
      color: var(--color-tone-1);
      font: 600 16px nyt-franklin, Arial;
      line-height: 20.8px;
      text-decoration: underline
    }

    .Welcome-module_contentWelcome__TL17B {
      position: relative;
      color: #000;
      max-width: 100%;
      width: 100%;
      overflow-y: auto;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: #e3e3e1
    }

    .Welcome-module_contentWelcomeContainer__UO4Ei {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-direction: column;
      padding: 50px 42px 0
    }

    .Welcome-module_contentWelcomeContainer__UO4Ei.Welcome-module_largeCTAVariant__HvqT5 {
      padding-top: 25px
    }

    .Welcome-module_contentWelcomeMain__O6vot {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      flex-grow: 1
    }

    .Welcome-module_spinner__ko9gy {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%
    }

    .Welcome-module_title__uhLqe {
      font-size: 36px;
      line-height: 38px;
      font-family: "nyt-karnakcondensed";
      font-weight: bold;
      margin-bottom: 12px
    }

    @media (min-width: 760px) {
      .Welcome-module_title__uhLqe {
        font-size: 44px;
        line-height: 1.045em
      }
    }

    @media (min-width: 992px) {
      .Welcome-module_title__uhLqe {
        font-size: 50px;
        line-height: 52px
      }
    }

    .Welcome-module_title__uhLqe.Welcome-module_small__gRQGu {
      font-size: 1.125em;
      line-height: 1.111
    }

    .Welcome-module_subtitle__rL8EE {
      font-size: 28px;
      line-height: 28px;
      margin-bottom: 28px;
      font-family: "nyt-karnak";
      text-align: center;
      font-weight: 400;
      font-size: 24.8px
    }

    @media (min-width: 760px) {
      .Welcome-module_subtitle__rL8EE {
        max-width: 300px;
        font-size: 32px;
        line-height: 36px
      }
    }

    @media (min-width: 992px) {
      .Welcome-module_subtitle__rL8EE {
        max-width: 375px;
        font-size: 38px;
        line-height: 44px;
        margin-bottom: 36px
      }
    }

    .Welcome-module_subtitle__rL8EE .Welcome-module_bold___70f6 {
      font-family: "nyt-karnakcondensed"
    }

    .Welcome-module_icon__iYwGT {
      height: 64px;
      margin-bottom: 16px;
      display: block;
      width: 100%;
      text-align: center;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      background-image: var(--wordle-icon)
    }

    @media (max-width: 768px) {
      .Welcome-module_largeCTAVariant__HvqT5 .Welcome-module_icon__iYwGT {
        height: 50px
      }
    }

    @media (min-width: 768px) {
      .Welcome-module_icon__iYwGT {
        height: 80px;
        margin-bottom: 12px
      }
    }

    .Welcome-module_icon__iYwGT.Welcome-module_small__gRQGu {
      height: 40px;
      margin-bottom: 8px
    }

    @media (min-width: 768px) {
      .Welcome-module_icon__iYwGT.Welcome-module_small__gRQGu {
        margin-top: 10px
      }
    }

    .Welcome-module_dateContainer__GTeM2 {
      text-align: center
    }

    .Welcome-module_noWrap__ThSVO {
      white-space: nowrap
    }

    .Welcome-module_date__Fmbmx {
      display: block;
      font-size: 1em;
      line-height: 1.25;
      letter-spacing: .005em;
      font-family: "nyt-franklin";
      font-weight: 600
    }

    @media (max-width: 992px) {
      .Welcome-module_date__Fmbmx {
        font-size: 16px;
        line-height: 20px
      }
    }

    .Welcome-module_wordleMeta__P_0lJ {
      display: block;
      font-size: 1em;
      line-height: 1.25;
      letter-spacing: .005em
    }

    @media (max-width: 992px) {
      .Welcome-module_wordleMeta__P_0lJ {
        font-size: 14px;
        line-height: 18px
      }
    }

    .Welcome-module_buttonContainer__K4GEw {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column-reverse;
      box-sizing: border-box;
      width: 100%;
      margin-bottom: 24px
    }

    @media (min-width: 760px) {
      .Welcome-module_buttonContainer__K4GEw {
        margin-bottom: 28px;
        flex-direction: row
      }
    }

    .Welcome-module_buttonContainer__K4GEw .Welcome-module_button__ZG0Zh {
      position: relative;
      border: none;
      height: 3em;
      border-radius: 1.5em;
      align-content: center;
      letter-spacing: .05em;
      font-size: 16px;
      font-family: "nyt-franklin";
      line-height: 28px;
      cursor: pointer;
      padding: 0 2em;
      background: #000;
      color: #fff;
      margin: 0 10px 8px;
      font-weight: 400
    }

    @media (max-width: 760px) {
      .Welcome-module_buttonContainer__K4GEw .Welcome-module_button__ZG0Zh {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 155px
      }
    }

    @media (min-width: 760px) {
      .Welcome-module_buttonContainer__K4GEw .Welcome-module_button__ZG0Zh {
        width: 180px
      }
    }

    .Welcome-module_buttonContainer__K4GEw .Welcome-module_button__ZG0Zh.Welcome-module_secondary__fv3cc {
      background: none;
      color: #000;
      border: 1px solid;
      letter-spacing: .01em
    }

    .Welcome-module_buttonContainer__K4GEw a {
      all: inherit
    }

    .Welcome-module_back__cUvW3 {
      position: absolute;
      display: flex;
      align-items: center;
      height: var(--header-height);
      top: 0;
      left: var(--header-padding-x)
    }

    .Welcome-module_back__cUvW3 button::before {
      background: var(--hybrid-back) center no-repeat !important;
      background-position-x: 0px !important
    }

    .Note-module_container__TXglF {
      padding: 0 20px
    }

    .Note-module_note__lbrbA {
      display: flex;
      border-top: 1px solid rgba(0, 0, 0, .2);
      padding: 20px 0
    }

    .Note-module_note__lbrbA .Note-module_statsIcon__RRy1C {
      margin-right: 16px
    }

    .Note-module_note__lbrbA .Note-module_moreLink__uzCuy {
      all: unset;
      text-decoration: underline;
      font-size: 14px;
      font-weight: 400;
      line-height: 16px;
      color: var(--newsGray-85);
      cursor: pointer
    }

    .Note-module_note__lbrbA .Note-module_noteHeader__jt707 {
      color: var(--outlineBlue);
      font-size: 11px;
      font-weight: 700;
      text-align: left
    }

    .Note-module_note__lbrbA .Note-module_noteDescription__QmvW2 {
      color: var(--newsGray-100);
      font-size: 16px;
      font-weight: 700;
      line-height: 24px
    }

    .Note-module_note__lbrbA .Note-module_noteSummary__niOPe {
      color: var(--newsGray-85);
      font-size: 14px;
      line-height: 16px
    }

    .Spinner-module_spinner__GJU3x {
      animation: Spinner-module_spin__D72mN 1s linear infinite
    }

    .SkipNav-module_skipNav__MFptJ {
      clip: rect(1px, 1px, 1px, 1px);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
      border: 0
    }

    .SkipNav-module_skipNav__MFptJ:focus {
      clip: auto;
      height: auto;
      overflow: auto;
      position: absolute;
      width: auto;
      top: 0;
      left: 0;
      z-index: 200;
      font-size: .75rem;
      text-transform: uppercase;
      font-weight: bold;
      padding: .5rem .5rem .375rem;
      border-radius: 3px;
      text-decoration: none;
      color: #000;
      background: #fff
    }

    .Tile-module_tile__UWEHN {
      font-family: "nyt-franklin";
      width: 100%;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      font-size: 3rem;
      line-height: 1;
      font-weight: bold;
      vertical-align: middle;
      box-sizing: border-box;
      color: var(--tile-text-color);
      text-transform: uppercase;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none
    }

    .Tile-module_tile__UWEHN::before {
      content: "";
      display: inline-block;
      padding-bottom: 100%
    }

    .Tile-module_tile__UWEHN.Tile-module_small__dKW39 {
      font-size: 1.6rem;
      padding-top: 1px
    }

    @media (max-height: 600px) {
      .Tile-module_tile__UWEHN {
        font-size: 1em
      }
    }

    .Tile-module_tile__UWEHN[data-state=empty] {
      border: 2px solid var(--color-tone-4)
    }

    .Tile-module_tile__UWEHN[data-state=tbd] {
      background-color: var(--color-tone-7);
      border: 2px solid var(--color-tone-3);
      color: var(--color-tone-1)
    }

    .Tile-module_tile__UWEHN[data-state=correct] {
      background-color: var(--color-correct);
      color: var(--key-evaluated-text-color)
    }

    .Tile-module_tile__UWEHN[data-state=present] {
      background-color: var(--color-present);
      color: var(--key-evaluated-text-color)
    }

    .Tile-module_tile__UWEHN[data-state=absent] {
      background-color: var(--color-absent);
      color: var(--key-evaluated-text-color-absent)
    }

    .Tile-module_tile__UWEHN[data-animation=pop] {
      animation-name: Tile-module_PopIn__CmX51;
      animation-duration: 100ms
    }

    .Tile-module_tile__UWEHN[data-animation=flip-in] {
      animation-name: Tile-module_FlipIn__PCdh1;
      animation-duration: 250ms;
      animation-timing-function: ease-in
    }

    .Tile-module_tile__UWEHN[data-animation=flip-out] {
      animation-name: Tile-module_FlipOut__xeJcb;
      animation-duration: 250ms;
      animation-timing-function: ease-in
    }

    .Row-module_row__pwpBq.Row-module_invalid__RNDXZ {
      animation-name: Row-module_Shake__LeteU;
      animation-duration: 600ms
    }

    .Row-module_win__U9cQp {
      animation-name: Row-module_Bounce__TMGbC;
      animation-duration: 1000ms
    }

    .Board-module_boardContainer__TBHNL {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-grow: 1;
      overflow: hidden
    }

    .Loading-module_container__JOli8 {
      display: flex;
      position: absolute;
      width: 100%;
      height: 100%;
      max-height: calc(100% - var(--header-height) - 1px);
      left: 0;
      justify-content: center;
      background-color: var(--color-background);
      z-index: var(--error-z-index)
    }

    .Loading-module_loadingContainer__bVEha {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      width: 82px;
      height: 100%;
      transition: opacity .2s;
      opacity: 1
    }

    .Loading-module_hide__Z00E7 {
      opacity: 0
    }

    .Help-module_help__fbOXF {
      width: 100%;
      margin: auto
    }

    .Help-module_subheading__mbRG9 {
      font-family: "nyt-karnak";
      font-weight: 500;
      font-size: 20px;
      line-height: 24px;
      margin: 0
    }

    .Help-module_instructions__uXsG6 {
      font-family: "nyt-franklin";
      font-size: 16px;
      line-height: 20px;
      list-style-type: disc;
      font-weight: 500;
      -webkit-margin-before: 1em;
      margin-block-start: 1em;
      -webkit-margin-after: 1em;
      margin-block-end: 1em;
      -webkit-padding-start: 20px;
      padding-inline-start: 20px;
      color: var(--color-tone-1)
    }

    .Help-module_instructions__uXsG6 li {
      margin-bottom: 4px
    }

    .Help-module_instructions__uXsG6 li::marker {
      font-size: 18px
    }

    .Help-module_examples__W3VXL {
      font-family: "nyt-franklin"
    }

    .Help-module_examples__W3VXL strong {
      font-weight: bold
    }

    .Help-module_examples__W3VXL p {
      margin: 0;
      font-size: 16px;
      line-height: 20px
    }

    .Help-module_example__gldBI {
      margin-top: 8px;
      margin-bottom: 20px
    }

    .Help-module_example__gldBI p {
      font-size: 16px;
      line-height: 20px;
      margin-top: 8px
    }

    .Help-module_tileContainer__vGHuc {
      display: inline-block;
      width: 32px;
      height: 32px;
      margin-right: 4px
    }

    .Help-module_reminderSignUp__oQ42D {
      font-family: "nyt-franklin";
      font-size: 16px;
      line-height: 20px;
      margin-top: 20px
    }

    .Help-module_reminderSignUp__oQ42D a {
      color: var(--inline-links);
      -webkit-text-decoration: underline var(--inline-links);
      text-decoration: underline var(--inline-links)
    }

    .Help-module_statsLogin__HkQec {
      font-family: "nyt-franklin";
      position: relative;
      color: var(--color-tone-1);
      font-size: 16px;
      line-height: 20px;
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: flex-start;
      text-decoration: none;
      padding: 17px 0;
      border-top: 1px solid var(--gray-3);
      border-bottom: 1px solid var(--gray-3);
      margin: 0 auto 20px
    }

    .Help-module_statsLogin__HkQec button {
      border: none;
      background-color: rgba(0, 0, 0, 0);
      font-family: "nyt-franklin";
      font-size: 16px;
      line-height: 20px;
      text-align: left;
      padding: 0px 0px 3px
    }

    .Help-module_statsLogin__HkQec a, .Help-module_statsLogin__HkQec button {
      color: var(--inline-links);
      -webkit-text-decoration: underline var(--inline-links);
      text-decoration: underline var(--inline-links)
    }

    .Help-module_statsLogin__HkQec .Help-module_loginArrow__VYc4x {
      text-decoration: none;
      justify-self: flex-end
    }

    .Help-module_statsLogin__HkQec .Help-module_loginText__lhtLY {
      flex-grow: 2
    }

    .Help-module_statsLogin__HkQec .Help-module_statsIcon__gZPRN {
      margin-right: 10px
    }

    @media (max-width: 295px) {
      .Help-module_tileContainer__vGHuc {
        height: 32px
      }
    }

    .MiniAuthCTA-module_container__c9Atk {
      border-top: 1px solid var(--color-tone-9);
      text-align: left;
      display: flex
    }

    @media (max-height: 548px) {
      .driveToMore .MiniAuthCTA-module_container__c9Atk {
        display: none
      }
    }

    @media (min-width: 500px) {
      .MiniAuthCTA-module_container__c9Atk {
        padding: 0px;
        margin: auto;
        width: 343px;
        border-bottom: 1px solid var(--color-tone-9)
      }
    }

    .MiniAuthCTA-module_icon__xDcPq {
      content: var(--stats-auth);
      padding-top: 10px;
      padding-right: 2px;
      height: 31px;
      width: 31px;
      margin-right: 8px
    }

    .MiniAuthCTA-module_buttonsContainer__IoQWk {
      text-align: left;
      margin: auto 0
    }

    .MiniAuthCTA-module_buttonsContainer__IoQWk .MiniAuthCTA-module_loginButton__x7_fR {
      text-decoration: underline;
      font-size: 14px;
      font-weight: 400;
      line-height: 16px;
      color: var(--color-tone-1);
      cursor: pointer
    }

    .MiniAuthCTA-module_buttonsContainer__IoQWk .MiniAuthCTA-module_loginButton__x7_fR > a {
      color: inherit
    }

    @media (min-width: 500px) {
      .MiniAuthCTA-module_buttonsContainer__IoQWk .MiniAuthCTA-module_loginButton__x7_fR {
        width: 343px
      }
    }

    .Stats-module_gameStats__X2eDU {
      font-family: "nyt-franklin";
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      margin: 0 auto auto auto;
      padding-top: 16px;
      max-width: 520px
    }

    @media (min-width: 500px) {
      .Stats-module_gameStats__X2eDU {
        padding-top: 50px;
        align-self: center
      }
    }

    .Stats-module_gameStats__X2eDU .Stats-module_statsContainer__g23s0 {
      align-self: center
    }

    @media (min-width: 500px) {
      .Stats-module_gameStats__X2eDU .Stats-module_statsContainer__g23s0 {
        width: 343px
      }
    }

    .Stats-module_gameStats__X2eDU .Stats-module_statisticsHeading__CExdL {
      font-weight: 700;
      font-size: 14px;
      letter-spacing: .05em;
      text-transform: uppercase;
      margin: 0;
      line-height: 20px;
      margin-top: 0;
      margin-bottom: 10px;
      letter-spacing: .05em
    }

    @media (min-width: 500px) {
      .Stats-module_gameStats__X2eDU .Stats-module_statisticsHeading__CExdL {
        padding-top: 20px;
        width: 250px;
        margin-left: 22px
      }
    }

    @media (min-width: 1000px) {
      .Stats-module_gameStats__X2eDU .Stats-module_statisticsHeading__CExdL {
        padding-top: 0px
      }
    }

    .Stats-module_statistics__oFLEK {
      display: flex;
      width: 100%;
      margin-bottom: 10px
    }

    @media (min-width: 500px) {
      .Stats-module_statistics__oFLEK {
        align-self: center
      }
    }

    .Stats-module_statisticContainer__woJli {
      flex: 1;
      margin-left: 12px
    }

    .Stats-module_statisticContainer__woJli:last-child {
      margin-right: 12px
    }

    .Stats-module_statisticContainer__woJli .Stats-module_statistic__u5db0 {
      font-size: 24px;
      font-weight: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      letter-spacing: .05em;
      font-variant-numeric: proportional-nums;
      line-height: 34px
    }

    @media (min-width: 500px) {
      .Stats-module_statisticContainer__woJli .Stats-module_statistic__u5db0:not(.Stats-module_small__zkkbW) {
        font-size: 44px;
        font-weight: 500
      }
    }

    .Stats-module_statistic__u5db0.Stats-module_timer__ndCDz {
      font-variant-numeric: initial;
      font-size: 32px;
      line-height: 34px;
      letter-spacing: .025em
    }

    .Stats-module_statisticContainer__woJli .Stats-module_label__sQwFu {
      font-size: 12px;
      font-weight: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 14px;
      letter-spacing: .1em
    }

    @media (min-width: 500px) {
      .Stats-module_statisticContainer__woJli .Stats-module_label__sQwFu {
        margin-top: 4px
      }
    }

    .Stats-module_guessDistribution__ibfJS {
      width: 80%;
      margin-bottom: 10px
    }

    @media (min-width: 500px) {
      .Stats-module_guessDistribution__ibfJS {
        width: 58%;
        margin-bottom: 20px;
        margin-left: 22px
      }
    }

    .Stats-module_graphContainer__Al4D1 {
      width: 100%;
      height: 18px;
      display: flex;
      align-items: center;
      padding-bottom: 4px;
      font-size: 14px;
      line-height: 20px
    }

    .Stats-module_graphContainer__Al4D1 .Stats-module_graph__f4tUv {
      width: 100%;
      height: 100%;
      padding-left: 4px
    }

    .Stats-module_graphContainer__Al4D1 .Stats-module_graph__f4tUv .Stats-module_graphBar__HvdG8 {
      height: 100%;
      width: 0%;
      position: relative;
      background-color: var(--color-absent);
      display: flex;
      justify-content: center
    }

    .Stats-module_graphContainer__Al4D1 .Stats-module_graph__f4tUv .Stats-module_graphBar__HvdG8.Stats-module_highlight__lrZJU {
      background-color: var(--color-correct-high-contrast)
    }

    .Stats-module_graphContainer__Al4D1 .Stats-module_graph__f4tUv .Stats-module_graphBar__HvdG8.Stats-module_alignRight__ljKmf {
      justify-content: flex-end;
      padding-right: 8px
    }

    .Stats-module_graphContainer__Al4D1 .Stats-module_graph__f4tUv .Stats-module_numGuesses__jFa2m {
      font-weight: bold;
      color: var(--tile-text-color);
      font-size: 12px;
      line-height: 18px
    }

    .Stats-module_footer__jx3ae {
      display: flex;
      width: 100%
    }

    .Stats-module_countdown__C3zxv {
      border-right: 1px solid var(--color-tone-1);
      padding-right: 12px;
      width: 50%
    }

    .Stats-module_share__EvF2C {
      display: flex;
      justify-content: center;
      align-items: center;
      padding-left: 12px;
      width: 50%
    }

    .Stats-module_noData__J1mBk {
      margin-bottom: 10px
    }

    .Stats-module_shareButton__L4E0m {
      background-color: var(--key-bg-correct);
      color: var(--key-evaluated-text-color);
      font-family: inherit;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      border: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: row;
      text-transform: uppercase;
      -webkit-tap-highlight-color: rgba(0, 0, 0, .3);
      width: 80%;
      font-size: 20px;
      height: 52px;
      filter: brightness(100%)
    }

    @media (max-width: 444px) {
      .Stats-module_shareButton__L4E0m {
        font-size: 16px
      }
    }

    .Stats-module_shareButton__L4E0m:hover {
      opacity: .9
    }

    .Stats-module_shareIconContainer__RUxSV {
      width: 24px;
      height: 24px;
      padding-left: 8px
    }

    .Stats-module_statsBtnLeft__IyDkc {
      justify-content: unset;
      width: 80%;
      margin: 0px 0px 10px 0
    }

    @media (min-width: 500px) {
      .Stats-module_statsBtnLeft__IyDkc {
        width: 250px;
        margin-left: 22px
      }
    }

    .Stats-module_statsBtnLeft__IyDkc h1 {
      display: inline-block
    }

    .Stats-module_statsBtnLeft__IyDkc .Stats-module_guessDistributionCopy__ydhXT {
      font-family: "nyt-franklin";
      font-weight: bold;
      text-transform: uppercase;
      font-weight: 700;
      font-size: 14px
    }

    .Stats-module_statsBtnLeft__IyDkc button {
      margin-left: 10px
    }

    .Stats-module_statsBtnCenter__AG0A8 {
      margin: 10px
    }

    .Stats-module_statsInfoBtn__bPz7C {
      display: none;
      align-self: center;
      all: unset;
      text-decoration: underline;
      font-size: 14px;
      font-weight: 400;
      line-height: 16px;
      margin-bottom: 20px;
      color: var(--color-tone-10);
      cursor: pointer;
      width: 92%
    }

    @media (min-width: 500px) {
      .Stats-module_statsInfoBtn__bPz7C {
        display: block;
        width: 250px;
        align-self: center
      }
    }

    .Stats-module_promoButton__AfY3n {
      border: 1px solid var(--color-tone-1);
      padding: 10px;
      border-radius: 105px;
      background: var(--color-tone-7);
      font-weight: 700;
      font-size: 14px;
      line-height: 16px;
      color: inherit;
      text-decoration: none;
      width: 150px;
      display: flex;
      width: 66%;
      align-items: center;
      vertical-align: middle;
      justify-content: center
    }

    .Stats-module_promoIcon__YEC17 {
      width: 25px;
      height: 25px;
      background-image: var(--spelling-bee-promo);
      background-size: 25px;
      background-position: center;
      margin-left: 5px
    }

    .Stats-module_promoButtonContainer__jGI1r {
      border-top: 1px solid var(--color-tone-9);
      width: 100%;
      justify-content: center;
      display: flex;
      padding-top: 20px
    }

    .Stats-module_ctaContainer__1Krdy {
      width: 100%
    }

    .Stats-module_guess__Fc0Xn {
      font-weight: bold;
      font-size: 12px;
      line-height: 18px;
      letter-spacing: .1em
    }

    .Stats-module_testGameStats__dznYC {
      padding: 16px
    }

    .Stats-module_testGameStats_regiwall__oBOlx {
      padding-top: 0
    }

    @media (max-height: 548px) {
      .driveToMore .Stats-module_testGameStats__dznYC {
        padding-bottom: 6px
      }
    }

    .Stats-module_testTimer__GYTLQ {
      font-family: "nyt-franklin";
      font-size: 14px;
      line-height: 20px;
      font-weight: 700
    }

    .Header-module_flexContainer__ySFsd {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .Header-module_expandToRow__nhW3k {
    }

    @media (min-width: 444px) {
      .Header-module_expandToRow__nhW3k {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .Header-module_mobileColumn___nCFN {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .Header-module_visually-hidden__cGU4S {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .Header-module_flexCenter__B5aPn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap
    }

    .Header-module_regiwallText__iNXVa {
      letter-spacing: 0;
      text-transform: none;
      text-align: center;
      display: block
    }

    .Header-module_regiwallText_heading__JhUCz {
      font: 700 36px nyt-karnakcondensed, Georgia;
      line-height: 115%;
      margin: 8px 0
    }

    .Header-module_regiwallText_heading_condensed__Tv8Qb {
      font: 400 28px nyt-karnak, Georgia;
      line-height: 115%;
      margin: .5em 0
    }

    @media (max-height: 548px) {
      .driveToMore .Header-module_regiwallText_heading_condensed__Tv8Qb {
        margin: .25em
      }
    }

    @media (min-width: 768px)and (max-width: 1025px) {
      .Header-module_regiwallText_heading_condensed__Tv8Qb {
        font-size: 32px
      }
    }

    @media (min-width: 1025px) {
      .Header-module_regiwallText_heading_condensed__Tv8Qb {
        font-size: 36px
      }
    }

    .Header-module_regiwallText_subheading__x0Sp_ {
      font: 400 24px nyt-karnak, Georgia;
      line-height: 120%
    }

    .Header-module_regiwallText_link__grL8P {
      color: var(--color-tone-1);
      font: 600 16px nyt-franklin, Arial;
      line-height: 20.8px;
      text-decoration: underline
    }

    .Header-module_icon__g9flM {
      width: 56px;
      height: 56px;
      margin-bottom: unset !important
    }

    .Header-module_icon_wordle__Ft04D {
      background-image: var(--wordle-icon);
      background-size: cover;
      background-repeat: no-repeat
    }

    @media (max-height: 548px) {
      .driveToMore .Header-module_icon__g9flM {
        display: none
      }
    }

    .SpellingBeeCTA-module_container__iJS15 {
      margin-top: 20px;
      width: 300px;
      height: 60px
    }

    .SpellingBeeCTA-module_cardContainer__re6a6 {
      display: flex;
      flex-direction: column;
      align-content: center;
      margin: 0 auto
    }

    @media (min-width: 500px) {

      .SpellingBeeCTA-module_cardContainer__re6a6 {
        padding-bottom: 24px
      }
    }

    .SpellingBeeCTA-module_spellingBeeCardEmphasis__OPJ36 {
      background-color: var(--spellingBeeYellow);
      display: flex;
      padding: 12px 0;
      border-radius: 4px
    }

    .SpellingBeeCTA-module_promoIcon__jOVZp {
      width: 45px;
      height: 40px;
      background-image: var(--spelling-bee-promo);
      background-size: contain;
      background-position: center;
      margin: auto 8px auto 8px
    }

    a {
      text-decoration: none
    }

    .SpellingBeeCTA-module_cardText__mFOX0 {
      align-self: center
    }

    .SpellingBeeCTA-module_cardText__mFOX0 + .SpellingBeeCTA-module_arrow__nLJJh {
      width: 20px;
      height: 20px;
      background-size: contain;
      background-position: center;
      margin: auto
    }

    @media (min-width: 500px) {
      .SpellingBeeCTA-module_promoIcon__jOVZp {
        margin-right: 4px
      }
    }

    .SpellingBeeCTA-module_gameTitle__LS_DG {
      color: var(--newsGray-100);
      display: block;
      font-family: "nyt-karnakcondensed";
      letter-spacing: .01em;
      font-size: 14px;
      line-height: 14px;
      margin-bottom: 5px
    }

    .SpellingBeeCTA-module_cardDescription__C75jz {
      color: var(--newsGray-100);
      font-size: 16px;
      line-height: 16px;
      font-family: "nyt-franklin";
      font-weight: 700;
      margin-top: 4px;
      display: inline-block
    }

    .Footer-module_container__Xnn0r {
      border-top: 1px solid var(--color-tone-9);
      text-align: left;
      display: flex;
      padding: 10px;
      padding-bottom: 7px;
      padding-left: 14px
    }

    @media (min-width: 500px) {
      .Footer-module_container__Xnn0r {
        padding: 15px 50px 10px 50px
      }
    }

    .Footer-module_icon__S_vdW {
      padding-top: 10px
    }

    .Footer-module_promoIcon__z2T7Q {
      width: 25px;
      height: 25px;
      background-image: var(--spelling-bee-promo);
      background-size: 25px;
      background-position: center;
      margin-left: 5px
    }

    .Footer-module_textContainer__LWkeW > p {
      margin: 5px
    }

    .Footer-module_textContainer__LWkeW .Footer-module_bold__g62FY {
      color: var(--color-tone-1);
      font-weight: 700;
      font-size: 16px;
      line-height: 20px
    }

    .Footer-module_textContainer__LWkeW .Footer-module_subText__cQvRy {
      color: var(--color-tone-11);
      font-weight: 400;
      font-size: 14px;
      line-height: 16px;
      margin-bottom: 12px
    }

    .Footer-module_textContainer__LWkeW .Footer-module_title__CzTdf {
      color: var(--outlineBlue);
      font-weight: 700;
      font-size: 11px;
      line-height: 12px;
      letter-spacing: .1em;
      text-transform: uppercase;
      margin-bottom: 2px
    }

    .Footer-module_textContainer__LWkeW .Footer-module_line1__lLInr {
      margin-bottom: 0
    }

    .Footer-module_textContainer__LWkeW .Footer-module_line2__m1O4_ {
      margin-top: 0;
      margin-bottom: 4px
    }

    .Footer-module_buttonsContainer__YNxCQ {
      text-align: center;
      margin-top: 10px
    }

    .Footer-module_buttonsContainer__YNxCQ .Footer-module_moreLink__gHL9Q {
      all: unset;
      text-decoration: underline;
      font-size: 14px;
      font-weight: 400;
      line-height: 16px;
      color: var(--color-tone-11);
      margin: 10px 20px 20px 20px;
      cursor: pointer
    }

    .Footer-module_buttonsContainer__YNxCQ .Footer-module_loginButton__abKD3 {
      background-color: var(--color-tone-7);
      color: var(--color-tone-1);
      cursor: pointer;
      font-weight: 700;
      font-size: 12px;
      line-height: 14px;
      border: 1px solid var(--color-tone-1);
      border-radius: 55px;
      align-items: center;
      text-align: center;
      letter-spacing: .04em;
      text-decoration: none;
      padding: 14px 5px
    }

    .Footer-module_buttonsContainer__YNxCQ .Footer-module_loginButton__abKD3 > a {
      color: inherit;
      text-decoration: none
    }

    @media (min-width: 500px) {
      .Footer-module_buttonsContainer__YNxCQ {
        width: 80%;
        margin: 0 auto
      }

      .Footer-module_loginButton__abKD3 {
        font-size: 14px;
        width: 90%;
        margin: 0 auto
      }
    }

    @media (max-width: 499px) {
      .Footer-module_buttonsContainer__YNxCQ {
        width: 70%;
        margin: 0 auto
      }

      .Footer-module_loginButton__abKD3 {
        width: 100%
      }
    }

    .Footer-module_promoButton__UcPmY, .Footer-module_sbButtonFooter__X3LsB .Footer-module_sbPlayButton__kNigc {
      border: 1px solid var(--color-tone-1);
      padding: 10px;
      border-radius: 105px;
      background: var(--color-tone-7);
      font-weight: 700;
      font-size: 14px;
      line-height: 16px;
      color: inherit;
      text-decoration: none;
      display: flex;
      align-items: center;
      margin-right: 12px;
      vertical-align: middle;
      justify-content: center
    }

    .Footer-module_shareButton__cHprS {
      background-color: var(--color-correct-high-contrast);
      color: var(--key-evaluated-text-color);
      border-radius: 104px;
      border: none;
      font-weight: 700;
      font-size: 14px;
      line-height: 16px;
      vertical-align: middle;
      cursor: pointer
    }

    #Footer-module_shareIcon__wOwOt {
      vertical-align: middle;
      margin-left: 10px
    }

    .Footer-module_shareText__m7yUa {
      color: var(--key-evaluated-text-color)
    }

    @media (max-width: 295px) {
      .Footer-module_promoIcon__z2T7Q {
        width: 15px;
        height: 15px;
        background-size: 15px
      }

      .Footer-module_shareButton__cHprS {
        font-size: 10px
      }
    }

    .Footer-module_bottomSheet__XnX4f .Footer-module_bottomSheetContainer__rNfdr {
      padding: 16px
    }

    .Footer-module_bottomSheet__XnX4f .Footer-module_shareButton__cHprS {
      width: 200px;
      height: 44px
    }

    @media (max-width: 500px) {
      .Footer-module_bottomSheet__XnX4f .Footer-module_shareButton__cHprS {
        width: 230px;
        height: 44px
      }
    }

    .Footer-module_bottomSheet__XnX4f .Footer-module_shareText__m7yUa {
      font-family: "nyt-franklin";
      font-size: 16px;
      line-height: 22px;
      letter-spacing: .04em
    }

    .Footer-module_bottomSheet__XnX4f .Footer-module_nextWordle__Bzpb0 {
      font-family: "nyt-franklin";
      font-size: 14px;
      line-height: 20px;
      font-weight: 700
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_bottomSheetContainer__rNfdr {
      display: flex;
      flex-direction: column;
      align-content: center;
      justify-content: center;
      align-items: center
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_buttonContainer__hP4ut {
      display: flex;
      flex-direction: row;
      align-content: center;
      justify-content: space-between
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_shareText__m7yUa, .Footer-module_sbButtonFooter__X3LsB .Footer-module_sbPlayButton__kNigc {
      font: 700 13px "nyt-franklin"
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_mediumText__jHtfj {
      display: none
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_nextWordle__Bzpb0 {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      letter-spacing: .07em;
      margin-bottom: 12px
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_nextWordle__Bzpb0 span {
      margin-right: 4px
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_sbPlayButton__kNigc {
      border: 0;
      background-color: var(--spellingBeeYellow)
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_sbPlayButton__kNigc span {
      color: #121212;
      letter-spacing: normal
    }

    .Footer-module_sbButtonFooter__X3LsB .Footer-module_promoIcon__z2T7Q {
      width: 16px;
      background-size: 100%;
      background-repeat: no-repeat
    }

    @media (min-width: 321px) {
      .Footer-module_sbButtonFooter__X3LsB .Footer-module_sbPlayButton__kNigc {
        font-size: 14px;
        line-height: 18px
      }

      .Footer-module_sbButtonFooter__X3LsB .Footer-module_shareText__m7yUa {
        font: 600 16px/20px "nyt-franklin"
      }

      .Footer-module_sbButtonFooter__X3LsB .Footer-module_mediumText__jHtfj {
        display: block
      }
    }

    .BotLink-module_botLink__uRdNy {
      display: flex;
      box-sizing: border-box;
      width: 100%;
      padding: 16px 0;
      border-top: 1px solid var(--color-tone-9);
      border-bottom: 1px solid var(--color-tone-9);
      text-decoration: none;
      color: inherit
    }

    @media (min-width: 500px) {
      .BotLink-module_botLink__uRdNy {
        padding: 16px 0px;
        width: 343px;
        align-self: center
      }
    }

    .BotLink-module_botLink__uRdNy .BotLink-module_botIcon__fF161 {
      content: var(--wordlebot-walking-icon);
      padding-right: 2px;
      height: 31px;
      width: 31px;
      margin-right: 8px
    }

    .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri {
      display: flex;
      flex-direction: column;
      flex-grow: 1
    }

    .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p {
      font: 700 14px/17.5px "nyt-franklin";
      margin: 0
    }

    .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p span {
      font-weight: 400;
      text-decoration: underline
    }

    @media (max-height: 548px) {
      .driveToMore .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p {
        font-size: 13px
      }
    }

    .BotLink-module_botLink__uRdNy .BotLink-module_mobileOnly__XMO4b {
      display: block
    }

    @media (min-width: 500px) {
      .BotLink-module_botLink__uRdNy .BotLink-module_mobileOnly__XMO4b {
        display: none
      }
    }

    .RegiwallPrompt-module_flexContainer__kQLQ3 {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .RegiwallPrompt-module_expandToRow__d8iMO {
    }

    @media (min-width: 444px) {
      .RegiwallPrompt-module_expandToRow__d8iMO {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .RegiwallPrompt-module_mobileColumn__ralDy {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .RegiwallPrompt-module_visually-hidden__krkC5 {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .RegiwallPrompt-module_flexCenter__uO4pd {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap
    }

    .RegiwallPrompt-module_regiwallText__sKAdI {
      letter-spacing: 0;
      text-transform: none;
      text-align: center;
      display: block
    }

    .RegiwallPrompt-module_regiwallText_heading__NVhzp {
      font: 700 36px nyt-karnakcondensed, Georgia;
      line-height: 115%;
      margin: 8px 0
    }

    .RegiwallPrompt-module_regiwallText_heading_condensed__D4F3u {
      font: 400 28px nyt-karnak, Georgia;
      line-height: 115%;
      margin: .5em 0
    }

    @media (max-height: 548px) {
      .driveToMore .RegiwallPrompt-module_regiwallText_heading_condensed__D4F3u {
        margin: .25em
      }
    }

    @media (min-width: 768px)and (max-width: 1025px) {
      .RegiwallPrompt-module_regiwallText_heading_condensed__D4F3u {
        font-size: 32px
      }
    }

    @media (min-width: 1025px) {
      .RegiwallPrompt-module_regiwallText_heading_condensed__D4F3u {
        font-size: 36px
      }
    }

    .RegiwallPrompt-module_regiwallText_subheading__deF_s {
      font: 400 24px nyt-karnak, Georgia;
      line-height: 120%
    }

    .RegiwallPrompt-module_regiwallText_link__S_3Z6 {
      color: var(--color-tone-1);
      font: 600 16px nyt-franklin, Arial;
      line-height: 20.8px;
      text-decoration: underline
    }

    .RegiwallPrompt-module_flexContainer__kQLQ3 {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .RegiwallPrompt-module_expandToRow__d8iMO {
    }

    @media (min-width: 444px) {
      .RegiwallPrompt-module_expandToRow__d8iMO {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .RegiwallPrompt-module_mobileColumn__ralDy {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .RegiwallPrompt-module_visually-hidden__krkC5 {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .RegiwallPrompt-module_parentContainer__liHHb {
      width: 312px;
      display: flex;
      flex-direction: column
    }

    .RegiwallPrompt-module_regiButton__uaOG2 {
      position: relative;
      border: none;
      height: 3em;
      border-radius: 1.5em;
      align-content: center;
      letter-spacing: .05em;
      font-size: 16px;
      font-family: "nyt-franklin";
      line-height: 28px;
      cursor: pointer;
      padding: 0 2em;
      font-weight: 600;
      color: var(--color-tone-7);
      background-color: var(--color-tone-1);
      margin: 1.25em 0 1.25em 0
    }

    .RegiwallPrompt-module_regiButtonContainer__g7g5M {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column-reverse;
      box-sizing: border-box;
      width: 100%
    }

    .RegiwallPrompt-module_loginButton__R6IJg {
      background: none;
      border: none;
      cursor: pointer
    }

    .RegiwallPrompt-module_bot__ddO9Q {
      margin-top: 2.5em;
      width: 110%
    }

    @media (max-height: 548px) {
      .driveToMore .RegiwallPrompt-module_bot__ddO9Q {
        margin-top: 1em
      }
    }

    .HardModeAwareness-module_hardModeText__Q6Rax {
      padding: 40px
    }

    @media (max-width: 500px) {
      .HardModeAwareness-module_hardModeText__Q6Rax {
        padding: 32px
      }
    }

    .HardModeAwareness-module_instructions__wSWO4 {
      font-family: "nyt-franklin";
      font-weight: 300;
      font-size: 24px;
      line-height: 30px;
      margin-bottom: 28px
    }

    .HardModeAwareness-module_settingsButton__DGkRg {
      cursor: pointer;
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      line-height: 18px;
      border: 1px solid;
      border-radius: 16px;
      padding: 6px 17px 7px;
      background-color: rgba(0, 0, 0, 0);
      color: var(--color-tone-1);
      border-color: var(--color-tone-1)
    }

    .HardModeAwareness-module_settingsButton__DGkRg svg {
      width: 12px;
      height: 12px;
      margin: 1px 0 0 5px;
      display: inline-block
    }

    #hardModeAwareness-dialog > div:first-child {
      padding: 0;
      max-width: 440px
    }

    @media (max-width: 500px) {
      #hardModeAwareness-dialog > div:first-child {
        width: 90%;
        height: auto;
        min-height: unset;
        align-self: center
      }
    }

    @media (max-width: 500px) {
      .HardModeAwareness-module_instructions__wSWO4 {
        font-size: 20px;
        line-height: 24px;
        margin-bottom: 18px
      }
    }

    .ActivationRegiModal-module_regiModalContainer__YtnuA {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: 16px
    }

    .ActivationRegiModal-module_copyContainer__sveqD {
      max-width: 260px;
      margin-top: 35px
    }

    .ActivationRegiModal-module_copyContainer__sveqD .ActivationRegiModal-module_copyHeader__LnHo5 {
      font-size: 16px;
      line-height: 20px;
      font-weight: 700;
      margin-bottom: 14px
    }

    .ActivationRegiModal-module_copyContainer__sveqD .ActivationRegiModal-module_copyBody__Lpr_0 {
      font-size: 14px;
      line-height: 18px;
      font-weight: 400
    }

    .ActivationRegiModal-module_loginLink__qqJOJ {
      background-color: var(--color-tone-1);
      color: var(--color-tone-7);
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      line-height: 14px;
      box-sizing: border-box;
      border: 3px solid var(--color-tone-1);
      border-radius: 55px;
      align-items: center;
      text-align: center;
      letter-spacing: .04em;
      text-decoration: none;
      padding: 14px 5px;
      margin: 40px 0 24px;
      max-width: 340px;
      width: 100%
    }

    .ActivationRegiModal-module_loginLink__qqJOJ > a {
      color: inherit;
      text-decoration: none
    }

    .ActivationRegiModal-module_statsIcon__E2E2U {
      height: 148px;
      width: 148px
    }

    .driveToMore {
      display: flex;
      align-items: center;
      font-family: "nyt-franklin";
      width: 100%;
      flex-direction: column
    }

    .driveToMore::-webkit-scrollbar {
      display: none
    }

    .driveToMore .DriveToMoreContent-module_bottom__v8mPw {
      width: 100%
    }

    @media (min-height: 548px) {
      .driveToMore .DriveToMoreContent-module_bottom__v8mPw {
        margin-bottom: 20px
      }
    }

    .pz-desktop .driveToMore .DriveToMoreContent-module_bottom__v8mPw {
      max-width: 693px
    }

    .driveToMore h4 {
      font: 700 0.6875rem/0.859375rem "nyt-franklin";
      letter-spacing: .05em;
      border-top: solid 2px var(--color-tone-1);
      padding-top: 10px;
      margin: 0 auto 18px;
      width: calc(100% - 50px);
      display: none
    }

    @media (min-height: 548px) {
      .driveToMore h4 {
        display: block
      }
    }

    @media (min-width: 768px) {
      .driveToMore h4 {
        width: calc(100% - 100px)
      }
    }

    .driveToMore .DriveToMoreContent-module_fitContent__h6S25 {
      margin: auto
    }

    @media (min-width: 768px) {

      .driveToMore .DriveToMoreContent-module_fitContent__h6S25 h4 {
        width: 100%
      }
    }

    .driveToMore .DriveToMoreContent-module_fitContentGrid__TDzaq h4 {
      width: auto
    }

    .driveToMore .DriveToMoreContent-module_sb___maFR {
      background-color: var(--spellingBeeYellow)
    }

    .driveToMore .DriveToMoreContent-module_sb___maFR .DriveToMoreContent-module_icon__p5Ui4 {
      background-image: var(--spelling-bee-np)
    }

    .driveToMore .DriveToMoreContent-module_mini__Of3jv {
      background-color: var(--miniCrosswordBlue)
    }

    .driveToMore .DriveToMoreContent-module_mini__Of3jv .DriveToMoreContent-module_icon__p5Ui4 {
      background-image: var(--mini-np)
    }

    .driveToMore .DriveToMoreContent-module_connections__MMX1o {
      background-color: var(--connectionsPeriwinkle)
    }

    .driveToMore .DriveToMoreContent-module_connections__MMX1o .DriveToMoreContent-module_icon__p5Ui4 {
      background-image: var(--connections-np)
    }

    .driveToMore .DriveToMoreContent-module_sudoku__lqOay {
      background-color: var(--sudoku-orange)
    }

    .driveToMore .DriveToMoreContent-module_sudoku__lqOay .DriveToMoreContent-module_icon__p5Ui4 {
      background-image: var(--sudoku-np)
    }

    .driveToMore .DriveToMoreContent-module_tiles__sshIx {
      background-color: var(--tiles-green)
    }

    .driveToMore .DriveToMoreContent-module_tiles__sshIx .DriveToMoreContent-module_icon__p5Ui4 {
      background-image: var(--tiles-np)
    }

    .driveToMore .DriveToMoreContent-module_crossword__AAvxe {
      background-color: var(--dailyCrosswordBlue)
    }

    .driveToMore .DriveToMoreContent-module_crossword__AAvxe .DriveToMoreContent-module_icon__p5Ui4 {
      background-image: var(--daily-np)
    }

    .driveToMore .DriveToMoreContent-module_carouselContainer__buFnq {
      display: flex;
      flex-flow: row;
      overflow-x: scroll;
      scroll-snap-type: x mandatory;
      width: 100%;
      margin-bottom: 15px
    }

    .driveToMore .DriveToMoreContent-module_carouselContainer__buFnq::-webkit-scrollbar {
      display: none
    }

    @media (min-height: 548px) {
      .driveToMore .DriveToMoreContent-module_carouselContainer__buFnq {
        margin-bottom: 30px
      }
    }

    @media (min-width: 768px) {
      .driveToMore .DriveToMoreContent-module_carouselContainer__buFnq {
        width: auto;
        margin: auto
      }
    }

    .driveToMore .DriveToMoreContent-module_gridContainer__vWpCc:after {
      content: ""
    }

    .pz-desktop .driveToMore .DriveToMoreContent-module_gridContainer__vWpCc:after {
      display: none
    }


    @media (min-width: 768px) {
      .driveToMore .DriveToMoreContent-module_gridContainer__vWpCc:after {
        display: none
      }
    }

    .driveToMore .DriveToMoreContent-module_gridContainer__vWpCc.DriveToMoreContent-module_gamesStack__pnYB2:after {
      display: none
    }

    .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW {
      height: 91px;
      scroll-snap-align: center;
      width: 100%
    }

    @media (min-height: 548px) {
      .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW {
        height: 123px;
        flex: 0 0 123px
      }
    }

    @media (min-width: 768px) {
      .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW {
        height: 100%;
        width: 100%
      }
    }

    .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku {
      border-radius: .5rem;
      color: #121212;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      text-align: center
    }

    .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW .DriveToMoreContent-module_icon__p5Ui4, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku .DriveToMoreContent-module_icon__p5Ui4 {
      background-size: contain;
      background-repeat: no-repeat
    }

    .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW .DriveToMoreContent-module_icon__p5Ui4 {
      width: 28px;
      height: 28px
    }

    @media (min-width: 768px) {
      .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW .DriveToMoreContent-module_icon__p5Ui4 {
        width: 25px;
        height: 25px
      }
    }

    .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku .DriveToMoreContent-module_icon__p5Ui4 {
      width: 25px;
      height: 25px
    }

    .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
      font: 700 0.875rem/1.1875rem "nyt-karnakcondensed";
      margin: 5px 0 2px
    }

    @media (min-height: 548px) {
      .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
        font-size: 1rem
      }
    }

    @media (min-width: 768px) {
      .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
        font-size: 1rem
      }
    }

    .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
      font: 500 0.75rem/1rem "nyt-franklin"
    }

    @media (min-height: 548px) {
      .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
        font-size: 0.875rem;
        line-height: 1.125rem
      }
    }

    @media (min-width: 992px) {
      .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
        font-size: 0.75rem
      }
    }

    .NewsCarousel-module_flexContainer___yphX {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .NewsCarousel-module_expandToRow__zBHIU {
    }

    @media (min-width: 444px) {
      .NewsCarousel-module_expandToRow__zBHIU {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .NewsCarousel-module_mobileColumn__BAz8m {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .NewsCarousel-module_visually-hidden__zhcAQ {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .NewsCarousel-module_carouselContainer__C6Bua {
      display: flex;
      flex-flow: row;
      overflow-x: scroll;
      scroll-snap-type: x mandatory;
      width: 100%;
      margin-top: 8px
    }

    .NewsCarousel-module_carouselContainer__C6Bua::-webkit-scrollbar {
      display: none
    }

    .NewsCarousel-module_carouselGrid__eBW_S::after {
      content: ""
    }

    .NewsCarousel-module_carouselNewsItem__iTjNZ {
      width: 100%;
      min-height: 96px;
      flex-shrink: 0;
      scroll-snap-align: center
    }

    .NewsCarousel-module_carouselNewsItem__iTjNZ p {
      font: 500 0.875rem/1.09375rem nyt-cheltenham, Georgia;
      color: var(--color-tone-1);
      margin-top: 8px
    }

    img {
      width: 100%;
      animation: NewsCarousel-module_fadeIn__XJI1h 500ms
    }

    .NewsCarousel-module_imageBg__kauxU {
      background-color: #ebebeb;
      width: 100%;
      height: 0;
      padding-bottom: 66.6666666667%
    }

    .NewsCarousel-module_desktopCarouselNewsContainer__aXhc3 {
      display: grid;
      grid-auto-columns: 1fr;
      grid-auto-flow: column;
      transition: .3s cubic-bezier(0.49, 0.49, 0.55, 0.95);
      width: 100%
    }

    .NewsCarousel-module_desktopCarouselNewsItem__pjK2M {
      width: 100%
    }

    .NewsCarousel-module_desktopCarouselNewsItem__pjK2M p {
      font: 500 1rem/1.25rem nyt-cheltenham, Georgia;
      color: var(--color-tone-1);
      margin-top: 8px
    }

    .NewsCarousel-module_controlContainer__bltE2 {
      width: 100%;
      position: absolute;
      z-index: 1;
      top: 29%
    }

    .NewsCarousel-module_carouselControl__P2VRs {
      position: absolute;
      background-color: rgba(0, 0, 0, 0);
      height: 26px;
      width: 26px;
      fill: #fff;
      border: 0;
      padding: 0;
      stroke: #121212;
      pointer-events: all;
      cursor: pointer
    }

    .NewsCarousel-module_carouselControl__P2VRs svg {
      width: 100%;
      height: 100%
    }

    .NewsCarousel-module_carouselControl__P2VRs:hover svg {
      fill: #dfdfdf
    }

    .NewsCarousel-module_carouselControl__P2VRs:disabled {
      visibility: hidden
    }

    .NewsCarousel-module_next__CFPgU {
      right: calc(-26px / 2)
    }

    .NewsCarousel-module_previous__rNe9O {
      left: calc(-26px / 2);
      transform: rotate(180deg)
    }

    .Switch-module_container__PO0Ll {
      display: flex;
      justify-content: space-between
    }

    .Switch-module_switch__isHE_ {
      height: 20px;
      width: 32px;
      background: var(--color-tone-3);
      border: none;
      border-radius: 999px;
      display: block;
      position: relative;
      cursor: pointer
    }

    .Switch-module_disabled__I6C9c {
      opacity: .5;
      cursor: not-allowed
    }

    .Switch-module_knob__B3HtC {
      display: block;
      position: absolute;
      left: 2px;
      top: 2px;
      height: calc(100% - 4px);
      width: 50%;
      border-radius: 8px;
      background: var(--white);
      transform: translateX(0);
      transition: transform .3s
    }

    .Switch-module_checked__R4Ixx .Switch-module_switch__isHE_ {
      background: var(--color-correct)
    }

    .Switch-module_checked__R4Ixx .Switch-module_knob__B3HtC {
      transform: translateX(calc(100% - 4px))
    }

    .Settings-module_setting__EaMz6 a, .Settings-module_setting__EaMz6 a:visited {
      color: var(--color-tone-8);
      text-decoration: underline
    }

    .Settings-module_title__NWAOC {
      font-size: 18px
    }

    .Settings-module_text__l3Wz3 {
      padding-right: 8px
    }

    a.Settings-module_feedbackLink__xHvaM {
      text-decoration: underline
    }

    .Settings-module_description__m0Tpo {
      font-size: 12px;
      color: var(--color-tone-12)
    }

    .Settings-module_footnote__TOUR0 {
      padding-top: 16px;
      color: var(--color-tone-12);
      font-size: 12px;
      text-align: right;
      display: flex;
      justify-content: space-between;
      align-items: flex-end
    }

    .Settings-module_container__utVKC {
      flex: 1
    }

    @media (min-width: 501px) {
      .Settings-module_footnote__TOUR0 {
        padding-bottom: 16px
      }
    }

    @media only screen and (min-device-width: 320px)and (max-device-width: 480px) {
      .Settings-module_setting__EaMz6 {
        padding: 16px
      }
    }

    .LoginPrompt-module_flexContainer__hNNau {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .LoginPrompt-module_expandToRow__BR9Qn {
    }

    @media (min-width: 444px) {
      .LoginPrompt-module_expandToRow__BR9Qn {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .LoginPrompt-module_mobileColumn__XfvZp {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .LoginPrompt-module_visually-hidden__BsBEE {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .LoginPrompt-module_flexCenter__pzLCi {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap
    }

    .LoginPrompt-module_regiwallText__LYKvu {
      letter-spacing: 0;
      text-transform: none;
      text-align: center;
      display: block
    }

    .LoginPrompt-module_regiwallText_heading__FtdSV {
      font: 700 36px nyt-karnakcondensed, Georgia;
      line-height: 115%;
      margin: 8px 0
    }

    .LoginPrompt-module_regiwallText_heading_condensed__vx_V3, .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_heading__CdJSh {
      font: 400 28px nyt-karnak, Georgia;
      line-height: 115%;
      margin: .5em 0
    }

    @media (max-height: 548px) {
      .driveToMore .LoginPrompt-module_regiwallText_heading_condensed__vx_V3, .driveToMore .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_heading__CdJSh, .LoginPrompt-module_cta__mvqcL .driveToMore .LoginPrompt-module_heading__CdJSh {
        margin: .25em
      }
    }

    @media (min-width: 768px)and (max-width: 1025px) {
      .LoginPrompt-module_regiwallText_heading_condensed__vx_V3, .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_heading__CdJSh {
        font-size: 32px
      }
    }

    @media (min-width: 1025px) {
      .LoginPrompt-module_regiwallText_heading_condensed__vx_V3, .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_heading__CdJSh {
        font-size: 36px
      }
    }

    .LoginPrompt-module_regiwallText_subheading__OZCWi {
      font: 400 24px nyt-karnak, Georgia;
      line-height: 120%
    }

    .LoginPrompt-module_regiwallText_link__RI4mW {
      color: var(--color-tone-1);
      font: 600 16px nyt-franklin, Arial;
      line-height: 20.8px;
      text-decoration: underline
    }

    .LoginPrompt-module_parent___ZoZ4 {
      max-width: 520px;
      display: flex;
      flex-direction: column;
      margin: auto
    }

    .LoginPrompt-module_icon__ecPL6 {
      width: 56px;
      height: 56px;
      margin-bottom: unset !important;
      background-image: var(--wordle-icon);
      background-size: cover;
      background-repeat: no-repeat
    }

    .LoginPrompt-module_cta__mvqcL {
      letter-spacing: 0;
      text-transform: none;
      text-align: center;
      display: flex;
      flex-direction: column
    }

    .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_heading__CdJSh {
      width: 400px
    }

    @media (min-width: 768px)and (max-width: 1025px) {
      .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_heading__CdJSh {
        width: 470px
      }
    }

    @media (min-width: 1025px) {
      .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_heading__CdJSh {
        width: 470px
      }
    }

    .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_subheading__ajwOT {
      font: 300 20px "nyt-franklin";
      line-height: 120%;
      width: 320px
    }

    @media (min-width: 768px)and (max-width: 1025px) {
      .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_subheading__ajwOT {
        font-size: 24px;
        width: 390px
      }
    }

    @media (min-width: 1025px) {
      .LoginPrompt-module_cta__mvqcL .LoginPrompt-module_subheading__ajwOT {
        font-size: 24px;
        width: 420px
      }
    }

    .Modal-module_modalOverlay__cdZDa {
      display: flex;
      position: fixed;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      padding: 0;
      border: none;
      justify-content: center;
      align-items: center;
      background-color: var(--opacity-50);
      z-index: var(--modal-z-index)
    }

    .Modal-module_content__TrPIX {
      position: relative;
      border-radius: 8px;
      border: 1px solid var(--color-tone-6);
      background-color: var(--modal-content-bg);
      color: var(--color-tone-1);
      box-shadow: 0 4px 23px 0 rgba(0, 0, 0, .2);
      width: 90%;
      max-height: 100%;
      overflow-y: auto;
      animation: Modal-module_SlideIn__BF5gw 200ms;
      max-width: var(--game-max-width);
      box-sizing: border-box
    }

    .Modal-module_content__TrPIX:focus {
      outline: none
    }

    .Modal-module_content__TrPIX.Modal-module_testExtraWidth__Dptic {
      max-width: 520px
    }

    .Modal-module_content__TrPIX.Modal-module_testExtraWidth__Dptic.Modal-module_fullscreenStats__dzhYf {
      height: 100%;
      max-width: 100%;
      width: 100%
    }

    .driveToMore.Modal-module_content__TrPIX {
      border-radius: 0
    }

    .Modal-module_topWrapper__MvEd5 {
      padding: 16px;
      width: 100%;
      box-sizing: border-box
    }

    @media (max-height: 548px) {
      .driveToMore .Modal-module_topWrapper__MvEd5 {
        padding-top: 0;
        padding-bottom: 0
      }
    }

    .Modal-module_paddingTop__xhWdR {
      padding-top: 30px;
      height: calc(100% - 30px)
    }

    .Modal-module_extraPadding__XGzkT {
      padding: 32px
    }

    .Modal-module_content__TrPIX.Modal-module_closing__Ly9iT {
      animation: Modal-module_SlideOut__cmGvu 200ms
    }

    .Modal-module_fullscreenStatsExit__DpWAs {
      width: 100%;
      display: flex;
      justify-content: center
    }

    .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr {
      display: flex;
      justify-content: flex-end;
      width: 100%;
      padding-top: 24px;
      padding-right: 16px
    }

    @media (min-width: 500px) {
      .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr {
        padding-top: 36px;
        padding-right: 36px
      }
    }

    @media (min-width: 770px) {
      .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr {
        max-width: 520px;
        padding-right: 0
      }
    }

    .pz-desktop .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr {
      padding-top: 75px
    }

    .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr .Modal-module_closeIconButton__y9b6c {
      background: none;
      border: none;
      position: relative;
      padding: 0;
      cursor: pointer;
      width: 27px;
      height: 27px
    }

    @media (min-width: 500px) {
      .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr .Modal-module_closeIconButton__y9b6c {
        width: 30px;
        height: 30px
      }
    }

    .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr .Modal-module_closeIconButton__y9b6c svg {
      width: 100%;
      height: auto
    }

    .Modal-module_closeIcon__TcEKb {
      background: none;
      border: none;
      padding: 0;
      width: 27px;
      height: 27px;
      position: absolute;
      top: 16px;
      right: 16px;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      cursor: pointer
    }

    @media (min-width: 500px) {
      .Modal-module_closeIcon__TcEKb {
        width: 30px;
        height: 30px
      }
    }

    .Modal-module_closeIcon__TcEKb svg {
      width: 100%;
      height: auto
    }

    .Modal-module_heading__u2uxI {
      font-family: "nyt-franklin";
      font-weight: 700;
      font-size: 16px;
      letter-spacing: .5px;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 15px;
      margin-top: 0px;
      display: block
    }

    .Modal-module_newHeading__Ah45w {
      font-family: "nyt-karnakcondensed";
      font-weight: 700;
      font-size: 28px;
      letter-spacing: 0;
      line-height: 30px;
      text-transform: none;
      text-align: left;
      margin-bottom: 4px;
      margin-top: 29px;
      display: block
    }

    .Modal-module_flexContainer__avPDp {
      display: flex;
      flex-direction: column
    }

    @media (max-width: 500px) {
      .Modal-module_modalOverlay__cdZDa {
        align-items: flex-end
      }

      .Modal-module_content__TrPIX {
        min-height: 70%;
        width: 100%
      }

      .Modal-module_content__TrPIX.Modal-module_testNoMinHeight__w7_BF {
        min-height: initial
      }

      .Modal-module_content__TrPIX.Modal-module_shortStatsModal__JqZJK {
        min-height: unset;
        width: 100%;
        padding-bottom: 20px
      }

      .Modal-module_paddingTop__xhWdR .Modal-module_content__TrPIX {
        height: 100%
      }
    }

    .Modal-module_content__TrPIX.Modal-module_noPadding__O80OB {
      padding: 0
    }

    .Nav-module_container__OHjbB {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      min-height: 100%
    }

    .Nav-module_container__OHjbB a.Nav-module_navLink__zndY2 {
      text-decoration: none;
      color: inherit;
      display: block
    }

    .Nav-module_container__OHjbB hr {
      border: 0;
      border-top: 1px solid #dcdcdc;
      width: calc(100% - 36px)
    }

    .Nav-module_gameList__IkaW6, .Nav-module_nytList__rVjMX {
      list-style: none;
      color: var(--color-tone-1);
      padding: unset;
      margin: unset
    }

    .Nav-module_nytList__rVjMX {
      margin-top: 5px
    }

    .Nav-module_navItem__khSKK {
      display: flex;
      justify-content: left;
      align-items: flex-start;
      font-family: "nyt-franklin-500";
      font-size: 16px;
      line-height: 1.3em;
      padding: 8px 0 8px 18px;
      --hover-color: var(--color-nav-hover)
    }

    .Nav-module_navItem__khSKK .Nav-module_navDescription__UGPPw {
      max-width: 280px
    }

    .Nav-module_navItem__khSKK:hover {
      background-color: var(--hover-color)
    }

    .Nav-module_navHeader__JaDrY {
      padding-top: 18px;
      padding-left: 18px
    }

    .Nav-module_moreText__Jg_7K {
      font-family: "nyt-franklin";
      font-weight: 700;
      text-transform: uppercase;
      font-size: 12px;
      line-height: 12px;
      margin: 32px 0px 24px 0px;
      padding-left: 18px
    }

    .Nav-module_privacy__T32_r, .Nav-module_privacyStatic__cQ4AX {
      letter-spacing: .5px;
      font-family: "nyt-franklin-500";
      color: var(--color-tone-1);
      text-align: left;
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-size: 12px
    }

    .Nav-module_privacyItem__tSFYv {
      height: 40px;
      display: flex;
      justify-content: left;
      align-items: center;
      color: var(--color-tone-1);
      padding-left: 18px;
      text-decoration: underline
    }

    .Nav-module_ccpaIcon__q6Ohg {
      width: 25px;
      height: 12px;
      background: var(--california-privacy-icon) 0 0/cover no-repeat;
      margin-right: 4px
    }

    .Nav-module_privacyStatic__cQ4AX {
      position: static
    }

    .NavAccount-module_navLoggedIn__DU0tY, .NavAccount-module_navLoggedOut__L52sW {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-evenly;
      flex-wrap: nowrap;
      padding: 8px
    }

    .NavAccount-module_navLoggedOut__L52sW {
      padding: 16px
    }

    .NavAccount-module_navDrawerHeading__kKsMu {
      font-family: "nyt-franklin";
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .75px;
      line-height: 14px;
      display: block;
      padding: 0px 10px;
      -webkit-margin-before: 1.33em;
      margin-block-start: 1.33em;
      -webkit-margin-after: 1.33em;
      margin-block-end: 1.33em;
      -webkit-margin-start: 0px;
      margin-inline-start: 0px;
      -webkit-margin-end: 0px;
      margin-inline-end: 0px
    }

    .NavAccount-module_navProfileAccount__cyEAP {
      padding: 5px
    }

    .NavAccount-module_navButton__UTgBV, .NavAccount-module_logoutButton__Xiu49, .NavAccount-module_subscribeButton__F3y0Z, .NavAccount-module_loginButton__p4LNv {
      display: flex;
      flex-direction: column;
      flex: 1;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      font-family: "nyt-franklin";
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .047em;
      text-transform: uppercase;
      height: 36px;
      border: 1px solid #f4f4f4;
      border-radius: 3px;
      color: #fff;
      background-color: #000;
      padding: 1px 33px 0;
      cursor: pointer;
      text-decoration: none
    }

    a + .NavAccount-module_navButton__UTgBV, a + .NavAccount-module_logoutButton__Xiu49, a + .NavAccount-module_subscribeButton__F3y0Z, a + .NavAccount-module_loginButton__p4LNv {
      margin-left: 8px
    }

    .NavAccount-module_navDrawerLink__RNbG5 {
      font-family: "nyt-franklin";
      display: block;
      height: 40px;
      line-height: 40px;
      font-size: 15px;
      letter-spacing: .5px;
      border-left: 4px solid rgba(0, 0, 0, 0);
      padding: 0 16px 0 8px;
      text-decoration: none;
      color: inherit
    }

    .NavAccount-module_navDrawerLink__RNbG5:hover {
      background-color: var(--color-nav-hover)
    }

    .NavAccount-module_loginButton__p4LNv {
      color: #000;
      border-color: #000;
      background-color: #fff
    }

    .NavAccount-module_loginButton__p4LNv:hover {
      color: #fff;
      background-color: #000
    }

    .NavAccount-module_subscribeButton__F3y0Z {
      color: #fff;
      background-color: #000
    }

    .NavAccount-module_subscribeGamesSale__OSUGb {
      padding: 1px 10px 0;
      white-space: nowrap
    }

    .NavAccount-module_subscribeButton__F3y0Z:hover {
      background-color: #797987;
      border: none
    }

    .NavAccount-module_logoutButton__Xiu49 {
      color: var(--color-tone-1);
      background-color: var(--color-tone-7);
      border: 1px solid var(--color-tone-1);
      border-radius: 3px
    }

    .NavAccount-module_logoutButton__Xiu49:hover {
      background-color: #ebebeb;
      color: var(--black)
    }

    .NavAccount-module_navGamesSale__sZGtR {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-evenly;
      flex-wrap: nowrap;
      padding: 0 8px 8px
    }

    .NavAccount-module_navGamesSale__sZGtR .NavAccount-module_logoutButton__Xiu49 {
      margin-left: 8px
    }

    .NavAccount-module_subscribeGamesSale__OSUGb {
      padding: 1px 10px 0;
      letter-spacing: .2px;
      margin: 0 4px
    }

    .NavAccount-module_subscribeGamesSale__OSUGb:hover {
      border: 1px solid var(--color-tone-1)
    }

    .NavIcon-module_burgerSvg__j9Cig {
      width: 20px
    }

    @media (min-width: 1024px) {
      .NavIcon-module_burgerSvg__j9Cig {
        width: 24px
      }
    }

    .AppHeader-module_appHeader__Jn4R7 {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: nowrap;
      padding: 0px var(--header-padding-x);
      height: var(--header-height);
      color: var(--color-tone-1);
      border-bottom: 1px solid var(--color-tone-4)
    }

    .AppHeader-module_appHeader__Jn4R7 button {
      cursor: pointer
    }

    .AppHeader-module_appHeader__Jn4R7 button.AppHeader-module_icon__qLz07 {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0 4px
    }

    .AppHeader-module_appHeader__Jn4R7 button.AppHeader-module_icon__qLz07:last-child {
      padding-right: 0
    }

    .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_subscribeLink__VBUGi {
      display: flex;
      align-items: center;
      justify-content: center;
      font: 12px/18px "nyt-franklin-600";
      color: var(--color-tone-1);
      border: solid 1px var(--color-tone-1);
      border-radius: 9999px;
      min-height: 29px;
      padding: 0 16px;
      background-color: var(--color-tone-7)
    }

    @media (min-width: 400px) {
      .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_subscribeLink__VBUGi {
        margin-left: 10px;
        padding: 0 22px
      }
    }

    @media (min-width: 1024px) {
      .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_subscribeLink__VBUGi {
        font: 14px/21px "nyt-franklin-600";
        margin-left: 30px;
        padding: 0 25px;
        min-height: 35px
      }
    }

    .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_title__EQr6V {
      flex-grow: 2;
      font-family: "nyt-karnakcondensed";
      font-weight: 700;
      font-size: 28px;
      letter-spacing: .01em;
      text-align: left;
      left: 0;
      right: 0;
      pointer-events: none;
      position: relative
    }

    .AppHeader-module_menuLeft__q6t_Z {
      display: flex;
      margin: 0;
      padding: 0;
      align-items: center;
      justify-content: flex-start
    }

    .AppHeader-module_menuRight__Noasd {
      display: flex;
      justify-content: flex-end
    }

    .AppHeader-module_menuRight__Noasd button svg {
      vertical-align: middle
    }

    @media (max-width: 499px) {
      .pz-web .AppHeader-module_menuRight__Noasd.AppHeader-module_longTextVariant__guJaD svg {
        width: 20px
      }
    }

    #AppHeader-module_navButton__nKv2h {
      padding-top: 2px;
      padding-left: 0px;
      padding-right: 8px
    }

    @media (min-width: 1024px) {
      .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_title__EQr6V {
        text-align: center;
        font-size: 36px
      }

      .AppHeader-module_appHeader__Jn4R7 button.AppHeader-module_icon__qLz07 {
        padding: 0 6px
      }
    }

    @media (min-width: 768px) {
      .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_title__EQr6V {
        text-align: center;
        font-size: 32px
      }

      .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_menuLeft__q6t_Z, .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_menuRight__Noasd {
        width: 350px
      }
    }

    @media (min-width: 768px)and (min-width: 1024px) {
      .AppHeader-module_appHeader__Jn4R7 .AppHeader-module_title__EQr6V {
        font-size: 36px
      }
    }

    @media (min-width: 768px) {
      #AppHeader-module_navButton__nKv2h {
        padding-top: 2px;
        padding-left: 0px
      }
    }

    .NavModal-module_overlayNav__EewdW {
      display: flex;
      flex-direction: column;
      justify-content: left;
      align-items: unset;
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      z-index: var(--modal-z-index);
      background-color: rgba(0, 0, 0, 0)
    }

    .NavModal-module_overlayNav__EewdW:focus {
      outline: none
    }

    .NavModal-module_contentNav__gdDZp {
      position: relative;
      border: 1px solid var(--color-tone-6);
      background-color: var(--modal-content-bg);
      color: var(--color-tone-1);
      overflow-y: auto;
      animation: NavModal-module_SlideRight__OZJm6 200ms;
      max-width: var(--game-max-width);
      box-sizing: border-box;
      width: 100%;
      border-radius: 0px;
      box-shadow: 3px 5px 5px rgba(0, 0, 0, .15);
      height: calc(100% - var(--header-height) - 1px);
      margin-top: calc(var(--header-height) + 1px);
      padding: 0px
    }

    @media (min-width: 415px) {
      .NavModal-module_contentNav__gdDZp {
        width: 375px
      }
    }

    .NavModal-module_contentNav__gdDZp.NavModal-module_closingNav__vsGdD {
      animation: NavModal-module_SlideLeft__bnLDK 200ms
    }

    .NavModal-module_closeIconNav__P3kl2 {
      background: none;
      border: none;
      padding: 0;
      width: 24px;
      height: 24px;
      position: absolute;
      top: 16px;
      right: 16px;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      cursor: pointer
    }

    .Explainer-module_title__pxagP {
      font-family: "nyt-franklin";
      font-size: 24px;
      font-weight: 700;
      line-height: 28px;
      letter-spacing: 0em;
      text-align: left;
      margin-left: 10px;
      color: var(--color-tone-1)
    }

    .Explainer-module_containerLink__Eahjg {
      padding: 30px
    }

    .Explainer-module_containerLink__Eahjg p:last-child {
      font-weight: 700
    }

    .Explainer-module_containerProblems__YkeXK {
      padding: 30px
    }

    .Explainer-module_containerLink__Eahjg, .Explainer-module_containerProblems__YkeXK {
      padding-top: 14px
    }

    .Explainer-module_explainerFooterText__v5jPj {
      margin: 30px;
      padding-top: 30px;
      border-top: 1px solid var(--gray-4);
      font-size: 15px;
      line-height: 130%
    }

    .Explainer-module_text__DosQz {
      font-size: 14px;
      line-height: 130%;
      letter-spacing: .01em;
      text-align: left;
      margin-left: 10px;
      color: var(--color-tone-1)
    }

    .Explainer-module_text__DosQz > a {
      color: var(--inline-links);
      -webkit-text-decoration: underline var(--inline-links);
      text-decoration: underline var(--inline-links)
    }

    .Explainer-module_statsLinkContainer__UwtoZ {
      margin-top: 40px;
      display: flex;
      flex-direction: column
    }

    .Explainer-module_actionButton__QMznh, .Explainer-module_helpButton__Y3kVe, .Explainer-module_loginButton__ndryx {
      height: 44px;
      border-radius: 104px;
      box-sizing: border-box;
      text-decoration: none;
      font-weight: 600;
      line-height: 14px;
      font-size: 14px;
      text-align: center;
      padding: 0 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: .05em;
      cursor: pointer
    }

    .Explainer-module_actionButton__QMznh:last-child, .Explainer-module_helpButton__Y3kVe:last-child, .Explainer-module_loginButton__ndryx:last-child {
      margin-top: 14px
    }

    .Explainer-module_loginButton__ndryx {
      background: var(--color-tone-1);
      color: var(--color-tone-7)
    }

    .Explainer-module_helpButton__Y3kVe {
      background: var(--color-tone-7);
      color: var(--color-tone-1);
      border: 1px solid var(--color-tone-1)
    }

    .Explainer-module_gamesIcon___J53J {
      width: 95px;
      height: 18px
    }

    .Explainer-module_headerNew__y8y2y {
      padding: 15px 0px
    }

    .Explainer-module_headerNew__y8y2y > p {
      text-align: center;
      margin: 10px 0px
    }

    .Explainer-module_close__wTSom {
      background: none;
      color: inherit;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
      outline: inherit;
      position: absolute;
      right: 0;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      cursor: pointer;
      margin: 0;
      margin-right: 30px
    }

    .Page-module_page__Py6Ys {
      display: flex;
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      justify-content: center;
      background-color: var(--color-background);
      animation: Page-module_SlideIn__AgM2I 100ms linear;
      z-index: var(--page-z-index)
    }

    .Page-module_page__Py6Ys.Page-module_closing__YdTL_ {
      animation: Page-module_SlideOut__Kn9ZJ 150ms linear
    }

    .Page-module_page__Py6Ys header {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative
    }

    .Page-module_page__Py6Ys h1 {
      font-weight: 700;
      font-size: 16px;
      letter-spacing: .5px;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 10px
    }

    .Page-module_pageNew__DnZEs {
      position: absolute;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      top: 0;
      left: 0;
      justify-content: center;
      background-color: var(--color-background);
      animation: Page-module_SlideIn__AgM2I 100ms linear;
      z-index: var(--page-z-index);
      overflow-y: auto;
      display: flex
    }

    .Page-module_pageNew__DnZEs .Page-module_gamesIcon__LZrZ6 {
      width: 95px;
      height: 18px
    }

    .Page-module_pageNew__DnZEs .Page-module_close__woWx7 {
      margin-right: 30px
    }

    .Page-module_pageNew__DnZEs.Page-module_closing__YdTL_ {
      animation: Page-module_SlideOut__Kn9ZJ 150ms linear
    }

    .Page-module_pageNew__DnZEs.Page-module_noDarkMode__g_QCc {
      background-color: var(--white);
      color: #000
    }

    .Page-module_pageNew__DnZEs.Page-module_noDarkMode__g_QCc > .Page-module_content__ZZpzo {
      color: #000
    }

    .Page-module_pageFixed__Yu8Dx {
      position: fixed
    }

    .Page-module_headerNew__FQAkL {
      padding: 15px 0px
    }

    .Page-module_headerNew__FQAkL > p {
      text-align: center;
      margin: 10px 0px
    }

    .Page-module_content__ZZpzo {
      position: relative;
      color: var(--color-tone-1);
      padding: 0 32px;
      max-width: var(--game-max-width);
      width: 100%;
      overflow-y: auto;
      height: 100%;
      display: flex;
      flex-direction: column
    }

    .Page-module_contentContainer__DXzS4 {
      height: 100%
    }

    .Page-module_close__woWx7 {
      background: none;
      color: inherit;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
      outline: inherit;
      position: absolute;
      right: 0;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      cursor: pointer;
      margin: 0
    }

    @media only screen and (min-device-width: 320px)and (max-device-width: 480px) {
      .Page-module_content__ZZpzo {
        max-width: 100%;
        padding: 0
      }

      .Page-module_close__woWx7 {
        padding: 0 16px
      }
    }

    .ToastContainer-module_toastContainer__SIgMB {
      position: relative
    }

    #ToastContainer-module_gameToaster__HPkaC {
      z-index: var(--toast-z-index)
    }

    #ToastContainer-module_systemToaster__K3Q61 {
      z-index: var(--system-toast-z-index)
    }

    .Toast-module_flexContainer__UOBGz {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      width: 100%
    }

    .Toast-module_expandToRow__iaMp_ {
    }

    @media (min-width: 444px) {
      .Toast-module_expandToRow__iaMp_ {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: nowrap
      }
    }

    @media (max-width: 991.98px) {
      .Toast-module_mobileColumn__vYBTF {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap
      }
    }

    .Toast-module_visually-hidden__zpIcn {
      clip: rect(0 0 0 0);
      -webkit-clip-path: inset(50%);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px
    }

    .Toast-module_flexCenter__UiW52 {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap
    }

    .Toast-module_regiwallText__BdjzX {
      letter-spacing: 0;
      text-transform: none;
      text-align: center;
      display: block
    }

    .Toast-module_regiwallText_heading__LRCi3 {
      font: 700 36px nyt-karnakcondensed, Georgia;
      line-height: 115%;
      margin: 8px 0
    }

    .Toast-module_regiwallText_heading_condensed__yXSJ8 {
      font: 400 28px nyt-karnak, Georgia;
      line-height: 115%;
      margin: .5em 0
    }

    @media (max-height: 548px) {
      .driveToMore .Toast-module_regiwallText_heading_condensed__yXSJ8 {
        margin: .25em
      }
    }

    @media (min-width: 768px)and (max-width: 1025px) {
      .Toast-module_regiwallText_heading_condensed__yXSJ8 {
        font-size: 32px
      }
    }

    @media (min-width: 1025px) {
      .Toast-module_regiwallText_heading_condensed__yXSJ8 {
        font-size: 36px
      }
    }

    .Toast-module_regiwallText_subheading__Hh2EZ {
      font: 400 24px nyt-karnak, Georgia;
      line-height: 120%
    }

    .Toast-module_regiwallText_link__iSu8I {
      color: var(--color-tone-1);
      font: 600 16px nyt-franklin, Arial;
      line-height: 20.8px;
      text-decoration: underline
    }

    .Toast-module_toast__iiVsN {
      font-family: "nyt-franklin";
      position: relative;
      margin: 16px;
      background-color: var(--color-tone-8);
      color: var(--color-tone-7);
      padding: 13px;
      border: none;
      border-radius: 4px;
      opacity: 1;
      transition: opacity 300ms cubic-bezier(0.645, 0.045, 0.355, 1);
      font-weight: 700;
      font-size: 14px;
      line-height: 16px
    }

    .Toast-module_toast_regiwall__oSBNY {
      margin: 0;
      width: 150%;
      transform: translate(-20%, 0);
      text-align: center
    }

    .Toast-module_win__kqUor {
      background-color: var(--color-correct);
      color: var(--tile-text-color)
    }

    .Toast-module_fade__hF7us {
      opacity: 0
    }

    .Error-module_container__qq_q0 {
      display: flex;
      position: absolute;
      width: 100%;
      height: 100%;
      max-height: calc(100% - var(--header-height) - 1px);
      left: 0;
      justify-content: center;
      background-color: var(--error-background);
      animation: Error-module_SlideIn__WlIVo 100ms linear;
      z-index: var(--error-z-index)
    }

    .Error-module_errorContainer__guLQP {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 200px;
      position: relative;
      top: 166px;
      font-family: "nyt-franklin"
    }

    .Error-module_errorText__m3mh6 {
      font-family: "nyt-franklin-400";
      text-align: center;
      margin-top: 40px;
      font-size: 20px;
      line-height: 24px;
      color: var(--color-tone-1)
    }

    .Error-module_errorTilesContainer__V7shi {
      width: 208px;
      display: inline-flex;
      justify-content: space-between
    }

    .Error-module_errorTiles__AE9kN {
      font-weight: 700;
      font-size: 20px;
      line-height: 20px;
      text-align: center;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--white);
      border: 1.27px solid var(--gray-13);
      width: 40px;
      height: 40px;
      box-sizing: border-box
    }

    .Error-module_backButton___ydkt {
      margin-top: 24px;
      border-radius: 24px;
      width: 150px;
      height: 48px;
      font-family: "nyt-franklin-600";
      font-size: 16px;
      line-height: 20px;
      text-align: center;
      background-color: var(--color-tone-1);
      box-shadow: none;
      border: none;
      color: var(--color-tone-7);
      cursor: pointer
    }

    .Error-module_errorBannerContainer__pfK75 {
      background-color: #323232;
      color: #fff;
      font-size: 14px;
      height: auto;
      opacity: 1;
      transition: all .5s ease-in-out;
      position: absolute;
      width: 100%;
      left: 0;
      font-family: "nyt-franklin"
    }

    .Error-module_errorBannerContainer__pfK75 p {
      font-weight: 400;
      margin: 5px 5px 5px 10px
    }

    .Error-module_errorBannerContainer__pfK75 p.Error-module_errorTitle__rS8xm {
      font-weight: 700
    }

    .Error-module_errorBannerContainer__pfK75 .Error-module_close__cXxlX {
      color: #fff;
      font-size: 14px;
      line-height: 17px;
      font-weight: 600;
      cursor: pointer;
      margin: 5px 5px 0px 0px
    }

    .Error-module_errorBannerContainer__pfK75 .Error-module_errorRow__No1ux {
      display: flex;
      justify-content: space-between
    }

    .Error-module_errorBannerContainer__pfK75.Error-module_hideBanner__Q6BVU {
      opacity: 0;
      height: 0
    }

    .Key-module_key__kchQI {
      font-family: "nyt-franklin";
      font-size: 1.25em;
      font-weight: bold;
      border: 0;
      padding: 0;
      margin: 0 6px 0 0;
      height: 58px;
      border-radius: 4px;
      cursor: pointer;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      background-color: var(--key-bg);
      color: var(--key-text-color);
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      text-transform: uppercase;
      -webkit-tap-highlight-color: rgba(0, 0, 0, .3)
    }

    .Key-module_key__kchQI:last-of-type {
      margin: 0
    }

    .Key-module_key__kchQI[data-state=correct] {
      background-color: var(--key-bg-correct);
      color: var(--key-evaluated-text-color)
    }

    .Key-module_key__kchQI[data-state=present] {
      background-color: var(--key-bg-present);
      color: var(--key-evaluated-text-color)
    }

    .Key-module_key__kchQI[data-state=absent] {
      background-color: var(--key-bg-absent);
      color: var(--key-evaluated-text-color-absent)
    }

    .Key-module_key__kchQI.Key-module_fade__dc3AW {
      transition: background-color .1s ease, color .1s ease
    }

    .Key-module_half__HooWu {
      flex: .5
    }

    .Key-module_one__zlfH6 {
      flex: 1
    }

    .Key-module_oneAndAHalf__bq8Tw {
      flex: 1.5;
      font-size: 12px
    }

    .Keyboard-module_keyboard__uYuqf {
      height: var(--keyboard-height);
      margin: 0 8px;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none
    }

    .Keyboard-module_row__ilOKU {
      display: flex;
      width: 100%;
      margin: 0 auto 8px;
      touch-action: manipulation
    }

    .Ad-module_adContainer__ZAFEc {
      border-bottom: 1px solid #e6e6e6;
      box-shadow: inset 0 0 60px -10px rgba(0, 0, 0, .07);
      text-align: center;
      min-height: 300px;
      overflow: hidden;
      position: relative
    }

    .Ad-module_adContainer__ZAFEc > *:first-child {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%)
    }

    .Ad-module_adContainer__ZAFEc:empty {
      border: none
    }

    .Ad-module_hasAdLabel__IXofl:empty:before {
      content: "advertisement";
      color: #bbb;
      font-size: 12px;
      border: 1px solid #ccc;
      padding: 8px 12px;
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%)
    }

    .App-module_gameContainer__K_CBh {
      position: relative
    }

    .App-module_game__yruqo {
      width: 100%;
      max-width: var(--game-max-width);
      margin: 0 auto;
      height: calc(100% - var(--header-height));
      display: flex;
      flex-direction: column
    }

    .pz-offline-ticker {
      position: absolute;
      left: 0;
      width: 100%;
      z-index: 2;
      font-weight: bold
    }

    .pz-offline-ticker svg path {
      fill: var(--white)
    }

    .StatsSelectionTool-module_container__meUAX {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 16px
    }

    .StatsSelectionTool-module_header__oZIc5 {
      padding: 15px 0px;
      display: flex;
      justify-content: center;
      margin-bottom: 32px
    }

    .StatsSelectionTool-module_gamesIcon__spDD2 {
      width: 95px;
      height: 18px
    }

    .StatsSelectionTool-module_form__eOT7F {
      flex: 1;
      display: flex;
      max-width: var(--game-max-width);
      flex-direction: column
    }

    .StatsSelectionTool-module_form__eOT7F fieldset {
      margin-bottom: 40px
    }

    .StatsSelectionTool-module_description__dmLIg {
      font-family: "nyt-franklin-400";
      font-size: 18px;
      line-height: 1.5;
      text-align: center;
      margin-bottom: 1em;
      padding: 0 24px;
      color: var(--color-tone-1)
    }

    .StatsSelectionTool-module_description__dmLIg .StatsSelectionTool-module_bold__zqF2S {
      font-family: "nyt-franklin-600"
    }

    .StatsSelectionTool-module_option___tbeV {
      margin-top: 20px;
      cursor: pointer;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      display: flex;
      flex-direction: column;
      align-items: stretch
    }

    .StatsSelectionTool-module_optionHeader__PN2q0 {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      width: calc(100% - 8px);
      padding: 0 4px;
      color: var(--color-tone-12)
    }

    .StatsSelectionTool-module_optionHeader__PN2q0 .StatsSelectionTool-module_label__HCsqe {
      text-transform: uppercase;
      font-family: "nyt-franklin";
      font-size: 11px;
      font-weight: 800
    }

    .StatsSelectionTool-module_optionHeader__PN2q0 .StatsSelectionTool-module_lastSaved__EBJVD {
      font-family: "nyt-franklin-500";
      font-size: 10px
    }

    .StatsSelectionTool-module_box__KSSH_ {
      background-color: var(--color-tone-6);
      padding: 12px;
      margin: 0 3px;
      outline: 1px solid var(--color-tone-1);
      border-radius: 8px
    }

    .StatsSelectionTool-module_box__KSSH_.StatsSelectionTool-module_selected__UlXC4 {
      outline-width: 3px
    }

    .StatsSelectionTool-module_box__KSSH_.StatsSelectionTool-module_unselected__CmIQE {
      opacity: .4
    }

    .StatsSelectionTool-module_box__KSSH_ .StatsSelectionTool-module_boxTop__Jv24G {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px
    }

    .StatsSelectionTool-module_box__KSSH_ .StatsSelectionTool-module_boxBottom__aFGVF {
      font-family: "nyt-franklin";
      font-size: 12px;
      display: flex;
      justify-content: flex-end;
      color: var(--color-tone-1)
    }

    .StatsSelectionTool-module_box__KSSH_ .StatsSelectionTool-module_boxBottom__aFGVF.StatsSelectionTool-module_incomplete__oy1ka {
      color: var(--warning-red);
      font-weight: bold;
      font-size: 13px
    }

    .StatsSelectionTool-module_radio__aXqLj {
      align-self: flex-start;
      margin-top: 4px;
      margin-left: 4px
    }

    .StatsSelectionTool-module_stats__f99Fo {
      width: 75%;
      color: var(--color-tone-1)
    }

    .StatsSelectionTool-module_buttonContainer__wiJe0 {
      display: flex;
      align-items: center
    }

    .StatsSelectionTool-module_submitButton__yazh7 {
      border: none;
      width: 100%;
      height: 3em;
      border-radius: 1.5em;
      align-content: center;
      letter-spacing: .05em;
      margin: 0 10px 12px;
      background: var(--color-tone-1);
      color: var(--color-tone-7);
      font-size: 16px;
      font-family: "nyt-franklin-600";
      line-height: 28px;
      cursor: pointer;
      padding: 0 2em
    }

    .StatsSelectionTool-module_submitButton__yazh7:disabled {
      background: var(--color-tone-7);
      color: var(--color-tone-1);
      opacity: .4;
      border: 1px solid var(--color-tone-1)
    }

    .StatsSelectionTool-module_back__fZ22v {
      position: absolute;
      display: flex;
      align-items: center;
      height: var(--header-height);
      top: 0;
      left: var(--header-padding-x)
    }

    @media (max-height: 600px) {
      .StatsSelectionTool-module_header__oZIc5 {
        margin-bottom: 8px
      }

      .StatsSelectionTool-module_form__eOT7F fieldset {
        margin-bottom: 16px
      }

      .StatsSelectionTool-module_option___tbeV {
        margin-top: 12px
      }
    }

    /*# sourceMappingURL=62.9d339ad0d09ddf80c92e.css.map*/

  </style>`
const htmlAfterStyle = `
</head>
<body>

<div>
  <div class="MomentSystem-module_moment__G9hyw">
    <div class="App-module_gameContainer__K_CBh" data-testid="game-wrapper" style="height: calc(100% - 210px);">
      <main class="App-module_game__yruqo" id="wordle-app-game">
        <div class="Board-module_boardContainer__TBHNL" style="overflow: unset;">`
