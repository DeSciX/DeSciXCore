"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightUTXOsE403 = void 0;
var GetBlockDetailsByBlockHeightUTXOsE403 = (function () {
    function GetBlockDetailsByBlockHeightUTXOsE403() {
    }
    GetBlockDetailsByBlockHeightUTXOsE403.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightUTXOsE403.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightUTXOsE403.discriminator = undefined;
    GetBlockDetailsByBlockHeightUTXOsE403.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHeightUTXOsE403;
}());
exports.GetBlockDetailsByBlockHeightUTXOsE403 = GetBlockDetailsByBlockHeightUTXOsE403;
//# sourceMappingURL=getBlockDetailsByBlockHeightUTXOsE403.js.map