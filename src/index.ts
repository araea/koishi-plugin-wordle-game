// noinspection CssUnresolvedCustomProperty

import {Context, h, Schema} from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import {} from 'koishi-plugin-monetary'
import {} from 'koishi-plugin-markdown-to-image-service'
import {load} from "cheerio";
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

- \`wordleGame.开始 [guessWordLength:number]\`
  - 开始游戏引导，可选参数为猜单词的长度。

- \`wordleGame.开始.经典\`
  - 开始经典猜单词游戏，需要投入货币，赢了有奖励。

- \`wordleGame.开始.CET4/6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL/Lewdle [guessWordLength:number]\`
  - 开始猜不同考试/类别的单词游戏，可选参数为猜单词的长度。
    - \`--hard\`
      - 困难模式，绿色字母必须保特固定，黄色字母必须重复使用。
    - \`--uhard\`
      - 超困难模式，在困难模式的基础上，黄色字母必须远离它们被线索的地方，灰色的线索必须被遵守。
    - \`--absurd\`
      - 荒谬/变态模式，AI将尽量避免给出答案，每次猜测时都会尽可能少地透露信息，甚至可能更换秘密词。
      - 在这种模式下，你将面对一个极具挑战性的对手。
      - [如何玩？](https://qntm.org/absurdle)
    - \`--challenge\`
      - 荒谬/变态挑战模式，要求你从一个给定的目标词出发，通过某种方式使其变成秘密词。
      - 仅建议高级玩家尝试。
      - [如何玩？](https://qntm.org/challenge)
    - \`--wordles <value:number>\`
      - 同时猜测多个单词，默认范围为 1 ~ 4，可自定义。

> Tip：可以同时启用困难模式和变态模式，且经典模式也同样适用。

### 游戏操作

- \`wordleGame.猜 [inputWord:text]\` - 猜单词，参数为输入的单词。
  - \`-r\`
    - 随机一个单词。
- \`wordleGame.查询进度\` - 查询当前游戏进度。

### 数据查询

- \`wordleGame.查询单词 [targetWord:text]\` - 在 ALL 词库中查询单词信息（翻译）。
- \`wordleGame.查找单词 [targetWord:text]\` - 在 [WordWord](https://wordword.org/) 中查询单词信息（英文定义）。
- \`wordleGame.单词查找器\` - 使用 [WordFinder](https://wordword.org/) 查找匹配的单词。
- \`wordleGame.查询玩家记录 [targetUser:text]\` - 查询玩家记录，可选参数为目标玩家的 at 信息。
- \`wordleGame.排行榜 [number:number]\` - 查看排行榜，可选参数为排行榜的人数。
- \`wordleGame.排行榜.损益/总.胜场/总.输场/经典/CET4/CET6/GMAT/GRE/IELTS/SAT/TOEFL/考研/专八/专四/ALL/Lewdle.胜场/输场/最快用时 [number:number]\` -
  查看不同模式的玩家排行榜，可选参数为排行榜的人数。`

// pz* pzx*
export interface Config {
  isDarkThemeEnabled: boolean
  isHighContrastThemeEnabled: boolean

  defaultMaxLeaderboardEntries: number
  defaultWordLengthForGuessing: number
  maxInvestmentCurrency: number
  defaultRewardMultiplier: number
  maxSimultaneousGuesses: number
  compositeImagePageWidth: number
  compositeImagePageHeight: number

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
    isDarkThemeEnabled: Schema.boolean().default(false).description(`是否开启黑暗主题。`),
    isHighContrastThemeEnabled: Schema.boolean().default(false).description(`是否开启高对比度（色盲）主题。`),
  }).description('主题设置'),

  Schema.object({
    defaultMaxLeaderboardEntries: Schema.number().min(0).default(10).description(`显示排行榜时默认的最大人数。`),
    defaultWordLengthForGuessing: Schema.number().min(1).default(5).description(`非经典游戏模式下，默认的猜单词长度。`),
    maxInvestmentCurrency: Schema.number().min(0).default(50).description(`加入游戏时可投入的最大货币数额。`),
    defaultRewardMultiplier: Schema.number().min(0).default(2).description(`猜单词经典模式赢了之后奖励的货币倍率。`),
    maxSimultaneousGuesses: Schema.number().min(1).default(4).description(`最多同时猜测单词的数量。`),
    compositeImagePageWidth: Schema.number().min(1).default(800).description(`合成图片页面宽度。`),
    compositeImagePageHeight: Schema.number().min(1).default(100).description(`合成图片页面高度。`),
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
    extra_wordle_game_records: ExtraGameRecord
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
  isUltraHardMode: boolean
  correctLetters: string[]
  presentLetters: string
  presentLettersWithIndex: string[]
  absentLetters: string
  timestamp: number
  remainingWordsList: string[]
  isAbsurd: boolean
  isChallengeMode: boolean
  targetWord: string
  wordlesNum: number
  wordleIndex: number
  isWin: boolean
}

export interface ExtraGameRecord {
  id: number
  channelId: string
  gameMode: string
  wordGuessHtmlCache: string
  wordAnswerChineseDefinition: string
  guessWordLength: number
  wordGuess: string
  correctLetters: string[]
  presentLetters: string
  presentLettersWithIndex: string[]
  absentLetters: string
  timestamp: number
  wordlesNum: number
  wordleIndex: number
  isWin: boolean
  remainingGuessesCount: number
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
  fastestGuessTime: Record<string, number>;
}

interface WordData {
  word: string;
  translation: string;
  wordCount: number;
}

interface PlayerStats {
  经典?: WinLoseStats;
  Lewdle?: WinLoseStats;
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
}

const initialStats: PlayerStats = {
  经典: {win: 0, lose: 0},
  Lewdle: {win: 0, lose: 0},
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

const initialFastestGuessTime: Record<string, number> = {
  经典: 0,
  Lewdle: 0,
  CET4: 0,
  CET6: 0,
  GMAT: 0,
  GRE: 0,
  IELTS: 0,
  SAT: 0,
  TOEFL: 0,
  考研: 0,
  专八: 0,
  专四: 0,
  ALL: 0,
};

interface LetterState {
  letter: string;
  state: 'correct' | 'present' | 'absent' | 'undefined';
}

interface WordEntry {
  word: string;
  translation: string;
}

// bl*
const classicWordList = `ABACK ABASE ABATE ABBEY ABBOT ABHOR ABIDE ABLED ABODE ABORT ABOUT ABOVE ABUSE ABYSS ACORN ACRID ACTOR ACUTE ADAGE ADAPT ADEPT ADMIN ADMIT ADOBE ADOPT ADORE ADORN ADULT AFFIX AFIRE AFOOT AFOUL AFTER AGAIN AGAPE AGATE AGENT AGILE AGING AGLOW AGONY AGORA AGREE AHEAD AIDER AISLE ALARM ALBUM ALERT ALGAE ALIBI ALIEN ALIGN ALIKE ALIVE ALLAY ALLEY ALLOT ALLOW ALLOY ALOFT ALONE ALONG ALOOF ALOUD ALPHA ALTAR ALTER AMASS AMAZE AMBER AMBLE AMEND AMISS AMITY AMONG AMPLE AMPLY AMUSE ANGEL ANGER ANGLE ANGRY ANGST ANIME ANKLE ANNEX ANNOY ANNUL ANODE ANTIC ANVIL AORTA APART APHID APING APNEA APPLE APPLY APRON APTLY ARBOR ARDOR ARENA ARGUE ARISE ARMOR AROMA AROSE ARRAY ARROW ARSON ARTSY ASCOT ASHEN ASIDE ASKEW ASSAY ASSET ATOLL ATONE ATTIC AUDIO AUDIT AUGUR AUNTY AVAIL AVERT AVIAN AVOID AWAIT AWAKE AWARD AWARE AWASH AWFUL AWOKE AXIAL AXIOM AXION AZURE BACON BADGE BADLY BAGEL BAGGY BAKER BALER BALMY BANAL BANJO BARGE BARON BASAL BASIC BASIL BASIN BASIS BASTE BATCH BATHE BATON BATTY BAWDY BAYOU BEACH BEADY BEARD BEAST BEECH BEEFY BEFIT BEGAN BEGAT BEGET BEGIN BEGUN BEING BELCH BELIE BELLE BELLY BELOW BENCH BERET BERRY BERTH BESET BETEL BEVEL BEZEL BIBLE BICEP BIDDY BIGOT BILGE BILLY BINGE BINGO BIOME BIRCH BIRTH BISON BITTY BLACK BLADE BLAME BLAND BLANK BLARE BLAST BLAZE BLEAK BLEAT BLEED BLEEP BLEND BLESS BLIMP BLIND BLINK BLISS BLITZ BLOAT BLOCK BLOKE BLOND BLOOD BLOOM BLOWN BLUER BLUFF BLUNT BLURB BLURT BLUSH BOARD BOAST BOBBY BONEY BONGO BONUS BOOBY BOOST BOOTH BOOTY BOOZE BOOZY BORAX BORNE BOSOM BOSSY BOTCH BOUGH BOULE BOUND BOWEL BOXER BRACE BRAID BRAIN BRAKE BRAND BRASH BRASS BRAVE BRAVO BRAWL BRAWN BREAD BREAK BREED BRIAR BRIBE BRICK BRIDE BRIEF BRINE BRING BRINK BRINY BRISK BROAD BROIL BROKE BROOD BROOK BROOM BROTH BROWN BRUNT BRUSH BRUTE BUDDY BUDGE BUGGY BUGLE BUILD BUILT BULGE BULKY BULLY BUNCH BUNNY BURLY BURNT BURST BUSED BUSHY BUTCH BUTTE BUXOM BUYER BYLAW CABAL CABBY CABIN CABLE CACAO CACHE CACTI CADDY CADET CAGEY CAIRN CAMEL CAMEO CANAL CANDY CANNY CANOE CANON CAPER CAPUT CARAT CARGO CAROL CARRY CARVE CASTE CATCH CATER CATTY CAULK CAUSE CAVIL CEASE CEDAR CELLO CHAFE CHAFF CHAIN CHAIR CHALK CHAMP CHANT CHAOS CHARD CHARM CHART CHASE CHASM CHEAP CHEAT CHECK CHEEK CHEER CHESS CHEST CHICK CHIDE CHIEF CHILD CHILI CHILL CHIME CHINA CHIRP CHOCK CHOIR CHOKE CHORD CHORE CHOSE CHUCK CHUMP CHUNK CHURN CHUTE CIDER CIGAR CINCH CIRCA CIVIC CIVIL CLACK CLAIM CLAMP CLANG CLANK CLASH CLASP CLASS CLEAN CLEAR CLEAT CLEFT CLERK CLICK CLIFF CLIMB CLING CLINK CLOAK CLOCK CLONE CLOSE CLOTH CLOUD CLOUT CLOVE CLOWN CLUCK CLUED CLUMP CLUNG COACH COAST COBRA COCOA COLON COLOR COMET COMFY COMIC COMMA CONCH CONDO CONIC COPSE CORAL CORER CORNY COUCH COUGH COULD COUNT COUPE COURT COVEN COVER COVET COVEY COWER COYLY CRACK CRAFT CRAMP CRANE CRANK CRASH CRASS CRATE CRAVE CRAWL CRAZE CRAZY CREAK CREAM CREDO CREED CREEK CREEP CREME CREPE CREPT CRESS CREST CRICK CRIED CRIER CRIME CRIMP CRISP CROAK CROCK CRONE CRONY CROOK CROSS CROUP CROWD CROWN CRUDE CRUEL CRUMB CRUMP CRUSH CRUST CRYPT CUBIC CUMIN CURIO CURLY CURRY CURSE CURVE CURVY CUTIE CYBER CYCLE CYNIC DADDY DAILY DAIRY DAISY DALLY DANCE DANDY DATUM DAUNT DEALT DEATH DEBAR DEBIT DEBUG DEBUT DECAL DECAY DECOR DECOY DECRY DEFER DEIGN DEITY DELAY DELTA DELVE DEMON DEMUR DENIM DENSE DEPOT DEPTH DERBY DETER DETOX DEUCE DEVIL DIARY DICEY DIGIT DILLY DIMLY DINER DINGO DINGY DIODE DIRGE DIRTY DISCO DITCH DITTO DITTY DIVER DIZZY DODGE DODGY DOGMA DOING DOLLY DONOR DONUT DOPEY DOUBT DOUGH DOWDY DOWEL DOWNY DOWRY DOZEN DRAFT DRAIN DRAKE DRAMA DRANK DRAPE DRAWL DRAWN DREAD DREAM DRESS DRIED DRIER DRIFT DRILL DRINK DRIVE DROIT DROLL DRONE DROOL DROOP DROSS DROVE DROWN DRUID DRUNK DRYER DRYLY DUCHY DULLY DUMMY DUMPY DUNCE DUSKY DUSTY DUTCH DUVET DWARF DWELL DWELT DYING EAGER EAGLE EARLY EARTH EASEL EATEN EATER EBONY ECLAT EDICT EDIFY EERIE EGRET EIGHT EJECT EKING ELATE ELBOW ELDER ELECT ELEGY ELFIN ELIDE ELITE ELOPE ELUDE EMAIL EMBED EMBER EMCEE EMPTY ENACT ENDOW ENEMA ENEMY ENJOY ENNUI ENSUE ENTER ENTRY ENVOY EPOCH EPOXY EQUAL EQUIP ERASE ERECT ERODE ERROR ERUPT ESSAY ESTER ETHER ETHIC ETHOS ETUDE EVADE EVENT EVERY EVICT EVOKE EXACT EXALT EXCEL EXERT EXILE EXIST EXPEL EXTOL EXTRA EXULT EYING FABLE FACET FAINT FAIRY FAITH FALSE FANCY FANNY FARCE FATAL FATTY FAULT FAUNA FAVOR FEAST FECAL FEIGN FELLA FELON FEMME FEMUR FENCE FERAL FERRY FETAL FETCH FETID FETUS FEVER FEWER FIBER FIBRE FICUS FIELD FIEND FIERY FIFTH FIFTY FIGHT FILER FILET FILLY FILMY FILTH FINAL FINCH FINER FIRST FISHY FIXER FIZZY FJORD FLACK FLAIL FLAIR FLAKE FLAKY FLAME FLANK FLARE FLASH FLASK FLECK FLEET FLESH FLICK FLIER FLING FLINT FLIRT FLOAT FLOCK FLOOD FLOOR FLORA FLOSS FLOUR FLOUT FLOWN FLUFF FLUID FLUKE FLUME FLUNG FLUNK FLUSH FLUTE FLYER FOAMY FOCAL FOCUS FOGGY FOIST FOLIO FOLLY FORAY FORCE FORGE FORGO FORTE FORTH FORTY FORUM FOUND FOYER FRAIL FRAME FRANK FRAUD FREAK FREED FREER FRESH FRIAR FRIED FRILL FRISK FRITZ FROCK FROND FRONT FROST FROTH FROWN FROZE FRUIT FUDGE FUGUE FULLY FUNGI FUNKY FUNNY FUROR FURRY FUSSY FUZZY GAFFE GAILY GAMER GAMMA GAMUT GASSY GAUDY GAUGE GAUNT GAUZE GAVEL GAWKY GAYER GAYLY GAZER GECKO GEEKY GEESE GENIE GENRE GHOST GHOUL GIANT GIDDY GIPSY GIRLY GIRTH GIVEN GIVER GLADE GLAND GLARE GLASS GLAZE GLEAM GLEAN GLIDE GLINT GLOAT GLOBE GLOOM GLORY GLOSS GLOVE GLYPH GNASH GNOME GODLY GOING GOLEM GOLLY GONAD GONER GOODY GOOEY GOOFY GOOSE GORGE GOUGE GOURD GRACE GRADE GRAFT GRAIL GRAIN GRAND GRANT GRAPE GRAPH GRASP GRASS GRATE GRAVE GRAVY GRAZE GREAT GREED GREEN GREET GRIEF GRILL GRIME GRIMY GRIND GRIPE GROAN GROIN GROOM GROPE GROSS GROUP GROUT GROVE GROWL GROWN GRUEL GRUFF GRUNT GUARD GUAVA GUESS GUEST GUIDE GUILD GUILE GUILT GUISE GULCH GULLY GUMBO GUMMY GUPPY GUSTO GUSTY GYPSY HABIT HAIRY HALVE HANDY HAPPY HARDY HAREM HARPY HARRY HARSH HASTE HASTY HATCH HATER HAUNT HAUTE HAVEN HAVOC HAZEL HEADY HEARD HEART HEATH HEAVE HEAVY HEDGE HEFTY HEIST HELIX HELLO HENCE HERON HILLY HINGE HIPPO HIPPY HITCH HOARD HOBBY HOIST HOLLY HOMER HONEY HONOR HORDE HORNY HORSE HOTEL HOTLY HOUND HOUSE HOVEL HOVER HOWDY HUMAN HUMID HUMOR HUMPH HUMUS HUNCH HUNKY HURRY HUSKY HUSSY HUTCH HYDRO HYENA HYMEN HYPER ICILY ICING IDEAL IDIOM IDIOT IDLER IDYLL IGLOO ILIAC IMAGE IMBUE IMPEL IMPLY INANE INBOX INCUR INDEX INEPT INERT INFER INGOT INLAY INLET INNER INPUT INTER INTRO IONIC IRATE IRONY ISLET ISSUE ITCHY IVORY JAUNT JAZZY JELLY JERKY JETTY JEWEL JIFFY JOINT JOIST JOKER JOLLY JOUST JUDGE JUICE JUICY JUMBO JUMPY JUNTA JUNTO JUROR KAPPA KARMA KAYAK KEBAB KHAKI KINKY KIOSK KITTY KNACK KNAVE KNEAD KNEED KNEEL KNELT KNIFE KNOCK KNOLL KNOWN KOALA KRILL LABEL LABOR LADEN LADLE LAGER LANCE LANKY LAPEL LAPSE LARGE LARVA LASSO LATCH LATER LATHE LATTE LAUGH LAYER LEACH LEAFY LEAKY LEANT LEAPT LEARN LEASE LEASH LEAST LEAVE LEDGE LEECH LEERY LEFTY LEGAL LEGGY LEMON LEMUR LEPER LEVEL LEVER LIBEL LIEGE LIGHT LIKEN LILAC LIMBO LIMIT LINEN LINER LINGO LIPID LITHE LIVER LIVID LLAMA LOAMY LOATH LOBBY LOCAL LOCUS LODGE LOFTY LOGIC LOGIN LOOPY LOOSE LORRY LOSER LOUSE LOUSY LOVER LOWER LOWLY LOYAL LUCID LUCKY LUMEN LUMPY LUNAR LUNCH LUNGE LUPUS LURCH LURID LUSTY LYING LYMPH LYNCH LYRIC MACAW MACHO MACRO MADAM MADLY MAFIA MAGIC MAGMA MAIZE MAJOR MAKER MAMBO MAMMA MAMMY MANGA MANGE MANGO MANGY MANIA MANIC MANLY MANOR MAPLE MARCH MARRY MARSH MASON MASSE MATCH MATEY MAUVE MAXIM MAYBE MAYOR MEALY MEANT MEATY MECCA MEDAL MEDIA MEDIC MELEE MELON MERCY MERGE MERIT MERRY METAL METER METRO MICRO MIDGE MIDST MIGHT MILKY MIMIC MINCE MINER MINIM MINOR MINTY MINUS MIRTH MISER MISSY MOCHA MODAL MODEL MODEM MOGUL MOIST MOLAR MOLDY MONEY MONTH MOODY MOOSE MORAL MORON MORPH MOSSY MOTEL MOTIF MOTOR MOTTO MOULT MOUND MOUNT MOURN MOUSE MOUTH MOVER MOVIE MOWER MUCKY MUCUS MUDDY MULCH MUMMY MUNCH MURAL MURKY MUSHY MUSIC MUSKY MUSTY MYRRH NADIR NAIVE NANNY NASAL NASTY NATAL NAVAL NAVEL NEEDY NEIGH NERDY NERVE NEVER NEWER NEWLY NICER NICHE NIECE NIGHT NINJA NINNY NINTH NOBLE NOBLY NOISE NOISY NOMAD NOOSE NORTH NOSEY NOTCH NOVEL NUDGE NURSE NUTTY NYLON NYMPH OAKEN OBESE OCCUR OCEAN OCTAL OCTET ODDER ODDLY OFFAL OFFER OFTEN OLDEN OLDER OLIVE OMBRE OMEGA ONION ONSET OPERA OPINE OPIUM OPTIC ORBIT ORDER ORGAN OTHER OTTER OUGHT OUNCE OUTDO OUTER OUTGO OVARY OVATE OVERT OVINE OVOID OWING OWNER OXIDE OZONE PADDY PAGAN PAINT PALER PALSY PANEL PANIC PANSY PAPAL PAPER PARER PARKA PARRY PARSE PARTY PASTA PASTE PASTY PATCH PATIO PATSY PATTY PAUSE PAYEE PAYER PEACE PEACH PEARL PECAN PEDAL PENAL PENCE PENNE PENNY PERCH PERIL PERKY PESKY PESTO PETAL PETTY PHASE PHONE PHONY PHOTO PIANO PICKY PIECE PIETY PIGGY PILOT PINCH PINEY PINKY PINTO PIPER PIQUE PITCH PITHY PIVOT PIXEL PIXIE PIZZA PLACE PLAID PLAIN PLAIT PLANE PLANK PLANT PLATE PLAZA PLEAD PLEAT PLIED PLIER PLUCK PLUMB PLUME PLUMP PLUNK PLUSH POESY POINT POISE POKER POLAR POLKA POLYP POOCH POPPY PORCH POSER POSIT POSSE POUCH POUND POUTY POWER PRANK PRAWN PREEN PRESS PRICE PRICK PRIDE PRIED PRIME PRIMO PRINT PRIOR PRISM PRIVY PRIZE PROBE PRONE PRONG PROOF PROSE PROUD PROVE PROWL PROXY PRUDE PRUNE PSALM PUBIC PUDGY PUFFY PULPY PULSE PUNCH PUPAL PUPIL PUPPY PUREE PURER PURGE PURSE PUSHY PUTTY PYGMY QUACK QUAIL QUAKE QUALM QUARK QUART QUASH QUASI QUEEN QUEER QUELL QUERY QUEST QUEUE QUICK QUIET QUILL QUILT QUIRK QUITE QUOTA QUOTE QUOTH RABBI RABID RACER RADAR RADII RADIO RAINY RAISE RAJAH RALLY RALPH RAMEN RANCH RANDY RANGE RAPID RARER RASPY RATIO RATTY RAVEN RAYON RAZOR REACH REACT READY REALM REARM REBAR REBEL REBUS REBUT RECAP RECUR RECUT REEDY REFER REFIT REGAL REHAB REIGN RELAX RELAY RELIC REMIT RENAL RENEW REPAY REPEL REPLY RERUN RESET RESIN RETCH RETRO RETRY REUSE REVEL REVUE RHINO RHYME RIDER RIDGE RIFLE RIGHT RIGID RIGOR RINSE RIPEN RIPER RISEN RISER RISKY RIVAL RIVER RIVET ROACH ROAST ROBIN ROBOT ROCKY RODEO ROGER ROGUE ROOMY ROOST ROTOR ROUGE ROUGH ROUND ROUSE ROUTE ROVER ROWDY ROWER ROYAL RUDDY RUDER RUGBY RULER RUMBA RUMOR RUPEE RURAL RUSTY SADLY SAFER SAINT SALAD SALLY SALON SALSA SALTY SALVE SALVO SANDY SANER SAPPY SASSY SATIN SATYR SAUCE SAUCY SAUNA SAUTE SAVOR SAVOY SAVVY SCALD SCALE SCALP SCALY SCAMP SCANT SCARE SCARF SCARY SCENE SCENT SCION SCOFF SCOLD SCONE SCOOP SCOPE SCORE SCORN SCOUR SCOUT SCOWL SCRAM SCRAP SCREE SCREW SCRUB SCRUM SCUBA SEDAN SEEDY SEGUE SEIZE SEMEN SENSE SEPIA SERIF SERUM SERVE SETUP SEVEN SEVER SEWER SHACK SHADE SHADY SHAFT SHAKE SHAKY SHALE SHALL SHALT SHAME SHANK SHAPE SHARD SHARE SHARK SHARP SHAVE SHAWL SHEAR SHEEN SHEEP SHEER SHEET SHEIK SHELF SHELL SHIED SHIFT SHINE SHINY SHIRE SHIRK SHIRT SHOAL SHOCK SHONE SHOOK SHOOT SHORE SHORN SHORT SHOUT SHOVE SHOWN SHOWY SHREW SHRUB SHRUG SHUCK SHUNT SHUSH SHYLY SIEGE SIEVE SIGHT SIGMA SILKY SILLY SINCE SINEW SINGE SIREN SISSY SIXTH SIXTY SKATE SKIER SKIFF SKILL SKIMP SKIRT SKULK SKULL SKUNK SLACK SLAIN SLANG SLANT SLASH SLATE SLAVE SLEEK SLEEP SLEET SLEPT SLICE SLICK SLIDE SLIME SLIMY SLING SLINK SLOOP SLOPE SLOSH SLOTH SLUMP SLUNG SLUNK SLURP SLUSH SLYLY SMACK SMALL SMART SMASH SMEAR SMELL SMELT SMILE SMIRK SMITE SMITH SMOCK SMOKE SMOKY SMOTE SNACK SNAIL SNAKE SNAKY SNARE SNARL SNEAK SNEER SNIDE SNIFF SNIPE SNOOP SNORE SNORT SNOUT SNOWY SNUCK SNUFF SOAPY SOBER SOGGY SOLAR SOLID SOLVE SONAR SONIC SOOTH SOOTY SORRY SOUND SOUTH SOWER SPACE SPADE SPANK SPARE SPARK SPASM SPAWN SPEAK SPEAR SPECK SPEED SPELL SPELT SPEND SPENT SPERM SPICE SPICY SPIED SPIEL SPIKE SPIKY SPILL SPILT SPINE SPINY SPIRE SPITE SPLAT SPLIT SPOIL SPOKE SPOOF SPOOK SPOOL SPOON SPORE SPORT SPOUT SPRAY SPREE SPRIG SPUNK SPURN SPURT SQUAD SQUAT SQUIB STACK STAFF STAGE STAID STAIN STAIR STAKE STALE STALK STALL STAMP STAND STANK STARE STARK START STASH STATE STAVE STEAD STEAK STEAL STEAM STEED STEEL STEEP STEER STEIN STERN STICK STIFF STILL STILT STING STINK STINT STOCK STOIC STOKE STOLE STOMP STONE STONY STOOD STOOL STOOP STORE STORK STORM STORY STOUT STOVE STRAP STRAW STRAY STRIP STRUT STUCK STUDY STUFF STUMP STUNG STUNK STUNT STYLE SUAVE SUGAR SUING SUITE SULKY SULLY SUMAC SUNNY SUPER SURER SURGE SURLY SUSHI SWAMI SWAMP SWARM SWASH SWATH SWEAR SWEAT SWEEP SWEET SWELL SWEPT SWIFT SWILL SWINE SWING SWIRL SWISH SWOON SWOOP SWORD SWORE SWORN SWUNG SYNOD SYRUP TABBY TABLE TABOO TACIT TACKY TAFFY TAINT TAKEN TAKER TALLY TALON TAMER TANGO TANGY TAPER TAPIR TARDY TAROT TASTE TASTY TATTY TAUNT TAWNY TEACH TEARY TEASE TEDDY TEETH TEMPO TENET TENOR TENSE TENTH TEPEE TEPID TERRA TERSE TESTY THANK THEFT THEIR THEME THERE THESE THETA THICK THIEF THIGH THING THINK THIRD THONG THORN THOSE THREE THREW THROB THROW THRUM THUMB THUMP THYME TIARA TIBIA TIDAL TIGER TIGHT TILDE TIMER TIMID TIPSY TITAN TITHE TITLE TOAST TODAY TODDY TOKEN TONAL TONGA TONIC TOOTH TOPAZ TOPIC TORCH TORSO TORUS TOTAL TOTEM TOUCH TOUGH TOWEL TOWER TOXIC TOXIN TRACE TRACK TRACT TRADE TRAIL TRAIN TRAIT TRAMP TRASH TRAWL TREAD TREAT TREND TRIAD TRIAL TRIBE TRICE TRICK TRIED TRIPE TRITE TROLL TROOP TROPE TROUT TROVE TRUCE TRUCK TRUER TRULY TRUMP TRUNK TRUSS TRUST TRUTH TRYST TUBAL TUBER TULIP TULLE TUMOR TUNIC TURBO TUTOR TWANG TWEAK TWEED TWEET TWICE TWINE TWIRL TWIST TWIXT TYING UDDER ULCER ULTRA UMBRA UNCLE UNCUT UNDER UNDID UNDUE UNFED UNFIT UNIFY UNION UNITE UNITY UNLIT UNMET UNSET UNTIE UNTIL UNWED UNZIP UPPER UPSET URBAN URINE USAGE USHER USING USUAL USURP UTILE UTTER VAGUE VALET VALID VALOR VALUE VALVE VAPID VAPOR VAULT VAUNT VEGAN VENOM VENUE VERGE VERSE VERSO VERVE VICAR VIDEO VIGIL VIGOR VILLA VINYL VIOLA VIPER VIRAL VIRUS VISIT VISOR VISTA VITAL VIVID VIXEN VOCAL VODKA VOGUE VOICE VOILA VOMIT VOTER VOUCH VOWEL VYING WACKY WAFER WAGER WAGON WAIST WAIVE WALTZ WARTY WASTE WATCH WATER WAVER WAXEN WEARY WEAVE WEDGE WEEDY WEIGH WEIRD WELCH WELSH WENCH WHACK WHALE WHARF WHEAT WHEEL WHELP WHERE WHICH WHIFF WHILE WHINE WHINY WHIRL WHISK WHITE WHOLE WHOOP WHOSE WIDEN WIDER WIDOW WIDTH WIELD WIGHT WILLY WIMPY WINCE WINCH WINDY WISER WISPY WITCH WITTY WOKEN WOMAN WOMEN WOODY WOOER WOOLY WOOZY WORDY WORLD WORRY WORSE WORST WORTH WOULD WOUND WOVEN WRACK WRATH WREAK WRECK WREST WRING WRIST WRITE WRONG WROTE WRUNG WRYLY YACHT YEARN YEAST YIELD YOUNG YOUTH ZEBRA ZESTY ZONAL`
const badWordsList = ["BONER", "FELCH", "PUSSY", "TAINT", "SEMEN", "DILDO", "FARTS", "CHODE", "MINGE", "GONAD", "TWATS", "SPUNK", "QUEEF", "GAPED", "PRICK", "BUSSY", "SHART", "BALLS", "VULVA", "PORNO", "COOCH", "PONUT", "LOADS", "DADDY", "FROTS", "SKEET", "MILFS", "BOOTY", "QUIMS", "DICKS", "CUSSY", "BOOBS", "BONCH", "TWINK", "GROOL", "HORNY", "YIFFY", "THICC", "BULGE", "TITTY", "WANKS", "FUCKS", "HUSSY", "COCKS", "FANNY", "SHAFT", "TWERK", "PUBES", "GONZO", "HANDY", "NARDS", "RIMJOB", "ERECT", "SPANK", "SQUIRT", "CUNTS", "PRECUM", "SCREW", "EDGING", "GOATSE", "BOINK", "PUNANI", "ASSES", "PECKER", "HINEY", "WANKER", "GUMMY", "CUMRAG", "PEGGED", "LEWDS", "MOPED", "TEABAG", "SCROTE", "BEAVER", "NOOKIE", "CRABS", "FUCKED", "BUTTS", "GOOCH", "TAGNUT", "TRUMP", "COUGAR", "SHTUP", "TOOBIN", "KANCHO", "KINKY", "WILLY", "SYBIAN", "GLUCK", "BONED", "GOBBLE", "TRIBS", "BROJOB", "DOGGY", "DOCKS", "CHUBBY", "TOSSER", "SHAGS", "FISTED", "STIFFY", "NASTY", "CLIMAX", "JOBBY", "BONERS", "RAWDOG", "PLUMS", "RANDY", "CLUNGE", "FEMDOM", "ZADDY", "SMEGMA", "THROB", "MERKIN", "CLITS", "MOMMY", "TITJOB", "MOIST", "GAGGED", "GUSHER", "FLAPS", "TODGER", "YONIC", "FRICK", "PROBE", "GIRTH", "PERVY", "AROUSE", "AHEGAO", "FLEDGE", "HENTAI", "GROWER", "SIMBA", "MENAGE", "LENGTH", "DOMME", "DIDDLE", "SHOWER", "BOYTOY", "SMANG", "GILFS", "NYASH", "LIGMA", "FACIAL", "OPPAI", "ASSJOB", "LUBED", "PAYPIG", "SPAFF", "PENGUS", "RIMBOW", "CUMPT", "FROMBE", "MILKER", "HIMBO", "FAPPY", "CUCKED", "HOOHA", "REAMED", "TOEJOB", "BEMHO", "BOOFED", "SEXILE", "GOOSE", "BANGED", "NORKS", "CHONES", "GLANS", "GLORP", "EPEEN", "JELQS", "CRANK", "ASSMAN", "SPURT", "BLOWIE", "ECCHI", "DICKED", "COOZE", "BEWBS", "BONKED", "BUGGER", "CUMWAD", "HANDY", "PORNO", "DILDO", "FELCH", "WANKS", "LOADS", "BOOBS", "QUIMS", "TITTY", "MILFS", "TWATS", "SCREW", "BUSSY", "DADDY", "BULGE", "BONER", "COOCH", "CUNTS", "FANNY", "TAINT", "SPUNK", "GONAD", "CUMRAG", "RIMJOB", "SHAFT", "SEMEN", "SCROTE", "TWERK", "HINEY", "SKEET", "CUSSY", "FROTS", "BONCH", "BOOTY", "BUTTS", "TAGNUT", "GAPED", "TOOBIN", "SYBIAN", "DICKS", "KINKY", "NARDS", "BONED", "DOGGY", "PUSSY", "WANKER", "PEGGED", "DOCKS", "KANCHO", "PONUT", "CHODE", "FUCKED", "THICC", "CRABS", "JOBBY", "TEABAG", "STIFFY", "EDGING", "COUGAR", "BALLS", "RAWDOG", "SMEGMA", "SQUIRT", "NASTY", "HUSSY", "FEMDOM", "PECKER", "TENTED", "SPLOSH", "BLUMPY", "CUMET", "SUCKLE", "SEXTS", "SUGMA", "SCROG", "BRAIN", "HOOKUP", "HICKEY", "AHOLE", "ANALLY", "COOMER", "ENEMA", "BARSE", "BOOBA", "CLUSSY", "HUMMER", "BEZOS", "CANING", "CHOKER", "BENWA", "CUMJAR", "DUMPER", "FIGGED", "GOONER", "INCEST", "SNUSNU", "SOUND", "ASSHAT", "BUNDA", "BREED", "CAGING", "MOIST", "FACIAL", "MOPED", "SHTUP", "GUMMY", "GOOCH", "LEWDS", "COCKS", "ASSES", "ZADDY", "MINGE", "LENGTH", "BOYTOY", "SEXILE", "PRECUM", "SHART", "PENGUS", "GOBBLE", "LUBED", "SMANG", "GUSHER", "CUMPT", "GONZO", "MERKIN", "JELQS", "TRIBS", "PERVY", "PROBE", "PUBES", "NORKS", "BUGGER", "SIMBA", "CUMWAD", "PRICK", "FISTED", "YONIC", "AROUSE", "BOOBS", "GAGGED", "YIFFY", "CLIMAX", "CRANK", "SPANK", "MILKER", "RANDY", "SHAGS", "GOOSE", "TOSSER", "SCREW", "LOADS", "CHONES", "RIMBOW", "BULGE", "BEWBS", "TITTY", "CLUNGE", "OPPAI", "HANDY", "EPEEN", "MILFS", "GILFS", "PAYPIG", "PUNANI", "SPAFF", "TWERK", "FAPPY", "CUNTS", "GAPED", "BLOWIE", "BOOTY", "CUMRAG", "TOOBIN", "DICKED", "FROMBE", "COOZE", "NARDS", "BONERS", "FUCKS", "TAGNUT", "PLUMS", "GONAD", "AHEGAO", "SYBIAN", "FUCKED", "GOATSE", "TWINK", "HOOHA", "CLITS", "COUGAR", "ERECT", "BONED", "SEMEN", "TWATS", "TITJOB", "CRABS", "THROB", "MOMMY", "VULVA", "DILDO", "PORNO", "KINKY", "SMEGMA", "NASTY", "TOEJOB", "LIGMA", "SPURT", "BEMHO", "TODGER", "FEMDOM", "EDGING", "NOOKIE", "KANCHO", "FLAPS", "TRUMP", "GROOL", "JOBBY", "BUSSY", "HICKEY", "BEZOS", "PUSSY", "BUTTS", "SCROG", "FELCH", "DUMPER", "REAMED", "HIMBO", "FIGGED", "ASSJOB", "CHUBBY", "BROJOB", "SPLOSH", "NYASH", "SHOWER", "FRICK", "TAINT", "BOOFED", "CHODE", "SEXTS", "BLUMPY", "FROTS", "SQUIRT", "LEWDS", "WANKS", "COOMER", "BREED", "CHOKER", "WANKER", "GLANS", "HUSSY", "BOINK", "BALLS", "HORNY", "QUIMS", "COOCH", "WILLY", "SPUNK", "BARSE", "BONKED", "DADDY", "MOPED", "FLEDGE", "PROBE", "SHAFT", "SCROTE", "PUBES", "HINEY", "CUMET", "BONCH", "BENWA", "SUCKLE", "ECCHI", "TENTED", "GUSHER", "FISTED", "BUNDA", "CUCKED", "MILKER", "SOUND", "SIMBA", "DIDDLE", "CAGING", "PRECUM", "YONIC", "CUSSY", "TEABAG", "BEWBS", "SPANK", "PEGGED", "FANNY", "RIMBOW", "GIRTH", "RAWDOG", "TRIBS", "INCEST", "HUMMER", "TWERK", "DOCKS", "YIFFY", "MERKIN", "CUMJAR", "ANALLY", "AHOLE", "SHTUP", "TOSSER", "FROMBE", "LOADS", "ASSES", "BEAVER", "DOMME", "BOOBA", "DICKED", "CUMPT", "CUMWAD", "ZADDY", "LUBED", "GONZO", "GAPED", "CUNTS", "RIMJOB", "PECKER", "GOOCH", "FARTS", "COUGAR", "DOGGY", "PLUMS", "PENGUS", "ENEMA", "BLOWIE", "FUCKED", "CLUNGE", "TOOBIN", "CUMRAG", "SHAGS", "OPPAI", "GLORP", "GOBBLE", "MINGE", "TAGNUT", "MOIST", "CLUSSY", "COOZE", "EPEEN", "STIFFY", "PUNANI", "TITJOB", "GUMMY", "HOOHA", "TODGER", "RANDY", "VULVA", "PORNO", "CLITS", "SMANG", "GILFS", "THROB", "FACIAL", "FAPPY", "BUGGER", "GROWER", "NOOKIE", "DILDO", "BOOTY", "FUCKS", "NORKS", "SEMEN", "CLIMAX", "FIGGED", "JELQS", "PRICK", "SUGMA", "ASSHAT", "FLAPS", "SQUIRT", "BRAIN", "EDGING", "GAGGED", "BULGE", "DICKS", "GOONER", "BANGED", "BOINK", "GOOSE", "BUTTS", "COOMER", "CANING", "SMEGMA", "GROOL", "KANCHO", "SEXILE", "NYASH", "TRUMP", "TWINK", "WILLY", "BLUMPY", "BOOBS", "FRICK", "HICKEY", "PUSSY", "SHART", "GOATSE", "HIMBO", "BONER", "LEWDS", "GLANS", "TOEJOB", "BEMHO", "HORNY", "ECCHI", "WANKER", "BARSE", "GUSHER", "FROTS", "CHOKER", "SOUND", "BREED", "QUIMS", "FEMDOM", "BENWA", "PUBES", "CAGING", "SUCKLE", "HINEY", "BONKED", "ERECT", "BONERS", "SHAFT", "SEXTS", "HENTAI", "PEGGED", "CRABS", "ASSJOB", "GIRTH", "TENTED", "BUSSY", "LIGMA", "ASSMAN", "MERKIN", "BROJOB", "NARDS", "PAYPIG", "SCROTE", "INCEST", "COCKS", "SPURT", "FELCH", "TRIBS", "TITTY", "CUMWAD", "PONUT", "MILKER", "BOOFED", "REAMED", "HUMMER", "MOPED", "MENAGE", "BEZOS", "DOGGY", "SPLOSH", "RIMJOB", "TWERK", "TAINT", "CLUNGE", "AHOLE", "DIDDLE", "ENEMA", "QUEEF", "WANKS", "HANDY", "SHAGS", "SNUSNU", "KINKY", "AHEGAO", "ASSES", "CUMJAR", "YIFFY", "GOOCH", "FLEDGE", "HOOKUP", "GOBBLE", "GUMMY", "OPPAI", "BEAVER", "CUMRAG", "GLUCK", "SIMBA", "FANNY", "PENGUS", "EPEEN", "BUGGER", "COUGAR", "CUMPT", "SKEET", "DOCKS", "MILFS", "FARTS", "BONCH", "THROB", "BLOWIE", "PERVY", "HUSSY", "HOOHA", "SEMEN", "MOMMY", "CLUSSY", "SCREW", "AROUSE", "CHONES", "FISTED", "THICC", "SYBIAN", "VULVA", "PECKER", "DADDY", "BOYTOY", "JOBBY", "SQUIRT", "ANALLY", "ZADDY", "BOOTY", "SHTUP", "DOMME", "TOOBIN", "CUNTS", "BOOBA", "SEXILE", "BOOBS", "TWATS", "CUSSY", "CANING", "STIFFY", "SHOWER", "NYASH", "NORKS", "RIMBOW", "COOCH", "TOSSER", "FLAPS", "SCROG", "BRAIN", "GILFS", "FRICK", "TODGER", "GONZO", "FUCKS", "CLIMAX", "LOADS", "BEMHO", "PUSSY", "PRECUM", "CHODE", "COOMER", "BUNDA", "HIMBO", "GOONER", "SPUNK", "KANCHO", "FROTS", "HINEY", "BARSE", "BONERS", "LENGTH", "BOINK", "PROBE", "SHAFT", "SUCKLE", "SUGMA", "WILLY", "BULGE", "ASSHAT", "GAGGED", "JELQS", "SMEGMA", "TRUMP", "SOUND", "BONKED", "SPURT", "TITJOB", "CAGING", "RANDY", "PUBES", "COOZE", "NOOKIE", "HORNY", "ERECT", "CRABS", "LUBED", "SMANG", "ASSJOB", "BLUMPY", "DICKS", "SPAFF", "BUTTS", "MENAGE", "GAPED", "PLUMS", "LIGMA", "PEGGED", "HENTAI", "TWINK", "BROJOB", "WANKS", "PUNANI", "GOOSE", "DUMPER", "FEMDOM", "NARDS", "FIGGED", "CUMET", "DILDO", "TEABAG", "EDGING", "AHOLE", "RAWDOG", "INCEST", "PORNO", "ASSES", "GROOL", "CUMWAD", "DICKED", "HOOKUP", "GOOCH", "TAGNUT", "LEWDS", "GUSHER", "GLANS", "BUGGER", "PAYPIG", "FUCKED", "CHOKER", "OPPAI", "SCROTE", "CUCKED", "TRIBS", "TENTED", "SPANK", "EPEEN", "AROUSE", "BONER", "QUEEF", "NASTY", "TITTY", "YIFFY", "GOATSE", "AHEGAO", "TWERK", "GUMMY", "DOGGY", "MILFS", "FISTED", "CLITS", "FAPPY", "KINKY", "JOBBY", "VULVA", "THICC", "MERKIN", "BUSSY", "DIDDLE", "MILKER", "GLORP", "FACIAL", "FROMBE", "SHAGS", "BONCH", "SPLOSH", "COCKS", "DOCKS", "GONAD", "GROWER", "COOCH", "SHOWER", "SIMBA", "PENGUS", "QUIMS", "RIMJOB", "TOOBIN", "BOOBA", "FARTS", "BONED", "CHUBBY", "SQUIRT", "SKEET", "GONZO", "SHART", "HUSSY", "THROB", "TAINT", "MOPED", "LOADS", "CRANK", "BEZOS", "DADDY", "CUMJAR", "SYBIAN", "NYASH", "SCREW", "BENWA", "CLIMAX", "HIMBO", "BONERS", "FLEDGE", "FUCKS", "BULGE", "SPUNK", "PECKER", "ASSHAT", "BOYTOY", "TITJOB", "WANKER", "JELQS", "SPURT", "BOINK", "SOUND", "FANNY", "LENGTH", "STIFFY", "MINGE", "FRICK", "BEAVER", "SMEGMA", "YONIC", "CHONES", "CUMRAG", "CLUSSY", "NORKS", "LUBED", "CUSSY", "ZADDY", "PUSSY", "TWATS", "PLUMS", "DICKS", "SEXILE", "CRABS", "COUGAR", "BREED", "HORNY", "GOBBLE", "HUMMER", "ERECT", "CHODE", "HINEY", "BARSE", "DILDO", "GOOSE", "WANKS", "COOMER", "BRAIN", "HICKEY", "SMANG", "CAGING", "AHOLE", "BALLS", "BUTTS", "ASSES", "NARDS", "SEMEN", "FIGGED", "TWINK", "SEXTS", "FELCH", "PORNO", "RIMBOW", "PROBE", "LIGMA", "PUNANI", "ASSJOB", "GOOCH", "REAMED", "PRICK", "PRECUM", "DUMPER", "TOSSER", "HOOHA", "QUEEF", "GROOL", "RANDY", "GIRTH", "SCROG", "GUSHER", "BONKED", "LEWDS", "PUBES", "TAGNUT", "FAPPY", "TRUMP", "SHTUP", "KINKY", "CLUNGE", "DIDDLE", "CLITS", "MILFS", "OPPAI", "SHAGS", "SPAFF", "BLUMPY", "BEMHO", "AROUSE", "ANALLY", "GROWER", "DICKED", "GLORP", "DOMME", "TWERK", "FLAPS", "BROJOB", "CUCKED", "BUNDA", "CUMET", "EDGING", "DOGGY", "SQUIRT", "RIMJOB", "HENTAI", "INCEST", "SUCKLE", "YIFFY", "BOOFED"];

// 将单词列表分割为数组
const wordArray: string[] = classicWordList.split(' ');
// 将单词列表中的单词全部小写化
const lowerCaseWordArray: string[] = wordArray.map(word => word.toLowerCase());
// const lowerCaseWordArray: string[] = ["cigar", "rebut", "sissy", "humph", "awake", "blush", "focal", "evade", "naval", "serve", "heath", "dwarf", "model", "karma", "stink", "grade", "quiet", "bench", "abate", "feign", "major", "death", "fresh", "crust", "stool", "colon", "abase", "marry", "react", "batty", "pride", "floss", "helix", "croak", "staff", "paper", "unfed", "whelp", "trawl", "outdo", "adobe", "crazy", "sower", "repay", "digit", "crate", "cluck", "spike", "mimic", "pound", "maxim", "linen", "unmet", "flesh", "booby", "forth", "first", "stand", "belly", "ivory", "seedy", "print", "yearn", "drain", "bribe", "stout", "panel", "crass", "flume", "offal", "agree", "error", "swirl", "argue", "bleed", "delta", "flick", "totem", "wooer", "front", "shrub", "parry", "biome", "lapel", "start", "greet", "goner", "golem", "lusty", "loopy", "round", "audit", "lying", "gamma", "labor", "islet", "civic", "forge", "corny", "moult", "basic", "salad", "agate", "spicy", "spray", "essay", "fjord", "spend", "kebab", "guild", "aback", "motor", "alone", "hatch", "hyper", "thumb", "dowry", "ought", "belch", "dutch", "pilot", "tweed", "comet", "jaunt", "enema", "steed", "abyss", "growl", "fling", "dozen", "boozy", "erode", "world", "gouge", "click", "briar", "great", "altar", "pulpy", "blurt", "coast", "duchy", "groin", "fixer", "group", "rogue", "badly", "smart", "pithy", "gaudy", "chill", "heron", "vodka", "finer", "surer", "radio", "rouge", "perch", "retch", "wrote", "clock", "tilde", "store", "prove", "bring", "solve", "cheat", "grime", "exult", "usher", "epoch", "triad", "break", "rhino", "viral", "conic", "masse", "sonic", "vital", "trace", "using", "peach", "champ", "baton", "brake", "pluck", "craze", "gripe", "weary", "picky", "acute", "ferry", "aside", "tapir", "troll", "unify", "rebus", "boost", "truss", "siege", "tiger", "banal", "slump", "crank", "gorge", "query", "drink", "favor", "abbey", "tangy", "panic", "solar", "shire", "proxy", "point", "robot", "prick", "wince", "crimp", "knoll", "sugar", "whack", "mount", "perky", "could", "wrung", "light", "those", "moist", "shard", "pleat", "aloft", "skill", "elder", "frame", "humor", "pause", "ulcer", "ultra", "robin", "cynic", "agora", "aroma", "caulk", "shake", "pupal", "dodge", "swill", "tacit", "other", "thorn", "trove", "bloke", "vivid", "spill", "chant", "choke", "rupee", "nasty", "mourn", "ahead", "brine", "cloth", "hoard", "sweet", "month", "lapse", "watch", "today", "focus", "smelt", "tease", "cater", "movie", "lynch", "saute", "allow", "renew", "their", "slosh", "purge", "chest", "depot", "epoxy", "nymph", "found", "shall", "harry", "stove", "lowly", "snout", "trope", "fewer", "shawl", "natal", "fibre", "comma", "foray", "scare", "stair", "black", "squad", "royal", "chunk", "mince", "slave", "shame", "cheek", "ample", "flair", "foyer", "cargo", "oxide", "plant", "olive", "inert", "askew", "heist", "shown", "zesty", "hasty", "trash", "fella", "larva", "forgo", "story", "hairy", "train", "homer", "badge", "midst", "canny", "fetus", "butch", "farce", "slung", "tipsy", "metal", "yield", "delve", "being", "scour", "glass", "gamer", "scrap", "money", "hinge", "album", "vouch", "asset", "tiara", "crept", "bayou", "atoll", "manor", "creak", "showy", "phase", "froth", "depth", "gloom", "flood", "trait", "girth", "piety", "payer", "goose", "float", "donor", "atone", "primo", "apron", "blown", "cacao", "loser", "input", "gloat", "awful", "brink", "smite", "beady", "rusty", "retro", "droll", "gawky", "hutch", "pinto", "gaily", "egret", "lilac", "sever", "field", "fluff", "hydro", "flack", "agape", "wench", "voice", "stead", "stalk", "berth", "madam", "night", "bland", "liver", "wedge", "augur", "roomy", "wacky", "flock", "angry", "bobby", "trite", "aphid", "tryst", "midge", "power", "elope", "cinch", "motto", "stomp", "upset", "bluff", "cramp", "quart", "coyly", "youth", "rhyme", "buggy", "alien", "smear", "unfit", "patty", "cling", "glean", "label", "hunky", "khaki", "poker", "gruel", "twice", "twang", "shrug", "treat", "unlit", "waste", "merit", "woven", "octal", "needy", "clown", "widow", "irony", "ruder", "gauze", "chief", "onset", "prize", "fungi", "charm", "gully", "inter", "whoop", "taunt", "leery", "class", "theme", "lofty", "tibia", "booze", "alpha", "thyme", "eclat", "doubt", "parer", "chute", "stick", "trice", "alike", "sooth", "recap", "saint", "liege", "glory", "grate", "admit", "brisk", "soggy", "usurp", "scald", "scorn", "leave", "twine", "sting", "bough", "marsh", "sloth", "dandy", "vigor", "howdy", "enjoy", "valid", "ionic", "equal", "unset", "floor", "catch", "spade", "stein", "exist", "quirk", "denim", "grove", "spiel", "mummy", "fault", "foggy", "flout", "carry", "sneak", "libel", "waltz", "aptly", "piney", "inept", "aloud", "photo", "dream", "stale", "vomit", "ombre", "fanny", "unite", "snarl", "baker", "there", "glyph", "pooch", "hippy", "spell", "folly", "louse", "gulch", "vault", "godly", "threw", "fleet", "grave", "inane", "shock", "crave", "spite", "valve", "skimp", "claim", "rainy", "musty", "pique", "daddy", "quasi", "arise", "aging", "valet", "opium", "avert", "stuck", "recut", "mulch", "genre", "plume", "rifle", "count", "incur", "total", "wrest", "mocha", "deter", "study", "lover", "safer", "rivet", "funny", "smoke", "mound", "undue", "sedan", "pagan", "swine", "guile", "gusty", "equip", "tough", "canoe", "chaos", "covet", "human", "udder", "lunch", "blast", "stray", "manga", "melee", "lefty", "quick", "paste", "given", "octet", "risen", "groan", "leaky", "grind", "carve", "loose", "sadly", "spilt", "apple", "slack", "honey", "final", "sheen", "eerie", "minty", "slick", "derby", "wharf", "spelt", "coach", "erupt", "singe", "price", "spawn", "fairy", "jiffy", "filmy", "stack", "chose", "sleep", "ardor", "nanny", "niece", "woozy", "handy", "grace", "ditto", "stank", "cream", "usual", "diode", "valor", "angle", "ninja", "muddy", "chase", "reply", "prone", "spoil", "heart", "shade", "diner", "arson", "onion", "sleet", "dowel", "couch", "palsy", "bowel", "smile", "evoke", "creek", "lance", "eagle", "idiot", "siren", "built", "embed", "award", "dross", "annul", "goody", "frown", "patio", "laden", "humid", "elite", "lymph", "edify", "might", "reset", "visit", "gusto", "purse", "vapor", "crock", "write", "sunny", "loath", "chaff", "slide", "queer", "venom", "stamp", "sorry", "still", "acorn", "aping", "pushy", "tamer", "hater", "mania", "awoke", "brawn", "swift", "exile", "birch", "lucky", "freer", "risky", "ghost", "plier", "lunar", "winch", "snare", "nurse", "house", "borax", "nicer", "lurch", "exalt", "about", "savvy", "toxin", "tunic", "pried", "inlay", "chump", "lanky", "cress", "eater", "elude", "cycle", "kitty", "boule", "moron", "tenet", "place", "lobby", "plush", "vigil", "index", "blink", "clung", "qualm", "croup", "clink", "juicy", "stage", "decay", "nerve", "flier", "shaft", "crook", "clean", "china", "ridge", "vowel", "gnome", "snuck", "icing", "spiny", "rigor", "snail", "flown", "rabid", "prose", "thank", "poppy", "budge", "fiber", "moldy", "dowdy", "kneel", "track", "caddy", "quell", "dumpy", "paler", "swore", "rebar", "scuba", "splat", "flyer", "horny", "mason", "doing", "ozone", "amply", "molar", "ovary", "beset", "queue", "cliff", "magic", "truce", "sport", "fritz", "edict", "twirl", "verse", "llama", "eaten", "range", "whisk", "hovel", "rehab", "macaw", "sigma", "spout", "verve", "sushi", "dying", "fetid", "brain", "buddy", "thump", "scion", "candy", "chord", "basin", "march", "crowd", "arbor", "gayly", "musky", "stain", "dally", "bless", "bravo", "stung", "title", "ruler", "kiosk", "blond", "ennui", "layer", "fluid", "tatty", "score", "cutie", "zebra", "barge", "matey", "bluer", "aider", "shook", "river", "privy", "betel", "frisk", "bongo", "begun", "azure", "weave", "genie", "sound", "glove", "braid", "scope", "wryly", "rover", "assay", "ocean", "bloom", "irate", "later", "woken", "silky", "wreck", "dwelt", "slate", "smack", "solid", "amaze", "hazel", "wrist", "jolly", "globe", "flint", "rouse", "civil", "vista", "relax", "cover", "alive", "beech", "jetty", "bliss", "vocal", "often", "dolly", "eight", "joker", "since", "event", "ensue", "shunt", "diver", "poser", "worst", "sweep", "alley", "creed", "anime", "leafy", "bosom", "dunce", "stare", "pudgy", "waive", "choir", "stood", "spoke", "outgo", "delay", "bilge", "ideal", "clasp", "seize", "hotly", "laugh", "sieve", "block", "meant", "grape", "noose", "hardy", "shied", "drawl", "daisy", "putty", "strut", "burnt", "tulip", "crick", "idyll", "vixen", "furor", "geeky", "cough", "naive", "shoal", "stork", "bathe", "aunty", "check", "prime", "brass", "outer", "furry", "razor", "elect", "evict", "imply", "demur", "quota", "haven", "cavil", "swear", "crump", "dough", "gavel", "wagon", "salon", "nudge", "harem", "pitch", "sworn", "pupil", "excel", "stony", "cabin", "unzip", "queen", "trout", "polyp", "earth", "storm", "until", "taper", "enter", "child", "adopt", "minor", "fatty", "husky", "brave", "filet", "slime", "glint", "tread", "steal", "regal", "guest", "every", "murky", "share", "spore", "hoist", "buxom", "inner", "otter", "dimly", "level", "sumac", "donut", "stilt", "arena", "sheet", "scrub", "fancy", "slimy", "pearl", "silly", "porch", "dingo", "sepia", "amble", "shady", "bread", "friar", "reign", "dairy", "quill", "cross", "brood", "tuber", "shear", "posit", "blank", "villa", "shank", "piggy", "freak", "which", "among", "fecal", "shell", "would", "algae", "large", "rabbi", "agony", "amuse", "bushy", "copse", "swoon", "knife", "pouch", "ascot", "plane", "crown", "urban", "snide", "relay", "abide", "viola", "rajah", "straw", "dilly", "crash", "amass", "third", "trick", "tutor", "woody", "blurb", "grief", "disco", "where", "sassy", "beach", "sauna", "comic", "clued", "creep", "caste", "graze", "snuff", "frock", "gonad", "drunk", "prong", "lurid", "steel", "halve", "buyer", "vinyl", "utile", "smell", "adage", "worry", "tasty", "local", "trade", "finch", "ashen", "modal", "gaunt", "clove", "enact", "adorn", "roast", "speck", "sheik", "missy", "grunt", "snoop", "party", "touch", "mafia", "emcee", "array", "south", "vapid", "jelly", "skulk", "angst", "tubal", "lower", "crest", "sweat", "cyber", "adore", "tardy", "swami", "notch", "groom", "roach", "hitch", "young", "align", "ready", "frond", "strap", "puree", "realm", "venue", "swarm", "offer", "seven", "dryer", "diary", "dryly", "drank", "acrid", "heady", "theta", "junto", "pixie", "quoth", "bonus", "shalt", "penne", "amend", "datum", "build", "piano", "shelf", "lodge", "suing", "rearm", "coral", "ramen", "worth", "psalm", "infer", "overt", "mayor", "ovoid", "glide", "usage", "poise", "randy", "chuck", "prank", "fishy", "tooth", "ether", "drove", "idler", "swath", "stint", "while", "begat", "apply", "slang", "tarot", "radar", "credo", "aware", "canon", "shift", "timer", "bylaw", "serum", "three", "steak", "iliac", "shirk", "blunt", "puppy", "penal", "joist", "bunny", "shape", "beget", "wheel", "adept", "stunt", "stole", "topaz", "chore", "fluke", "afoot", "bloat", "bully", "dense", "caper", "sneer", "boxer", "jumbo", "lunge", "space", "avail", "short", "slurp", "loyal", "flirt", "pizza", "conch", "tempo", "droop", "plate", "bible", "plunk", "afoul", "savoy", "steep", "agile", "stake", "dwell", "knave", "beard", "arose", "motif", "smash", "broil", "glare", "shove", "baggy", "mammy", "swamp", "along", "rugby", "wager", "quack", "squat", "snaky", "debit", "mange", "skate", "ninth", "joust", "tramp", "spurn", "medal", "micro", "rebel", "flank", "learn", "nadir", "maple", "comfy", "remit", "gruff", "ester", "least", "mogul", "fetch", "cause", "oaken", "aglow", "meaty", "gaffe", "shyly", "racer", "prowl", "thief", "stern", "poesy", "rocky", "tweet", "waist", "spire", "grope", "havoc", "patsy", "truly", "forty", "deity", "uncle", "swish", "giver", "preen", "bevel", "lemur", "draft", "slope", "annoy", "lingo", "bleak", "ditty", "curly", "cedar", "dirge", "grown", "horde", "drool", "shuck", "crypt", "cumin", "stock", "gravy", "locus", "wider", "breed", "quite", "chafe", "cache", "blimp", "deign", "fiend", "logic", "cheap", "elide", "rigid", "false", "renal", "pence", "rowdy", "shoot", "blaze", "envoy", "posse", "brief", "never", "abort", "mouse", "mucky", "sulky", "fiery", "media", "trunk", "yeast", "clear", "skunk", "scalp", "bitty", "cider", "koala", "duvet", "segue", "creme", "super", "grill", "after", "owner", "ember", "reach", "nobly", "empty", "speed", "gipsy", "recur", "smock", "dread", "merge", "burst", "kappa", "amity", "shaky", "hover", "carol", "snort", "synod", "faint", "haunt", "flour", "chair", "detox", "shrew", "tense", "plied", "quark", "burly", "novel", "waxen", "stoic", "jerky", "blitz", "beefy", "lyric", "hussy", "towel", "quilt", "below", "bingo", "wispy", "brash", "scone", "toast", "easel", "saucy", "value", "spice", "honor", "route", "sharp", "bawdy", "radii", "skull", "phony", "issue", "lager", "swell", "urine", "gassy", "trial", "flora", "upper", "latch", "wight", "brick", "retry", "holly", "decal", "grass", "shack", "dogma", "mover", "defer", "sober", "optic", "crier", "vying", "nomad", "flute", "hippo", "shark", "drier", "obese", "bugle", "tawny", "chalk", "feast", "ruddy", "pedal", "scarf", "cruel", "bleat", "tidal", "slush", "semen", "windy", "dusty", "sally", "igloo", "nerdy", "jewel", "shone", "whale", "hymen", "abuse", "fugue", "elbow", "crumb", "pansy", "welsh", "syrup", "terse", "suave", "gamut", "swung", "drake", "freed", "afire", "shirt", "grout", "oddly", "tithe", "plaid", "dummy", "broom", "blind", "torch", "enemy", "again", "tying", "pesky", "alter", "gazer", "noble", "ethos", "bride", "extol", "decor", "hobby", "beast", "idiom", "utter", "these", "sixth", "alarm", "erase", "elegy", "spunk", "piper", "scaly", "scold", "hefty", "chick", "sooty", "canal", "whiny", "slash", "quake", "joint", "swept", "prude", "heavy", "wield", "femme", "lasso", "maize", "shale", "screw", "spree", "smoky", "whiff", "scent", "glade", "spent", "prism", "stoke", "riper", "orbit", "cocoa", "guilt", "humus", "shush", "table", "smirk", "wrong", "noisy", "alert", "shiny", "elate", "resin", "whole", "hunch", "pixel", "polar", "hotel", "sword", "cleat", "mango", "rumba", "puffy", "filly", "billy", "leash", "clout", "dance", "ovate", "facet", "chili", "paint", "liner", "curio", "salty", "audio", "snake", "fable", "cloak", "navel", "spurt", "pesto", "balmy", "flash", "unwed", "early", "churn", "weedy", "stump", "lease", "witty", "wimpy", "spoof", "saner", "blend", "salsa", "thick", "warty", "manic", "blare", "squib", "spoon", "probe", "crepe", "knack", "force", "debut", "order", "haste", "teeth", "agent", "widen", "icily", "slice", "ingot", "clash", "juror", "blood", "abode", "throw", "unity", "pivot", "slept", "troop", "spare", "sewer", "parse", "morph", "cacti", "tacky", "spool", "demon", "moody", "annex", "begin", "fuzzy", "patch", "water", "lumpy", "admin", "omega", "limit", "tabby", "macho", "aisle", "skiff", "basis", "plank", "verge", "botch", "crawl", "lousy", "slain", "cubic", "raise", "wrack", "guide", "foist", "cameo", "under", "actor", "revue", "fraud", "harpy", "scoop", "climb", "refer", "olden", "clerk", "debar", "tally", "ethic", "cairn", "tulle", "ghoul", "hilly", "crude", "apart", "scale", "older", "plain", "sperm", "briny", "abbot", "rerun", "quest", "crisp", "bound", "befit", "drawn", "suite", "itchy", "cheer", "bagel", "guess", "broad", "axiom", "chard", "caput", "leant", "harsh", "curse", "proud", "swing", "opine", "taste", "lupus", "gumbo", "miner", "green", "chasm", "lipid", "topic", "armor", "brush", "crane", "mural", "abled", "habit", "bossy", "maker", "dusky", "dizzy", "lithe", "brook", "jazzy", "fifty", "sense", "giant", "surly", "legal", "fatal", "flunk", "began", "prune", "small", "slant", "scoff", "torus", "ninny", "covey", "viper", "taken", "moral", "vogue", "owing", "token", "entry", "booth", "voter", "chide", "elfin", "ebony", "neigh", "minim", "melon", "kneed", "decoy", "voila", "ankle", "arrow", "mushy", "tribe", "cease", "eager", "birth", "graph", "odder", "terra", "weird", "tried", "clack", "color", "rough", "weigh", "uncut", "ladle", "strip", "craft", "minus", "dicey", "titan", "lucid", "vicar", "dress", "ditch", "gypsy", "pasta", "taffy", "flame", "swoop", "aloof", "sight", "broke", "teary", "chart", "sixty", "wordy", "sheer", "leper", "nosey", "bulge", "savor", "clamp", "funky", "foamy", "toxic", "brand", "plumb", "dingy", "butte", "drill", "tripe", "bicep", "tenor", "krill", "worse", "drama", "hyena", "think", "ratio", "cobra", "basil", "scrum", "bused", "phone", "court", "camel", "proof", "heard", "angel", "petal", "pouty", "throb", "maybe", "fetal", "sprig", "spine", "shout", "cadet", "macro", "dodgy", "satyr", "rarer", "binge", "trend", "nutty", "leapt", "amiss", "split", "myrrh", "width", "sonar", "tower", "baron", "fever", "waver", "spark", "belie", "sloop", "expel", "smote", "baler", "above", "north", "wafer", "scant", "frill", "awash", "snack", "scowl", "frail", "drift", "limbo", "fence", "motel", "ounce", "wreak", "revel", "talon", "prior", "knelt", "cello", "flake", "debug", "anode", "crime", "salve", "scout", "imbue", "pinky", "stave", "vague", "chock", "fight", "video", "stone", "teach", "cleft", "frost", "prawn", "booty", "twist", "apnea", "stiff", "plaza", "ledge", "tweak", "board", "grant", "medic", "bacon", "cable", "brawl", "slunk", "raspy", "forum", "drone", "women", "mucus", "boast", "toddy", "coven", "tumor", "truer", "wrath", "stall", "steam", "axial", "purer", "daily", "trail", "niche", "mealy", "juice", "nylon", "plump", "merry", "flail", "papal", "wheat", "berry", "cower", "erect", "brute", "leggy", "snipe", "sinew", "skier", "penny", "jumpy", "rally", "umbra", "scary", "modem", "gross", "avian", "greed", "satin", "tonic", "parka", "sniff", "livid", "stark", "trump", "giddy", "reuse", "taboo", "avoid", "quote", "devil", "liken", "gloss", "gayer", "beret", "noise", "gland", "dealt", "sling", "rumor", "opera", "thigh", "tonga", "flare", "wound", "white", "bulky", "etude", "horse", "circa", "paddy", "inbox", "fizzy", "grain", "exert", "surge", "gleam", "belle", "salvo", "crush", "fruit", "sappy", "taker", "tract", "ovine", "spiky", "frank", "reedy", "filth", "spasm", "heave", "mambo", "right", "clank", "trust", "lumen", "borne", "spook", "sauce", "amber", "lathe", "carat", "corer", "dirty", "slyly", "affix", "alloy", "taint", "sheep", "kinky", "wooly", "mauve", "flung", "yacht", "fried", "quail", "brunt", "grimy", "curvy", "cagey", "rinse", "deuce", "state", "grasp", "milky", "bison", "graft", "sandy", "baste", "flask", "hedge", "girly", "swash", "boney", "coupe", "endow", "abhor", "welch", "blade", "tight", "geese", "miser", "mirth", "cloud", "cabal", "leech", "close", "tenth", "pecan", "droit", "grail", "clone", "guise", "ralph", "tango", "biddy", "smith", "mower", "payee", "serif", "drape", "fifth", "spank", "glaze", "allot", "truck", "kayak", "virus", "testy", "tepee", "fully", "zonal", "metro", "curry", "grand", "banjo", "axion", "bezel", "occur", "chain", "nasal", "gooey", "filer", "brace", "allay", "pubic", "raven", "plead", "gnash", "flaky", "munch", "dully", "eking", "thing", "slink", "hurry", "theft", "shorn", "pygmy", "ranch", "wring", "lemon", "shore", "mamma", "froze", "newer", "style", "moose", "antic", "drown", "vegan", "chess", "guppy", "union", "lever", "lorry", "image", "cabby", "druid", "exact", "truth", "dopey", "spear", "cried", "chime", "crony", "stunk", "timid", "batch", "gauge", "rotor", "crack", "curve", "latte", "witch", "bunch", "repel", "anvil", "soapy", "meter", "broth", "madly", "dried", "scene", "known", "magma", "roost", "woman", "thong", "punch", "pasty", "downy", "knead", "whirl", "rapid", "clang", "anger", "drive", "goofy", "email", "music", "stuff", "bleep", "rider", "mecca", "folio", "setup", "verso", "quash", "fauna", "gummy", "happy", "newly", "fussy", "relic", "guava", "ratty", "fudge", "femur", "chirp", "forte", "alibi", "whine", "petty", "golly", "plait", "fleck", "felon", "gourd", "brown", "thrum", "ficus", "stash", "decry", "wiser", "junta", "visor", "daunt", "scree", "impel", "await", "press", "whose", "turbo", "stoop", "speak", "mangy", "eying", "inlet", "crone", "pulse", "mossy", "staid", "hence", "pinch", "teddy", "sully", "snore", "ripen", "snowy", "attic", "going", "leach", "mouth", "hound", "clump", "tonal", "bigot", "peril", "piece", "blame", "haute", "spied", "undid", "intro", "basal", "shine", "gecko", "rodeo", "guard", "steer", "loamy", "scamp", "scram", "manly", "hello", "vaunt", "organ", "feral", "knock", "extra", "condo", "adapt", "willy", "polka", "rayon", "skirt", "faith", "torso", "match", "mercy", "tepid", "sleek", "riser", "twixt", "peace", "flush", "catty", "login", "eject", "roger", "rival", "untie", "refit", "aorta", "adult", "judge", "rower", "artsy", "rural", "shave"]

// zhs*
export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('wordleGame')
  // htmlStyle* bl* cl*
  const htmlAfterStyle = `
</head>
<body>

<body class="${config.isDarkThemeEnabled ? 'dark' : ''} ${config.isHighContrastThemeEnabled ? 'colorblind' : ''}">
<div>
  <div class="MomentSystem-module_moment__G9hyw">
    <div class="App-module_gameContainer__K_CBh" data-testid="game-wrapper" style="height: calc(100% - 210px);">
      <main class="App-module_game__yruqo" id="wordle-app-game">
        <div class="Board-module_boardContainer__TBHNL" style="overflow: unset;">`
  // tzb*
  ctx.model.extend('wordle_game_records', {
    id: 'unsigned',
    channelId: 'string',
    isStarted: 'boolean',
    remainingGuessesCount: 'integer',
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
    remainingWordsList: 'list',
    isAbsurd: 'boolean',
    isChallengeMode: 'boolean',
    targetWord: 'string',
    wordlesNum: 'unsigned',
    wordleIndex: 'unsigned',
    isWin: 'boolean',
    isUltraHardMode: 'boolean',
    presentLettersWithIndex: 'list',
  }, {
    primary: 'id',
    autoInc: true,
  })
  ctx.model.extend('extra_wordle_game_records', {
    id: 'unsigned',
    channelId: 'string',
    wordAnswerChineseDefinition: 'string',
    wordGuess: 'string',
    wordGuessHtmlCache: 'text',
    guessWordLength: 'unsigned',
    gameMode: 'string',
    timestamp: {type: 'integer', length: 20},
    correctLetters: 'list',
    presentLetters: 'string',
    absentLetters: 'string',
    wordlesNum: 'unsigned',
    wordleIndex: 'unsigned',
    isWin: 'boolean',
    remainingGuessesCount: 'integer',
    presentLettersWithIndex: 'list',
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
    stats: {type: 'json', initial: initialStats},
    fastestGuessTime: {type: 'json', initial: initialFastestGuessTime},
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
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      await session.execute(`wordleGame -h`)
    })
  // wordleGame.加入 j* jr*
  ctx.command('wordleGame.加入 [money:number]', '加入游戏')
    .action(async ({session}, money = 0) => {
      const {channelId, userId, username, user} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      let gameInfo: any = await getGameInfo(channelId)
      const isInGame = await isPlayerInGame(channelId, userId);
      if (gameInfo.isStarted) {
        if (!isInGame) {
          return await sendMessage(session, `【@${username}】\n不好意思你来晚啦~\n游戏已经开始了呢！`)
        } else {
          const wordlesNum = gameInfo.wordlesNum
          const isAbsurd = gameInfo.isAbsurd
          // 生成 html 字符串
          let imageBuffers: Buffer[] = [];
          let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
          for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
            if (wordleIndex > 1) {
              gameInfo = await getGameInfo2(channelId, wordleIndex)
            }
            const emptyGridHtml = isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
            const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
            // 图
            imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
            imageBuffers.push(imageBuffer);
          }
          if (wordlesNum > 1) {
            const htmlImgString = generateImageTags(imageBuffers);
            imageBuffer = await generateWordlesImage(htmlImgString);
          }
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
      const {channelId, userId, username, timestamp} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      // 游戏状态
      const gameInfo = await getGameInfo(channelId)
      if (!gameInfo.isStarted) {
        return await sendMessage(session, `【@${username}】\n游戏还没开始哦~怎么结束呐？`);
      }
      // 玩家记录输
      await updatePlayerRecordsLose(channelId, gameInfo)
      // 结束
      const processedResult: string = gameInfo.wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
      await endGame(channelId)
      const duration = calculateGameDuration(gameInfo.timestamp, timestamp);
      const message = `【@${username}】\n由于您执行了操作：【结束】\n游戏已结束！\n${duration}${gameInfo.isAbsurd ? '' : `\n${generateGameEndMessage(gameInfo)}`}${processedResult}`;
      return await sendMessage(session, message);
      // .action
    })
  // wordleGame.开始 s* ks*
  ctx.command('wordleGame.开始 [guessWordLength:number]', '开始游戏引导')
    .option('hard', '--hard 困难模式', {fallback: false})
    .option('ultraHardMode', '--uhard 超困难模式', {fallback: false})
    .option('absurd', '--absurd 变态模式', {fallback: false})
    .option('challenge', '--challenge 变态挑战模式', {fallback: false})
    .option('wordles', '--wordles <value:number> 同时猜测多个单词', {fallback: 1})
    .action(async ({session, options}, guessWordLength) => {
      const {channelId, userId, username} = session;
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username);
      if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
        return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`);
      }
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
        if (!guessWordLength) {
          if (config.shouldPromptWordLengthInput && selectedExam !== '经典' && selectedExam !== 'Lewdle') {
            await sendMessage(session, `【@${username}】\n请输入猜单词的长度：`);
            const userInput = await session.prompt();
            if (!userInput) return await sendMessage(session, `【@${username}】\n输入超时！`);
            guessWordLength = parseInt(userInput)
          } else {
            guessWordLength = config.defaultWordLengthForGuessing
          }
        }
        const hardOption = options.hard ? ` --hard` : '';
        const uhardOption = options.ultraHardMode ? ` --uhard` : '';
        const absurdOption = options.absurd ? ` --absurd` : '';
        const challengeOption = options.challenge ? ` --challenge` : '';
        const wordlesOption = options.wordles > 1 ? `--wordles ${options.wordles}` : '';
        const command = `wordleGame.开始.${selectedExam}${hardOption}${uhardOption}${absurdOption}${challengeOption}${wordlesOption} ${guessWordLength}`;
        return await session.execute(command);
      } else {
        return await sendMessage(session, `【@${username}】\n无效的输入！`);
      }
      // .action
    });
  // wordleGame.开始.经典 jd*
  ctx.command('wordleGame.开始.经典', '开始经典猜单词游戏')
    .option('hard', '--hard 困难模式', {fallback: false})
    .option('ultraHardMode', '--uhard 超困难模式', {fallback: false})
    .option('absurd', '--absurd 变态模式', {fallback: false})
    .option('challenge', '--challenge 变态挑战模式', {fallback: false})
    .option('wordles', '--wordles <value:number> 同时猜测多个单词', {fallback: 1})
    .action(async ({session, options}) => {
      const {channelId, userId, username, platform, timestamp} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
        return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`);
      }
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
      // 随机选择一个单词并小写化
      const selectedWords: string[] = [];
      const randomWord: string = lowerCaseWordArray[Math.floor(Math.random() * lowerCaseWordArray.length)].toLowerCase();
      selectedWords.push(randomWord);

      let isHardMode = options.hard;
      let isUltraHardMode = options.ultraHardMode;
      let isChallengeMode = options.challenge;
      let isAbsurdMode = isChallengeMode ? true : options.absurd;
      const wordlesNum = options.wordles
      if (isUltraHardMode) {
        isHardMode = true
      }
      if (wordlesNum > 1) {
        isHardMode = false
        isUltraHardMode = false
        isChallengeMode = false
        isAbsurdMode = false
      }


      const correctLetters: string[] = new Array(5).fill('*');

      const foundWord = findWord(randomWord)

      await ctx.database.set('wordle_game_records', {channelId}, {
        isStarted: true,
        wordGuess: randomWord,
        wordAnswerChineseDefinition: replaceEscapeCharacters(foundWord.translation),
        remainingGuessesCount: 6 + wordlesNum - 1,
        guessWordLength: 5,
        gameMode: '经典',
        timestamp: timestamp,
        isHardMode: isHardMode,
        isUltraHardMode,
        correctLetters: correctLetters,
        presentLetters: '',
        absentLetters: '',
        isAbsurd: isAbsurdMode,
        isChallengeMode: isChallengeMode,
        targetWord: randomWord,
        wordlesNum: wordlesNum,
        wordleIndex: 1,
      })

      if (wordlesNum > 1) {
        let randomWordExtra: string = ''
        for (let wordleIndex = 2; wordleIndex < wordlesNum + 1; wordleIndex++) {
          while (selectedWords.length < wordleIndex) {
            randomWordExtra = lowerCaseWordArray[Math.floor(Math.random() * lowerCaseWordArray.length)].toLowerCase();
            if (!selectedWords.includes(randomWordExtra)) {
              selectedWords.push(randomWordExtra);
            }
          }
          const foundWordExtra = findWord(randomWordExtra)
          await ctx.database.create('extra_wordle_game_records', {
            channelId,
            remainingGuessesCount: 6 + wordlesNum - 1,
            guessWordLength: 5,
            wordGuess: randomWordExtra,
            wordAnswerChineseDefinition: replaceEscapeCharacters(foundWordExtra.translation),
            gameMode: '经典',
            timestamp: timestamp,
            correctLetters: correctLetters,
            presentLetters: '',
            absentLetters: '',
            wordlesNum: wordlesNum,
            wordleIndex,
          })
        }
      }
      // 游戏图
      const emptyGridHtml = isAbsurdMode ? generateEmptyGridHtml(1, 5) : generateEmptyGridHtml(6 + wordlesNum - 1, 5);
      const styledHtml = generateStyledHtml(6);
      let imageBuffer = await generateImage(styledHtml, emptyGridHtml);
      let imageBuffers: Buffer[] = [];
      if (wordlesNum > 1) {
        for (let wordleIndex = 0; wordleIndex < wordlesNum; wordleIndex++) {
          imageBuffers.push(imageBuffer);
        }
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(htmlImgString);
      }

      const gameMode = `【经典${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurdMode ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】`;
      const targetWord = isChallengeMode ? `\n目标单词为：【${randomWord}】` : '';
      const wordLength = '单词长度为：【5】';
      const guessChance = `猜单词机会为：【${isAbsurdMode ? '♾️' : `${6 + wordlesNum - 1}`}】`;
      const wordCount = '待猜单词数量为：【2315】';
      const timeLimit = config.enableWordGuessTimeLimit ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒` : '';
      const image = h.image(imageBuffer, `image/${config.imageType}`);

      const message = `游戏开始！\n当前游戏模式为：${gameMode}${isChallengeMode ? targetWord : ''}\n${wordLength}\n${guessChance}\n${wordCount}${timeLimit}\n${image}`;

      return await sendMessage(session, message);
      // .action
    })
  const exams = [
    "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle",
  ];
  exams.forEach((exam) => {
    if (exam !== "经典") {
      // 10* fjd*
      ctx.command(`wordleGame.开始.${exam} [guessWordLength:number]`, `开始猜${exam}单词游戏`)
        .option('hard', '--hard 困难模式', {fallback: false})
        .option('ultraHardMode', '--uhard 超困难模式', {fallback: false})
        .option('absurd', '--absurd 变态模式', {fallback: false})
        .option('challenge', '--challenge 变态挑战模式', {fallback: false})
        .option('wordles', '--wordles <value:number> 同时猜测多个单词', {fallback: 1})
        .action(async ({session, options}, guessWordLength) => {
          const {channelId, username, userId} = session
          // 更新玩家记录表中的用户名
          await updateNameInPlayerRecord(userId, username)
          if (!guessWordLength) {
            if (config.shouldPromptForWordLengthOnNonClassicStart && exam !== 'Lewdle') {
              await sendMessage(session, `【@${session.username}】\n请输入猜单词的长度：`);
              const userInput = await session.prompt();
              if (!userInput) return await sendMessage(session, `【@${session.username}】\n输入超时！`);
              guessWordLength = parseInt(userInput)
            } else {
              guessWordLength = config.defaultWordLengthForGuessing
            }
          }
          return startWordleGame(exam, guessWordLength, session, options);
        });
    }
  })
  // wordleGame.猜 c* cdc*
  ctx.command('wordleGame.猜 [inputWord:text]', '猜单词')
    .option('random', '-r 随机单词', {fallback: false})
    .action(async ({session, options}, inputWord) => {
      const {channelId, userId, username, platform, timestamp} = session
      // 游戏状态
      let gameInfo: any = await getGameInfo(channelId)
      // 操作太快
      if (gameInfo.isRunning === true) {
        return await sendMessage(session, `【@${username}】\n操作太快了哦~\n再试一次吧！`);
      }
      if (options.random) {
        inputWord = getRandomWordTranslation('ALL', gameInfo.guessWordLength).word
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
      const timeDifferenceInSeconds = (timestamp - gameInfo.timestamp) / 1000; // 将时间戳转换为秒
      if (config.enableWordGuessTimeLimit) {
        if (timeDifferenceInSeconds > config.wordGuessTimeLimitInSeconds) {
          // // 生成 html 字符串
          // const emptyGridHtml = gameInfo.isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount, gameInfo.guessWordLength);
          // const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          // // 图
          // const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
          // 玩家记录输
          await updatePlayerRecordsLose(channelId, gameInfo)
          await endGame(channelId)
          await setGuessRunningStatus(channelId, false)
          return await sendMessage(session, `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~`)
          // return await sendMessage(session, `【@${username}】\n作答时间超过【${config.wordGuessTimeLimitInSeconds}】秒！\n很遗憾，你们输了!\n下次猜快点吧~\n${h.image(imageBuffer, `image/${config.imageType}`)}`)
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
      let {
        correctLetters,
        presentLetters,
        isHardMode,
        absentLetters,
        isAbsurd,
        remainingWordsList,
        gameMode,
        guessWordLength,
        isChallengeMode,
        targetWord,
        wordlesNum,
        isUltraHardMode,
        presentLettersWithIndex,
      } = gameInfo;
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
        const processedResult = wordlesNum > 1 ? '\n' + await processExtraGameInfos(channelId) : '';
        const progressMessage = `当前${calculateGameDuration(gameInfo.timestamp, timestamp)}\n当前进度：【${correctLetters.join('')}】${presentLettersWithoutAsterisk.length === 0 ? `` : `\n包含字母：【${presentLettersWithoutAsterisk}】`}${absentLetters.length === 0 ? '' : `\n不包含字母：【${absentLetters}】`}${processedResult}`;
        return await sendMessage(session, `${usernameMention}\n${inputLengthMessage}\n${progressMessage}`);
      }
      // 是否存在该单词
      // 小写化
      const lowercaseInputWord = inputWord.toLowerCase();
      const foundWord = findWord(lowercaseInputWord)
      if (!foundWord) {
        await setGuessRunningStatus(channelId, false)
        return await sendMessage(session, `【@${username}】\n你确定存在这样的单词吗？`);
      }
      // 困难模式
      if (isHardMode) {
        let isInputWordWrong = false;
        // 包含
        const containsAllLetters = lowercaseInputWord.split('').filter(letter => presentLetters.includes(letter) && letter !== '*');
        if (mergeSameLetters(containsAllLetters).length !== presentLetters.length && presentLetters.length !== 0) {
          isInputWordWrong = true;
        }
        // 正确
        for (let i = 0; i < lowercaseInputWord.length; i++) {
          if (correctLetters[i] !== '*' && correctLetters[i] !== lowercaseInputWord[i] && correctLetters.some(letter => letter !== '*')) {
            isInputWordWrong = true;
            break;
          }
        }
        // 不包含 灰色的线索必须被遵守  超困难
        if (isUltraHardMode && absentLetters.length !== 0 && checkAbsentLetters(lowercaseInputWord, absentLetters)) {
          isInputWordWrong = true;
        }
        // 黄色字母必须远离它们被线索的地方 超困难
        if (isUltraHardMode && presentLettersWithIndex.length !== 0 && checkPresentLettersWithIndex(lowercaseInputWord, presentLettersWithIndex)) {
          isInputWordWrong = true
        }
        if (isInputWordWrong) {
          await setGuessRunningStatus(channelId, false);
          const difficulty = isUltraHardMode ? '超困难' : '困难';
          const rule = `绿色字母必须保特固定，黄色字母必须重复使用。${isUltraHardMode ? `\n黄色字母必须远离它们被线索的地方，灰色的线索必须被遵守。` : ''}`

          const message = `【@${username}】\n当前难度为：【${difficulty}】\n【${difficulty}】：${rule}\n您输入的单词字母不符合要求！\n您的输入为：【${inputWord}】\n单词字母要求：【${correctLetters.join('')}】${presentLetters.length === 0 ? `` : `\n包含字母：【${presentLetters}】`}${absentLetters.length === 0 || !isUltraHardMode ? `` : `\n不包含字母：【${absentLetters}】`}${presentLettersWithIndex.length === 0 || !isUltraHardMode ? `` : `\n黄色字母远离：【${presentLettersWithIndex.join(', ')}】`}`;

          return await sendMessage(session, message);
        }
      }
      // 初始化输
      let isLose = false
      // 变态模式
      if (isAbsurd) {
        let wordsList: string[];
        if (remainingWordsList.length === 0) {
          if (gameMode === '经典') {
            wordsList = lowerCaseWordArray;
          } else {
            const fileData = getJsonFilePathAndWordCountByLength(gameMode, guessWordLength);
            if (gameMode === "ALL") {
              const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
              wordsList = extractLowerCaseWords(jsonData)
            } else {
              const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));
              wordsList = Object.keys(jsonData).map(word => word.toLowerCase());
            }
          }
        } else {
          wordsList = remainingWordsList;
        }
        let longestRemainingWordList = await findLongestMatchedWords(wordsList, lowercaseInputWord, targetWord, isChallengeMode);
        if (!longestRemainingWordList) {
          longestRemainingWordList = []
        } else {
          while (isChallengeMode && wordsList.includes(targetWord) && longestRemainingWordList && longestRemainingWordList.length === 1 && longestRemainingWordList[0] !== targetWord) {
            longestRemainingWordList = await findLongestMatchedWords(wordsList, lowercaseInputWord, targetWord, isChallengeMode);
          }

          // 变态挑战模式
          if (isChallengeMode) {
            isLose = !longestRemainingWordList.includes(targetWord);
          }
        }
        if (longestRemainingWordList.length === 0) {
          await updatePlayerRecordsLose(channelId, gameInfo)
          await endGame(channelId)
          return await sendMessage(session, `【@${username}】\n根据透露出的信息！\n已经无任何可用单词！\n很遗憾，你们输了！`);
        }
        let randomWord = longestRemainingWordList[Math.floor(Math.random() * longestRemainingWordList.length)];
        const foundWord = findWord(randomWord)
        if (isLose && isChallengeMode) {
          // 生成 html 字符串
          const letterTilesHtml = '<div class="Row-module_row__pwpBq">' + await generateLetterTilesHtml(foundWord.word.toLowerCase(), inputWord, channelId, 1, gameInfo) + '</div>';
          const emptyGridHtml = isAbsurd ? generateEmptyGridHtml(1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.remainingGuessesCount - 1, gameInfo.guessWordLength);
          const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
          // 图
          const imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}`);
          await sendMessage(session, `【@${username}】\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n您可选择的操作有：【撤销】和【结束】\n\n【撤销】：回到上一步。\n\n注意：无效输入将自动选择【撤销】操作。`);
          let userInput = await session.prompt()
          // 生成 html 字符串
          // 图
          const imageBuffer2 = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}\n${emptyGridHtml}`);
          if (!userInput) {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `【@${username}】\n输入超时！\n已自动选择【撤销】操作。\n${h.image(imageBuffer2, `image/${config.imageType}`)}`);
          }
          if (userInput === '结束') {
            await session.execute(`wordleGame.结束`)
            return
          } else {
            await setGuessRunningStatus(channelId, false)
            return await sendMessage(session, `【@${username}】\n您执行了操作：【撤销】\n撤销成功！挑战继续！\n${h.image(imageBuffer2, `image/${config.imageType}`)}`);
          }
        }
        await ctx.database.set('wordle_game_records', {channelId}, {
          remainingWordsList: longestRemainingWordList,
          wordGuess: foundWord.word.toLowerCase(),
          wordAnswerChineseDefinition: replaceEscapeCharacters(foundWord.translation),
        })
        gameInfo = await getGameInfo(channelId)
      }
      // 胜
      let isWin = false
      if (wordlesNum === 1 && lowercaseInputWord === gameInfo.wordGuess) {
        isWin = true
      }
      let isWinNum = 0
      // 生成 html 字符串
      let imageBuffers: Buffer[] = [];
      let imageBuffer: Buffer = Buffer.from('initial value', 'utf-8');
      for (let wordleIndex = 1; wordleIndex < wordlesNum + 1; wordleIndex++) {
        if (wordleIndex > 1) {
          gameInfo = await getGameInfo2(channelId, wordleIndex)
        }
        const isWin = lowercaseInputWord === gameInfo.wordGuess
        if (isWin || gameInfo.isWin) {
          ++isWinNum
        }
        // 负
        if (!isWin && gameInfo.remainingGuessesCount - 1 === 0 && !isAbsurd) {
          isLose = true
        }
        const letterTilesHtml = gameInfo.isWin ? '' : '<div class="Row-module_row__pwpBq">' + await generateLetterTilesHtml(gameInfo.wordGuess, inputWord, channelId, wordleIndex, gameInfo) + '</div>';
        const emptyGridHtml = isAbsurd ? generateEmptyGridHtml(isWin ? 0 : 1, gameInfo.guessWordLength) : generateEmptyGridHtml(gameInfo.isWin ? gameInfo.remainingGuessesCount : gameInfo.remainingGuessesCount - 1, gameInfo.guessWordLength);
        const styledHtml = generateStyledHtml(gameInfo.guessWordLength + 1);
        // 图
        imageBuffer = await generateImage(styledHtml, `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n${emptyGridHtml}`);
        imageBuffers.push(imageBuffer);
        // 更新游戏记录
        const remainingGuessesCount = isAbsurd ? gameInfo.remainingGuessesCount : gameInfo.remainingGuessesCount - 1
        if (wordleIndex === 1 && !gameInfo.isWin) {
          await ctx.database.set('wordle_game_records', {channelId}, {
            isWin,
            remainingGuessesCount: remainingGuessesCount,
            wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
          })
        } else if (wordleIndex > 1 && !gameInfo.isWin) {
          await ctx.database.set('extra_wordle_game_records', {channelId, wordleIndex}, {
            isWin,
            remainingGuessesCount: remainingGuessesCount,
            wordGuessHtmlCache: `${gameInfo.wordGuessHtmlCache}${letterTilesHtml}\n`,
          })
        }
      }
      if (wordlesNum > 1) {
        const htmlImgString = generateImageTags(imageBuffers);
        imageBuffer = await generateWordlesImage(htmlImgString);
        if (isWinNum === wordlesNum) {
          isWin = true
        }
      }
      gameInfo = await getGameInfo(channelId)

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
        // 更新最快用时
        if (timeDifferenceInSeconds < playerRecord.fastestGuessTime[gameInfo.gameMode] || playerRecord.fastestGuessTime[gameInfo.gameMode] === 0) {
          playerRecord.fastestGuessTime[gameInfo.gameMode] = Math.floor(timeDifferenceInSeconds);
        }
        await ctx.database.set('wordle_player_records', {userId}, {
          wordGuessCount: playerRecord.wordGuessCount + 1,
          fastestGuessTime: playerRecord.fastestGuessTime
        })

        const processedResult: string = wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
        await endGame(channelId)
        const gameDuration = calculateGameDuration(gameInfo.timestamp, timestamp);
        const imageType = config.imageType;
        const settlementResult = finalSettlementString === '' ? '' : `最终结算结果如下：\n${finalSettlementString}`;

        const message = `
【@${username}】
太棒了，你猜出来了！
${gameDuration}
${h.image(imageBuffer, `image/${imageType}`)}
${generateGameEndMessage(gameInfo)}${processedResult}
${settlementResult}
`;

        return await sendMessage(session, message);
      }
      // 处理输
      if (isLose) {
        // 玩家记录输
        await updatePlayerRecordsLose(channelId, gameInfo)
        const processedResult: string = wordlesNum > 1 ? `\n${await processExtraGameRecords(channelId)}` : '';
        await endGame(channelId)
        const challengeMessage = isChallengeMode ? `\n目标单词为：【${targetWord}】\n它不再是可能的秘密单词！` : '';
        const answerInfo = isChallengeMode ? '' : `\n${generateGameEndMessage(gameInfo)}`;
        const gameDuration = calculateGameDuration(gameInfo.timestamp, timestamp);
        const message = `很遗憾，你们没有猜出来！${challengeMessage}\n但没关系~下次加油哇！\n${h.image(imageBuffer, `image/${config.imageType}`)}\n${gameDuration}${answerInfo}${processedResult}`;

        return await sendMessage(session, message);
      }
      // 继续
      await setGuessRunningStatus(channelId, false)
      return await sendMessage(session, `${h.image(imageBuffer, `image/${config.imageType}`)}`)
      // .action
    })
  // wordleGame.查询玩家记录 cx* cxwjjl*
  ctx.command('wordleGame.查询玩家记录 [targetUser:text]', '查询玩家记录')
    .action(async ({session}, targetUser) => {
      let {userId, username} = session;
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (targetUser) {
        const userIdRegex = /<at id="([^"]+)"(?: name="([^"]+)")?\/>/;
        const match = targetUser.match(userIdRegex);
        userId = match?.[1] ?? userId;
        username = match?.[2] ?? username;
      }

      const targetUserRecord = await ctx.database.get('wordle_player_records', {userId});

      if (targetUserRecord.length === 0) {
        await ctx.database.create('wordle_player_records', {userId, username});
        return sendMessage(session, `查询对象：${username} 无任何游戏记录。`);
      }

      const {
        win,
        lose,
        moneyChange,
        wordGuessCount,
        stats,
        fastestGuessTime
      } = targetUserRecord[0];

      const queryInfo = `【@${session.username}】
查询对象：${username}
猜出单词次数：${wordGuessCount} 次
总胜场：${win} 次
总输场：${lose} 次
损益为：${moneyChange} 点
详细统计信息如下：
${generateStatsInfo(stats, fastestGuessTime)}
    `;

      return sendMessage(session, queryInfo);
    });
  // wordleGame.查询单词 cxdc*
  ctx.command('wordleGame.查询单词 [targetWord:text]', '在ALL词库中查询单词释义')
    .action(async ({session}, targetWord) => {
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      targetWord = targetWord?.trim();
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

      // 寻找
      const foundWord = findWord(targetWord)
      if (!foundWord) {
        return await sendMessage(session, `【@${username}】\n未在ALL词库中找到该单词。`);
      }
      return sendMessage(session, `查询对象：【${targetWord}】\n单词释义如下：\n${replaceEscapeCharacters(foundWord.translation)}`);
    })
  // czdc*
  ctx.command('wordleGame.查找单词 [targetWord:text]', '在WordWord中查找单词定义')
    .action(async ({session}, targetWord) => {
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      targetWord = targetWord?.trim();
      if (!targetWord) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查找的单词】或【取消】：`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入超时！`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查找单词操作已取消。`);
        targetWord = userInput.trim();
      }
      // 判断输入
      if (!/^[a-zA-Z]+$/.test(targetWord)) {
        return await sendMessage(session, `【@${username}】\n输入包含非字母字符，请重新输入！`);
      }

      // 寻找
      fetchWordDefinitions(targetWord)
        .then((responseData) => {
          const definitions = responseData.word.definitions;
          const serializedDefinitions = serializeDefinitions(definitions);
          return sendMessage(session, `${capitalizeFirstLetter(targetWord)} Definitions: \n${serializedDefinitions}`);
        })
        .catch((error) => {
          return sendMessage(session, `【@${username}】\n未在WordWord中找到该单词。`);
        });
    })
  // czcy*
  ctx.command('wordleGame.查找成语 [targetIdiom:text]', '在汉典中查找成语解释')
    .action(async ({session}, targetIdiom) => {
      let {userId, username} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      targetIdiom = targetIdiom?.trim();
      if (!targetIdiom) {
        // 提示输入
        await sendMessage(session, `【@${username}】\n请输入【待查找的成语】或【取消】：`);
        const userInput = await session.prompt();
        if (!userInput) return await sendMessage(session, `【@${username}】\n输入超时！`);
        if (userInput === '取消') return await sendMessage(session, `【@${username}】\n查找成语操作已取消。`);
        targetIdiom = userInput.trim();
      }
      // 判断输入
      if (!isFourCharacterIdiom(targetIdiom)) {
        return await sendMessage(session, `【@${username}】\n您确定您输入的是四字成语吗？`);
      }

      // 寻找
      const idiomInfo = await getIdiomInfo(targetIdiom)
      console.log('pinyin: ',idiomInfo.pinyin)
      console.log('explanation: ',idiomInfo.explanation)
      if (idiomInfo.pinyin === '未找到拼音') {
        return await sendMessage(session, `【@${username}】\n未在汉典中找到该成语。`);
      }
      return await sendMessage(session, `【@${username}】\n【成语】${targetIdiom}\n【拼音】${idiomInfo.pinyin}\n${idiomInfo.explanation}`);
    })
  // dcczq*
  ctx.command('wordleGame.单词查找器 [wordleIndexs:text]', '使用WordFinder查找匹配的单词')
    .option('auto', '-a 自动查找（根据游戏进程）', {fallback: false})
    .option('wordLength', '-l <length> 指定要搜索的单词长度', {fallback: undefined})
    .option('wordWithThreeWildcards', '-w <word> 搜索带有最多三个通配符字符的单词', {fallback: undefined})
    .option('containingLetters', '-c <letters> 搜索包含特定字母组合的单词', {fallback: undefined})
    .option('containingTheseLetters', '--ct <letters> 搜索只包含指定字母的单词', {fallback: undefined})
    .option('withoutTheseLetters', '--wt <letters> 搜索不包含特定字母的单词', {fallback: undefined})
    .option('startingWithTheseLetters', '--sw <letters> 搜索以特定字母开头的单词', {fallback: undefined})
    .option('endingWithTheseLetters', '--ew <letters> 搜索以特定字母结尾的单词', {fallback: undefined})
    .action(async ({session, options}, wordleIndexs) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)

      let {
        auto,
        wordLength,
        wordWithThreeWildcards,
        containingLetters,
        containingTheseLetters,
        withoutTheseLetters,
        startingWithTheseLetters,
        endingWithTheseLetters
      } = options;

      if (auto) {

        const gameInfo = await getGameInfo(channelId)
        const {isStarted, wordlesNum, guessWordLength, absentLetters, presentLetters} = gameInfo
        if (!isStarted) {
          return await sendMessage(session, `【${username}】\n未检测到任何游戏进度！\n无法使用自动查找功能！`);
        }
        if (wordlesNum === 1) {
          await session.execute(`wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`)
        } else {
          let userInput: string = ''
          if (!wordleIndexs) {
            await sendMessage(session, `【${username}】\n检测到当前进度数量为：【${wordlesNum}】\n请输入【待查询序号（从左到右）】：\n支持输入多个（用空格隔开）\n例如：1 2`);
            userInput = await session.prompt()
            if (!userInput) return await sendMessage(session, `【${username}】\n输入超时！`);
          } else {
            userInput = wordleIndexs
          }

          const stringArray = userInput.split(' ');

          for (const element of stringArray) {

            if (!isNaN(Number(element))) {
              const index = parseInt(element);
              if (index > 0 && index <= wordlesNum) {
                if (index === 1) {
                  await session.execute(`wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`)
                } else {
                  const gameInfo2 = await getGameInfo2(channelId, index)
                  const {guessWordLength, absentLetters, presentLetters} = gameInfo2
                  await session.execute(`wordleGame.单词查找器 -l ${guessWordLength} --ct ${presentLetters} --wt ${absentLetters}`)
                }
              } else {
                await session.send(`序号 ${index} 超出范围（1~${wordlesNum}）。`);
                continue;
              }
            } else {
              continue;
            }
            //
          }

          // else
        }
      }

      if (auto) {
        return
      }

      const noOptionsSpecified = !wordLength &&
        !wordWithThreeWildcards &&
        !containingLetters &&
        !containingTheseLetters &&
        !withoutTheseLetters &&
        !startingWithTheseLetters &&
        !endingWithTheseLetters;

      if (noOptionsSpecified) {
        const chineseTutorial = "欢迎使用单词查找器！\n你可以使用以下选项来搜索匹配的单词：\n- 使用 -a 自动查找（根据游戏进程）\n- 使用 -l <length> 指定要搜索的单词长度\n- 使用 -w <word> 搜索带有最多三个通配符字符的单词\n- 使用 -c <letters> 搜索包含特定字母组合的单词\n- 使用 --ct <letters> 搜索只包含指定字母的单词\n- 使用 --wt <letters> 搜索不包含特定字母的单词\n- 使用 --sw <letters> 搜索以特定字母开头的单词\n- 使用 --ew <letters> 搜索以特定字母结尾的单词";
        return await sendMessage(session, chineseTutorial);
      }

      const params = {
        wordLength: wordLength ? `${wordLength}-letter-words` : '',
        wordWithThreeWildcards: wordWithThreeWildcards ? `out-of-${wordWithThreeWildcards}` : '',
        containingLetters: containingLetters ? `containing-${containingLetters}` : '',
        containingTheseLetters: containingTheseLetters ? `with-${containingTheseLetters}` : '',
        withoutTheseLetters: withoutTheseLetters ? `without-${withoutTheseLetters}` : '',
        startingWithTheseLetters: startingWithTheseLetters ? `starting-with-${startingWithTheseLetters}` : '',
        endingWithTheseLetters: endingWithTheseLetters ? `ending-with-${endingWithTheseLetters}` : ''
      };

      const queryParams = Object.values(params).filter(param => param).join('-');

      const url = `https://wordword.org/search/${queryParams}`;
      const result = await fetchAndParseWords(url);
      return await sendMessage(session, `${result}`);
    });
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
      const {
        correctLetters,
        presentLetters,
        isHardMode,
        gameMode,
        guessWordLength,
        absentLetters,
        isAbsurd,
        isChallengeMode,
        targetWord,
        wordlesNum,
        isUltraHardMode,
        presentLettersWithIndex,
      } = gameInfo;
      const usernameMention = `【@${username}】`;
      const inputLengthMessage = `待猜单词的长度为：【${guessWordLength}】`;
      const processedResult = wordlesNum > 1 ? '\n' + await processExtraGameInfos(channelId) : ''
      const progressMessage = `当前${calculateGameDuration(gameInfo.timestamp, timestamp)}\n当前进度：【${correctLetters.join('')}】${presentLetters.length === 0 ? '' : `\n包含字母：【${presentLetters}】`}${absentLetters.length === 0 ? '' : `\n不包含字母：【${absentLetters}】`}${presentLettersWithIndex.length === 0 ? '' : `\n字母位置排除：【${presentLettersWithIndex.join(', ')}】`}${processedResult}`;
      const timeDifferenceInSeconds = (timestamp - gameInfo.timestamp) / 1000;
      let message = `${usernameMention}\n当前游戏模式为：【${gameMode}${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurd ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】${isChallengeMode ? `\n目标单词为：【${targetWord}】` : ''}`;
      if (config.enableWordGuessTimeLimit) {
        message += `\n剩余作答时间：【${timeDifferenceInSeconds}】秒`;
      }
      message += `\n${inputLengthMessage}\n${progressMessage}`;

      return await sendMessage(session, message);

      // .action
    })

  const rankType = [
    "总", "损益", "猜出单词次数", "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle",
  ];

// r* phb*
  ctx.command('wordleGame.排行榜 [number:number]', '查看排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
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
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle",
  ];

  rankType2.forEach(type => {
    // phb*
    ctx.command(`wordleGame.排行榜.${type} [number:number]`, `查看${type}排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        const {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        await updateNameInPlayerRecord(userId, username)
        if (typeof number !== 'number' || isNaN(number) || number < 0) {
          return '请输入大于等于 0 的数字作为排行榜的参数。';
        }
        const rankType3 = [
          "胜场", "输场", "最快用时"
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
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'moneyChange', 'moneyChange', '玩家损益排行榜', number);
    });
  // ccdccs*
  ctx.command('wordleGame.排行榜.猜出单词次数 [number:number]', '查看玩家猜出单词次数排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'wordGuessCount', 'wordGuessCount', '玩家猜出单词次数排行榜', number);
    });
  // zsc*
  ctx.command('wordleGame.排行榜.总.胜场 [number:number]', '查看玩家总胜场排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'win', 'win', '玩家总胜场排行榜', number);
    });
  // zsc*
  ctx.command('wordleGame.排行榜.总.输场 [number:number]', '查看玩家总输场排行榜')
    .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
      const {channelId, username, userId} = session
      // 更新玩家记录表中的用户名
      await updateNameInPlayerRecord(userId, username)
      if (typeof number !== 'number' || isNaN(number) || number < 0) {
        return '请输入大于等于 0 的数字作为排行榜的参数。';
      }
      return await getLeaderboard(session, 'lose', 'lose', '查看玩家总输场排行榜', number);
    });
  const rankType4 = [
    "经典", "CET4", "CET6", "GMAT", "GRE", "IELTS",
    "SAT", "TOEFL", "考研", "专八", "专四", "ALL", "Lewdle",
  ];
  // 注册胜场、输场、用时排行榜指令
  rankType4.forEach((type) => {
    ctx.command(`wordleGame.排行榜.${type}.胜场 [number:number]`, `查看${type}胜场排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        const {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        await updateNameInPlayerRecord(userId, username)
        return await sendMessage(session, await getLeaderboardWinOrLose(type, number, 'win', '胜场'));
      });

    ctx.command(`wordleGame.排行榜.${type}.输场 [number:number]`, `查看${type}输场排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        const {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        await updateNameInPlayerRecord(userId, username)
        return await sendMessage(session, await getLeaderboardWinOrLose(type, number, 'lose', '输场'));
      });

    ctx.command(`wordleGame.排行榜.${type}.最快用时 [number:number]`, `查看${type}最快用时排行榜`)
      .action(async ({session}, number = config.defaultMaxLeaderboardEntries) => {
        const {channelId, username, userId} = session
        // 更新玩家记录表中的用户名
        await updateNameInPlayerRecord(userId, username)
        return await sendMessage(session, await getLeaderboardFastestGuessTime(type, number));
      });
  });


  // ch*
  async function processExtraGameInfos(channelId: string): Promise<string> {
    const extraGameInfos: ExtraGameRecord[] = await ctx.database.get('extra_wordle_game_records', {channelId});

    return extraGameInfos
      .map(({correctLetters, presentLetters, absentLetters, presentLettersWithIndex}) => {
        const present = presentLetters.length === 0 ? '' : `\n包含字母：【${presentLetters}】`;
        const absent = absentLetters.length === 0 ? '' : `\n不包含字母：【${absentLetters}】`;
        const presentWithoutIndex = presentLettersWithIndex.length === 0 ? '' : `\n字母位置排除：【${presentLettersWithIndex.join(', ')}】`;
        return `\n当前进度：【${correctLetters.join('')}】${present}${absent}${presentWithoutIndex}`;
      })
      .join('\n');
  }

  async function processExtraGameRecords(channelId: string): Promise<string> {
    const extraGameInfos: ExtraGameRecord[] = await ctx.database.get('extra_wordle_game_records', {channelId})

    const resultStrings: string[] = extraGameInfos.map(info => {
      return `\n答案是：【${info.wordGuess}】\n单词释义如下：\n${info.wordAnswerChineseDefinition}`
    })

    return resultStrings.join('\n')
  }

  async function generateWordlesImage(htmlImgString: string,) {
    const page = await ctx.puppeteer.page();
    await page.setViewport({
      width: config.compositeImagePageWidth,
      height: config.compositeImagePageHeight,
      deviceScaleFactor: 1
    })
    const filePath = path.join(__dirname, 'emptyHtml.html').replace(/\\/g, '/');
    await page.goto('file://' + filePath);

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <style>
            .image-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: space-between;
                align-items: center;
            }
            .image-container img {
                max-width: 100%;
                /*margin-top: 20px;*/
                /*margin-bottom: 20px;*/
            }
        </style>
        <script>
            window.onload = function() {
                var imageContainer = document.querySelector('.image-container');
                var images = imageContainer.getElementsByTagName('img');

                if (images.length > 4) {
                    for (var i = 0; i < images.length; i++) {
                        images[i].style.width = "calc(25% - 15px)";
                    }
                } else {
                    for (var i = 0; i < images.length; i++) {
                        images[i].style.width = "calc(50% - 10px)";
                    }
                }
            };
        </script>
    </head>
    <body>
    <div class="image-container">
    ${htmlImgString}
    </div>
    </body>
    </html>`;

    await page.setContent(html, {waitUntil: 'load'});
    const wordlesImageBuffer = await page.screenshot({fullPage: true, type: config.imageType});

    await page.close();

    return wordlesImageBuffer;
  }

  async function getLeaderboardWinOrLose(type, number, statKey, label) {
    if (typeof number !== 'number' || isNaN(number) || number < 0) {
      return '请输入大于等于 0 的数字作为排行榜的参数。';
    }
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});

    // 降序排序
    getPlayers.sort((a, b) => (b.stats[type]?.[statKey] || 0) - (a.stats[type]?.[statKey] || 0));

    const leaderboard: string[] = getPlayers.slice(0, number).map((player, index) => `${index + 1}. ${player.username}：${player.stats[type]?.[statKey]} 次`);

    return `${type}模式${label}排行榜：\n${leaderboard.join('\n')}`;
  }

  async function getLeaderboardFastestGuessTime(type: string, number: number) {
    const getPlayers: PlayerRecord[] = await ctx.database.get('wordle_player_records', {});
    const leaderboard = getPlayers
      .filter(player => player.fastestGuessTime[type] > 0)
      .sort((a, b) => a.fastestGuessTime[type] - b.fastestGuessTime[type])
      .slice(0, number)
      .map((player, index) => `${index + 1}. ${player.username}：${formatGameDuration2(player.fastestGuessTime[type])}`)
      .join('\n');

    return `${type}模式最快用时排行榜：\n${leaderboard}`;
  };

  async function generateLetterTilesHtml(wordGuess: string, inputWord: string, channelId: string, wordleIndex: number, gameInfo: GameRecord | ExtraGameRecord): Promise<string> {
    const wordHtml: string[] = new Array(inputWord.length);
    const letterCountMap: { [key: string]: number } = {};

    const correctLetters: string[] = gameInfo.correctLetters;
    let presentLetters = gameInfo.presentLetters
    let absentLetters = gameInfo.absentLetters
    let presentLettersWithIndex = gameInfo.presentLettersWithIndex


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
            presentLettersWithIndex.push(`${letter}-${i + 1}`)
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

    const setWordleGameRecord = async (collection: any, keys: any) => {
      await ctx.database.set(collection, keys, {
        correctLetters,
        presentLetters: uniqueSortedLowercaseLetters(presentLetters),
        absentLetters: removeLetters(gameInfo.wordGuess, uniqueSortedLowercaseLetters(absentLetters)),
        presentLettersWithIndex,
      });
    };

    if (wordleIndex === 1) {
      await setWordleGameRecord('wordle_game_records', {channelId});
    } else {
      await setWordleGameRecord('extra_wordle_game_records', {channelId, wordleIndex});
    }
    return wordHtml.join("\n");
  }

  async function setGuessRunningStatus(channelId: string, isRunning: boolean): Promise<void> {
    await ctx.database.set('wordle_game_records', {channelId}, {isRunning});
  }

  async function endGame(channelId: string) {
    await Promise.all([
      ctx.database.remove('wordle_gaming_player_records', {channelId}),
      ctx.database.remove('wordle_game_records', {channelId}),
      ctx.database.remove('extra_wordle_game_records', {channelId}),
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

  async function getGameInfo2(channelId: string, wordleIndex: number): Promise<ExtraGameRecord> {
    const gameRecord = await ctx.database.get('extra_wordle_game_records', {channelId, wordleIndex});
    return gameRecord[0];
  }

  async function updateNameInPlayerRecord(userId: string, username: string): Promise<void> {
    const userRecord = await ctx.database.get('wordle_player_records', {userId});

    if (userRecord.length === 0) {
      await ctx.database.create('wordle_player_records', {
        userId,
        username,
      });
      return;
    }

    const existingRecord = userRecord[0];

    if (username !== existingRecord.username) {
      await ctx.database.set('wordle_player_records', {userId}, {username});
    }

    if (!existingRecord.stats.hasOwnProperty("Lewdle")) {
      existingRecord.stats["Lewdle"] = {win: 0, lose: 0};
      await ctx.database.set('wordle_player_records', {userId}, {stats: existingRecord.stats});
    }

    if (!existingRecord.fastestGuessTime.hasOwnProperty("Lewdle")) {
      existingRecord.fastestGuessTime["Lewdle"] = 0;
      await ctx.database.set('wordle_player_records', {userId}, {fastestGuessTime: existingRecord.fastestGuessTime});
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

    if (typeof options.wordles !== 'number' || options.wordles < 1 || options.wordles > config.maxSimultaneousGuesses) {
      return await sendMessage(session, `【@${username}】\n您输入的参数值无效！\n如果您想同时猜测多个单词~\n输入范围应在 1 ~ ${config.maxSimultaneousGuesses} 之间！`);
    }

    // 判断输入
    if (typeof guessWordLength !== 'number' || !isValidGuessWordLength(command, guessWordLength) && command !== 'Lewdle') {
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

    const selectedWords: string[] = [];
    // 开始游戏
    let randomWord: string = ''
    let translation: string = ''
    let wordCount: number = 0
    if (command === 'Lewdle') {
      const randomLowerCaseWord = getRandomLowerCaseWord(badWordsList);
      guessWordLength = randomLowerCaseWord.length
      const foundWord = findWord(randomLowerCaseWord)
      randomWord = randomLowerCaseWord
      translation = foundWord ? foundWord.translation : ''
    } else {
      const result = getRandomWordTranslation(command, guessWordLength);
      randomWord = result.word
      translation = result.translation
      wordCount = result.wordCount
    }
    selectedWords.push(randomWord);
    let isHardMode = options.hard;
    let isUltraHardMode = options.ultraHardMode;
    let isChallengeMode = options.challenge;
    let isAbsurdMode = isChallengeMode ? true : options.absurd;
    const wordlesNum = options.wordles
    if (isUltraHardMode) {
      isHardMode = true
    }
    if (wordlesNum > 1) {
      isHardMode = false
      isUltraHardMode = false
      isChallengeMode = false
      isAbsurdMode = false
    }

    const correctLetters: string[] = new Array(guessWordLength).fill('*');

    await ctx.database.set('wordle_game_records', {channelId}, {
      isStarted: true,
      wordGuess: randomWord,
      wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
      remainingGuessesCount: guessWordLength + 1 + wordlesNum - 1,
      guessWordLength,
      gameMode: command,
      timestamp: timestamp,
      isHardMode: isHardMode,
      isUltraHardMode,
      correctLetters: correctLetters,
      presentLetters: '',
      absentLetters: '',
      isAbsurd: isAbsurdMode,
      isChallengeMode: isChallengeMode,
      targetWord: randomWord,
      wordlesNum: wordlesNum,
      wordleIndex: 1,
    })

    if (wordlesNum > 1) {
      let randomWordExtra: string = ''
      let translation: string = ''
      for (let wordleIndex = 2; wordleIndex < wordlesNum + 1; wordleIndex++) {

        while (selectedWords.length < wordleIndex) {
          if (command === 'Lewdle') {
            let randomLowerCaseWord = getRandomLowerCaseWord(badWordsList);
            while (randomLowerCaseWord.length !== guessWordLength) {
              randomLowerCaseWord = getRandomLowerCaseWord(badWordsList);
            }
            const foundWord = findWord(randomLowerCaseWord)
            randomWordExtra = randomLowerCaseWord
            translation = foundWord ? foundWord.translation : ''
          } else {
            const resultExtra = getRandomWordTranslation(command, guessWordLength);
            translation = resultExtra.translation
            randomWordExtra = resultExtra.word;
          }

          if (!selectedWords.includes(randomWordExtra)) {
            selectedWords.push(randomWordExtra);
          }
        }
        await ctx.database.create('extra_wordle_game_records', {
          channelId,
          remainingGuessesCount: guessWordLength + 1 + wordlesNum - 1,
          guessWordLength,
          wordGuess: randomWordExtra,
          wordAnswerChineseDefinition: replaceEscapeCharacters(translation),
          gameMode: command,
          timestamp: timestamp,
          correctLetters: correctLetters,
          presentLetters: '',
          absentLetters: '',
          wordlesNum: wordlesNum,
          wordleIndex,
        })
      }
    }
    // 生成并发送游戏图
    const emptyGridHtml = isAbsurdMode ? generateEmptyGridHtml(1, guessWordLength) : generateEmptyGridHtml(guessWordLength + 1 + wordlesNum - 1, guessWordLength);
    const styledHtml = generateStyledHtml(guessWordLength + 1);
    let imageBuffer = await generateImage(styledHtml, emptyGridHtml);
    let imageBuffers: Buffer[] = [];
    if (wordlesNum > 1) {
      for (let wordleIndex = 0; wordleIndex < wordlesNum; wordleIndex++) {
        imageBuffers.push(imageBuffer);
      }
      const htmlImgString = generateImageTags(imageBuffers);
      imageBuffer = await generateWordlesImage(htmlImgString);
    }

    const gameMode = `游戏开始！\n当前游戏模式为：【${command}${wordlesNum > 1 ? `（x${wordlesNum}）` : ''}${isHardMode ? `（${isUltraHardMode ? '超' : ''}困难）` : ''}${isAbsurdMode ? `（变态${isChallengeMode ? '挑战' : ''}）` : ''}】`;
    const challengeInfo = isChallengeMode ? `\n目标单词为：【${randomWord}】` : '';
    const wordLength = `单词长度为：【${guessWordLength}】`;
    const guessChance = `猜单词机会为：【${isAbsurdMode ? '♾️' : guessWordLength + 1 + wordlesNum - 1}】`;
    const wordCount2 = `待猜单词数量为：【${command === 'Lewdle' ? '1000' : wordCount}】`;
    const timeLimit = config.enableWordGuessTimeLimit ? `\n作答时间为：【${config.wordGuessTimeLimitInSeconds}】秒` : '';
    const image = h.image(imageBuffer, `image/${config.imageType}`);

    return await sendMessage(session, `${gameMode}${challengeInfo}\n${wordLength}\n${guessChance}\n${wordCount2}${timeLimit}\n${image}`);
  }

  // apply


  // hs*
  function isFourCharacterIdiom(targetIdiom: string): boolean {
    // 判断字符串长度是否为四
    if (targetIdiom.length !== 4) {
      return false;
    }

    // 使用正则表达式判断是否为中文字符
    const chineseRegex = /^[\u4e00-\u9fa5]+$/;
    if (!chineseRegex.test(targetIdiom)) {
      return false;
    }

    return true;
  }

  async function getIdiomInfo(idiom: string): Promise<{ pinyin: string, explanation: string }> {
    try {
      const response = await fetch(`https://www.zdic.net/hans/${idiom}`);
      if (!response.ok) {
        throw new Error('未能提取数据。');
      }

      const html = await response.text();
      // 保存HTML到当前目录下
      fs.writeFileSync(`${idiom}.html`, html, 'utf8');
      const $ = load(html);

      const pinyin = $('.ciif.noi.zisong .dicpy').first().text().replace(/\s+/g, ' ').trim();
      // const explanation = $('#cyjs .content.definitions.cnr').text().replace(/\s+/g, ' ').trim();
      const cyjsDiv = $("#cyjs");
      cyjsDiv.find("h3").remove();
      const explanation = cyjsDiv.find("p").map((_, p) => $(p).text()).get().join("\n");

      if (!pinyin || !explanation) {
        throw new Error('找不到拼音或解释。');
      }

      return { pinyin, explanation };
    } catch (error) {
      // logger.error(error);
      return { pinyin: '未找到拼音', explanation: '未找到解释' };
    }
  }

  function checkAbsentLetters(lowercaseInputWord: string, absentLetters: string): boolean {
    for (let i = 0; i < lowercaseInputWord.length; i++) {
      if (absentLetters.includes(lowercaseInputWord[i])) {
        return true;
      }
    }
    return false;
  }

  function checkPresentLettersWithIndex(lowercaseInputWord: string, presentLettersWithIndex: string[]): boolean {
    let isInputWordWrong = false;

    presentLettersWithIndex.forEach(item => {
      const [letter, indexStr] = item.split('-');
      const index = parseInt(indexStr, 10) - 1;

      if (lowercaseInputWord.length > index && lowercaseInputWord[index] === letter) {
        isInputWordWrong = true;
      }
    });

    return isInputWordWrong;
  }

  function getRandomLowerCaseWord(words: string[]): string {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex].toLowerCase();
  }

  async function fetchAndParseWords(url: string) {

    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = load(html);

      const wordGroups = $('.word-group');
      let finalResult = '';

      if (wordGroups.length === 0) {
        finalResult = '未找到。';
      } else {
        wordGroups.each((_, element) => {
          const title = $(element).find('.word-group__title').text();
          const words = $(element).find('.word-group__inner .word').map((_, el) => $(el).contents().filter(function () {
            return this.nodeType === 3;
          }).text().trim()).get();
          finalResult += `${title}:\n${words.join(', ')}\n\n`;
        });
      }

      return finalResult
    } catch (error) {
      logger.error('发生错误：', error);
    }
  }

  function capitalizeFirstLetter(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  async function fetchWordDefinitions(word: string) {
    const url = 'https://wordword.org/api/words/get_by_word';
    const requestBody = {
      word: word
    };

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {'Content-Type': 'application/json'}
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    return responseData;
  }

  function serializeDefinitions(definitions: { [part: string]: any }) {
    let resultString = '';
    for (const part in definitions) {
      resultString += `${part}.\n`;
      definitions[part].forEach((definition: any) => {
        resultString += `- ${definition.text}\n`;
      });
      resultString += '\n';
    }
    return resultString;
  }


  function generateImageTags(buffers: Buffer[]): string {
    return buffers
      .map((buffer, index) => {
        const base64Image = buffer.toString('base64');
        return `    <img src="data:image/png;base64,${base64Image}" alt="图片${index + 1}">`;
      })
      .join('\n');
  }

  function extractLowerCaseWords(arr: { word: string; translation: string }[]): string[] {
    return arr.map(item => item.word.toLowerCase());
  }

  function replaceEscapeCharacters(input: string): string {
    return input.replace(/\\r/g, '\r').replace(/\\n/g, '\n');
  }

  function combineWord(letters: LetterState[]): string {
    return letters.reduce((word, {letter}) => word + letter, '');
  }

  function findWord(targetWord: string): WordEntry | undefined {
    const fileData = getJsonFilePathAndWordCountByLength('ALL', targetWord.length);
    const jsonData = JSON.parse(fs.readFileSync(fileData.filePath, 'utf-8'));

    // 小写化
    const lowercaseTargetWord = targetWord.toLowerCase();

    // 寻找
    return jsonData.find((entry) => entry.word.toLowerCase() === lowercaseTargetWord);
  }

  async function findLongestMatchedWords(wordsList: string[], lowercaseInputWord: string, targetWord: string, isChallengeMode: boolean): Promise<string[]> {
    const results = await Promise.all(
      wordsList.map(word => processWordAndMatch(lowercaseInputWord, word, wordsList))
    );

    const maxLength = Math.max(...results.map(result => result.matchedWords.length));
    let longestMatchedWords = results.filter(result => result.matchedWords.length === maxLength).map(result => result.matchedWords);
    if (isChallengeMode && wordsList.includes(targetWord)) {
      const filteredWords = longestMatchedWords.filter(words => words.includes(targetWord));
      if (filteredWords.length > 0) {
        longestMatchedWords = filteredWords;
      }
    }
    const randomIndex = Math.floor(Math.random() * longestMatchedWords.length);
    return longestMatchedWords[randomIndex];
  }


  function processWordAndMatch(lowercaseInputWord: string, word: string, wordsList: string[]): {
    matchedWords: string[],
    length: number
  } {
    const bucket = processWord(lowercaseInputWord, word);
    const matchedWordsList = matchWordsList(bucket, word, wordsList);
    return {matchedWords: matchedWordsList, length: matchedWordsList.length};
  }


  function matchWordsList(bucket: LetterState[], word: string, wordsList: string[]): string[] {
    return wordsList.filter(candidateWord => isMatch(candidateWord, bucket));
  }

  function isMatch(word: string, bucket: LetterState[]): boolean {
    for (let i = 0; i < bucket.length; i++) {
      const bucketState = bucket[i].state;
      const bucketLetter = bucket[i].letter;
      const wordLetter = word[i];

      if (bucketState === 'correct' && wordLetter !== bucketLetter) {
        return false;
      }

      if (bucketState === 'absent' && word.includes(bucketLetter)) {
        return false;
      }

      if (bucketState === 'present' && (wordLetter === bucketLetter || !word.includes(bucketLetter))) {
        return false;
      }
    }
    return true;
  }

  function processWord(userInputWord: string, word: string): LetterState[] {
    const bucket: LetterState[] = [];
    const wordArray: number[] = new Array(26).fill(0);

    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      wordArray[letter.charCodeAt(0) - 97]++;
      const userLetter = userInputWord[i];
      bucket.push({letter: userLetter, state: userLetter === letter ? 'correct' : 'undefined'});
    }

    for (let i = 0; i < userInputWord.length; i++) {
      const currentBucket = bucket[i];
      if (currentBucket.state !== 'correct') {
        const letterIndex = currentBucket.letter.charCodeAt(0) - 97;
        if (wordArray[letterIndex] > 0) {
          currentBucket.state = 'present';
          wordArray[letterIndex]--;
        } else {
          currentBucket.state = 'absent';
        }
      }
    }

    return bucket;
  }


  function generateStatsInfo(stats, fastestGuessTime) {
    const gameTypes = [
      '经典',
      'CET4',
      'CET6',
      'GMAT',
      'GRE',
      'IELTS',
      'SAT',
      'TOEFL',
      '考研',
      '专八',
      '专四',
      'ALL'
    ];

    let statsInfo = '';

    gameTypes.forEach(type => {
      const winCount = stats[type]?.win || 0;
      const loseCount = stats[type]?.lose || 0;
      const fastestTime = fastestGuessTime[type] || 0;

      statsInfo += `${type} - 胜：${winCount} 次，负：${loseCount} 次`;
      statsInfo += fastestTime === 0 ? '' : `，最快${formatGameDuration(fastestTime)}`;
      statsInfo += '\n';
    });

    return statsInfo;
  }

  function formatGameDuration(elapsedSeconds: number): string {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    if (minutes > 0) {
      return `用时：${minutes} 分 ${seconds} 秒`;
    } else {
      return `用时：${seconds} 秒`;
    }
  }

  function formatGameDuration2(elapsedSeconds: number): string {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    if (minutes > 0) {
      return `${minutes} 分 ${seconds} 秒`;
    } else {
      return `${seconds} 秒`;
    }
  }

  function removeLetters(wordAnswer: string, absentLetters: string): string {
    const letterSet = new Set(wordAnswer);
    return absentLetters.split('').filter(letter => !letterSet.has(letter)).join('');
  }

  function calculateGameDuration(startTime: number, currentTime: number): string {
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
    return `答案是：【${gameInfo.wordGuess}】${gameInfo.wordAnswerChineseDefinition !== '' ? `\n单词释义如下：\n${replaceEscapeCharacters(gameInfo.wordAnswerChineseDefinition)}` : ''}`;
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


        .pz-error__stack-trace pre {
            white-space: normal
        }

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




        @font-face {
            font-family: "nyt-franklin";
            src: url("./franklin-normal-700.woff2") format("woff2");
            font-weight: 700;
            font-style: normal
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


        .dark before {
            background: var(--hybrid-back-dark-mode) center no-repeat;
            background-position-x: 0px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG i {
            min-height: 35px;
            min-width: 35px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG.NonDismissalBanner-module_bannerMessageIcon__xCwfD i {
            min-height: 20px;
            min-width: 20px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl h3 {
            font-size: 14px;
            font-size: 0.875rem;
            line-height: 18.2px;
            line-height: 1.1375rem;
            font-weight: 700;
            margin: 0
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




        .NonDismissalBanner-module_multiIconBannerTest__t8tvf button.NonDismissalBanner-module_iconButtonTest__oaGgl i {
            margin-right: 0
        }



        .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerInformationTest__Q0Dqp i {
            min-height: 25px;
            min-width: 25px
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


        .LargeCTABanner-module_playButton__if85L i {
            width: 27px;
            height: 27px;
            border-radius: 7px
        }

        .LargeCTABanner-module_iconTextWrapper__goI7a + i {
            position: absolute;
            right: 10px
        }



        .Skip-module_skipButton__m8KJ8 svg {
            margin-left: .5rem
        }


        :root {
            --inter-ad-skip-button-height: 52px;
            --inter-ad-top-bar-height: 34px;
            --inter-ad-bottom-bar-height: 24px
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

        .Welcome-module_buttonContainer__K4GEw a {
            all: inherit
        }

        .Welcome-module_back__cUvW3 button::before {
            background: var(--hybrid-back) center no-repeat !important;
            background-position-x: 0px !important
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


        .Board-module_boardContainer__TBHNL {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
            overflow: hidden
        }

        .Help-module_instructions__uXsG6 li {
            margin-bottom: 4px
        }

        .Help-module_instructions__uXsG6 li::marker {
            font-size: 18px
        }


        .Help-module_examples__W3VXL strong {
            font-weight: bold
        }

        .Help-module_examples__W3VXL p {
            margin: 0;
            font-size: 16px;
            line-height: 20px
        }


        .Help-module_example__gldBI p {
            font-size: 16px;
            line-height: 20px;
            margin-top: 8px
        }


        .Help-module_reminderSignUp__oQ42D a {
            color: var(--inline-links);
            -webkit-text-decoration: underline var(--inline-links);
            text-decoration: underline var(--inline-links)
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


        .MiniAuthCTA-module_buttonsContainer__IoQWk .MiniAuthCTA-module_loginButton__x7_fR > a {
            color: inherit
        }


        .Stats-module_statsBtnLeft__IyDkc h1 {
            display: inline-block
        }

        .Stats-module_statsBtnLeft__IyDkc button {
            margin-left: 10px
        }

        .Footer-module_textContainer__LWkeW > p {
            margin: 5px
        }


        .Footer-module_buttonsContainer__YNxCQ .Footer-module_loginButton__abKD3 > a {
            color: inherit;
            text-decoration: none
        }


        .Footer-module_sbButtonFooter__X3LsB .Footer-module_nextWordle__Bzpb0 span {
            margin-right: 4px
        }


        .Footer-module_sbButtonFooter__X3LsB .Footer-module_sbPlayButton__kNigc span {
            color: #121212;
            letter-spacing: normal
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


        .ActivationRegiModal-module_loginLink__qqJOJ > a {
            color: inherit;
            text-decoration: none
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


        @media (min-width: 768px) {

            .driveToMore .DriveToMoreContent-module_fitContent__h6S25 h4 {
                width: 100%
            }
        }

        .driveToMore .DriveToMoreContent-module_fitContentGrid__TDzaq h4 {
            width: auto
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


        .NewsCarousel-module_carouselNewsItem__iTjNZ p {
            font: 500 0.875rem/1.09375rem nyt-cheltenham, Georgia;
            color: var(--color-tone-1);
            margin-top: 8px
        }

        img {
            width: 100%;
            animation: NewsCarousel-module_fadeIn__XJI1h 500ms
        }


        .NewsCarousel-module_desktopCarouselNewsItem__pjK2M p {
            font: 500 1rem/1.25rem nyt-cheltenham, Georgia;
            color: var(--color-tone-1);
            margin-top: 8px
        }


        .NewsCarousel-module_carouselControl__P2VRs svg {
            width: 100%;
            height: 100%
        }

        .NewsCarousel-module_carouselControl__P2VRs:hover svg {
            fill: #dfdfdf
        }

        .Settings-module_setting__EaMz6 a, .Settings-module_setting__EaMz6 a:visited {
            color: var(--color-tone-8);
            text-decoration: underline
        }


        .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr .Modal-module_closeIconButton__y9b6c svg {
            width: 100%;
            height: auto
        }

        .Modal-module_closeIcon__TcEKb svg {
            width: 100%;
            height: auto
        }


        .AppHeader-module_menuRight__Noasd button svg {
            vertical-align: middle
        }

        @media (max-width: 499px) {
            .pz-web .AppHeader-module_menuRight__Noasd.AppHeader-module_longTextVariant__guJaD svg {
                width: 20px
            }
        }

        .Explainer-module_containerLink__Eahjg p:last-child {
            font-weight: 700
        }


        .Explainer-module_text__DosQz > a {
            color: var(--inline-links);
            -webkit-text-decoration: underline var(--inline-links);
            text-decoration: underline var(--inline-links)
        }



        .Explainer-module_headerNew__y8y2y > p {
            text-align: center;
            margin: 10px 0px
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



        .Page-module_headerNew__FQAkL > p {
            text-align: center;
            margin: 10px 0px
        }




        .Error-module_errorBannerContainer__pfK75 p {
            font-weight: 400;
            margin: 5px 5px 5px 10px
        }

        .Ad-module_adContainer__ZAFEc > *:first-child {
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

        .pz-offline-ticker svg path {
            fill: var(--white)
        }

        .StatsSelectionTool-module_form__eOT7F fieldset {
            margin-bottom: 40px
        }

        .dark.colorblind {
            --color-absent: var(--color-tone-4);
            --key-bg-absent: var(--color-tone-4)
        }

        .colorblind {
            --color-correct: var(--orange);
            --color-present: var(--blue);
            --color-absent: var(--color-tone-2);
            --tile-text-color: var(--white);
            --key-bg-present: var(--color-present);
            --key-bg-correct: var(--color-correct);
            --key-bg-absent: var(--color-tone-2);
            --key-evaluated-text-color: var(--black);
            --key-evaluated-text-color-absent: var(--white);
            --color-correct-high-contrast: var(--orange);
            --modal-content-bg: var(--color-tone-7)
        }

        /*# sourceMappingURL=62.9d339ad0d09ddf80c92e.css.map*/

    </style>`


}
