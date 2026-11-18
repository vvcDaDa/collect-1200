(function () {
  'use strict';

  window.Collect1200 = window.Collect1200 || {};

  const CONFIG = {
    HERO_NAME: 'FriedRich',
    HERO_NICK: 'Freddy',
    HERO_FULL: 'FriedRich (Freddy)',

    STAGE1_TARGET: 1200,
    STAGE2_TARGET: 12000,
    HEAL_COST: 1200,

    WORLD: {
      WIDTH: 3600,
      HEIGHT: 2700,
      PADDING: 64
    },

    STORY_CONFIG: {
      stage1Milestones: [280, 650],
      stage1BossMoney: 880,
      stage2Milestones: [1800, 4500, 7800],
      stage2Bosses: [
        { money: 2800, bossId: 'phantom' },
        { money: 6200, bossId: 'freezer404' },
        { money: 9600, bossId: 'wang' }
      ],
      stage2Multiplier: 3.2
    },

    BOSS_PROFILES: {
      jack: {
        id: 'jack',
        name: '金牌派单总监 · 杰克导师',
        title: '连环联单忽悠王',
        maxHp: 380,
        radius: 34,
        speed: 132,
        dropTotal: 260
      },
      phantom: {
        id: 'phantom',
        name: 'AI 拟声千面客服 · 魅影姬',
        title: '甜言蜜语杀猪盘核心',
        maxHp: 620,
        radius: 38,
        speed: 125,
        dropTotal: 1150
      },
      freezer404: {
        id: 'freezer404',
        name: '黑客洗钱巨兽 · 冻结者404',
        title: '账户异常解冻金收割机',
        maxHp: 820,
        radius: 44,
        speed: 112,
        dropTotal: 1650
      },
      wang: {
        id: 'wang',
        name: '境外刷单总庄家 · 王总',
        title: '黄金赌城终极幕后黑手',
        maxHp: 1100,
        radius: 48,
        speed: 122,
        dropTotal: 2400
      }
    },

    MODES: {
      story: {
        id: 'story',
        name: '剧情模式',
        tag: '两幕完整战役',
        desc: '第一幕攒回被骗的 ¥1,200 → 轻信返利再被骗 ¥12,000 → 大彻大悟横跨全城追回 ¥12,000！',
        maxHp: 5,
        scamSpeedMult: 1.0,
        scamLossMult: 1.0,
        spawnRateMult: 1.0
      },
      endless: {
        id: 'endless',
        name: '无尽模式',
        tag: '生存冲榜',
        desc: '无金额上限自由搞钱！四大电诈 Boss 轮番狂暴降临，装备无限进阶，挑战全群最高存款纪录！',
        maxHp: 5,
        scamSpeedMult: 1.08,
        scamLossMult: 1.1,
        spawnRateMult: 1.12
      }
    },

    PLAYER_BASE: {
      radius: 18,
      speed: 265,
      pickupRadius: 46,
      dashSpeed: 680,
      dashDuration: 0.22,
      dashCooldown: 1.9,
      skillRadius: 195,
      skillCooldown: 7.0,
      reportBounty: 18,
      invulnDuration: 1.15
    },

    // Smaller, grounded Stage 1 base values (scaled up dynamically in Stage 2 & Endless!)
    ITEMS: {
      bottle: { id: 'bottle', name: '塑料水瓶', value: 3, radius: 13 },
      can: { id: 'can', name: '易拉罐', value: 5, radius: 13 },
      cardboard: { id: 'cardboard', name: '废纸箱', value: 8, radius: 15 },
      cash_small: { id: 'cash_small', name: '传单日结零钱', value: 14, radius: 15 },
      maotai_bottle: { id: 'maotai_bottle', name: '飞天茅台空瓶', value: 30, radius: 16 }
    },

    UPGRADES: [
      {
        id: 'scooter',
        icon: '🛵',
        title: '改装续航小电驴',
        sender: '热心群友·老张',
        desc: '移动速度 +25%，跑腿送外卖每单额外加收 +35% 准时小费！'
      },
      {
        id: 'magnet',
        icon: '🧲',
        title: '强磁吸金抓钩',
        sender: '技术宅群友·阿凯',
        desc: '自动拾取范围 +85%，且左键/Q【抓钩吸金】射程扩大并减冷却 25%！'
      },
      {
        id: 'app96110',
        icon: '🛡️',
        title: '国家反诈中心护盾',
        sender: '群管理员',
        desc: '立即恢复 1 颗❤️，并生成每 15 秒自动充能的【防诈护盾】，抵挡一次骗局伤害！'
      },
      {
        id: 'megaphone',
        icon: '📢',
        title: '96110 高音大喇叭',
        sender: '暴躁老哥群友',
        desc: '右键/E【一键举报】范围扩大 +45%、冷却缩减 28%，封禁骗子赏金翻倍且对 Boss 增伤 50%！'
      },
      {
        id: 'milktea',
        icon: '🧋',
        title: '冰镇吨吨桶柠檬茶',
        sender: '富婆群友',
        desc: '立即恢复 2 颗❤️（满血则上限+1），冲刺冷却缩减 28% 且滑铲途中强力吸金！'
      },
      {
        id: 'hustle',
        icon: '💼',
        title: '金牌打工人执照',
        sender: '考公上岸群友',
        desc: '捡废品、外卖跑腿、蹲兼职圈与群红包的所有正经收入永久提升 +32%！'
      },
      {
        id: 'eagle_eye',
        icon: '👀',
        title: '人间清醒火眼金睛',
        sender: '反诈课代表',
        desc: '假红包与陷阱高亮警示，且右键/E【一键举报】可将陷阱直接转化为高额真钞！'
      },
      {
        id: 'rich_aura',
        icon: '✨',
        title: '夺回 Rich 光环',
        sender: '全群打Call团',
        desc: '每连续 10 秒未被骗自动获群友打赏津贴，且基础移速额外 +10%！'
      },
      {
        id: 'vip_box',
        icon: '📦',
        title: '恒温黑金外卖箱',
        sender: '单王骑手群友',
        desc: '外卖配送时限延长 +6 秒，配送期间移速额外 +15%，送达收益再 +25%！'
      },
      {
        id: 'emp_overload',
        icon: '⚡',
        title: '专案组脉冲增幅器',
        sender: '网安热心群友',
        desc: '左键/Q 抓钩可直接震晕面前小骗子，且拾取 ⚡96110电磁炮 对 Boss 伤害与追缴金额提升 +40%！'
      }
    ],

    TWIST_STORY: {
      badge: '⚠️ 第一阶段达成 ¥1,200 · 突发剧情转折！',
      title: '“再刷完这最后一联单，连本带利全提现！”',
      lines: [
        { speaker: '📱 金牌清退客服', text: '“恭喜亲凑齐 ¥1,200 激活金！系统已为您开启【VIP 三联大单通道】，现在把这 1200 连同花呗额度一起垫进去，3 分钟立返 ¥18,888 哦！”', type: 'scam' },
        { speaker: '💬 群友集体嘶吼', text: '“Freddy 住手啊！！那可是你刚捡瓶子跑断腿攒回来的 1200！！千万别转！！”', type: 'friends' },
        { speaker: '🤡 FriedRich (Freddy)', text: '“万一……万一做完这单真能把之前的全提出来呢？我冲最后一把！！【确认转账】”', type: 'freddy' },
        { speaker: '🚨 银行扣款暴雷', text: '【交易提醒】您尾号 8848 账户连环垫付被卷款拉黑，刚攒的 ¥1,200 清零，并额外被骗 ¥12,000！！（真·油炸全熟 Deep-Fried Rich）', type: 'alert' }
      ],
      awakenText: '痛失 ¥12,000 后 Freddy 终于彻底醒悟！卸载全部刷单软件，心态上限 +1❤️ 并回满状态！全城【CBD 高薪跑腿】【大额兼职】与【三大电诈头目追缴悬赏】现已全面开启——脚踏实地把 ¥12,000 全部挣回来！'
    },

    CHAT_LINES: {
      startStage1: [
        { user: '群主·老王', msg: 'Freddy 先在四大街区跑跑腿捡捡瓶子，把被骗的 1200 块凑回来，别再看刷单群了！' },
        { user: '摸鱼仙人', msg: '按 Tab 可以放大右下角雷达，四个街区都有高价外卖店和兼职圈！' }
      ],
      startStage2: [
        { user: '反诈课代表', msg: '1200 变 12000……我血压上来了！幸好 Freddy 这次彻底醒了，去东南区 CBD 接高薪大单吧！' },
        { user: '暴躁群友', msg: '别灰心！端掉那几个电诈大头目能直接追缴上千块赃款，全群陪你干到底！' }
      ],
      startEndless: [
        { user: '群主·老王', msg: '【无尽搞钱挑战开启】看看今天谁能帮 FriedRich 创下全群最高存款纪录！' }
      ],
      bottleStreak: [
        { user: '夜跑群友', msg: '好家伙 Freddy 这连收手速，四个街区的瓶子纸箱都被你承包了 😂' },
        { user: '环保卫士', msg: '积少成多！每一分汗水钱都比骗子的画饼实在！' }
      ],
      deliveryPick: [
        { user: '单王群友', msg: '接单成功！看准脚下绿色箭头和右下雷达路线，跨区闪送小费超丰厚！' }
      ],
      deliveryDone: [
        { user: '五星好评顾客', msg: '配送神速！打赏已到账，Freddy 离翻盘又近了一大步！' }
      ],
      parttimeDone: [
        { user: '兼职店长', msg: '日结工资现结现发！记住：正经工作永远是老板给你发钱！' }
      ],
      redPacketRain: [
        { user: '富哥群友', msg: '🧧 群里下一波红包雨给 Freddy 回血！小心紫色长角的假返利包！' }
      ],
      scammed: [
        { user: '毒舌群友', msg: '哎呀 Freddy 怎么又挨骗子一下！快把掉地上的钱捡回来！' },
        { user: '急疯了的群主', msg: '按 Space 滑铲有无敌帧！左键/Q 也能直接拍碎飞过来的弹幕！' }
      ],
      baited: [
        { user: '吃瓜课代表', msg: '写着“高倍返利”的紫包千万别踩！用右键/E 一键举报能把它净化成真钱！' }
      ],
      reportHit: [
        { user: '96110专线', msg: '举报核实有效！成功封停电诈账号，发放反诈奖金！' }
      ],
      shieldBlock: [
        { user: '国家反诈APP', msg: '🛡️【预警拦截】已自动为 FriedRich 阻断一次诈骗攻击！' }
      ],
      healBought: [
        { user: '毒舌群友', msg: '笑死，花 ¥1200 买强心套餐回血，四舍五入相当于又体验了一把痛失 1200 😂' },
        { user: '暖心群友', msg: '留得青山在不怕没柴烧！心态稳住了才能把大钱赚回来！' }
      ],
      bossSpawn: [
        { user: '全群拉响警报', msg: '🚨 电诈团伙大头目现身了！拾取场上的 ⚡96110电磁炮 或按 E 狠狠制裁他追回巨款！' }
      ],
      bossDefeated: [
        { user: '专案组通报', msg: '🎉 成功捣毁电诈头目窝点！追缴大额被骗资金散落满地，快吸过来！' }
      ],
      nearWin: [
        { user: '全群屏息凝神', msg: '只差最后一点就彻底凑齐上岸了！！Freddy 稳住别浪！！' }
      ],
      win: [
        { user: '全群刷屏欢呼', msg: '🏆 ¥12,000 全部赚回来了！！恭喜 FriedRich 彻底涅槃，真真正正变回 Rich！！' }
      ]
    },

    ANTI_SCAM_TIPS: [
      '被骗后切勿相信“再补一单/交解冻金即可全额提现”，那是从 1200 变成 12000 的连环深渊！',
      '凡是宣称“足不出户、先垫付后返佣”的网络兼职刷单，100% 是诈骗！',
      '遇到自称客服发来屏幕共享、索要验证码或诱导网贷垫付，立即挂断并拨打 96110！',
      '前期几十块小额返利只是诱饵，及时止损报警才是唯一正确选择！'
    ]
  };

  window.Collect1200.CONFIG = CONFIG;
})();
