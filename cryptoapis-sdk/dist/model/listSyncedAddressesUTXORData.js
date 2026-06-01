"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesUTXORData = void 0;
var ListSyncedAddressesUTXORData = (function () {
    function ListSyncedAddressesUTXORData() {
    }
    ListSyncedAddressesUTXORData.getAttributeTypeMap = function () {
        return ListSyncedAddressesUTXORData.attributeTypeMap;
    };
    ListSyncedAddressesUTXORData.discriminator = undefined;
    ListSyncedAddressesUTXORData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListSyncedAddressesUTXORI>"
        }
    ];
    return ListSyncedAddressesUTXORData;
}());
exports.ListSyncedAddressesUTXORData = ListSyncedAddressesUTXORData;
//# sourceMappingURL=listSyncedAddressesUTXORData.js.map