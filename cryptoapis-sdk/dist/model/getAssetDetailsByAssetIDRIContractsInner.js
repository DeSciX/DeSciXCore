"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetIDRIContractsInner = void 0;
var GetAssetDetailsByAssetIDRIContractsInner = (function () {
    function GetAssetDetailsByAssetIDRIContractsInner() {
    }
    GetAssetDetailsByAssetIDRIContractsInner.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetIDRIContractsInner.attributeTypeMap;
    };
    GetAssetDetailsByAssetIDRIContractsInner.discriminator = undefined;
    GetAssetDetailsByAssetIDRIContractsInner.attributeTypeMap = [
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "fungibleValues",
            "baseName": "fungibleValues",
            "type": "GetAssetDetailsByAssetIDRIContractsInnerFungibleValues"
        },
        {
            "name": "identifier",
            "baseName": "identifier",
            "type": "string"
        },
        {
            "name": "network",
            "baseName": "network",
            "type": "string"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        }
    ];
    return GetAssetDetailsByAssetIDRIContractsInner;
}());
exports.GetAssetDetailsByAssetIDRIContractsInner = GetAssetDetailsByAssetIDRIContractsInner;
//# sourceMappingURL=getAssetDetailsByAssetIDRIContractsInner.js.map