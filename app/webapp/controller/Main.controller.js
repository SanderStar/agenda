sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function(Controller) {
  "use strict";
  return Controller.extend("agenda.controller.Main", {
    onPersonsPress: function() {
      this.getOwnerComponent().getRouter().navTo("persons");
    },
    onLocationsPress: function() {
      this.getOwnerComponent().getRouter().navTo("locations");
    },
    onEventsPress: function() {
      this.getOwnerComponent().getRouter().navTo("events");
    },
    onGroupsPress: function() {
      this.getOwnerComponent().getRouter().navTo("groups");
    }
  });
});
