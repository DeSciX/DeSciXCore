"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressSyncStatusDataItem = void 0;
var AddressSyncStatusDataItem = (function () {
    function AddressSyncStatusDataItem() {
    }
    AddressSyncStatusDataItem.getAttributeTypeMap = function () {
        return AddressSyncStatusDataItem.attributeTypeMap;
    };
    AddressSyncStatusDataItem.discriminator = undefined;
    AddressSyncStatusDataItem.attributeTypeMap = [
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "network",
            "baseName": "network",
            "type": "string"
        },
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "AddressSyncStatusDataItem.StatusEnum"
        }
    ];
    return AddressSyncStatusDataItem;
}());
exports.AddressSyncStatusDataItem = AddressSyncStatusDataItem;
(function (AddressSyncStatusDataItem) {
    var StatusEnum;
    (function (StatusEnum) {
        StatusEnum[StatusEnum["Syncing"] = 'syncing'] = "Syncing";
        StatusEnum[StatusEnum["Synced"] = 'synced'] = "Synced";
    })(StatusEnum = AddressSyncStatusDataItem.StatusEnum || (AddressSyncStatusDataItem.StatusEnum = {}));
})(AddressSyncStatusDataItem || (exports.AddressSyncStatusDataItem = AddressSyncStatusDataItem = {}));
//# sourceMappingURL=addressSyncStatusDataItem.js.map