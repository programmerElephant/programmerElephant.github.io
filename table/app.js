import { computed, createApp, reactive, ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";

const API_BASE_URL = "https://analyze.yuanma.live/event";

const countryNameMap = {
  CN: "中国", HK: "中国香港", TW: "中国台湾", MO: "中国澳门", JP: "日本", KR: "韩国", KP: "朝鲜", IN: "印度", PK: "巴基斯坦",
  BD: "孟加拉国", LK: "斯里兰卡", NP: "尼泊尔", BT: "不丹", MM: "缅甸", TH: "泰国", VN: "越南", LA: "老挝", KH: "柬埔寨",
  MY: "马来西亚", SG: "新加坡", ID: "印尼", PH: "菲律宾", BN: "文莱", MN: "蒙古", KZ: "哈萨克斯坦", UZ: "乌兹别克斯坦",
  TM: "土库曼斯坦", KG: "吉尔吉斯斯坦", TJ: "塔吉克斯坦", TR: "土耳其", SA: "沙特阿拉伯", AE: "阿联酋", IR: "伊朗",
  IQ: "伊拉克", IL: "以色列", JO: "约旦", LB: "黎巴嫩", SY: "叙利亚", KW: "科威特", QA: "卡塔尔", BH: "巴林", OM: "阿曼",
  YE: "也门", GB: "英国", IE: "爱尔兰", FR: "法国", DE: "德国", IT: "意大利", ES: "西班牙", PT: "葡萄牙", NL: "荷兰",
  BE: "比利时", LU: "卢森堡", CH: "瑞士", AT: "奥地利", SE: "瑞典", NO: "挪威", DK: "丹麦", FI: "芬兰", IS: "冰岛",
  PL: "波兰", CZ: "捷克", SK: "斯洛伐克", HU: "匈牙利", RO: "罗马尼亚", BG: "保加利亚", GR: "希腊", HR: "克罗地亚",
  SI: "斯洛文尼亚", RS: "塞尔维亚", BA: "波黑", ME: "黑山", MK: "北马其顿", AL: "阿尔巴尼亚", UA: "乌克兰",
  BY: "白俄罗斯", LT: "立陶宛", LV: "拉脱维亚", EE: "爱沙尼亚", US: "美国", CA: "加拿大", MX: "墨西哥", BR: "巴西",
  AR: "阿根廷", CL: "智利", CO: "哥伦比亚", PE: "秘鲁", VE: "委内瑞拉", EC: "厄瓜多尔", BO: "玻利维亚", PY: "巴拉圭",
  UY: "乌拉圭", EG: "埃及", ZA: "南非", NG: "尼日利亚", KE: "肯尼亚", ET: "埃塞俄比亚", TZ: "坦桑尼亚", UG: "乌干达",
  GH: "加纳", CI: "科特迪瓦", SN: "塞内加尔", DZ: "阿尔及利亚", MA: "摩洛哥", TN: "突尼斯", LY: "利比亚", SD: "苏丹",
  AU: "澳大利亚", NZ: "新西兰", PG: "巴布亚新几内亚", FJ: "斐济", SB: "所罗门群岛", RU: "俄罗斯", AF: "阿富汗",
  AM: "亚美尼亚", AZ: "阿塞拜疆", GE: "格鲁吉亚", MD: "摩尔多瓦"
};

const platformLabelMap = {
  "": "全部平台",
  android: "Android",
  ios: "iOS"
};

const appAccentMap = {
  vpnproxy: "linear-gradient(135deg, #0d1c3b, #1d6de7)",
  lumotalk: "linear-gradient(135deg, #6327ff, #ff7a59)",
  manbo: "linear-gradient(135deg, #16202b, #19a974)",
  funVoice: "linear-gradient(135deg, #1a1326, #ff8b3d)"
};

const apps = [
  { name: "VPN Proxy", table: "vpnproxy" },
  { name: "LumoTalk", table: "lumotalk" },
  { name: "Manbo", table: "manbo" },
  { name: "我的刀盾", table: "funVoice" }
];

const platforms = [
  { label: "全部", value: "" },
  { label: "Android", value: "android" },
  { label: "iOS", value: "ios" }
];

const actions = [
  { label: "用户列表", value: "userIds" },
  { label: "留存率", value: "retention" },
  { label: "单用户数据", value: "userData" },
  { label: "VIP 人数", value: "vipCount" }
];

const actionLabelMap = {
  retention: "留存率",
  userIds: "用户列表",
  userData: "单用户数据",
  vipCount: "VIP 人数"
};

function safeText(value, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getAdjustedDateRange(startDateStr, endDateStr, country) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (country === "0" || country === "1" || country === "TR" || country === "SA") {
    start.setHours(5, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(4, 59, 59, 0);
  } else {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 0);
  }

  return {
    startDateTime: formatDateTime(start),
    endDateTime: formatDateTime(end)
  };
}

function getToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

createApp({
  setup() {
    const loading = ref(false);
    const errorMessage = ref("");

    const state = reactive({
      selectedApp: apps[0],
      selectedCountry: "",
      selectedAction: "userIds",
      selectedPlatform: "",
      adminId: "",
      startDate: getToday(),
      endDate: getToday(),
      userIdInput: "",
      countries: [],
      userStats: { install: [], buy: [], cancel: [], refund: [], userIds: [] },
      currentAllUserList: [],
      retentionData: [],
      vipCountData: null,
      userListSearch: "",
      userSortField: "log_time",
      userSortOrder: "desc",
      drawerOpen: false,
      drawerMode: "timeline",
      drawerTitle: "用户详情",
      drawerList: [],
      drawerTimeline: [],
      drawerSearch: "",
      drawerSortOrder: "desc"
    });

    function createApiUrl(params = {}) {
      const url = new URL(API_BASE_URL);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });

      if (state.selectedPlatform) {
        url.searchParams.append("platform", state.selectedPlatform);
      }

      return url;
    }

    async function fetchJson(url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(response.statusText || "请求失败");
      }
      return response.json();
    }

    async function initCountries() {
      try {
        const response = await fetchJson(
          createApiUrl({
            action: "countries",
            adminId: "",
            table: state.selectedApp.table
          })
        );

        state.countries = response?.success && Array.isArray(response.data) ? response.data : [];
        if (!state.countries.includes(state.selectedCountry)) {
          state.selectedCountry = "";
        }
      } catch (error) {
        state.countries = [];
        state.selectedCountry = "";
      }
    }

    function clearCurrentResult() {
      state.currentAllUserList = [];
      state.retentionData = [];
      state.vipCountData = null;
      state.userStats = { install: [], buy: [], cancel: [], refund: [], userIds: [] };
    }

    async function runFetchIfReady() {
      if (!state.adminId || !state.startDate || !state.endDate) {
        return;
      }

      if (state.selectedAction === "userData" && !state.userIdInput) {
        return;
      }

      await handleFetch();
    }

    async function setAction(action) {
      state.selectedAction = action;
      errorMessage.value = "";
      clearCurrentResult();
      await runFetchIfReady();
    }

    async function changeApp(app) {
      state.selectedApp = app;
      errorMessage.value = "";
      clearCurrentResult();
      await initCountries();
      await runFetchIfReady();
    }

    async function changePlatform(platformValue) {
      state.selectedPlatform = platformValue;
      errorMessage.value = "";
      clearCurrentResult();
      await initCountries();
      await runFetchIfReady();
    }

    function vipText(status) {
      if (status === 1) {
        return "会员";
      }
      if (status === 2) {
        return "过期";
      }
      return "普通";
    }

    function vipTone(status) {
      if (status === 1) {
        return "success";
      }
      if (status === 2) {
        return "warning";
      }
      return "neutral";
    }

    function formatBodyContent(body) {
      if (!body) {
        return [];
      }
      return String(body)
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    function closeDrawer() {
      state.drawerOpen = false;
    }

    function openTimelineDrawer(list, title = "用户详情") {
      state.drawerTitle = title;
      state.drawerMode = "timeline";
      state.drawerSearch = "";
      state.drawerSortOrder = "desc";
      state.drawerTimeline = Array.isArray(list) ? [...list] : [];
      state.drawerOpen = true;
    }

    function openListDrawer(list, title) {
      state.drawerTitle = title;
      state.drawerMode = "list";
      state.drawerList = Array.isArray(list) ? list : [];
      state.drawerOpen = true;
    }

    async function fetchStats(adminId, startDateTime, endDateTime) {
      const actionMap = {
        install: "install",
        buy: "subscribe_page_success,guide_start_success",
        cancel: "cancel",
        refund: "refund",
        userIds: null
      };

      const requests = Object.entries(actionMap).map(async ([action, name]) => {
        try {
          const data = await fetchJson(
            createApiUrl({
              table: state.selectedApp.table,
              action,
              adminId,
              startDate: startDateTime,
              endDate: endDateTime,
              country: state.selectedCountry,
              name
            })
          );
          return { action, data: Array.isArray(data) ? data : [] };
        } catch (error) {
          return { action, data: [] };
        }
      });

      const results = await Promise.all(requests);
      results.forEach(({ action, data }) => {
        state.userStats[action] = data;
      });
      state.currentAllUserList = state.userStats.userIds;
    }

    async function fetchUser(userId) {
      if (!userId) {
        return;
      }

      try {
        const data = await fetchJson(
          createApiUrl({
            action: "userData",
            table: state.selectedApp.table,
            adminId: state.adminId,
            userId
          })
        );
        openTimelineDrawer(Array.isArray(data) ? data : [], `${userId} · 用户时间线`);
      } catch (error) {
        errorMessage.value = `详情失败: ${error.message}`;
      }
    }

    async function handleFetch() {
      errorMessage.value = "";

      if (!state.adminId) {
        errorMessage.value = "请输入管理员 ID";
        return;
      }

      if (!state.startDate || !state.endDate) {
        errorMessage.value = "请选择日期";
        return;
      }

      if (state.selectedAction === "userData" && !state.userIdInput) {
        errorMessage.value = "请输入用户 ID";
        return;
      }

      loading.value = true;

      const { startDateTime, endDateTime } = getAdjustedDateRange(
        state.startDate,
        state.endDate,
        state.selectedCountry
      );

      try {
        if (state.selectedAction === "userIds") {
          await fetchStats(state.adminId, startDateTime, endDateTime);
        } else {
          const data = await fetchJson(
            createApiUrl({
              table: state.selectedApp.table,
              action: state.selectedAction,
              adminId: state.adminId,
              startDate: startDateTime,
              endDate: endDateTime,
              country: state.selectedAction === "retention" ? state.selectedCountry : undefined,
              userId: state.selectedAction === "userData" ? state.userIdInput : undefined
            })
          );

          if (state.selectedAction === "retention") {
            state.retentionData = Array.isArray(data) ? data : [];
          } else if (state.selectedAction === "vipCount") {
            state.vipCountData = data;
          } else if (state.selectedAction === "userData") {
            openTimelineDrawer(Array.isArray(data) ? data : [], `${state.userIdInput} · 用户时间线`);
          }
        }
      } catch (error) {
        errorMessage.value = `查询失败: ${error.message}`;
      } finally {
        loading.value = false;
      }
    }

    function toggleUserSort() {
      const nextField = state.userSortField === "log_time" ? "vip_status" : "log_time";
      const nextOrder = nextField === "vip_status"
        ? "desc"
        : state.userSortOrder === "desc"
          ? "asc"
          : "desc";

      state.userSortField = nextField;
      state.userSortOrder = nextOrder;
    }

    function toggleDrawerSort() {
      state.drawerSortOrder = state.drawerSortOrder === "desc" ? "asc" : "desc";
    }

    function openUserIdDrawer(card) {
      if (!card.items.length) {
        errorMessage.value = `当前没有${card.label}`;
        return;
      }
      openListDrawer(card.items, card.drawerTitle);
    }

    function appInitials(name) {
      return safeText(name)
        .split(/[\s-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item.charAt(0).toUpperCase())
        .join("");
    }

    function appAccentStyle(table) {
      return { background: appAccentMap[table] || "linear-gradient(135deg, #31343f, #777d90)" };
    }

    const countryOptions = computed(() => [
      { label: "全部地区", value: "" },
      ...state.countries.map((code) => ({
        label: countryNameMap[code] || code,
        value: code
      }))
    ]);

    const filteredUserList = computed(() => {
      const searchText = state.userListSearch.toLowerCase().trim();

      return [...state.currentAllUserList]
        .filter((item) => {
          if (!searchText) {
            return true;
          }
          return [
            safeText(item.user_id).toLowerCase(),
            safeText(item.country_code).toLowerCase(),
            safeText(item.device).toLowerCase()
          ].some((value) => value.includes(searchText));
        })
        .sort((left, right) => {
          let leftValue;
          let rightValue;

          if (state.userSortField === "log_time") {
            leftValue = new Date(left.log_time || 0).getTime();
            rightValue = new Date(right.log_time || 0).getTime();
          } else {
            leftValue = left.vip_status ?? -1;
            rightValue = right.vip_status ?? -1;
          }

          if (leftValue < rightValue) {
            return state.userSortOrder === "asc" ? -1 : 1;
          }
          if (leftValue > rightValue) {
            return state.userSortOrder === "asc" ? 1 : -1;
          }
          return 0;
        });
    });

    const retentionRows = computed(() => state.retentionData.map((item) => {
      const rate = Number(item.day1_rate || 0) * 100;
      return {
        date: item.period_start ? item.period_start.substring(0, 10) : "未知日期",
        newUserCount: safeText(item.new_user_count, "0"),
        day1Retention: safeText(item.day1_retention, "0"),
        day1Rate: `${rate.toFixed(2)}%`
      };
    }));

    const vipCountDisplay = computed(() => safeText(state.vipCountData?.count, "0"));

    const statCards = computed(() => {
      const installCount = state.userStats.install.length;
      const buyCount = state.userStats.buy.length;
      const cancelCount = state.userStats.cancel.length;
      const refundCount = state.userStats.refund.length;
      const userCount = state.userStats.userIds.length;
      const buyRate = installCount > 0 ? `${(buyCount / installCount * 100).toFixed(2)}%` : "0.00%";
      const cancelRate = buyCount > 0 ? `${(cancelCount / buyCount * 100).toFixed(2)}%` : "0.00%";
      const refundRate = buyCount > 0 ? `${(refundCount / buyCount * 100).toFixed(2)}%` : "0.00%";

      return [
        {
          key: "install",
          label: "新用户数",
          value: `${installCount}/${userCount}`,
          rateLabel: "购买率",
          rate: buyRate,
          tone: "tone-blue",
          items: state.userStats.install,
          drawerTitle: "新用户列表"
        },
        {
          key: "buy",
          label: "购买人数",
          value: String(buyCount),
          rateLabel: "转化率",
          rate: buyRate,
          tone: "tone-green",
          items: state.userStats.buy,
          drawerTitle: "购买用户列表"
        },
        {
          key: "cancel",
          label: "订单取消人数",
          value: String(cancelCount),
          rateLabel: "取消率",
          rate: cancelRate,
          tone: "tone-amber",
          items: state.userStats.cancel,
          drawerTitle: "取消用户列表"
        },
        {
          key: "refund",
          label: "退款人数",
          value: String(refundCount),
          rateLabel: "退款率",
          rate: refundRate,
          tone: "tone-red",
          items: state.userStats.refund,
          drawerTitle: "退款用户列表"
        }
      ];
    });

    const filteredDrawerTimeline = computed(() => {
      const searchText = state.drawerSearch.toLowerCase().trim();
      return [...state.drawerTimeline]
        .filter((item) => {
          if (!searchText) {
            return true;
          }
          return [
            safeText(item.name).toLowerCase(),
            safeText(item.ip).toLowerCase(),
            safeText(item.device).toLowerCase(),
            safeText(item.body).toLowerCase()
          ].some((value) => value.includes(searchText));
        })
        .sort((left, right) => {
          const leftTime = new Date(left.log_time || 0).getTime();
          const rightTime = new Date(right.log_time || 0).getTime();
          return state.drawerSortOrder === "desc" ? rightTime - leftTime : leftTime - rightTime;
        });
    });

    const userSortButtonLabel = computed(() => {
      const label = state.userSortField === "log_time" ? "按时间" : "按 VIP";
      const icon = state.userSortOrder === "desc" ? "↓" : "↑";
      return `${label} ${icon}`;
    });

    const drawerSortButtonLabel = computed(() => `按时间 ${state.drawerSortOrder === "desc" ? "↓" : "↑"}`);
    const resultTitle = computed(() => actionLabelMap[state.selectedAction]);

    const selectedCountryLabel = computed(() => {
      if (!state.selectedCountry) {
        return "全部地区";
      }
      return countryNameMap[state.selectedCountry] || state.selectedCountry;
    });

    const selectedPlatformLabel = computed(() => platformLabelMap[state.selectedPlatform] || state.selectedPlatform || "全部平台");

    const resultCountText = computed(() => {
      if (state.selectedAction === "retention") {
        return `${retentionRows.value.length} 条`;
      }
      if (state.selectedAction === "vipCount") {
        return "实时汇总";
      }
      if (state.selectedAction === "userIds") {
        return `${filteredUserList.value.length} 位用户`;
      }
      return "抽屉时间线";
    });

    const appActionSummary = computed(() => (app) => {
      if (app.table !== state.selectedApp.table) {
        return `点击查看 ${actionLabelMap[state.selectedAction]}`;
      }

      if (loading.value) {
        return `正在加载 ${actionLabelMap[state.selectedAction]}`;
      }

      if (state.selectedAction === "userIds") {
        return `当前共 ${filteredUserList.value.length} 位用户`;
      }

      if (state.selectedAction === "retention") {
        return `当前共 ${retentionRows.value.length} 条留存记录`;
      }

      if (state.selectedAction === "vipCount") {
        return `当前 VIP 人数 ${vipCountDisplay.value}`;
      }

      return "点击后在右侧抽屉查看用户时间线";
    });

    initCountries();

    return {
      actionLabelMap,
      actions,
      appAccentStyle,
      appActionSummary,
      appInitials,
      apps,
      changeApp,
      changePlatform,
      closeDrawer,
      countryOptions,
      drawerSortButtonLabel,
      errorMessage,
      fetchUser,
      filteredDrawerTimeline,
      filteredUserList,
      formatBodyContent,
      handleFetch,
      loading,
      openUserIdDrawer,
      platforms,
      retentionRows,
      resultCountText,
      resultTitle,
      safeText,
      selectedCountryLabel,
      selectedPlatformLabel,
      setAction,
      statCards,
      state,
      toggleDrawerSort,
      toggleUserSort,
      userSortButtonLabel,
      vipCountDisplay,
      vipText,
      vipTone
    };
  }
}).mount("#app");
