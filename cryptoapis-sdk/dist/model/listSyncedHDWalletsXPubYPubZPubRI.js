"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedHDWalletsXPubYPubZPubRI = void 0;
var ListSyncedHDWalletsXPubYPubZPubRI = (function () {
    function ListSyncedHDWalletsXPubYPubZPubRI() {
    }
    ListSyncedHDWalletsXPubYPubZPubRI.getAttributeTypeMap = function () {
        return ListSyncedHDWalletsXPubYPubZPubRI.attributeTypeMap;
    };
    ListSyncedHDWalletsXPubYPubZPubRI.discriminator = undefined;
    ListSyncedHDWalletsXPubYPubZPubRI.attributeTypeMap = [
        {
            "name": "extendedPublicKey",
            "baseName": "extendedPublicKey",
            "type": "string"
        },
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "syncStatus",
            "baseName": "syncStatus",
            "type": "string"
        }
    ];
    return ListSyncedHDWalletsXPubYPubZPubRI;
}());
exports.ListSyncedHDWalletsXPubYPubZPubRI = ListSyncedHDWalletsXPubYPubZPubRI;
//# sourceMappingURL=listSyncedHDWalletsXPubYPubZPubRI.js.map