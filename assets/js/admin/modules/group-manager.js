// assets/js/admin/modules/group-manager.js

const GroupManager = {
  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    jQuery(document).on("click", ".edit-group", this.handleEditGroup);
    jQuery(document).on("click", ".duplicate-group", this.handleDuplicateGroup);
    jQuery(document).on("click", ".delete-group", this.handleDeleteGroup);
  },

  handleEditGroup: function (e) {
    e.preventDefault();
    jQuery(this).closest(".pricing-group").find(".group-rules").toggle();
  },

  handleDuplicateGroup: function (e) {
    e.preventDefault();
    // Logic duplicate group
  },

  handleDeleteGroup: function (e) {
    if (!confirm("Are you sure you want to delete this group?")) return;
    // Logic delete group
  },
};
