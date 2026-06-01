"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashEVME400 = void 0;
var GetBlockDetailsByBlockHashEVME400 = (function () {
    function GetBlockDetailsByBlockHashEVME400() {
    }
    GetBlockDetailsByBlockHashEVME400.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashEVME400.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashEVME400.discriminator = undefined;
    GetBlockDetailsByBlockHashEVME400.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashEVME400;
}());
exports.GetBlockDetailsByBlockHashEVME400 = GetBlockDetailsByBlockHashEVME400;
//# sourceMappingURL=getBlockDetailsByBlockHashEVME400.js.map