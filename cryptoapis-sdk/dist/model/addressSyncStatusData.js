"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressSyncStatusData = void 0;
var AddressSyncStatusData = (function () {
    function AddressSyncStatusData() {
    }
    AddressSyncStatusData.getAttributeTypeMap = function () {
        return AddressSyncStatusData.attributeTypeMap;
    };
    AddressSyncStatusData.discriminator = undefined;
    AddressSyncStatusData.attributeTypeMap = [
        {
            "name": "product",
            "baseName": "product",
            "type": "string"
        },
        {
            "name": "event",
            "baseName": "event",
            "type": "string"
        },
        {
            "name": "item",
            "baseName": "item",
            "type": "AddressSyncStatusDataItem"
        }
    ];
    return AddressSyncStatusData;
}());
exports.AddressSyncStatusData = AddressSyncStatusData;
//# sourceMappingURL=addressSyncStatusData.js.map