"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashEVME401 = void 0;
var GetBlockDetailsByBlockHashEVME401 = (function () {
    function GetBlockDetailsByBlockHashEVME401() {
    }
    GetBlockDetailsByBlockHashEVME401.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashEVME401.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashEVME401.discriminator = undefined;
    GetBlockDetailsByBlockHashEVME401.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashEVME401;
}());
exports.GetBlockDetailsByBlockHashEVME401 = GetBlockDetailsByBlockHashEVME401;
//# sourceMappingURL=getBlockDetailsByBlockHashEVME401.js.map