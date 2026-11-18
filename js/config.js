(function () {
  'use strict';

  window.Collect1200 = window.Collect1200 || {};

  const CONFIG = {
    HERO_NAME: 'FriedRich',
    HERO_NICK: 'Freddy',
    HERO_FULL: 'FriedRich (Freddy)',
    TARGET_MONEY: 1200,

    WORLD: {
      WIDTH: 1920,
      HEIGHT: 1440,
      PADDING: 56
    },

    MILESTONES: [250, 550, 850],
    BOSS_TRIGGER_MONEY: 1000,

    DIFFICULTIES: {
      normal: {
        id: 'normal',
        name: '群友互助模式',
        badge: '推荐',
        desc: '初始 5 颗心态 ❤️ · 群友支援充足 · 稳步帮 Freddy 凑齐 ¥1200',
        maxHp: 5,
        scamSpeedMult: 1.0,
        scamLossMult: 1.0,
        spawnRateMult: 1.0
      },
      hard: {
        id: 'hard',
        name: '地狱防诈速通',
        badge: '挑战',
        desc: '初始 3 颗心态 ❤️ · 电诈团伙移速+28% · 专为群内竞速冲榜打造',
        maxHp: 3,
        scamSpeedMult: 1.28,
        scamLossMult: 1.3,
        spawnRateMult: 1.25
      }
    },

    PLAYER_BASE: {
      radius: 18,
      speed: 245,
      pickupRadius: 42,
      dashSpeed: 640,
      dashDuration: 0.21,
      dashCooldown: 2.1,
      skillRadius: 185,
      skillCooldown: 7.5,
      reportBounty: 30,
      invulnDuration: 1.15
    },

    ITEMS: {
      bottle: { id: 'bottle', name: '塑料瓶', value: 8, radius: 13, color: '#38BDF8', weight: 48 },
      cardboard: { id: 'cardboard', name: '废纸箱', value: 15, radius: 15, color: '#D97706', weight: 32 },
      cash_small: { id: 'cash_small', name: '日结零钱', value: 22, radius: 15, color: '#10B981', weight: 15 },
      maotai_bottle: { id: 'maotai_bottle', name: '空茅台瓶', value: 38, radius: 16, color: '#F59E0B', weight: 5 }
    },

    UPGRADES: [
      {
        id: 'scooter',
        icon: '🛵',
        title: '众筹二手小电驴',
        sender: '热心群友·老张',
        desc: 'Freddy 移动速度 +24%，且每次完成【跑腿外卖】额外多拿 ¥35 小费！'
      },
      {
        id: 'magnet',
        icon: '🧲',
        title: '群友祖传抢红包挂',
        sender: '技术宅群友·阿凯',
        desc: '拾取吸附范围扩大 +90%，路过街道自动把真钞票、塑料瓶和红包吸进兜里！'
      },
      {
        id: 'app96110',
        icon: '🛡️',
        title: '国家反诈中心护盾',
        sender: '群管理员',
        desc: '立即恢复 1 颗心态 ❤️，并生成每 16 秒自动充能的【防诈护盾】，抵挡一次骗局！'
      },
      {
        id: 'megaphone',
        icon: '📢',
        title: '96110 扩音大喇叭',
        sender: '暴躁老哥群友',
        desc: '【一键举报 (E)】范围扩大 +45%、冷却缩减 30%，震退骗子的反诈奖金提升至 ¥50！'
      },
      {
        id: 'milktea',
        icon: '🧋',
        title: '拼好饭冰镇柠檬水',
        sender: '富婆群友',
        desc: '立即恢复 2 颗心态 ❤️（满血则上限+1），冲刺冷却缩减 28% 且冲刺途中强力吸金！'
      },
      {
        id: 'hustle',
        icon: '💼',
        title: '正经副业打工魂',
        sender: '考公上岸群友',
        desc: '脚踏实地搞钱！捡废品、摇奶茶兼职、抢群红包的所有正经收入永久 +30%！'
      },
      {
        id: 'eagle_eye',
        icon: '👀',
        title: '人间清醒火眼金睛',
        sender: '吃瓜课代表',
        desc: '所有伪装假红包与陷阱均标注醒目【骗局】警示，且【一键举报】可将假红包净化为 ¥45 真钱！'
      },
      {
        id: 'rich_aura',
        icon: '✨',
        title: '夺回 Rich 之名',
        sender: '全群打Call团',
        desc: '拒绝再当 Fried！每连续 10 秒未被骗自动获群友打赏 +¥28，且移速额外 +10%！'
      }
    ],

    INTRO_MESSAGES: [
      { sender: 'FriedRich (Freddy)', role: '大冤种本人', self: true, text: '兄弟们天塌了……刚在兼职链接做刷单任务垫付了 ¥1200，客服说卡单了要再转 5000 才能提现，我是不是凉了 😭' },
      { sender: '熬夜冠军·阿哲', role: '群友', text: '？？？哥们你名字叫 FriedRich，结果 Rich 没当上，直接被骗子给 Fried（炸糊）了是吧？！' },
      { sender: '反诈课代表', role: '管理员', text: '千万别再转钱！100%是连环刷单杀猪盘！立刻止损拉黑！' },
      { sender: '热心富哥·老王', role: '群主', text: '别光顾着笑 Freddy 了（虽然确实好笑），大家搭把手，带他去街区跑外卖、捡瓶子、发点群红包，帮他把这 1200 凑回来！' }
    ],

    CHAT_LINES: {
      start: [
        { user: '群主·老王', msg: '加油啊 Freddy！脚踏实地挣回 1200，别再点陌生刷单链接了！' },
        { user: '摸鱼仙人', msg: '看到发光外卖餐箱记得去接单，一单能回血百来块呢！' }
      ],
      bottleStreak: [
        { user: '夜跑群友', msg: '卧槽 Freddy 这手速，整条街的塑料瓶都被你薅秃了 😂' },
        { user: '环保卫士', msg: '虽然一个瓶子8块有点魔幻，但为了帮 FriedRich 回本我认了！' },
        { user: '吃瓜群友', msg: '捡瓶子虽慢但稳啊，总比垫付返利靠谱一万倍！' }
      ],
      deliveryPick: [
        { user: '黄袍加身群友', msg: 'Freddy 接单了！跟着脚下绿色箭头冲，别超时拿满小费！' },
        { user: '点外卖的群友', msg: '慢点骑但快点跑，我的猪脚饭就拜托 FriedRich 配送了！' }
      ],
      deliveryDone: [
        { user: '五星好评顾客', msg: '配送神速！打赏已到账，Freddy 离变回 Rich 又近了一大步！' },
        { user: '记账群友', msg: '好家伙，这单跑腿顶得上捡十几个瓶子，汗水不会骗人！' }
      ],
      parttimeDone: [
        { user: '奶茶店长', msg: '日结工资现结现发！正经兼职从不要你先垫钱！' },
        { user: '群友小陈', msg: '看到 Freddy 认真端盘子摇奶茶的样子，眼角流下了欣慰的泪水' }
      ],
      redPacketRain: [
        { user: '富哥群友', msg: '【群红包雨】发了一波拼手气红包助 Freddy 回血！注意混进来的紫色假返利包别乱点！' },
        { user: '潜水大佬', msg: '出来冒个泡，撒一波红包雨！Freddy 看准真红包再抢啊！' }
      ],
      scammed: [
        { user: '反诈课代表', msg: '痛心疾首！！Freddy 你怎么又信了“做完这单立返”啊！快把掉地上的钱捡回来！' },
        { user: '毒舌群友', msg: '完了完了，刚攒点钱又被炸了，真·Fried（全熟）Rich 啊！' },
        { user: '急疯了的群主', msg: '按空格冲刺躲开啊哥们！看到紫色诈骗弹窗离远点！' }
      ],
      baited: [
        { user: '吃瓜课代表', msg: '哎呀！那个写着“垫付双倍返”的紫包一眼假啊 Freddy！！' },
        { user: '群友老李', msg: '贪小便宜吃大亏！下次按 E 一键举报直接端掉它！' }
      ],
      reportHit: [
        { user: '96110接线员', msg: '举报核实有效！成功拦截电诈分子，发放反诈奖金！' },
        { user: '暴躁群友', msg: '漂亮！！反手就是一个举报拉黑，Freddy 终于支棱起来了！' }
      ],
      shieldBlock: [
        { user: '国家反诈APP', msg: '【预警拦截成功】已为 FriedRich 自动阻断一次刷单诈骗攻击！' }
      ],
      bossSpawn: [
        { user: '全群拉响警报', msg: '⚠️ 卧槽！眼看 Freddy 快凑齐 1000+ 了，【境外刷单总庄家】急眼亲自下场了！！' },
        { user: '战术指导群友', msg: '别慌！捡地上的蓝色【96110电磁脉冲】或者继续跑单凑满 1200 就能直接正义执行他！' }
      ],
      nearWin: [
        { user: '全群屏息凝神', msg: '只差最后一点就满 ¥1200 了！！Freddy 稳住千万别浪！！' }
      ],
      win: [
        { user: '全群刷屏庆祝', msg: '🎉 1200 凑齐啦！！恭喜 FriedRich 彻底告别 Fried，重夺 Rich 之名！！' }
      ]
    },

    ANTI_SCAM_TIPS: [
      '凡是宣称“足不出户、动动手指、先垫付后返佣”的网络刷单，100% 是诈骗！',
      '遇到“操作失误、卡单、联单、信誉分不足、账户冻结需交解冻金”话术，立即止损报警！',
      '前期给你几块钱小额返利只是鱼饵，等你投入上千上万就会立刻拉黑卷款！',
      '正经兼职都是干完活发工资，绝不会让你先往陌生账户充值垫付一分钱！',
      '下载国家反诈中心 APP，牢记全国反诈劝阻专线 96110，守护好自己的钱袋子！'
    ]
  };

  window.Collect1200.CONFIG = CONFIG;
})();
