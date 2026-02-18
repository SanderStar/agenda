sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function(Controller, JSONModel, MessageToast) {
  "use strict";

  var SERVICE_URL = "/odata/v4/agenda";

  return Controller.extend("agenda.controller.Groups", {
    onInit: function() {
      var oModel = new JSONModel({
        groups: [],
        selectedGroup: null,
        selectedIndex: -1
      });
      this.getView().setModel(oModel);
      this._loadGroups();
    },

    onNavBack: function() {
      this.getOwnerComponent().getRouter().navTo("main");
    },

    onFilterGroups: function(oEvent) {
      var sValue = oEvent.getParameter("newValue") || "";
      this._loadGroups(sValue);
    },

    onGroupSelect: function(oEvent) {
      var oItem = oEvent.getParameter("listItem");
      if (!oItem) {
        return;
      }

      var sPath = oItem.getBindingContext().getPath();
      var iIndex = parseInt(sPath.split("/")[2], 10);
      this._selectGroupByIndex(iIndex);
    },

    onAddGroup: function() {
      var sId = Date.now().toString();
      var oPayload = {
        ID: sId,
        name: "New Group",
        description: ""
      };

      this._request("POST", SERVICE_URL + "/Groups", oPayload)
        .then(function() {
          return this._loadGroups();
        }.bind(this))
        .then(function() {
          this._selectGroupById(sId);
          MessageToast.show("Group added");
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to add group");
        });
    },

    onSaveGroup: function() {
      var oModel = this.getView().getModel();
      var oSelectedGroup = oModel.getProperty("/selectedGroup");

      if (!oSelectedGroup) {
        MessageToast.show("Select a group first");
        return;
      }

      if (!oSelectedGroup.name || !oSelectedGroup.name.trim()) {
        MessageToast.show("Group name is required");
        return;
      }

      this._request("PATCH", SERVICE_URL + "/Groups('" + encodeURIComponent(oSelectedGroup.ID) + "')", {
        name: oSelectedGroup.name.trim(),
        description: oSelectedGroup.description || ""
      })
        .then(function() {
          return this._loadGroups();
        }.bind(this))
        .then(function() {
          this._selectGroupById(oSelectedGroup.ID);
          MessageToast.show("Group saved");
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to save group");
        });
    },

    onDeleteGroup: function() {
      var oModel = this.getView().getModel();
      var iIndex = oModel.getProperty("/selectedIndex");
      var oSelectedGroup = oModel.getProperty("/selectedGroup");

      if (iIndex < 0 || !oSelectedGroup) {
        MessageToast.show("Select a group first");
        return;
      }

      this._request("DELETE", SERVICE_URL + "/Groups('" + encodeURIComponent(oSelectedGroup.ID) + "')")
        .then(function() {
          return this._loadGroups();
        }.bind(this))
        .then(function() {
          var aUpdatedGroups = oModel.getProperty("/groups") || [];
          if (aUpdatedGroups.length > 0) {
            this._selectGroupByIndex(Math.min(iIndex, aUpdatedGroups.length - 1));
          } else {
            oModel.setProperty("/selectedGroup", null);
            oModel.setProperty("/selectedIndex", -1);
          }
          MessageToast.show("Group deleted");
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to delete group");
        });
    },

    _loadGroups: function(sFilterValue) {
      var sUrl = SERVICE_URL + "/Groups";
      if (sFilterValue) {
        var sEscaped = sFilterValue.replace(/'/g, "''");
        sUrl += "?$filter=contains(name,'" + sEscaped + "') or contains(description,'" + sEscaped + "')";
      }

      return this._request("GET", sUrl)
        .then(function(oData) {
          var aGroups = oData.value || [];
          var oModel = this.getView().getModel();
          var sSelectedId = oModel.getProperty("/selectedGroup/ID");

          oModel.setProperty("/groups", aGroups);

          if (aGroups.length === 0) {
            oModel.setProperty("/selectedGroup", null);
            oModel.setProperty("/selectedIndex", -1);
            return;
          }

          if (sSelectedId) {
            this._selectGroupById(sSelectedId);
          } else {
            this._selectGroupByIndex(0);
          }
        }.bind(this))
        .catch(function(oError) {
          MessageToast.show(oError.message || "Failed to load groups");
        });
    },

    _selectGroupById: function(sId) {
      var aGroups = this.getView().getModel().getProperty("/groups") || [];
      var iIndex = aGroups.findIndex(function(oGroup) {
        return oGroup.ID === sId;
      });
      this._selectGroupByIndex(iIndex >= 0 ? iIndex : 0);
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

    _selectGroupByIndex: function(iIndex) {
      var oModel = this.getView().getModel();
      var aGroups = oModel.getProperty("/groups") || [];
      var oList = this.byId("groupsList");

      if (iIndex < 0 || iIndex >= aGroups.length) {
        oModel.setProperty("/selectedGroup", null);
        oModel.setProperty("/selectedIndex", -1);
        if (oList) {
          oList.removeSelections(true);
        }
        return;
      }

      oModel.setProperty("/selectedIndex", iIndex);
      oModel.setProperty("/selectedGroup", Object.assign({}, aGroups[iIndex]));

      if (oList && oList.getItems()[iIndex]) {
        oList.setSelectedItem(oList.getItems()[iIndex]);
      }
    }
  });
});
