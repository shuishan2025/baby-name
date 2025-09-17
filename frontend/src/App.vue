<template>
  <el-container class="app-shell">
    <el-header class="app-header">
      <div class="branding">
        <div class="title">宝宝起名助手</div>
        <div class="subtitle">结合八字与诗词灵感，为新生宝宝取一个寓意深远的好名字</div>
      </div>
      <el-space>
        <el-tag type="success" effect="dark">DeepSeek 驱动</el-tag>
        <el-tag type="info">Vue 3 · Element Plus</el-tag>
      </el-space>
    </el-header>
    <el-main>
      <el-row :gutter="20" class="content-row">
        <el-col :xs="24" :md="14">
          <el-card shadow="hover" class="form-card">
            <template #header>
              <div class="card-header">
                <span>宝宝信息</span>
                <el-tag size="small" effect="dark">姓氏固定不变</el-tag>
              </div>
            </template>
            <el-form :model="form" label-width="90px" label-position="top" class="name-form">
              <el-form-item label="宝宝姓氏" required>
                <el-input
                  v-model.trim="form.surname"
                  :disabled="surnameLocked"
                  maxlength="2"
                  placeholder="请输入姓氏，例如：张"
                >
                  <template #append>
                    <el-tooltip
                      content="锁定后可以保证生成的名字始终使用该姓氏"
                      placement="top"
                    >
                      <el-button
                        :type="surnameLocked ? 'success' : 'info'"
                        @click="toggleSurnameLock"
                        plain
                      >
                        <component :is="surnameLocked ? 'Lock' : 'Unlock'" />
                      </el-button>
                    </el-tooltip>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="宝宝性别（可选）">
                <el-segmented v-model="form.gender" :options="genderOptions" block />
              </el-form-item>
              <el-form-item label="出生时间（可选）">
                <el-date-picker
                  v-model="form.birthDateTime"
                  type="datetime"
                  placeholder="选择出生日期与时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  :shortcuts="dateShortcuts"
                />
              </el-form-item>
              <el-form-item label="名字字数">
                <el-radio-group v-model="form.nameLength">
                  <el-radio-button v-for="item in nameLengthOptions" :key="item" :label="item">
                    {{ item }} 字
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="取名风格">
                <el-select v-model="form.style" placeholder="选择风格">
                  <el-option
                    v-for="option in styleOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  >
                    <div class="style-option">
                      <div class="style-name">{{ option.label }}</div>
                      <div class="style-desc">{{ option.description }}</div>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-space wrap>
                  <el-button type="primary" size="large" :loading="loading" @click="handleSubmit">
                    生成宝宝名字
                  </el-button>
                  <el-button size="large" @click="handleReset">重置可选项</el-button>
                </el-space>
              </el-form-item>
            </el-form>
            <el-alert
              title="提示：为了获得更契合的名字，可以补充宝宝的出生时间以及倾向的诗词风格。"
              type="info"
              show-icon
              :closable="false"
            />
          </el-card>
          <el-card v-if="results" shadow="never" class="result-card">
            <template #header>
              <div class="card-header">
                <span>智能起名结果</span>
                <el-tag :type="results.source === 'deepseek' ? 'success' : 'warning'" effect="dark">
                  {{ results.source === 'deepseek' ? 'DeepSeek 实时生成' : '本地示例结果' }}
                </el-tag>
              </div>
            </template>
            <el-empty description="点击上方按钮生成名字" v-if="!results.suggestions.length" />
            <template v-else>
              <el-alert
                v-if="results.summary"
                :title="results.summary"
                type="success"
                :closable="false"
                show-icon
                class="summary-alert"
              />
              <el-row :gutter="16">
                <el-col :span="24" :md="12" v-for="(item, index) in results.suggestions" :key="item.fullName">
                  <el-card shadow="hover" class="suggestion-card">
                    <div class="suggestion-header">
                      <span class="suggestion-rank">推荐 {{ index + 1 }}</span>
                      <el-button size="small" type="primary" link @click="copyName(item.fullName)">
                        <el-icon><CopyDocument /></el-icon>
                        复制名字
                      </el-button>
                    </div>
                    <div class="full-name">{{ item.fullName }}</div>
                    <div class="given-name">{{ item.givenName }}</div>
                    <el-divider></el-divider>
                    <p class="meaning">{{ item.meaning }}</p>
                    <p v-if="item.styleNotes" class="style-notes">{{ item.styleNotes }}</p>
                  </el-card>
                </el-col>
              </el-row>
            </template>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="10">
          <el-affix :offset="24">
            <el-card shadow="hover" class="history-card">
              <template #header>
                <div class="card-header">
                  <span>历史记录</span>
                  <el-tag size="small" type="info">最近 {{ history.length }} 条</el-tag>
                </div>
              </template>
              <el-empty description="还没有生成记录" v-if="!history.length" />
              <el-timeline v-else class="history-timeline">
                <el-timeline-item
                  v-for="item in history"
                  :key="item.timestamp"
                  type="primary"
                  :timestamp="formatTimestamp(item.timestamp)"
                >
                  <div class="history-entry">
                    <div class="history-name">{{ item.suggestions[0]?.fullName ?? '—' }}</div>
                    <div class="history-meta">
                      <span>风格：{{ item.conditions.style }}</span>
                      <span v-if="item.conditions.gender">性别：{{ genderDisplay(item.conditions.gender) }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-card>
            <el-card shadow="hover" class="tips-card">
              <template #header>
                <div class="card-header">
                  <span>取名小贴士</span>
                </div>
              </template>
              <ul class="tips-list">
                <li>“生辰八字”侧重五行平衡，适合追求命理契合的家庭。</li>
                <li>“诗经”风格常取材于古典诗篇，意境含蓄文雅。</li>
                <li>“唐诗宋词”善用韵律典故，名字朗朗上口、文化底蕴深厚。</li>
              </ul>
            </el-card>
          </el-affix>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script setup>
import { reactive, ref } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { CopyDocument } from '@element-plus/icons-vue';

const genderOptions = [
  { label: '不限', value: '' },
  { label: '男孩', value: 'male' },
  { label: '女孩', value: 'female' }
];

const nameLengthOptions = [1, 2, 3];

const styleOptions = [
  {
    label: '生辰八字',
    value: '生辰八字',
    description: '根据五行与命理匹配喜用神，平衡宝宝命局'
  },
  {
    label: '诗经',
    value: '诗经',
    description: '借鉴《诗经》中的词句意象，彰显温婉典雅'
  },
  {
    label: '唐诗宋词',
    value: '唐诗宋词',
    description: '融合唐宋诗词风韵，名字朗朗上口、意境悠远'
  }
];

const form = reactive({
  surname: '',
  gender: '',
  birthDateTime: '',
  nameLength: 2,
  style: styleOptions[0].value
});

const results = ref(null);
const history = ref([]);
const loading = ref(false);
const surnameLocked = ref(false);

const dateShortcuts = [
  {
    text: '当前时间',
    value: () => new Date()
  },
  {
    text: '昨天',
    value: () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date;
    }
  }
];

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const genderDisplay = (value) => {
  const found = genderOptions.find((item) => item.value === value);
  return found ? found.label || '不限' : '不限';
};

const toggleSurnameLock = () => {
  if (!form.surname) {
    ElMessage.warning('请先填写宝宝姓氏');
    return;
  }
  surnameLocked.value = !surnameLocked.value;
};

const handleReset = () => {
  form.gender = '';
  form.birthDateTime = '';
  form.nameLength = 2;
  form.style = styleOptions[0].value;
};

const copyName = async (name) => {
  try {
    await navigator.clipboard.writeText(name);
    ElMessage.success(`已复制：${name}`);
  } catch (error) {
    ElMessage.error('复制失败，请手动选择文本复制');
  }
};

const handleSubmit = async () => {
  if (!form.surname) {
    ElMessage.error('请先填写宝宝姓氏');
    return;
  }

  loading.value = true;
  try {
    const payload = {
      surname: form.surname,
      gender: form.gender || null,
      birthDateTime: form.birthDateTime || null,
      nameLength: form.nameLength,
      style: form.style
    };
    const { data } = await axios.post('/api/generate-name', payload);
    results.value = data;
    history.value = [
      {
        timestamp: new Date().toISOString(),
        conditions: payload,
        suggestions: data.suggestions
      },
      ...history.value
    ].slice(0, 10);
    surnameLocked.value = true;
  } catch (error) {
    console.error(error);
    const message = error.response?.data?.error || '生成名字失败，请稍后重试';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: transparent;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 16px;
  background: transparent;
}

.branding .title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.branding .subtitle {
  margin-top: 6px;
  color: #909399;
}

.content-row {
  margin-top: 12px;
}

.form-card,
.result-card,
.history-card,
.tips-card {
  margin-bottom: 20px;
  border-radius: 18px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.style-option {
  display: flex;
  flex-direction: column;
}

.style-name {
  font-weight: 600;
}

.style-desc {
  color: #909399;
  font-size: 12px;
}

.summary-alert {
  margin-bottom: 16px;
}

.suggestion-card {
  min-height: 220px;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.suggestion-rank {
  font-weight: 500;
  color: #409eff;
}

.full-name {
  font-size: 24px;
  font-weight: 700;
}

.given-name {
  font-size: 18px;
  color: #606266;
  margin-bottom: 10px;
}

.meaning {
  margin: 0;
  color: #303133;
  line-height: 1.6;
}

.style-notes {
  margin-top: 8px;
  color: #909399;
  font-size: 13px;
}

.history-timeline {
  margin-top: 12px;
}

.history-entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-name {
  font-weight: 600;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.tips-list {
  margin: 0;
  padding-left: 18px;
  color: #606266;
  line-height: 1.8;
}

@media (max-width: 992px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
