// 活动信息存储工具（使用 localStorage）
// 由于智能合约不支持描述和图片字段，我们在前端本地存储

const STORAGE_KEY = 'event_data';

// 保存活动信息（包含描述和图片）
export const saveEventData = (eventId, data) => {
  try {
    const events = loadAllEventData();
    events[eventId] = {
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('保存活动信息失败:', error);
  }
};

// 加载所有活动信息
export const loadAllEventData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('加载活动信息失败:', error);
    return {};
  }
};

// 获取单个活动信息
export const getEventData = (eventId) => {
  const events = loadAllEventData();
  return events[eventId] || {
    description: '精彩演唱会，敬请期待！',
    imageUrl: '',
    updatedAt: 0
  };
};

// 获取活动描述（兼容旧代码）
export const saveEventDescription = (eventId, description) => {
  const existingData = getEventData(eventId);
  saveEventData(eventId, {
    ...existingData,
    description
  });
};

// 获取单个活动描述（兼容旧代码）
export const getEventDescription = (eventId) => {
  return getEventData(eventId).description || '精彩演唱会，敬请期待！';
};

// 删除活动信息
export const deleteEventData = (eventId) => {
  try {
    const events = loadAllEventData();
    delete events[eventId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('删除活动信息失败:', error);
  }
};

// 删除活动描述（兼容旧代码）
export const deleteEventDescription = deleteEventData;

// 获取活动图片URL
export const getEventImage = (eventId, eventName) => {
  const eventData = getEventData(eventId);
  if (eventData.imageUrl && eventData.imageUrl.trim()) {
    return eventData.imageUrl;
  }

  // 默认图片映射
  const defaultImages = {
    '周杰伦2025演唱会': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop',
    '鹿晗巡回演唱会': 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop',
    '陶喆演唱会': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop',
  };

  return defaultImages[eventName] || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop';
};
