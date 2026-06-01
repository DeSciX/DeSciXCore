"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssetDetailsByAssetIDRIS = void 0;
var GetAssetDetailsByAssetIDRIS = (function () {
    function GetAssetDetailsByAssetIDRIS() {
    }
    GetAssetDetailsByAssetIDRIS.getAttributeTypeMap = function () {
        return GetAssetDetailsByAssetIDRIS.attributeTypeMap;
    };
    GetAssetDetailsByAssetIDRIS.discriminator = undefined;
    GetAssetDetailsByAssetIDRIS.attributeTypeMap = [
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
            "type": "GetAssetDetailsByAssetIDRIS.TypeEnum"
        }
    ];
    return GetAssetDetailsByAssetIDRIS;
}());
exports.GetAssetDetailsByAssetIDRIS = GetAssetDetailsByAssetIDRIS;
(function (GetAssetDetailsByAssetIDRIS) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Coin"] = 'coin'] = "Coin";
        TypeEnum[TypeEnum["Token"] = 'token'] = "Token";
    })(TypeEnum = GetAssetDetailsByAssetIDRIS.TypeEnum || (GetAssetDetailsByAssetIDRIS.TypeEnum = {}));
})(GetAssetDetailsByAssetIDRIS || (exports.GetAssetDetailsByAssetIDRIS = GetAssetDetailsByAssetIDRIS = {}));
//# sourceMappingURL=getAssetDetailsByAssetIDRIS.js.map