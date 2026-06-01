"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVME400 = void 0;
var ListTokensByAddressSyncedEVME400 = (function () {
    function ListTokensByAddressSyncedEVME400() {
    }
    ListTokensByAddressSyncedEVME400.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVME400.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVME400.discriminator = undefined;
    ListTokensByAddressSyncedEVME400.attributeTypeMap = [
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
    return ListTokensByAddressSyncedEVME400;
}());
exports.ListTokensByAddressSyncedEVME400 = ListTokensByAddressSyncedEVME400;
//# sourceMappingURL=listTokensByAddressSyncedEVME400.js.map