"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedHDWalletsXPubYPubZPubRData = void 0;
var ListSyncedHDWalletsXPubYPubZPubRData = (function () {
    function ListSyncedHDWalletsXPubYPubZPubRData() {
    }
    ListSyncedHDWalletsXPubYPubZPubRData.getAttributeTypeMap = function () {
        return ListSyncedHDWalletsXPubYPubZPubRData.attributeTypeMap;
    };
    ListSyncedHDWalletsXPubYPubZPubRData.discriminator = undefined;
    ListSyncedHDWalletsXPubYPubZPubRData.attributeTypeMap = [
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
            "type": "Array<ListSyncedHDWalletsXPubYPubZPubRI>"
        }
    ];
    return ListSyncedHDWalletsXPubYPubZPubRData;
}());
exports.ListSyncedHDWalletsXPubYPubZPubRData = ListSyncedHDWalletsXPubYPubZPubRData;
//# sourceMappingURL=listSyncedHDWalletsXPubYPubZPubRData.js.map