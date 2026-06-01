"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNextAvailableNonceEVME400 = void 0;
var GetNextAvailableNonceEVME400 = (function () {
    function GetNextAvailableNonceEVME400() {
    }
    GetNextAvailableNonceEVME400.getAttributeTypeMap = function () {
        return GetNextAvailableNonceEVME400.attributeTypeMap;
    };
    GetNextAvailableNonceEVME400.discriminator = undefined;
    GetNextAvailableNonceEVME400.attributeTypeMap = [
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
    return GetNextAvailableNonceEVME400;
}());
exports.GetNextAvailableNonceEVME400 = GetNextAvailableNonceEVME400;
//# sourceMappingURL=getNextAvailableNonceEVME400.js.map