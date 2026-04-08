const API_BASE_URL = "https://analyze.yuanma.live/event";

const countryNameMap = {
  "CN": "中国", "HK": "中国香港", "TW": "中国台湾", "MO": "中国澳门", "JP": "日本", "KR": "韩国", "KP": "朝鲜", "IN": "印度", "PK": "巴基斯坦", "BD": "孟加拉国", "LK": "斯里兰卡", "NP": "尼泊尔", "BT": "不丹", "MM": "缅甸", "TH": "泰国", "VN": "越南", "LA": "老挝", "KH": "柬埔寨", "MY": "马来西亚", "SG": "新加坡", "ID": "印尼", "PH": "菲律宾", "BN": "文莱", "MN": "蒙古", "KZ": "哈萨克斯坦", "UZ": "乌兹别克斯坦", "TM": "土库曼斯坦", "KG": "吉尔吉斯斯坦", "TJ": "塔吉克斯坦", "TR": "土耳其", "SA": "沙特阿拉伯", "AE": "阿联酋", "IR": "伊朗", "IQ": "伊拉克", "IL": "以色列", "JO": "约旦", "LB": "黎巴嫩", "SY": "叙利亚", "KW": "科威特", "QA": "卡塔尔", "BH": "巴林", "OM": "阿曼", "YE": "也门", "GB": "英国", "IE": "爱尔兰", "FR": "法国", "DE": "德国", "IT": "意大利", "ES": "西班牙", "PT": "葡萄牙", "NL": "荷兰", "BE": "比利时", "LU": "卢森堡", "CH": "瑞士", "AT": "奥地利", "SE": "瑞典", "NO": "挪威", "DK": "丹麦", "FI": "芬兰", "IS": "冰岛", "PL": "波兰", "CZ": "捷克", "SK": "斯洛伐克", "HU": "匈牙利", "RO": "罗马尼亚", "BG": "保加利亚", "GR": "希腊", "HR": "克罗地亚", "SI": "斯洛文尼亚", "RS": "塞尔维亚", "BA": "波黑", "ME": "黑山", "MK": "北马其顿", "AL": "阿尔巴尼亚", "UA": "乌克兰", "BY": "白俄罗斯", "LT": "立陶宛", "LV": "拉脱维亚", "EE": "爱沙尼亚", "US": "美国", "CA": "加拿大", "MX": "墨西哥", "BR": "巴西", "AR": "阿根廷", "CL": "智利", "CO": "哥伦比亚", "PE": "秘鲁", "VE": "委内瑞拉", "EC": "厄瓜多尔", "BO": "玻利维亚", "PY": "巴拉圭", "UY": "乌拉圭", "EG": "埃及", "ZA": "南非", "NG": "尼日利亚", "KE": "肯尼亚", "ET": "埃塞俄比亚", "TZ": "坦桑尼亚", "UG": "乌干达", "GH": "加纳", "CI": "科特迪瓦", "SN": "塞内加尔", "DZ": "阿尔及利亚", "MA": "摩洛哥", "TN": "突尼斯", "LY": "利比亚", "SD": "苏丹", "AU": "澳大利亚", "NZ": "新西兰", "PG": "巴布亚新几内亚", "FJ": "斐济", "SB": "所罗门群岛", "RU": "俄罗斯", "AF": "阿富汗", "AM": "亚美尼亚", "AZ": "阿塞拜疆", "GE": "格鲁吉亚", "MD": "摩尔多瓦"
};

const state = {
  selectedApp: { name: "VPN Proxy", table: "vpnproxy" },
  selectedCountry: "",
  selectedAction: "userIds",
  selectedPlatform: "",
  userStats: { install: [], buy: [], cancel: [], refund: [], userIds: [] },
  currentAllUserList: [],
  currentDisplayedUserList: [],
  currentDrawerData: [],
  drawerSortOrder: "desc"
};

const elements = {
  productTabs: document.getElementById("productTabs"),
  platformSelector: document.getElementById("platformSelector"),
  countrySelector: document.getElementById("countrySelector"),
  actionSelector: document.getElementById("actionSelector"),
  adminId: document.getElementById("adminId"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  fetchBtn: document.getElementById("fetchBtn"),
  userIdInput: document.getElementById("userIdInput"),
  userIdInputWrapper: document.getElementById("userIdInputWrapper"),
  statsContainer: document.getElementById("statsContainer"),
  userListControls: document.getElementById("userListControls"),
  userListSearch: document.getElementById("userListSearch"),
  userListSortBtn: document.getElementById("userListSortBtn"),
  userDataContainer: document.getElementById("userDataContainer"),
  overlay: document.getElementById("overlay"),
  drawer: document.getElementById("userDrawer"),
  drawerClose: document.getElementById("drawerClose"),
  drawerTitle: document.getElementById("drawerTitle"),
  drawerControls: document.getElementById("drawerControls"),
  drawerSearch: document.getElementById("drawerSearch"),
  drawerSortBtn: document.getElementById("drawerSortBtn"),
  drawerContent: document.getElementById("drawerContent"),
  statNewUsersValue: document.getElementById("statNewUsersValue"),
  statPurchasesValue: document.getElementById("statPurchasesValue"),
  statCancellationsValue: document.getElementById("statCancellationsValue"),
  statRefundsValue: document.getElementById("statRefundsValue"),
  rateBuy: document.getElementById("rateBuy"),
  rateCancel: document.getElementById("rateCancel"),
  rateRefund: document.getElementById("rateRefund")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textValue(value, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

function setActiveClass(nodeList, activeElement) {
  nodeList.forEach((node) => node.classList.remove("active"));
  activeElement.classList.add("active");
}

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
    throw new Error(response.statusText);
  }
  return response.json();
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

function setToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateText = `${yyyy}-${mm}-${dd}`;
  elements.startDate.value = dateText;
  elements.endDate.value = dateText;
}

function resetCountrySelection() {
  state.selectedCountry = "";
}

function renderCountrySelectors(countries = []) {
  const selectorHtml = ['<div class="ant-selector active" data-value="">全部</div>'];
  countries.forEach((code) => {
    selectorHtml.push(
      `<div class="ant-selector" data-value="${escapeHtml(code)}">${escapeHtml(countryNameMap[code] || code)}</div>`
    );
  });

  elements.countrySelector.innerHTML = selectorHtml.join("");
  resetCountrySelection();

  elements.countrySelector.querySelectorAll(".ant-selector").forEach((button) => {
    button.onclick = () => {
      setActiveClass(elements.countrySelector.querySelectorAll(".ant-selector"), button);
      state.selectedCountry = button.dataset.value || "";
    };
  });
}

async function initCountries() {
  elements.countrySelector.innerHTML = '<div class="ant-selector active" data-value="">加载中...</div>';

  try {
    const response = await fetchJson(
      createApiUrl({
        action: "countries",
        adminId: "",
        table: state.selectedApp.table
      })
    );

    if (response.success && Array.isArray(response.data)) {
      renderCountrySelectors(response.data);
      return;
    }
  } catch (error) {
    console.error("获取国家列表失败", error);
  }

  renderCountrySelectors([]);
}

function setAction(action) {
  state.selectedAction = action;
  const isUserIds = action === "userIds";
  const isUserData = action === "userData";

  elements.statsContainer.classList.toggle("hidden", !isUserIds);
  elements.userListControls.classList.toggle("hidden", !isUserIds);
  elements.userIdInputWrapper.classList.toggle("hidden", !isUserData);
}

function vipStatusLabel(status) {
  switch (status) {
    case 1:
      return '<span class="px-2 py-1 text-xs bg-green-500 text-white rounded-full">会员</span>';
    case 2:
      return '<span class="px-2 py-1 text-xs bg-orange-500 text-white rounded-full">过期</span>';
    default:
      return '<span class="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-full">普通</span>';
  }
}

function updateStatsDisplay() {
  const installCount = state.userStats.install.length;
  const buyCount = state.userStats.buy.length;
  const cancelCount = state.userStats.cancel.length;
  const refundCount = state.userStats.refund.length;
  const userCount = state.userStats.userIds.length;

  elements.statNewUsersValue.textContent = `${installCount}/${userCount}`;
  elements.statPurchasesValue.textContent = String(buyCount);
  elements.statCancellationsValue.textContent = String(cancelCount);
  elements.statRefundsValue.textContent = String(refundCount);

  const rateBuy = installCount > 0 ? (buyCount / installCount * 100).toFixed(2) : "0.00";
  const rateCancel = buyCount > 0 ? (cancelCount / buyCount * 100).toFixed(2) : "0.00";
  const rateRefund = buyCount > 0 ? (refundCount / buyCount * 100).toFixed(2) : "0.00";

  elements.rateBuy.textContent = `${rateBuy}%`;
  elements.rateCancel.textContent = `${rateCancel}%`;
  elements.rateRefund.textContent = `${rateRefund}%`;
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

  updateStatsDisplay();
}

function renderRetentionTable(data) {
  let html = `<table class="ant-table"><thead><tr>
    <th>日期</th><th>新增</th><th>Day1 留存</th><th>留存率%</th></tr></thead><tbody>`;

  data.forEach((item) => {
    const date = item.period_start ? item.period_start.substring(0, 10) : "未知日期";
    const rate = Number(item.day1_rate || 0) * 100;
    html += `<tr><td>${escapeHtml(date)}</td><td>${escapeHtml(textValue(item.new_user_count, "0"))}</td><td>${escapeHtml(textValue(item.day1_retention, "0"))}</td>
      <td>${escapeHtml(rate.toFixed(2))}%</td></tr>`;
  });

  html += "</tbody></table>";
  elements.userDataContainer.innerHTML = html;
}

function renderVipCount(data) {
  const count = textValue(data?.count, "0");
  elements.userDataContainer.innerHTML = `<p class="text-lg">VIP人数：<b class="text-green-600">${escapeHtml(count)}</b></p>`;
}

function renderUserList(list) {
  let html = `<table class="ant-table"><thead><tr>
    <th>UserID</th><th>国家</th><th>设备</th><th>VIP</th><th>最后记录时间</th><th>操作</th></tr></thead><tbody>`;

  list.forEach((item) => {
    const userId = textValue(item.user_id, "N/A");
    html += `<tr><td>${escapeHtml(userId)}</td><td>${escapeHtml(textValue(item.country_code, "N/A"))}</td><td>${escapeHtml(textValue(item.device, "N/A"))}</td>
      <td>${vipStatusLabel(item.vip_status)}</td>
      <td>${escapeHtml(textValue(item.log_time, "N/A"))}</td>
      <td><button class="ant-btn openUserBtn" data-id="${escapeHtml(userId)}">打开</button></td></tr>`;
  });

  html += "</tbody></table>";
  elements.userDataContainer.innerHTML = html;

  elements.userDataContainer.querySelectorAll(".openUserBtn").forEach((button) => {
    button.onclick = () => fetchUser(button.dataset.id);
  });
}

function applyUserListFilterAndSort() {
  const searchText = elements.userListSearch.value.toLowerCase().trim();
  const sortField = elements.userListSortBtn.dataset.sortField;
  const sortOrder = elements.userListSortBtn.dataset.sortOrder;

  const filteredList = state.currentAllUserList
    .filter((item) => {
      if (!searchText) {
        return true;
      }

      return [
        textValue(item.user_id).toLowerCase(),
        textValue(item.country_code).toLowerCase(),
        textValue(item.device).toLowerCase()
      ].some((value) => value.includes(searchText));
    })
    .sort((left, right) => {
      let leftValue;
      let rightValue;

      if (sortField === "log_time") {
        leftValue = new Date(left.log_time || 0);
        rightValue = new Date(right.log_time || 0);
      } else if (sortField === "vip_status") {
        leftValue = left.vip_status ?? -1;
        rightValue = right.vip_status ?? -1;
      } else {
        leftValue = left[sortField] || "";
        rightValue = right[sortField] || "";
      }

      if (leftValue < rightValue) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });

  state.currentDisplayedUserList = filteredList;
  renderUserList(filteredList);
}

function formatBodyContent(body) {
  if (!body) {
    return "";
  }

  return body
    .split("|")
    .filter((item) => item.trim() !== "")
    .map((item) => `<div class="text-xs text-gray-700">${escapeHtml(item.trim())}</div>`)
    .join("");
}

function renderDrawerContent(list) {
  let html = `<table class="ant-table"><thead><tr>
    <th style="text-align: left;">时间</th><th style="text-align: center;">事件</th><th style="text-align: left;">详情</th></tr></thead><tbody>`;

  list.forEach((item) => {
    html += `<tr><td style="text-align: left;">${escapeHtml(textValue(item.log_time, "N/A"))}</td><td style="text-align: center;">${escapeHtml(textValue(item.name, "N/A"))}</td><td style="text-align: left;">
      <div class="text-left text-xs space-y-1">
        <div><span class="font-semibold">IP:</span> ${escapeHtml(textValue(item.ip, "N/A"))}</div>
        <div><span class="font-semibold">设备:</span> ${escapeHtml(textValue(item.device, "N/A"))}</div>
        <div><span class="font-semibold">地区:</span> ${escapeHtml(textValue(item.area, "N/A"))}</div>
        <div><span class="font-semibold">VPN:</span> ${item.vpn_status === 1 ? "开启" : "关闭"}</div>
        ${item.body ? `<div><span class="font-semibold">Body:</span> ${formatBodyContent(item.body)}</div>` : ""}
      </div></td></tr>`;
  });

  html += "</tbody></table>";
  elements.drawerContent.innerHTML = html;
}

function openDrawer() {
  elements.drawer.classList.add("open");
  elements.overlay.classList.add("show");
}

function closeDrawer() {
  elements.drawer.classList.remove("open");
  elements.overlay.classList.remove("show");
}

function sortDrawerData(reset = false) {
  if (state.currentDrawerData.length === 0) {
    return;
  }

  state.drawerSortOrder = reset
    ? "desc"
    : state.drawerSortOrder === "desc"
      ? "asc"
      : "desc";

  elements.drawerSearch.value = "";
  state.currentDrawerData.sort((left, right) => {
    const leftTime = new Date(left.log_time || 0);
    const rightTime = new Date(right.log_time || 0);
    return state.drawerSortOrder === "desc" ? rightTime - leftTime : leftTime - rightTime;
  });

  elements.drawerSortBtn.textContent = state.drawerSortOrder === "desc" ? "按时间 ↓" : "按时间 ↑";
  renderDrawerContent(state.currentDrawerData);
}

function applyDrawerSearch() {
  const searchText = elements.drawerSearch.value.toLowerCase().trim();
  if (!searchText) {
    sortDrawerData(true);
    return;
  }

  const filteredList = state.currentDrawerData.filter((item) => {
    return [
      textValue(item.name).toLowerCase(),
      textValue(item.ip).toLowerCase(),
      textValue(item.device).toLowerCase(),
      textValue(item.body).toLowerCase()
    ].some((value) => value.includes(searchText));
  });

  renderDrawerContent(filteredList);
}

function openDrawerWithData(list) {
  elements.drawerTitle.textContent = "用户详情";
  elements.drawerControls.classList.remove("hidden");
  state.currentDrawerData = Array.isArray(list) ? [...list] : [];
  elements.drawerSearch.value = "";
  state.drawerSortOrder = "desc";
  state.currentDrawerData.sort((left, right) => new Date(right.log_time || 0) - new Date(left.log_time || 0));
  elements.drawerSortBtn.textContent = "按时间 ↓";
  renderDrawerContent(state.currentDrawerData);
  openDrawer();
}

function openDrawerWithUserIds(list, title) {
  elements.drawerTitle.textContent = title;
  elements.drawerControls.classList.add("hidden");

  let html = `<table class="ant-table"><thead><tr><th>UserID</th><th>国家</th><th>最后时间</th></tr></thead><tbody>`;
  list.forEach((item) => {
    html += `<tr><td>${escapeHtml(textValue(item.user_id, "N/A"))}</td><td>${escapeHtml(textValue(item.country_code, "N/A"))}</td><td>${escapeHtml(textValue(item.log_time, "N/A"))}</td></tr>`;
  });
  html += "</tbody></table>";

  elements.drawerContent.innerHTML = html;
  openDrawer();
}

async function fetchUser(userId) {
  const adminId = elements.adminId.value.trim();

  try {
    const data = await fetchJson(
      createApiUrl({
        action: "userData",
        table: state.selectedApp.table,
        adminId,
        userId
      })
    );

    openDrawerWithData(data);
  } catch (error) {
    alert(`详情失败: ${error.message}`);
  }
}

function renderResult(data) {
  elements.userDataContainer.innerHTML = "";

  if (state.selectedAction === "retention") {
    renderRetentionTable(Array.isArray(data) ? data : []);
    return;
  }

  if (state.selectedAction === "vipCount") {
    renderVipCount(data);
    return;
  }

  if (state.selectedAction === "userIds") {
    state.currentAllUserList = Array.isArray(data) ? data : [];
    applyUserListFilterAndSort();
    return;
  }

  if (state.selectedAction === "userData") {
    openDrawerWithData(Array.isArray(data) ? data : []);
  }
}

async function handleFetch() {
  const adminId = elements.adminId.value.trim();
  if (!adminId) {
    alert("请输入管理员ID");
    return;
  }

  if (!elements.startDate.value || !elements.endDate.value) {
    alert("请选择日期");
    return;
  }

  if (state.selectedAction === "userData" && !elements.userIdInput.value.trim()) {
    alert("请输入用户ID");
    return;
  }

  const { startDateTime, endDateTime } = getAdjustedDateRange(
    elements.startDate.value,
    elements.endDate.value,
    state.selectedCountry
  );

  if (state.selectedAction === "userIds") {
    await fetchStats(adminId, startDateTime, endDateTime);
    state.currentAllUserList = state.userStats.userIds;
    applyUserListFilterAndSort();
    return;
  }

  try {
    const data = await fetchJson(
      createApiUrl({
        table: state.selectedApp.table,
        action: state.selectedAction,
        adminId,
        startDate: startDateTime,
        endDate: endDateTime,
        country: state.selectedAction === "retention" ? state.selectedCountry : undefined,
        userId: state.selectedAction === "userData" ? elements.userIdInput.value.trim() : undefined
      })
    );

    renderResult(data);
  } catch (error) {
    alert(`查询失败: ${error.message}`);
  }
}

function bindEvents() {
  elements.productTabs.querySelectorAll(".ant-tab").forEach((button) => {
    button.onclick = async () => {
      setActiveClass(elements.productTabs.querySelectorAll(".ant-tab"), button);
      state.selectedApp = { table: button.dataset.app, name: button.dataset.name };
      await initCountries();
    };
  });

  elements.platformSelector.querySelectorAll(".ant-selector").forEach((button) => {
    button.onclick = async () => {
      setActiveClass(elements.platformSelector.querySelectorAll(".ant-selector"), button);
      state.selectedPlatform = button.dataset.platform || "";
      await initCountries();
    };
  });

  elements.actionSelector.querySelectorAll(".ant-selector").forEach((button) => {
    button.onclick = () => {
      setActiveClass(elements.actionSelector.querySelectorAll(".ant-selector"), button);
      setAction(button.dataset.action);
    };
  });

  elements.fetchBtn.onclick = handleFetch;

  elements.userListSortBtn.onclick = () => {
    const currentField = elements.userListSortBtn.dataset.sortField;
    const currentOrder = elements.userListSortBtn.dataset.sortOrder;
    const nextField = currentField === "log_time" ? "vip_status" : "log_time";
    const nextOrder = nextField === "vip_status" ? "desc" : currentOrder === "desc" ? "asc" : "desc";
    const label = nextField === "log_time" ? "时间" : "VIP";
    const icon = nextOrder === "desc" ? "↓" : "↑";

    elements.userListSortBtn.dataset.sortField = nextField;
    elements.userListSortBtn.dataset.sortOrder = nextOrder;
    elements.userListSortBtn.textContent = `按${label} ${icon}`;
    applyUserListFilterAndSort();
  };

  elements.userListSearch.oninput = applyUserListFilterAndSort;
  elements.drawerClose.onclick = closeDrawer;
  elements.overlay.onclick = closeDrawer;
  elements.drawerSortBtn.onclick = () => sortDrawerData(false);
  elements.drawerSearch.oninput = applyDrawerSearch;

  elements.statsContainer.querySelectorAll(".stat-card").forEach((card) => {
    card.onclick = () => {
      const action = card.dataset.action;
      const label = card.dataset.label || "用户列表";
      const list = state.userStats[action] || [];

      if (list.length === 0) {
        alert(`当前没有 ${label}`);
        return;
      }

      openDrawerWithUserIds(list, label);
    };
  });
}

function init() {
  bindEvents();
  setToday();
  setAction(state.selectedAction);
  initCountries();
}

window.addEventListener("load", init);
