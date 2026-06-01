"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetIDRI = void 0;
var GetAssetDetailsByAssetIDRI = (function () {
    function GetAssetDetailsByAssetIDRI() {
    }
    GetAssetDetailsByAssetIDRI.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetIDRI.attributeTypeMap;
    };
    GetAssetDetailsByAssetIDRI.discriminator = undefined;
    GetAssetDetailsByAssetIDRI.attributeTypeMap = [
        {
            "name": "contracts",
            "baseName": "contracts",
            "type": "Array<GetAssetDetailsByAssetIDRIContractsInner>"
        },
        {
            "name": "latestRate",
            "baseName": "latestRate",
            "type": "ListSupportedAssetsRILatestRate"
        },
        {
            "name": "logo",
            "baseName": "logo",
            "type": "ListSupportedAssetsRILogo"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "originalSymbol",
            "baseName": "originalSymbol",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "slug",
            "baseName": "slug",
            "type": "string"
        },
        {
            "name": "specificData",
            "baseName": "specificData",
            "type": "GetAssetDetailsByAssetIDRIS"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        }
    ];
    return GetAssetDetailsByAssetIDRI;
}());
exports.GetAssetDetailsByAssetIDRI = GetAssetDetailsByAssetIDRI;
//# sourceMappingURL=getAssetDetailsByAssetIDRI.js.map