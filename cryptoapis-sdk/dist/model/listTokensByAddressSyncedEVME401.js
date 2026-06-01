"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVME401 = void 0;
var ListTokensByAddressSyncedEVME401 = (function () {
    function ListTokensByAddressSyncedEVME401() {
    }
    ListTokensByAddressSyncedEVME401.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVME401.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVME401.discriminator = undefined;
    ListTokensByAddressSyncedEVME401.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return ListTokensByAddressSyncedEVME401;
}());
exports.ListTokensByAddressSyncedEVME401 = ListTokensByAddressSyncedEVME401;
//# sourceMappingURL=listTokensByAddressSyncedEVME401.js.map