sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/Device"
], function(UIComponent, Device) {
  "use strict";
  return UIComponent.extend("agenda.Component", {
    metadata: {
      manifest: "json"
    },
    init: function() {
      UIComponent.prototype.init.apply(this, arguments);
      this.getRouter().initialize();
    }
  });
});
