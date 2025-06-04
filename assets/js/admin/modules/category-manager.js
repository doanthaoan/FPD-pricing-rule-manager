// assets/js/admin/modules/category-manager.js

const CategoryManager = {
  selectedImages: [],
  selectedAllImages: false,

  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    jQuery("#category-select").on("change", this.handleCategorySelect);
    jQuery("#select-all-images").on("change", this.toggleSelectAll);
    jQuery("#select-images-btn").on("click", this.openImageModal);
    jQuery("#confirm-images-selection").on("click", this.confirmSelection);
    jQuery("#save-category-groups").on("click", this.saveCategoryGroups);
  },

  handleCategorySelect: function () {
    const categoryId = jQuery(this).val();
    jQuery("#select-images-btn").prop("disabled", !categoryId);
  },

  toggleSelectAll: function () {
    CategoryManager.selectedAllImages = jQuery(this).is(":checked");
    jQuery("#select-images-btn").prop(
      "disabled",
      CategoryManager.selectedAllImages
    );
  },

  // ... Các phương thức khác
};
