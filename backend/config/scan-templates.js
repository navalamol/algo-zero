module.exports = [
  {
    id: 'momentum_burst',
    name: 'Momentum Burst',
    description: 'Strong momentum with volume confirmation above VWAP',
    conditions: [
      { indicator: 'rsi', operator: '>', value: 60 },
      { indicator: 'volumeVsAvg', operator: '>', value: 1.5 },
      { indicator: 'priceVsVwap', operator: '>', value: 1.0 }
    ]
  },
  {
    id: 'oversold_reversal',
    name: 'Oversold Reversal Candidate',
    description: 'Oversold stocks with buyer pressure building',
    conditions: [
      { indicator: 'rsi', operator: '<', value: 35 },
      { indicator: 'buyerRatio', operator: '>', value: 1.2 }
    ]
  },
  {
    id: 'volume_breakout',
    name: 'Volume Breakout',
    description: 'Unusual volume spike — 2× average or more',
    conditions: [
      { indicator: 'volumeVsAvg', operator: '>', value: 2.0 }
    ]
  },
  {
    id: 'vwap_reclaim',
    name: 'VWAP Reclaim',
    description: 'Price reclaiming VWAP with buyers in control',
    conditions: [
      { indicator: 'priceVsVwap', operator: '>', value: 1.0 },
      { indicator: 'buyerRatio', operator: '>', value: 1.0 }
    ]
  },
  {
    id: 'weak_hands_exit',
    name: 'Weak Hands Exit',
    description: 'Overbought with heavy selling — short or exit signal',
    conditions: [
      { indicator: 'rsi', operator: '>', value: 70 },
      { indicator: 'buyerRatio', operator: '<', value: 0.7 }
    ]
  }
];
