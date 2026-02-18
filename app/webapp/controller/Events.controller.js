sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function(Controller, JSONModel, MessageToast) {
  "use strict";

  var SERVICE_URL = "/odata/v4/agenda";

  return Controller.extend("agenda.controller.Events", {
    onInit: function() {
      var oModel = new JSONModel({
        events: [],
        groups: [],
        selectedEvent: null,
        selectedIndex: -1
      });
      this.getView().setModel(oModel);
      this._loadGroups();
      this._loadEvents();
    },

    onNavBack: function() {
      this.getOwnerComponent().getRouter().navTo("main");
    },

    onFilterEvents: function(oEvent) {
      var sValue = oEvent.getParameter("newValue") || "";
      this._loadEvents(sValue);
    },

    onEventSelect: function(oEvent) {
      var oItem = oEvent.getParameter("listItem");
      if (!oItem) {
        return;
      }

      var sPath = oItem.getBindingContext().getPath();
      var iIndex = parseInt(sPath.split("/")[2], 10);
      this._selectEventByIndex(iIndex);
    },

    onAddEvent: function() {
      var oModel = this.getView().getModel();
      var aGroups = oModel.getProperty("/groups") || [];

      if (!aGroups.length) {
        MessageToast.show("Create at least one group first");
        return;
      }

      var sId = this._createGuid();
      var sToday = new Date().toISOString().slice(0, 10);
      var oPayload = {
        ID: sId,
        title: "New Event",
        date: sToday,
        group_ID_ID: aGroups[0].ID
      };

      this._request("POST", SERVICE_URL + "/Events", oPayload)
        .then(function() {
          return this._loadEvents();
        }.bind(this))
        .then(function() {
          this._selectEventById(sId);
          MessageToast.show("Event added");
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to add event");
        });
    },

    onSaveEvent: function() {
      var oModel = this.getView().getModel();
      var oSelectedEvent = oModel.getProperty("/selectedEvent");

      if (!oSelectedEvent) {
        MessageToast.show("Select an event first");
        return;
      }

      if (!oSelectedEvent.title || !oSelectedEvent.title.trim()) {
        MessageToast.show("Event title is required");
        return;
      }

      if (!oSelectedEvent.group_ID_ID) {
        MessageToast.show("Group is required");
        return;
      }

      var oPayload = {
        title: oSelectedEvent.title.trim(),
        date: oSelectedEvent.date,
        group_ID_ID: oSelectedEvent.group_ID_ID,
        location_ID_ID: oSelectedEvent.location_ID_ID || null,
        person_ID_ID: oSelectedEvent.person_ID_ID || null
      };

      this._request("PATCH", SERVICE_URL + "/Events(" + oSelectedEvent.ID + ")", oPayload)
        .then(function() {
          return this._loadEvents();
        }.bind(this))
        .then(function() {
          this._selectEventById(oSelectedEvent.ID);
          MessageToast.show("Event saved");
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to save event");
        });
    },

    onDeleteEvent: function() {
      var oModel = this.getView().getModel();
      var iIndex = oModel.getProperty("/selectedIndex");
      var oSelectedEvent = oModel.getProperty("/selectedEvent");

      if (iIndex < 0 || !oSelectedEvent) {
        MessageToast.show("Select an event first");
        return;
      }

      this._request("DELETE", SERVICE_URL + "/Events(" + oSelectedEvent.ID + ")")
        .then(function() {
          return this._loadEvents();
        }.bind(this))
        .then(function() {
          var aUpdatedEvents = oModel.getProperty("/events") || [];
          if (aUpdatedEvents.length > 0) {
            this._selectEventByIndex(Math.min(iIndex, aUpdatedEvents.length - 1));
          } else {
            oModel.setProperty("/selectedEvent", null);
            oModel.setProperty("/selectedIndex", -1);
          }
          MessageToast.show("Event deleted");
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to delete event");
        });
    },

    _loadEvents: function(sFilterValue) {
      var sUrl = SERVICE_URL + "/Events";
      if (sFilterValue) {
        var sEscaped = sFilterValue.replace(/'/g, "''");
        sUrl += "?$filter=contains(title,'" + sEscaped + "')";
      }

      return this._request("GET", sUrl)
        .then(function(oData) {
          var aEvents = oData.value || [];
          var oModel = this.getView().getModel();
          var sSelectedId = oModel.getProperty("/selectedEvent/ID");

          oModel.setProperty("/events", aEvents);

          if (aEvents.length === 0) {
            oModel.setProperty("/selectedEvent", null);
            oModel.setProperty("/selectedIndex", -1);
            return;
          }

          if (sSelectedId) {
            this._selectEventById(sSelectedId);
          } else {
            this._selectEventByIndex(0);
          }
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to load events");
        });
    },

    _loadGroups: function() {
      return this._request("GET", SERVICE_URL + "/Groups")
        .then(function(oData) {
          this.getView().getModel().setProperty("/groups", oData.value || []);
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to load groups");
        });
    },

    _selectEventById: function(sId) {
      var aEvents = this.getView().getModel().getProperty("/events") || [];
      var iIndex = aEvents.findIndex(function(oEvent) {
        return oEvent.ID === sId;
      });
      this._selectEventByIndex(iIndex >= 0 ? iIndex : 0);
    },

    _selectEventByIndex: function(iIndex) {
      var oModel = this.getView().getModel();
      var aEvents = oModel.getProperty("/events") || [];
      var oList = this.byId("eventsList");

      if (iIndex < 0 || iIndex >= aEvents.length) {
        oModel.setProperty("/selectedEvent", null);
        oModel.setProperty("/selectedIndex", -1);
        if (oList) {
          oList.removeSelections(true);
        }
        return;
      }

      oModel.setProperty("/selectedIndex", iIndex);
      oModel.setProperty("/selectedEvent", Object.assign({}, aEvents[iIndex]));

      if (oList && oList.getItems()[iIndex]) {
        oList.setSelectedItem(oList.getItems()[iIndex]);
      }
    },

    _request: function(sMethod, sUrl, oBody) {
      var oOptions = {
        method: sMethod,
        headers: {
          "Accept": "application/json"
        }
      };

      if (oBody) {
        oOptions.headers["Content-Type"] = "application/json";
        oOptions.body = JSON.stringify(oBody);
      }

      return fetch(sUrl, oOptions).then(function(oResponse) {
        if (!oResponse.ok) {
          return oResponse.text().then(function(sErrorText) {
            throw new Error(sErrorText || ("Request failed with status " + oResponse.status));
          });
        }

        if (sMethod === "DELETE" || oResponse.status === 204) {
          return {};
        }

        return oResponse.json();
      });
    },

    _createGuid: function() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  });
});
