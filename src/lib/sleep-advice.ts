import type { AdviceItem, AdviceSummary, SleepLogRow, SleepMetrics } from "@/types/sleep";
import { formatDuration, parseTimeToMinutes } from "@/lib/sleep-calculator";

interface AdviceContext {
  metrics: SleepMetrics;
  wasoMinutes: number;
  sleepQualityScore: number;
  daytimeImpairmentScore: number;
  memo: string;
  recentLogs?: SleepLogRow[];
}

export const SLEEP_QUALITY_LABELS: Record<number, string> = {
  1: "全くなし",
  2: "あまりなし",
  3: "ふつう",
  4: "まずまず",
  5: "ぐっすり",
};

export const DAYTIME_IMPAIRMENT_LABELS: Record<number, string> = {
  1: "支障なし",
  2: "わずかに眠気",
  3: "やや支障あり",
  4: "眠気が強い",
  5: "強い眠気・支障大",
};

function circularMinutesSpread(times: string[]): number {
  if (times.length < 2) return 0;
  // 起床時刻は 00:00〜23:59。正午基準で連続値にして最大-最小を求める
  const vals = times.map((t) => {
    const m = parseTimeToMinutes(t);
    return m >= 12 * 60 ? m - 24 * 60 : m;
  });
  return Math.max(...vals) - Math.min(...vals);
}

export function generateSleepAdvice(ctx: AdviceContext): AdviceSummary {
  const {
    metrics,
    wasoMinutes,
    sleepQualityScore,
    daytimeImpairmentScore,
    memo,
    recentLogs = [],
  } = ctx;

  const items: AdviceItem[] = [];
  const {
    sleepEfficiency,
    tstMinutes,
    sleepLatencyMinutes,
    morningAwakeMinutes,
    totalAwakeMinutes,
  } = metrics;

  // 1. 睡眠効率 (SE) 評価（CBT-I の最重要指標）
  if (sleepEfficiency >= 85) {
    items.push({
      category: "good",
      metricTag: `睡眠効率 ${sleepEfficiency.toFixed(1)}%`,
      title: "睡眠効率は良好な水準です",
      message:
        "寝床にいる時間のうち85%以上しっかり眠れています。布団と「眠る場所」という結びつきが保たれている良いサインです。",
    });
  } else if (sleepEfficiency >= 75) {
    items.push({
      category: "info",
      metricTag: `睡眠効率 ${sleepEfficiency.toFixed(1)}%`,
      title: "寝床で起きている時間を少し減らしてみましょう",
      message:
        "睡眠効率は標準圏のやや下です。強い眠気を感じてから布団に入るようにすると、寝床で目を覚ましている時間が減り効率が高まります。",
    });
  } else {
    items.push({
      category: "caution",
      metricTag: `睡眠効率 ${sleepEfficiency.toFixed(1)}%`,
      title: "布団の中で眠れない時間が長くなっています",
      message:
        "覚醒合計時間が長め（" +
        formatDuration(totalAwakeMinutes) +
        "）です。20分以上眠れないときは一度布団から出て、暗い部屋で静かに過ごし、眠気が戻ってから布団に戻る方法（刺激制御法）を試してみてください。",
    });
  }

  // 2. 入眠潜時 (SOL)
  if (sleepLatencyMinutes >= 30) {
    items.push({
      category: "caution",
      metricTag: `入眠まで ${formatDuration(sleepLatencyMinutes)}`,
      title: "寝つきに時間がかかっています",
      message:
        "就寝の90分ほど前にぬるめのお湯で入浴し、寝る1時間前からはスマホやPCの強い光を避けるとスムーズに深部体温が下がり入眠しやすくなります。",
    });
  } else if (sleepLatencyMinutes <= 5 && daytimeImpairmentScore >= 4) {
    items.push({
      category: "info",
      metricTag: `入眠まで ${formatDuration(sleepLatencyMinutes)}`,
      title: "「気絶するようにすぐ眠れる」のは睡眠不足のサインかも",
      message:
        "寝つきが極端に早く、かつ日中の眠気が強い場合は睡眠負債が溜まっている可能性があります。就寝時間を少しずつ早めて睡眠時間を確保してみてください。",
    });
  }

  // 3. 中途覚醒 (WASO)
  if (wasoMinutes >= 30) {
    items.push({
      category: "caution",
      metricTag: `中途覚醒 ${formatDuration(wasoMinutes)}`,
      title: "夜間の目覚めが長引いています",
      message:
        "夜中に目が覚めたとき時計を見ると「あと何時間しか眠れない」と緊張しやすくなります。時計を伏せ、夕方以降のカフェインや寝酒を控えると再入眠しやすくなります。",
    });
  }

  // 4. 起床前覚醒時間（目が覚めてから布団を出るまで）
  if (morningAwakeMinutes >= 30) {
    items.push({
      category: "info",
      metricTag: `起床前の滞在 ${formatDuration(morningAwakeMinutes)}`,
      title: "目が覚めたら早めに布団から出てみましょう",
      message:
        "目が覚めてから布団の中で過ごす時間が長めです。起きたらカーテンを開けて朝の光を浴びることで体内時計がリセットされ、夜の眠気も自然に訪れやすくなります。",
    });
  }

  // 5. 実睡眠時間 (TST)
  if (tstMinutes < 360) {
    items.push({
      category: "caution",
      metricTag: `実睡眠 ${formatDuration(tstMinutes)}`,
      title: "実睡眠時間が6時間未満と短めです",
      message:
        "睡眠時間が短い状態が続くと日中の集中力や気分の低下につながります。まずは就寝前のルーティンを15〜30分前倒ししてみましょう。",
    });
  } else if (tstMinutes >= 540 && sleepQualityScore <= 2) {
    items.push({
      category: "info",
      metricTag: `実睡眠 ${formatDuration(tstMinutes)}`,
      title: "長時間の睡眠でも熟睡感が得られにくい状態です",
      message:
        "休日の寝だめなどで睡眠が浅くなっている可能性があります。起床時刻を一定に保ち、日中の軽い運動を取り入れると深い睡眠が増えやすくなります。",
    });
  }

  // 6. 熟睡感 & 日中の支障度
  if (daytimeImpairmentScore >= 4) {
    items.push({
      category: "caution",
      metricTag: `日中の支障度 ${daytimeImpairmentScore}/5`,
      title: "日中の強い眠気への対策を取り入れましょう",
      message:
        "強い眠気がある日は、15時までに15〜20分以内の短い仮眠をとると午後の負担を和らげつつ夜の睡眠への影響を抑えられます。",
    });
  } else if (sleepQualityScore >= 4 && daytimeImpairmentScore <= 2) {
    items.push({
      category: "good",
      metricTag: `熟睡感 ${sleepQualityScore}/5`,
      title: "質の高い睡眠がとれています",
      message:
        "熟睡感が高く日中も安定して過ごせています。この日の食事・入浴・運動などのメモを振り返り、良いパターンを再現してみましょう。",
    });
  }

  // 7. メモのキーワードに基づく生活習慣ヒント
  const lowerMemo = memo.toLowerCase();
  if (
    /(カフェイン|コーヒー|coffee|紅茶|緑茶|抹茶|エナジー|モンスター|レッドブル)/.test(lowerMemo) &&
    (sleepLatencyMinutes >= 25 || wasoMinutes >= 20)
  ) {
    items.push({
      category: "info",
      metricTag: "メモ分析: カフェイン",
      title: "カフェインの摂取タイミングを見直してみましょう",
      message:
        "カフェインの覚醒作用は5〜7時間ほど続くことがあります。寝つきや中途覚醒が気になる日は、14〜15時以降はノンカフェインに切り替えるのがおすすめです。",
    });
  }

  if (
    /(酒|アルコール|ビール|ワイン|ハイボール|日本酒|焼酎|チューハイ|飲酒)/.test(lowerMemo) &&
    (wasoMinutes >= 20 || sleepQualityScore <= 2)
  ) {
    items.push({
      category: "info",
      metricTag: "メモ分析: アルコール",
      title: "アルコールは睡眠の後半を浅くすることがあります",
      message:
        "お酒は一時的に眠気を誘いますが、分解過程で中途覚醒や早朝覚醒が増え熟睡感が下がりやすくなります。就寝3〜4時間前までに切り上げると改善しやすいです。",
    });
  }

  if (
    /(スマホ|携帯|動画|youtube|sns|ゲーム|pc|パソコン|仕事)/.test(lowerMemo) &&
    sleepLatencyMinutes >= 25
  ) {
    items.push({
      category: "info",
      metricTag: "メモ分析: 就寝前の光・刺激",
      title: "就寝前のデジタル機器を少し早めに手放してみましょう",
      message:
        "画面の光や情報の刺激は脳を覚醒状態にします。寝る30〜60分前から照明を落とし、読書やストレッチなど穏やかな時間に変えてみましょう。",
    });
  }

  if (
    /(昼寝|うたた寝|仮眠|居眠り)/.test(lowerMemo) &&
    (sleepLatencyMinutes >= 25 || sleepEfficiency < 85)
  ) {
    items.push({
      category: "info",
      metricTag: "メモ分析: 昼寝・うたた寝",
      title: "昼寝・うたた寝の時間帯と長さを意識してみましょう",
      message:
        "15時以降の昼寝や夕方〜夜のうたた寝は、夜の眠気（睡眠圧）を弱めて寝つきを悪くする原因になります。仮眠をとる場合は15時までに15〜20分以内を目安にしてみましょう。",
    });
  }

  // 8. 直近7日間のリズム分析
  const last7 = recentLogs.slice(0, 7);
  if (last7.length >= 3) {
    const wakeSpread = circularMinutesSpread(last7.map((l) => l.out_of_bed_time));
    const avgSE =
      last7.reduce((sum, l) => sum + Number(l.sleep_efficiency), 0) / last7.length;

    if (wakeSpread >= 90) {
      items.push({
        category: "info",
        metricTag: `直近${last7.length}日の起床差 ${formatDuration(wakeSpread)}`,
        title: "起床時刻のばらつきを小さくするとリズムが安定します",
        message:
          "直近の記録で起床時刻に1時間半以上の差があります。休日も含めて起床時刻を±1時間以内に揃えると、平日の寝つきも改善しやすくなります。",
      });
    } else if (avgSE >= 85) {
      items.push({
        category: "good",
        metricTag: `直近${last7.length}日平均SE ${avgSE.toFixed(1)}%`,
        title: "直近の睡眠リズムがとても安定しています",
        message:
          "起床時刻のブレも少なく、平均睡眠効率も良好です。このまま日々の記録を続けて小さな変化に気づける状態を保ちましょう。",
      });
    }
  }

  // 医療相談のやさしい案内（強い不調がある場合）
  if (sleepEfficiency < 75 && daytimeImpairmentScore >= 4) {
    items.push({
      category: "caution",
      metricTag: "専門家への相談",
      title: "つらい状態が続く場合は医療機関への相談も有効です",
      message:
        "睡眠の悩みや日中の強い眠気が2週間以上続く場合は、この睡眠日誌をCSV出力して睡眠外来やかかりつけ医に見せると診察がスムーズになります。",
    });
  }

  // 総合トーンとヘッドラインの決定
  const cautionCount = items.filter((i) => i.category === "caution").length;
  const goodCount = items.filter((i) => i.category === "good").length;

  let tone: AdviceSummary["tone"] = "balanced";
  let headline = "少しずつリズムを整えていくヒントが見つかりました";

  if (cautionCount === 0 && goodCount > 0) {
    tone = "positive";
    headline = "とても良い睡眠バランスです。このリズムを大切にしましょう";
  } else if (cautionCount >= 2 || sleepEfficiency < 75) {
    tone = "attention";
    headline = "無理なく取り組めるポイントから1つずつ試してみましょう";
  }

  return { headline, tone, items };
}
