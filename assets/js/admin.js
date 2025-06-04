jQuery(document).ready(function ($) {
    // Kiểm tra xem dữ liệu đã được load chưa
    if (typeof fpdPricingData === "undefined") {
        console.error("fpdPricingData is not defined");
        return;
    }
    // Mặc định hiển thị tab Existing Groups
    $('.nav-tab-wrapper a[href="#existing-groups"]').addClass("nav-tab-active");
    $("#existing-groups").show();

    // Load dữ liệu tạm nếu có
    // loadTempGroups();

    // Hiển thị danh sách groups
    refreshGroupsList();

    // Xử lý tab
    $(".nav-tab-wrapper a").click(function (e) {
        e.preventDefault();

        // Chuyển tab
        $(".nav-tab").removeClass("nav-tab-active");
        $(".tab-content").hide();

        $(this).addClass("nav-tab-active");
        $($(this).attr("href")).show();

        // Nếu là tab Existing Groups thì refresh danh sách
        if ($(this).attr("href") === "#existing-groups") {
            // $('#existing-groups').addClass('loading-content');

            // loadGroupsFromServer().then(function(response) {
            //     if (response.success) {
            //         fpdPricingData.imageGroups = response.data;
            //         refreshGroupsList();
            //     }
            // }).always(function() {
            //     $('#existing-groups').removeClass('loading-content');
            // });
            refreshGroupsList();
        }
    });
    // Toggle rules visibility
    $(document).on("click", ".show-group", function (e) {
        e.preventDefault();
        $(this).closest(".pricing-group").find(".group-rules").toggle();
    });

    // Open duplicate modal
    $(document).on("click", ".duplicate-group", function (e) {
        e.preventDefault();
        const groupIndex = $(this).closest(".pricing-group").data("index");

        if (typeof fpdPricingData.imageGroups[groupIndex] === "undefined") {
            console.error("Group data not found at index:", groupIndex);
            return;
        }
        console.log(groupIndex);

        const groupData = fpdPricingData.imageGroups[groupIndex];

        $("#modal-title").text("Duplicate Group");
        $("#is-duplicate").val("1");
        $("#original-group-index").val(groupIndex);
        $("#element-name").val("");
        $("#category-name").val("");

        // Populate rules
        $("#rules-container").empty();
        if (groupData.data.rules && Array.isArray(groupData.data.rules)) {
            groupData.data.rules.forEach((rule) => {
                addRuleToModal(
                    rule.operator || ">",
                    rule.value?.width || "",
                    rule.value?.height || "",
                    rule.price || ""
                );
            });
        }

        $("#group-modal").show();
    });

    // Add New Group button
    $("#add-new-group").on("click", function (e) {
        e.preventDefault();
        const modalTitle = "Add New Group";
        $("#modal-title").text(modalTitle);
        $("#is-duplicate").val("0");
        $("#original-group-index").val("");
        $("#element-name").val("");
        $("#category-name").val("");
        $("#rules-container").empty();
        addRuleToModal(">", "", "", ""); // Thêm rule mẫu
        $("#group-modal").show();
    });

    $(document).on("click", ".edit-group", function () {
        const groupIndex = $(this).closest(".pricing-group").data("index");
        const groupData = fpdPricingData.imageGroups[groupIndex];
        const elementName = groupData.data.target.elements.replace("#", "");
        const categoryName = groupData.category;
        const modalTitle = "Edit Group: " + groupData.name;
        $("#modal-title").text(modalTitle);
        $("#is-duplicate").val("0");
        $("#original-group-index").val(groupIndex);
        $("#element-name").val(elementName);
        $("#category-name").val(categoryName);

        // Hiển thị elements selector (với #)
        $("#elements-selector").val(groupData.data.target.elements).parent().show();

        // Populate rules
        $("#rules-container").empty();
        groupData.data.rules.forEach((rule) => {
            addRuleToModal(
                rule.operator,
                rule.value.width,
                rule.value.height || "",
                rule.price
            );
        });

        $("#group-modal").show();
    });
    // Close modal
    $(".fpd-modal-close").click(function () {
        $("#group-modal").hide();
        $("#image-modal").hide();
    });

    // Add rule in modal
    $("#add-rule-in-modal").click(function () {
        addRuleToModal(">", "", "", "");
    });

    // Save/Update group (add to list, not to DB yet)
    $("#group-form").submit(function (e) {
        e.preventDefault();

        const elementName = $("#element-name").val().trim();
        if (!elementName) {
            alert("Please enter a group name");
            return;
        }

        // Tạo elements selector từ name (thêm # nếu chưa có)
        let elements = elementName;
        if (!elements.startsWith("#")) {
            elements = "#" + elements;
        }
        groupName = "Motif - " + elementName;
        // Loại bỏ ký tự đặc biệt không hợp lệ trong selector
        // elements = elements.replace(/[^a-zA-Z0-9-_#]/g, '');
        const categoryName = $("#category-name").val().trim();

        // Collect rules
        const rules = [];
        $(".rule-item").each(function () {
            const operator = $(this).find(".rule-operator").val();
            const width = $(this).find(".rule-width").val();
            const height = $(this).find(".rule-height").val();
            const price = $(this).find(".rule-price").val();

            if (operator && width && price) {
                rules.push({
                    operator: operator,
                    value: {
                        width: width,
                        height: height,
                    },
                    price: parseFloat(price),
                });
            }
        });

        if (rules.length === 0) {
            alert("Please add at least one rule");
            return;
        }

        const groupIndex = $("#original-group-index").val();
        const isDuplicate = $("#is-duplicate").val() === "1";

        // Create new group object
        const updatedGroup = {
            name: groupName,
            category: categoryName,
            data: {
                property: "imageSizeScaled",
                target: {
                    views: -1,
                    elements: elements,
                },
                type: "any",
                rules: rules,
            },
        };

        let actionType = "";
        // Add to temporary list
        if (isDuplicate || groupIndex === "") {
            // Thêm mới
            if (!window.tempGroups) window.tempGroups = [];
            window.tempGroups.push(updatedGroup);
            actionType = isDuplicate ? "Duplicate" : "Add New";
        } else {
            // Cập nhật group hiện có
            fpdPricingData.imageGroups[groupIndex] = updatedGroup;
            actionType = "Update";
        }

        const newGroupHtml = createGroupHtml(updatedGroup, groupIndex, true, actionType);
        // Thêm vào đầu danh sách
        $("#pricing-groups-list").prepend(newGroupHtml);
        // Refresh list display
        // refreshGroupsList();

        // Close modal and enable save button
        $("#group-modal").hide();
        $("#save-all-groups").prop("disabled", false);
    });

    // Save all groups to DB
    $("#save-all-groups").click(function () {
        showLoading();
        // Lấy dữ liệu hiện tại
        $("#save-all-groups").prop("disabled", true);
        let allGroups = [...fpdPricingData.imageGroups];

        // Xóa các group đã marked
        if (window.groupsToDelete && window.groupsToDelete.length > 0) {
            allGroups = allGroups.filter(
                (_, index) => !window.groupsToDelete.includes(index)
            );
        }

        // Thêm các group tạm
        if (window.tempGroups && window.tempGroups.length > 0) {
            allGroups = [...allGroups, ...window.tempGroups];
        }

        // Send to server via AJAX
        $.ajax({
            url: fpdPricing.ajaxurl,
            type: "POST",
            data: {
                action: "fpd_save_pricing_groups",
                nonce: fpdPricing.nonce,
                groups: JSON.stringify(allGroups),
            },
            success: function (response) {
                if (response.success) {
                    // Reset các biến tạm
                    window.tempGroups = [];
                    window.groupsToDelete = [];
                    hasUnsavedChanges = false;
                    alert("Groups saved successfully");
                    refreshGroupsList()
                    hideLoading();
                } else {
                    alert("Error saving groups: " + response.data);
                    hideLoading();
                }
            },
        });
    });
    // Delete group
    $(document).on("click", ".delete-group", function () {
        if (!confirm("Are you sure you want to delete this group?")) return;

        const $group = $(this).closest(".pricing-group");
        const groupIndex = $group.data("index");
        const groupData = fpdPricingData.imageGroups[groupIndex];
        if ($group.hasClass("temporary-item")) {
            // Xóa group tạm
            window.tempGroups = window.tempGroups.filter((_, i) => i != groupIndex);
        } else {
            // Đánh dấu group cần xóa
            if (!window.groupsToDelete) window.groupsToDelete = [];
            window.groupsToDelete.push(groupIndex);
            $group.hide();
            const newGroupHtml = createGroupHtml(groupData, groupIndex, true, "Delete");
            // Thêm vào đầu danh sách
            $("#pricing-groups-list").prepend(newGroupHtml);
        }

        $("#save-all-groups").prop("disabled", false);
    });

    function addRuleToModal(operator, width, height, price) {
        const ruleId = "rule-" + Date.now();
        const ruleHtml = `
            <div class="rule-item" id="${ruleId}">
                <select class="rule-operator">
                    <option value=">" ${operator === ">" ? "selected" : ""}>></option>
                    <option value="<" ${operator === "<" ? "selected" : ""}><</option>
                    <option value="=" ${operator === "=" ? "selected" : ""}>=</option>
                    <option value="<=" ${operator === "<=" ? "selected" : ""}><=</option>
                    <option value=">=" ${operator === ">=" ? "selected" : ""}>>=</option>
                </select>
                <input type="number" class="rule-width" placeholder="Width" value="${width || ""}">
                <input type="number" class="rule-height" placeholder="Height (optional)" value="${height || ""}">
                <input type="number" step="0.01" class="rule-price" placeholder="Price" value="${price || ""}">
                <button type="button" class="button remove-rule">Remove</button>
            </div>
        `;
        $("#rules-container").append(ruleHtml);
    }

    // Remove rule
    $(document).on("click", ".remove-rule", function () {
        $(this).closest(".rule-item").remove();
    });

    ////// CATEGORY UPDATE
    // Filter theo category
    $(document).on("click", ".category-filter-item", function (e) {
        e.preventDefault();
        const category = $(this).data("category");

        $(".category-filter-item").removeClass("active");
        $(this).addClass("active");

        if (!category) {
            $(".pricing-group").show();
        } else {
            $(".pricing-group").each(function () {
                const groupCategory = $(this).data("category") || "Uncategorized";
                $(this).toggle(groupCategory === category);
            });
        }
    });

    // Khi chọn category
    $("#category-select").change(function () {
        const categoryId = $(this).val();
        if (categoryId) {
            $("#select-images-btn").prop("disabled", false);
        } else {
            $("#select-images-btn").prop("disabled", true);
        }
    });

    // Mở modal chọn ảnh
    $("#select-images-btn").click(function () {
        showLoading();
        const categoryId = $("#category-select").val();
        if (!categoryId) return;

        // Load ảnh từ category
        $.ajax({
            url: fpdPricing.ajaxurl,
            type: "POST",
            data: {
                action: "fpd_get_category_images",
                category_id: categoryId,
                nonce: fpdPricing.nonce,
            },
            success: function (response) {
                if (response.success) {
                    renderImagesModal(response.data.images);
                    hideLoading();
                    $("#images-modal").show();
                } else {
                    hideLoading();
                    alert("Error loading images: " + response.data);
                }
            },
        });
    });

    // Hiển thị modal chọn ảnh
    function renderImagesModal(images) {
        const $container = $("#images-list");
        $container.empty();

        images.forEach((image) => {
            $container.append(`
                <div class="image-item">
                    <label>
                        <input type="checkbox" class="image-checkbox" value="${image.ID}" data-title="${image.title}" ${window.selectedImages?.includes(image.ID) ? "checked" : ""}>
                        <img src="${image.image}" alt="${image.title}" style="max-width: 100px; height: auto;">
                        <div>${image.title}</div>
                    </label>
                </div>
            `);
        });
    }

    // Xác nhận chọn ảnh
    $("#confirm-images-selection").click(function () {
        window.selectedImages = [];
        window.selectedImagesData = [];

        $(".image-checkbox:checked").each(function () {
            const imageId = $(this).val();
            const imageTitle = $(this).data("title");
            window.selectedImages.push(imageId);
            window.selectedImagesData.push({
                id: imageId,
                title: imageTitle,
            });
        });

        // Hiển thị ảnh đã chọn
        renderSelectedImages();
        $("#images-modal").hide();
    });

    // Hiển thị ảnh đã chọn
    function renderSelectedImages() {
        const $container = $("#selected-images-list");
        $container.empty();

        if (window.selectedImagesData.length > 0) {
            window.selectedImagesData.forEach((image) => {
                $container.append(`<div>${image.title}</div>`);
            });
            $("#selected-images-container").show();
        } else {
            $("#selected-images-container").hide();
        }
    }

    // Select all images
    $("#select-all-images").change(function () {
        if ($(this).is(":checked")) {
            $(".image-checkbox").prop("checked", true);
        } else {
            $(".image-checkbox").prop("checked", false);
        }
    });

    // Thêm rule cho category
    $("#add-category-rule").click(function () {
        addCategoryRule();
    });

    function addCategoryRule(operator = ">", width = "", height = "", price = "") {
        const ruleId = "category-rule-" + Date.now();
        $("#category-rules-container").append(`
            <div class="rule-item" id="${ruleId}">
                <select class="rule-operator">
                    <option value=">" ${operator === ">" ? "selected" : ""}>></option>
                    <option value="<" ${operator === "<" ? "selected" : ""}><</option>
                    <option value="=" ${operator === "=" ? "selected" : ""}>=</option>
                    <option value="<=" ${operator === "<=" ? "selected" : ""}><=</option>
                    <option value=">=" ${operator === ">=" ? "selected" : ""}>>=</option>
                </select>
                <input type="number" class="rule-width" placeholder="Width" value="${width}">
                <input type="number" class="rule-height" placeholder="Height (optional)" value="${height}">
                <input type="number" step="0.01" class="rule-price" placeholder="Price" value="${price}">
                <button type="button" class="button remove-rule">Remove</button>
            </div>
        `);
    }
    // Xử lý khi click "Select All Images"
    $("#select-all-images").change(function () {
        if ($(this).is(":checked")) {
            // Đánh dấu đã chọn tất cả
            window.selectedAllImages = true;
            $("#select-images-btn").prop("disabled", true);
            $("#selected-images-container").hide();
        } else {
            window.selectedAllImages = false;
            $("#select-images-btn").prop("disabled", false);
        }
    });
    // Tạo groups từ category
    $("#save-category-groups").click(function () {
        showLoading();
        const categoryId = $("#category-select").val();
        if (!categoryId) {
            hideLoading();
            alert("Please select a category");
            return;
        }

        // Nếu chọn "Select All Images" thì không cần kiểm tra selectedImages
        if (
            !window.selectedAllImages &&
            (!window.selectedImagesData || window.selectedImagesData.length === 0)
        ) {
            hideLoading();
            alert("Please select at least one image");
            return;
        }

        // Lấy rules
        const rules = [];
        $("#category-rules-container .rule-item").each(function () {
            const operator = $(this).find(".rule-operator").val();
            const width = $(this).find(".rule-width").val();
            const height = $(this).find(".rule-height").val();
            const price = $(this).find(".rule-price").val();

            if (operator && width && price) {
                rules.push({
                    operator: operator,
                    value: { width: width, height: height || "" },
                    price: parseFloat(price),
                });
            }
        });

        if (rules.length === 0) {
            hideLoading();
            alert("Please add at least one pricing rule");
            return;
        }

        const categoryTitle = $("#category-select option:selected").text();

        // Tạo các groups
        // const newGroups = window.selectedImagesData.map(image => {
        //     return {
        //         name: `Motif - ${image.title}`,
        //         category: categoryTitle,
        //         data: {
        //             property: 'imageSizeScaled',
        //             target: {
        //                 views: -1,
        //                 elements: `#${image.title.replace(/\s+/g, '-').toLowerCase()}`
        //             },
        //             type: 'any',
        //             rules: rules
        //         }
        //     };
        // });

        // Gửi AJAX để lưu ngay vào database
        $.ajax({
            url: fpdPricing.ajaxurl,
            type: "POST",
            data: {
                action: "fpd_create_category_groups",
                nonce: fpdPricing.nonce,
                category_id: categoryId,
                select_all: window.selectedAllImages ? 1 : 0,
                selected_images: window.selectedAllImages
                    ? null
                    : JSON.stringify(window.selectedImagesData),
                rules: JSON.stringify(rules),
            },
            success: function (response) {
                if (response.success) {
                    alert(response.data.message);
                    hasUnsavedChanges = false;
                    hideLoading();
                    window.location.reload();
                } else {
                    hideLoading();
                    alert("Error: " + response.data);
                }
            },
        });

        // Refresh hiển thị
        refreshGroupsList();
        // alert(`${newGroups.length} groups created successfully!`);
    });

    // HELPER

    function loadGroupsFromServer() {
        return $.ajax({
            url: fpdPricing.ajaxurl,
            type: "POST",
            data: {
                action: "fpd_get_pricing_groups",
                nonce: fpdPricing.nonce,
            },
        });
    }

    // Hàm refresh danh sách groups
    function refreshGroupsList() {
        const $container = $("#pricing-groups-list");
        $container.empty();

        // Hiển thị groups từ server
        if (fpdPricingData.imageGroups && fpdPricingData.imageGroups.length > 0) {
            fpdPricingData.imageGroups.forEach((group, index) => {
                $container.append(createGroupHtml(group, index, false));
            });
        }

        // Hiển thị groups tạm
        if (window.tempGroups && window.tempGroups.length > 0) {
            window.tempGroups.forEach((group, index) => {
                $container.prepend(createGroupHtml(group, index, true));
            });
        }

        // Hiển thị thông báo nếu không có group nào
        if ($container.children().length === 0) {
            $container.append("<p>No pricing groups found.</p>");
        }
    }
    // Hàm tạo HTML cho một group
    function createGroupHtml(group, index, isTemp, action) {
        const tempClass = isTemp ? "temporary-item" : "";
        let tempBadge = isTemp ? `<span class="temp-badge">(Pending Save - ${action})</span>` : "";

        return `
            <div class="pricing-group ${tempClass}" data-index="${index}" data-category="${group.category || "Uncategorized"}">
                <div class="group-header">
                    <h3>${group.name} ${tempBadge}</h3>
                    <div class="group-meta">
                        <span class="group-category">Category: ${group.category || "Uncategorized"}</span>
                    </div>
                    <div class="group-details">
                        <span class="group-element">Element:</> ${group.data.target.elements}</span>
                    </div>
                    <div class="group-actions">${isTemp
                ? ""
                : '<button class="button duplicate-group">Duplicate</button><button class="button edit-group">Edit</button><button class="button delete-group">Delete</button>'
            }
                        
                    </div>
                </div>
            </div>
        `;
    }

    // Hàm hiển thị loading
    function showLoading() {
        $("#fpd-loading-screen").fadeIn();
    }

    // Hàm ẩn loading
    function hideLoading() {
        $("#fpd-loading-screen").fadeOut();
    }

    // Biến global để theo dõi thay đổi
    let hasUnsavedChanges = false;

    // Hàm kiểm tra có phải là link nội bộ không
    function isInternalLink(href) {
        return (
            href.startsWith("#") ||
            href.startsWith(window.location.origin) ||
            href.startsWith("/") ||
            href === "javascript:void(0)"
        );
    }

    // Hàm kiểm tra có phải là link chuyển tab/filter không
    function isTabOrFilterLink(element) {
        return (
            $(element).hasClass("nav-tab") ||
            $(element).hasClass("category-filter-item") ||
            $(element).closest(".nav-tab-wrapper").length > 0 ||
            $(element).closest(".category-filter").length > 0
        );
    }

    // Xử lý khi có thay đổi dữ liệu
    $(document).on("input change", "#group-name, #elements-selector, .rule-operator, .rule-width, .rule-height, .rule-price", function () {
        if (!hasUnsavedChanges) {
            hasUnsavedChanges = true;
        }
    });

    // Xử lý khi click các nút thay đổi dữ liệu
    $(document).on("click", "#add-new-group, .duplicate-group, .edit-group, .delete-group, .add-rule, .remove-rule", function () {
        hasUnsavedChanges = true;
    });

    // Xử lý khi click vào link
    $(document).on("click", "a", function (e) {
        const href = $(this).attr("href");

        // Bỏ qua nếu là link chuyển tab/filter hoặc link đặc biệt
        if (isTabOrFilterLink(this) || href === "#" || !href) {
            return;
        }

        // Bỏ qua nếu là link nội bộ và không có thay đổi
        if (isInternalLink(href) && !hasUnsavedChanges) {
            return;
        }

        // Hiển thị cảnh báo nếu có thay đổi chưa lưu
        if (hasUnsavedChanges) {
            e.preventDefault();
            const confirmLeave = confirm("You have unsaved changes. Are you sure you want to leave this page?");
            if (confirmLeave) {
                hasUnsavedChanges = false;
                window.location.href = href;
            }
        }
    });

    // Xử lý khi refresh/đóng trang
    window.addEventListener("beforeunload", function (e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
            return e.returnValue;
        }
    });

    // Reset trạng thái khi save thành công
    $(document).ajaxSuccess(function (event, xhr, settings) {
        if (settings.data && (
            settings.data.includes("action=fpd_save_pricing_groups") ||
            settings.data.includes("action=fpd_create_category_groups"))
        ) {
            hasUnsavedChanges = false;
        }
    });
});
