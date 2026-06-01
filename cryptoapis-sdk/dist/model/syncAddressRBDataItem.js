"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressRBDataItem = void 0;
var SyncAddressRBDataItem = (function () {
    function SyncAddressRBDataItem() {
    }
    SyncAddressRBDataItem.getAttributeTypeMap = function () {
        return SyncAddressRBDataItem.attributeTypeMap;
    };
    SyncAddressRBDataItem.discriminator = undefined;
    SyncAddressRBDataItem.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "callbackUrl",
            "baseName": "callbackUrl",
            "type": "string"
        }
    ];
    return SyncAddressRBDataItem;
}());
exports.SyncAddressRBDataItem = SyncAddressRBDataItem;
//# sourceMappingURL=syncAddressRBDataItem.js.map