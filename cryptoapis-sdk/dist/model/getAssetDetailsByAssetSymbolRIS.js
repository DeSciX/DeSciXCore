"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetSymbolRIS = void 0;
var GetAssetDetailsByAssetSymbolRIS = (function () {
    function GetAssetDetailsByAssetSymbolRIS() {
    }
    GetAssetDetailsByAssetSymbolRIS.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetSymbolRIS.attributeTypeMap;
    };
    GetAssetDetailsByAssetSymbolRIS.discriminator = undefined;
    GetAssetDetailsByAssetSymbolRIS.attributeTypeMap = [
        {
            "name": "_1hourPriceChangeInPercentage",
            "baseName": "1HourPriceChangeInPercentage",
            "type": "string"
        },
        {
            "name": "_1weekPriceChangeInPercentage",
            "baseName": "1WeekPriceChangeInPercentage",
            "type": "string"
        },
        {
            "name": "_24hoursPriceChangeInPercentage",
            "baseName": "24HoursPriceChangeInPercentage",
            "type": "string"
        },
        {
            "name": "_24hoursTradingVolume",
            "baseName": "24HoursTradingVolume",
            "type": "string"
        },
        {
            "name": "circulatingSupply",
            "baseName": "circulatingSupply",
            "type": "string"
        },
        {
            "name": "marketCapInUSD",
            "baseName": "marketCapInUSD",
            "type": "string"
        },
        {
            "name": "maxSupply",
            "baseName": "maxSupply",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "GetAssetDetailsByAssetSymbolRIS.TypeEnum"
        }
    ];
    return GetAssetDetailsByAssetSymbolRIS;
}());
exports.GetAssetDetailsByAssetSymbolRIS = GetAssetDetailsByAssetSymbolRIS;
(function (GetAssetDetailsByAssetSymbolRIS) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Coin"] = 'coin'] = "Coin";
        TypeEnum[TypeEnum["Token"] = 'token'] = "Token";
    })(TypeEnum = GetAssetDetailsByAssetSymbolRIS.TypeEnum || (GetAssetDetailsByAssetSymbolRIS.TypeEnum = {}));
})(GetAssetDetailsByAssetSymbolRIS || (exports.GetAssetDetailsByAssetSymbolRIS = GetAssetDetailsByAssetSymbolRIS = {}));
//# sourceMappingURL=getAssetDetailsByAssetSymbolRIS.js.map