"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNextAvailableNonceEVME401 = void 0;
var GetNextAvailableNonceEVME401 = (function () {
    function GetNextAvailableNonceEVME401() {
    }
    GetNextAvailableNonceEVME401.getAttributeTypeMap = function () {
        return GetNextAvailableNonceEVME401.attributeTypeMap;
    };
    GetNextAvailableNonceEVME401.discriminator = undefined;
    GetNextAvailableNonceEVME401.attributeTypeMap = [
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
    return GetNextAvailableNonceEVME401;
}());
exports.GetNextAvailableNonceEVME401 = GetNextAvailableNonceEVME401;
//# sourceMappingURL=getNextAvailableNonceEVME401.js.map