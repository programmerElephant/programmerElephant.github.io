const { computed, createApp, reactive, ref } = Vue;

const DEFAULT_API_BASE = "https://analyze.yuanma.live";
const appNameMap = {
  funVoice: "我的刀盾",
  lumotalk: "LumoTalk",
  manbo: "Manbo",
  printer: "Printer",
  vpnproxy: "VPN Proxy"
};

const countryNameMap = {
  CN: "中国", HK: "中国香港", TW: "中国台湾", MO: "中国澳门", JP: "日本", KR: "韩国", IN: "印度", TH: "泰国",
  VN: "越南", MY: "马来西亚", SG: "新加坡", ID: "印度尼西亚", PH: "菲律宾", GB: "英国", FR: "法国", DE: "德国",
  IT: "意大利", ES: "西班牙", NL: "荷兰", US: "美国", CA: "加拿大", MX: "墨西哥", BR: "巴西", AU: "澳大利亚",
  NZ: "新西兰", TR: "土耳其", SA: "沙特阿拉伯", AE: "阿联酋", RU: "俄罗斯"
};

const appAccentMap = {
  vpnproxy: "linear-gradient(135deg, #0d1c3b, #1d6de7)",
  lumotalk: "linear-gradient(135deg, #6327ff, #ff7a59)",
  manbo: "linear-gradient(135deg, #16202b, #19a974)",
  funVoice: "linear-gradient(135deg, #1a1326, #ff8b3d)",
  printer: "linear-gradient(135deg, #2d2137, #ef5aa1)"
};

const fallbackApps = Object.keys(appNameMap).map((id) => ({
  id,
  name: appNameMap[id]
}));

const staticFilterLabels = {
  body_contains: "Body 模糊搜索",
  country_code: "国家",
  user_id: "用户 ID",
  platform: "平台",
  vip_status: "VIP 状态",
  vpn_status: "VPN 状态",
  device: "设备",
  area: "地区",
  ip: "IP"
};

const groupByLabels = {
  date: "日期",
  event: "事件",
  country_code: "国家",
  platform: "平台",
  vip_status: "VIP 状态",
  device: "设备",
  area: "地区"
};

const metricLabels = {
  event_count: "事件数",
  distinct_user_count: "去重用户数",
  vip_event_count: "VIP 事件数",
  vip_user_count: "VIP 用户数",
  install_user_count: "安装用户数",
  refund_user_count: "退款用户数",
  purchase_user_count: "购买用户数",
  cancel_user_count: "取消用户数"
};

const viewDefs = [
  { value: "events", label: "事件明细" },
  { value: "aggregate", label: "聚合统计" },
  { value: "retention", label: "留存分析" },
  { value: "timeline", label: "用户时间线" },
  { value: "metadata", label: "元数据" }
];

function getToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeText(value, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function normalizeBaseUrl(value) {
  return safeText(value, "").trim().replace(/\/+$/, "");
}

function unwrapResponse(payload) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

function parseListInput(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatMetricValue(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return safeText(value, "0");
}

createApp({
  setup() {
    const loading = reactive({
      apps: false,
      metadata: false,
      query: false
    });
    const errorMessage = ref("");

    const state = reactive({
      adminId: "",
      activeView: "events",
      selectedApp: "funVoice",
      startDate: getToday(),
      endDate: getToday(),
      apps: [...fallbackApps],
      metadata: {
        apps: [],
        filters: [],
        groupBy: [],
        metrics: [],
        fields: [],
        events: [],
        countries: [],
        platforms: []
      },
      filters: {
        country_code: [],
        platform: [],
        vip_status: [],
        vpn_status: [],
        user_id: "",
        device: "",
        area: "",
        ip: "",
        body_contains: ""
      },
      aggregate: {
        groupBy: ["date", "event"],
        metrics: ["event_count", "distinct_user_count"]
      },
      eventsPanel: {
        eventKeyword: "",
        selectedEvents: [],
        page: 1,
        pageSize: 50,
        sortBy: "log_time",
        sortOrder: "DESC",
        total: 0,
        rows: []
      },
      retention: {
        returnEventsInput: "server_done, session, launch_resources_prepared",
        rows: []
      },
      timeline: {
        userId: "",
        limit: 300,
        rows: []
      },
      aggregateRows: [],
      drawerOpen: false,
      drawerTitle: "用户时间线",
      drawerSearch: "",
      drawerSortOrder: "DESC",
      drawerRows: []
    });

    function buildHeaders(withJson = true) {
      const headers = {};
      if (state.adminId.trim()) {
        headers["x-admin-id"] = state.adminId.trim();
      }
      if (withJson) {
        headers["Content-Type"] = "application/json";
      }
      return headers;
    }

    async function request(path, options = {}) {
      const response = await fetch(`${DEFAULT_API_BASE}${path}`, options);
      const text = await response.text();
      let payload = null;

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (error) {
          payload = text;
        }
      }

      if (!response.ok) {
        const detail = typeof payload === "string"
          ? payload
          : payload?.error || payload?.message || response.statusText;
        throw new Error(detail || "请求失败");
      }

      return payload;
    }

    async function loadApps() {
      if (!state.adminId.trim()) {
        state.apps = [...fallbackApps];
        return;
      }

      loading.apps = true;
      try {
        const payload = await request("/api/apps", {
          method: "GET",
          headers: buildHeaders(false)
        });
        const data = unwrapResponse(payload);
        if (Array.isArray(data)) {
          state.apps = data.map((item) => ({
            id: item.id,
            name: appNameMap[item.id] || item.id
          }));
          if (!state.apps.some((item) => item.id === state.selectedApp) && state.apps[0]) {
            state.selectedApp = state.apps[0].id;
          }
        }
      } catch (error) {
        state.apps = [...fallbackApps];
      } finally {
        loading.apps = false;
      }
    }

    function normalizeFilters() {
      const filters = {};

      if (state.filters.country_code.length) {
        filters.country_code = [...state.filters.country_code];
      }
      if (state.filters.platform.length) {
        filters.platform = [...state.filters.platform];
      }
      if (state.filters.vip_status.length) {
        filters.vip_status = state.filters.vip_status.map((item) => Number(item));
      }
      if (state.filters.vpn_status.length) {
        filters.vpn_status = state.filters.vpn_status.map((item) => Number(item));
      }

      ["user_id", "device", "area", "ip", "body_contains"].forEach((key) => {
        const value = String(state.filters[key] || "").trim();
        if (value) {
          filters[key] = value;
        }
      });

      return filters;
    }

    function syncMetadataSelections() {
      const eventSet = new Set(state.metadata.events);
      const countrySet = new Set(state.metadata.countries);
      const platformSet = new Set(state.metadata.platforms);

      state.eventsPanel.selectedEvents = state.eventsPanel.selectedEvents.filter((item) => eventSet.has(item));
      state.filters.country_code = state.filters.country_code.filter((item) => countrySet.has(item));
      state.filters.platform = state.filters.platform.filter((item) => platformSet.has(item));

      const allowedGroupBy = new Set(state.metadata.groupBy);
      state.aggregate.groupBy = state.aggregate.groupBy.filter((item) => allowedGroupBy.has(item));
      if (!state.aggregate.groupBy.length && state.metadata.groupBy.includes("date")) {
        state.aggregate.groupBy = ["date"];
      }

      const allowedMetrics = new Set(state.metadata.metrics);
      state.aggregate.metrics = state.aggregate.metrics.filter((item) => allowedMetrics.has(item));
      if (!state.aggregate.metrics.length && state.metadata.metrics.includes("event_count")) {
        state.aggregate.metrics = ["event_count"];
      }
    }

    async function loadMetadata() {
      errorMessage.value = "";
      if (!state.adminId.trim()) {
        errorMessage.value = "请输入管理员 ID";
        return;
      }

      loading.metadata = true;
      try {
        const payload = await request("/api/metadata", {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify({
            adminId: state.adminId.trim(),
            app: state.selectedApp,
            dateRange: {
              start: state.startDate,
              end: state.endDate
            },
            filters: normalizeFilters()
          })
        });

        const data = unwrapResponse(payload) || {};
        state.metadata = {
          apps: Array.isArray(data.apps) ? data.apps : [],
          filters: Array.isArray(data.filters) ? data.filters : [],
          groupBy: Array.isArray(data.groupBy) ? data.groupBy : [],
          metrics: Array.isArray(data.metrics) ? data.metrics : [],
          fields: Array.isArray(data.fields) ? data.fields : [],
          events: Array.isArray(data.events) ? data.events : [],
          countries: Array.isArray(data.countries) ? data.countries : [],
          platforms: Array.isArray(data.platforms) ? data.platforms : []
        };

        if (state.metadata.apps.length) {
          state.apps = state.metadata.apps.map((item) => ({
            id: item.id,
            name: appNameMap[item.id] || item.id
          }));
        }

        syncMetadataSelections();
      } catch (error) {
        errorMessage.value = `加载元数据失败: ${error.message}`;
      } finally {
        loading.metadata = false;
      }
    }

    function resetResultState() {
      state.eventsPanel.rows = [];
      state.eventsPanel.total = 0;
      state.aggregateRows = [];
      state.retention.rows = [];
      state.timeline.rows = [];
    }

    async function runActiveQuery() {
      errorMessage.value = "";
      if (!state.adminId.trim()) {
        errorMessage.value = "请输入管理员 ID";
        return;
      }
      if (!state.startDate || !state.endDate) {
        errorMessage.value = "请选择日期范围";
        return;
      }
      if (state.activeView === "timeline" && !state.timeline.userId.trim()) {
        errorMessage.value = "请输入用户 ID";
        return;
      }

      loading.query = true;
      resetResultState();

      try {
        if (state.activeView === "events") {
          await fetchEvents();
        } else if (state.activeView === "aggregate") {
          await fetchAggregate();
        } else if (state.activeView === "retention") {
          await fetchRetention();
        } else if (state.activeView === "timeline") {
          await fetchTimeline(state.timeline.userId.trim(), false);
        } else {
          await loadMetadata();
        }
      } catch (error) {
        errorMessage.value = `查询失败: ${error.message}`;
      } finally {
        loading.query = false;
      }
    }

    async function fetchEvents() {
      const payload = await request("/api/events/search", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          adminId: state.adminId.trim(),
          app: state.selectedApp,
          dateRange: {
            start: state.startDate,
            end: state.endDate
          },
          filters: normalizeFilters(),
          events: state.eventsPanel.selectedEvents,
          sortBy: state.eventsPanel.sortBy,
          sortOrder: state.eventsPanel.sortOrder,
          page: state.eventsPanel.page,
          pageSize: state.eventsPanel.pageSize
        })
      });

      const data = unwrapResponse(payload) || {};
      state.eventsPanel.rows = Array.isArray(data.list) ? data.list : [];
      state.eventsPanel.total = Number(data.total || 0);
      state.eventsPanel.page = Number(data.page || state.eventsPanel.page);
      state.eventsPanel.pageSize = Number(data.pageSize || state.eventsPanel.pageSize);
    }

    async function fetchAggregate() {
      const payload = await request("/api/events/aggregate", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          adminId: state.adminId.trim(),
          app: state.selectedApp,
          dateRange: {
            start: state.startDate,
            end: state.endDate
          },
          filters: normalizeFilters(),
          events: state.eventsPanel.selectedEvents,
          groupBy: state.aggregate.groupBy,
          metrics: state.aggregate.metrics
        })
      });

      const data = unwrapResponse(payload) || {};
      state.aggregateRows = Array.isArray(data.rows) ? data.rows : [];
    }

    async function fetchRetention() {
      const payload = await request("/api/analytics/retention", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          adminId: state.adminId.trim(),
          app: state.selectedApp,
          dateRange: {
            start: state.startDate,
            end: state.endDate
          },
          filters: normalizeFilters(),
          returnEvents: parseListInput(state.retention.returnEventsInput)
        })
      });

      const data = unwrapResponse(payload) || {};
      state.retention.rows = Array.isArray(data.rows) ? data.rows : [];
    }

    async function fetchTimeline(userId, openDrawer = false) {
      const payload = await request("/api/users/timeline", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          adminId: state.adminId.trim(),
          app: state.selectedApp,
          userId,
          dateRange: {
            start: state.startDate,
            end: state.endDate
          },
          filters: normalizeFilters(),
          limit: state.timeline.limit
        })
      });

      const data = unwrapResponse(payload) || {};
      const rows = Array.isArray(data.list) ? data.list : [];

      if (openDrawer) {
        state.drawerTitle = `${userId} · 用户时间线`;
        state.drawerSearch = "";
        state.drawerSortOrder = "DESC";
        state.drawerRows = rows;
        state.drawerOpen = true;
      } else {
        state.timeline.rows = rows;
      }
    }

    function changeApp(appId) {
      state.selectedApp = appId;
      state.eventsPanel.page = 1;
      loadMetadata();
    }

    function toggleValue(listKey, value) {
      const current = state.filters[listKey];
      if (current.includes(value)) {
        state.filters[listKey] = current.filter((item) => item !== value);
      } else {
        state.filters[listKey] = [...current, value];
      }
    }

    function toggleEvent(eventName) {
      const current = state.eventsPanel.selectedEvents;
      if (current.includes(eventName)) {
        state.eventsPanel.selectedEvents = current.filter((item) => item !== eventName);
      } else {
        state.eventsPanel.selectedEvents = [...current, eventName];
      }
    }

    function toggleAggregateList(key, value) {
      const current = state.aggregate[key];
      if (current.includes(value)) {
        state.aggregate[key] = current.filter((item) => item !== value);
      } else {
        state.aggregate[key] = [...current, value];
      }
    }

    function clearAllFilters() {
      state.filters.country_code = [];
      state.filters.platform = [];
      state.filters.vip_status = [];
      state.filters.vpn_status = [];
      state.filters.user_id = "";
      state.filters.device = "";
      state.filters.area = "";
      state.filters.ip = "";
      state.filters.body_contains = "";
      state.eventsPanel.selectedEvents = [];
    }

    function changePage(step) {
      const nextPage = state.eventsPanel.page + step;
      if (nextPage < 1) {
        return;
      }
      const maxPage = Math.max(1, Math.ceil(state.eventsPanel.total / state.eventsPanel.pageSize));
      if (nextPage > maxPage) {
        return;
      }
      state.eventsPanel.page = nextPage;
      runActiveQuery();
    }

    function closeDrawer() {
      state.drawerOpen = false;
    }

    function toggleDrawerSort() {
      state.drawerSortOrder = state.drawerSortOrder === "DESC" ? "ASC" : "DESC";
    }

    function formatAppName(appId) {
      return appNameMap[appId] || appId;
    }

    function appAccentStyle(appId) {
      return {
        background: appAccentMap[appId] || "linear-gradient(135deg, #31343f, #777d90)"
      };
    }

    const selectedAppName = computed(() => formatAppName(state.selectedApp));
    const activeViewLabel = computed(() => viewDefs.find((item) => item.value === state.activeView)?.label || "数据视图");
    const eventPageCount = computed(() => Math.max(1, Math.ceil(state.eventsPanel.total / state.eventsPanel.pageSize)));
    const activeFilterCount = computed(() => {
      const filters = normalizeFilters();
      return Object.keys(filters).length + (state.eventsPanel.selectedEvents.length ? 1 : 0);
    });

    const countryOptions = computed(() => state.metadata.countries.map((code) => ({
      value: code,
      label: countryNameMap[code] || code
    })));

    const platformOptions = computed(() => {
      const source = state.metadata.platforms.length ? state.metadata.platforms : ["ios", "android"];
      return source.map((item) => ({
        value: item,
        label: item === "ios" ? "iOS" : item === "android" ? "Android" : item
      }));
    });

    const eventSummaryCards = computed(() => {
      const rows = state.eventsPanel.rows;
      const vipUsers = rows.filter((item) => Number(item.vip_status) === 1).length;
      const refundEvents = rows.filter((item) => safeText(item.name, "").toLowerCase() === "refund").length;
      const uniqueUsers = new Set(rows.map((item) => item.user_id).filter(Boolean)).size;
      return [
        { label: "总记录数", value: formatMetricValue(state.eventsPanel.total), detail: `第 ${state.eventsPanel.page} / ${eventPageCount.value} 页` },
        { label: "当前页用户数", value: formatMetricValue(uniqueUsers), detail: "按 user_id 去重" },
        { label: "VIP 事件数", value: formatMetricValue(vipUsers), detail: "vip_status = 1" },
        { label: "退款事件数", value: formatMetricValue(refundEvents), detail: "name = refund" }
      ];
    });

    const aggregateHeaders = computed(() => {
      if (!state.aggregateRows.length) {
        return [...state.aggregate.groupBy, ...state.aggregate.metrics];
      }
      return Object.keys(state.aggregateRows[0]);
    });

    const aggregateSummaryCards = computed(() => {
      if (!state.aggregateRows.length || state.aggregate.groupBy.length > 0) {
        return [];
      }

      const row = state.aggregateRows[0];
      return state.aggregate.metrics.map((metric) => ({
        key: metric,
        label: metricLabels[metric] || metric,
        value: formatMetricValue(row[metric])
      }));
    });

    const retentionRows = computed(() => state.retention.rows.map((item) => ({
      period_start: safeText(item.period_start),
      new_user_count: Number(item.new_user_count || 0),
      day1_retention: Number(item.day1_retention || 0),
      day1_rate: `${(Number(item.day1_rate || 0) * 100).toFixed(2)}%`
    })));

    const filteredDrawerRows = computed(() => {
      const keyword = state.drawerSearch.toLowerCase().trim();
      const rows = [...state.drawerRows].filter((item) => {
        if (!keyword) {
          return true;
        }
        return [
          safeText(item.name, "").toLowerCase(),
          safeText(item.ip, "").toLowerCase(),
          safeText(item.device, "").toLowerCase(),
          safeText(item.body, "").toLowerCase()
        ].some((value) => value.includes(keyword));
      });

      return rows.sort((left, right) => {
        const leftTime = new Date(left.log_time || 0).getTime();
        const rightTime = new Date(right.log_time || 0).getTime();
        return state.drawerSortOrder === "DESC" ? rightTime - leftTime : leftTime - rightTime;
      });
    });

    const timelineRows = computed(() => state.timeline.rows);

    const filteredEventSuggestions = computed(() => {
      const keyword = state.eventsPanel.eventKeyword.trim().toLowerCase();
      const selectedSet = new Set(state.eventsPanel.selectedEvents);
      const source = state.metadata.events.filter((item) => !selectedSet.has(item));

      if (!keyword) {
        return source.slice(0, 12);
      }

      return source
        .filter((item) => item.toLowerCase().includes(keyword))
        .slice(0, 12);
    });

    loadApps();
    loadMetadata();
    return {
      activeFilterCount,
      activeViewLabel,
      aggregateHeaders,
      aggregateSummaryCards,
      appAccentStyle,
      changeApp,
      changePage,
      clearAllFilters,
      closeDrawer,
      countryOptions,
      errorMessage,
      eventPageCount,
      eventSummaryCards,
      filteredEventSuggestions,
      filteredDrawerRows,
      formatAppName,
      formatMetricValue,
      groupByLabels,
      loading,
      loadMetadata,
      metricLabels,
      platformOptions,
      retentionRows,
      runActiveQuery,
      safeText,
      selectedAppName,
      state,
      staticFilterLabels,
      timelineRows,
      toggleAggregateList,
      toggleDrawerSort,
      toggleEvent,
      toggleValue,
      viewDefs,
      fetchTimeline
    };
  }
}).mount("#app");
