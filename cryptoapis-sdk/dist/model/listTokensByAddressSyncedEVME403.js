"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVME403 = void 0;
var ListTokensByAddressSyncedEVME403 = (function () {
    function ListTokensByAddressSyncedEVME403() {
    }
    ListTokensByAddressSyncedEVME403.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVME403.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVME403.discriminator = undefined;
    ListTokensByAddressSyncedEVME403.attributeTypeMap = [
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
    return ListTokensByAddressSyncedEVME403;
}());
exports.ListTokensByAddressSyncedEVME403 = ListTokensByAddressSyncedEVME403;
//# sourceMappingURL=listTokensByAddressSyncedEVME403.js.map