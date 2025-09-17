import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const stylePrompts = {
  '生辰八字':
    '从五行、喜用神、命理平衡角度入手，兼顾寓意与音律，确保名字有助于弥补命局不足。',
  '诗经': '参考《诗经》中意象与典故，突出清新含蓄、质朴自然的审美。',
  '唐诗宋词': '借鉴唐宋名篇辞章的意境与韵律，让名字富有文化底蕴与诗意。'
};

function buildUserPrompt({ surname, gender, birthDateTime, nameLength, style }) {
  const details = [
    `姓氏：${surname}`,
    `名字字数：${nameLength} 字`
  ];

  if (gender) {
    details.push(`性别：${gender === 'male' ? '男孩' : gender === 'female' ? '女孩' : gender}`);
  }

  if (birthDateTime) {
    details.push(`出生时间：${birthDateTime}`);
  }

  if (style && stylePrompts[style]) {
    details.push(`风格偏好：${style} — ${stylePrompts[style]}`);
  }

  return `请根据以下信息为中国宝宝生成 ${surname} 姓的名字：\n${details.join('\n')}\n\n必须返回 JSON，结构为：\n{\n  "names": [\n    {\n      "fullName": "",\n      "givenName": "",\n      "meaning": "",\n      "styleNotes": ""\n    }\n  ],\n  "summary": "整体点评"\n}\n\n请提供至少三个不同的候选名字，均使用中文解释含义与所体现的文化典故。名字需避开生僻字，突出美好寓意。`;
}

function extractJsonPayload(text) {
  if (!text) return null;
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  const candidate = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    return null;
  }
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const mockCharacterPool = {
  '生辰八字': [
    { char: '泽', meaning: '水润万物，寓意柔和包容' },
    { char: '霖', meaning: '甘霖普降，象征恩泽不断' },
    { char: '辰', meaning: '星辰闪耀，带来光明希望' },
    { char: '熙', meaning: '光明昌盛，生活和顺兴旺' },
    { char: '瑾', meaning: '美玉光泽，象征品德高雅' },
    { char: '谦', meaning: '谦逊有礼，修身养性' }
  ],
  '诗经': [
    { char: '如', meaning: '如月之恒，温润如玉' },
    { char: '瑶', meaning: '美玉，纯洁美好' },
    { char: '清', meaning: '清澈明亮，心志澄澈' },
    { char: '岚', meaning: '山间雾气，灵秀飘逸' },
    { char: '言', meaning: '言必信，守信用' },
    { char: '雅', meaning: '文雅大方，气质出众' }
  ],
  '唐诗宋词': [
    { char: '锦', meaning: '锦绣前程，富贵华美' },
    { char: '筠', meaning: '竹子意象，坚韧挺拔' },
    { char: '然', meaning: '怡然自得，顺遂安然' },
    { char: '乐', meaning: '快乐顺心，音律优美' },
    { char: '安', meaning: '平安吉祥，人生安定' },
    { char: '轩', meaning: '气宇轩昂，风度翩翩' }
  ]
};

function generateMockNames({ surname, style, nameLength }) {
  const pool = mockCharacterPool[style] || mockCharacterPool['生辰八字'];
  const fallbackNotes = {
    '生辰八字': '参考五行平衡，寓意稳重与谦和。',
    '诗经': '灵感来源于《诗经》中的典雅意象。',
    '唐诗宋词': '参考唐宋诗词音韵，注重朗朗上口。'
  };

  const suggestions = Array.from({ length: 3 }).map(() => {
    const used = new Set();
    let givenName = '';
    const meaningParts = [];
    while (givenName.length < nameLength) {
      const candidate = randomChoice(pool);
      if (used.has(candidate.char)) {
        continue;
      }
      used.add(candidate.char);
      givenName += candidate.char;
      meaningParts.push(candidate.meaning);
    }

    const meaning = meaningParts.join('，');
    return {
      fullName: `${surname}${givenName}`,
      givenName,
      meaning: `${meaning}。名字与姓氏组合后读音协调，寓意吉祥。`,
      styleNotes: fallbackNotes[style] || fallbackNotes['生辰八字']
    };
  });

  return {
    surname,
    suggestions,
    summary: `${surname}姓宝宝推荐名字以${style || '传统雅致'}风格为灵感，寓意积极向上，便于日常书写与称呼。`,
    source: 'mock'
  };
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/generate-name', async (req, res) => {
  const { surname, gender, birthDateTime, nameLength, style } = req.body || {};

  if (!surname) {
    return res.status(400).json({ error: '姓氏为必填项' });
  }

  const requestPayload = {
    surname,
    gender,
    birthDateTime,
    nameLength: Number(nameLength) || 2,
    style: style || '生辰八字'
  };

  const systemPrompt = '你是一位资深的中文起名大师，擅长结合命理与传统文化给宝宝取名字。请根据用户提供的信息，推荐寓意吉祥、音律和谐、易于书写的名字。';
  const userPrompt = buildUserPrompt(requestPayload);

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res.json(generateMockNames(requestPayload));
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      return res.json(generateMockNames(requestPayload));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = extractJsonPayload(content);

    if (!parsed?.names?.length) {
      console.warn('Unable to parse DeepSeek response, fallback to mock');
      return res.json(generateMockNames(requestPayload));
    }

    const suggestions = parsed.names.map((item) => ({
      fullName: item.fullName || `${surname}${item.givenName ?? ''}`,
      givenName: item.givenName || (item.fullName ? item.fullName.replace(surname, '') : ''),
      meaning: item.meaning || '',
      styleNotes: item.styleNotes || ''
    }));

    return res.json({
      surname,
      suggestions,
      summary: parsed.summary || '',
      source: 'deepseek'
    });
  } catch (error) {
    console.error('DeepSeek request failed:', error);
    return res.json(generateMockNames(requestPayload));
  }
});

app.listen(PORT, () => {
  console.log(`Baby name service listening on http://localhost:${PORT}`);
});
