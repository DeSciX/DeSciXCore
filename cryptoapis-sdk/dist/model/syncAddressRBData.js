"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressRBData = void 0;
var SyncAddressRBData = (function () {
    function SyncAddressRBData() {
    }
    SyncAddressRBData.getAttributeTypeMap = function () {
        return SyncAddressRBData.attributeTypeMap;
    };
    SyncAddressRBData.discriminator = undefined;
    SyncAddressRBData.attributeTypeMap = [
        {
            "name": "item",
            "baseName": "item",
            "type": "SyncAddressRBDataItem"
        }
    ];
    return SyncAddressRBData;
}());
exports.SyncAddressRBData = SyncAddressRBData;
//# sourceMappingURL=syncAddressRBData.js.map