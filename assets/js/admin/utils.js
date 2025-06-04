// assets/js/admin/utils.js

const FPDUtils = {
  showLoading: function () {
    jQuery("#fpd-loading-screen").fadeIn();
  },

  hideLoading: function () {
    jQuery("#fpd-loading-screen").fadeOut();
  },

  addRuleToContainer: function (
    containerId,
    operator = ">",
    width = "",
    height = "",
    price = ""
  ) {
    const ruleId = "rule-" + Date.now();
    const ruleHtml = `
        <div class="rule-item" id="${ruleId}">
          <select class="rule-operator">
            <option value=">" ${operator === ">" ? "selected" : ""}>></option>
            <option value="<" ${operator === "<" ? "selected" : ""}><</option>
            <option value="=" ${operator === "=" ? "selected" : ""}>=</option>
            <option value="<=" ${
              operator === "<=" ? "selected" : ""
            }><=</option>
            <option value=">=" ${
              operator === ">=" ? "selected" : ""
            }>>=</option>
          </select>
          <input type="number" class="rule-width" placeholder="Width" value="${width}">
          <input type="number" class="rule-height" placeholder="Height (optional)" value="${height}">
          <input type="number" step="0.01" class="rule-price" placeholder="Price" value="${price}">
          <button type="button" class="button remove-rule">Remove</button>
        </div>
      `;
    jQuery(`#${containerId}`).append(ruleHtml);
  },
};
