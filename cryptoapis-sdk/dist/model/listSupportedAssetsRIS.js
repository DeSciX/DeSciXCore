"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsRIS = void 0;
var ListSupportedAssetsRIS = (function () {
    function ListSupportedAssetsRIS() {
    }
    ListSupportedAssetsRIS.getAttributeTypeMap = function () {
        return ListSupportedAssetsRIS.attributeTypeMap;
    };
    ListSupportedAssetsRIS.discriminator = undefined;
    ListSupportedAssetsRIS.attributeTypeMap = [
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
            "type": "ListSupportedAssetsRIS.TypeEnum"
        }
    ];
    return ListSupportedAssetsRIS;
}());
exports.ListSupportedAssetsRIS = ListSupportedAssetsRIS;
(function (ListSupportedAssetsRIS) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Coin"] = 'coin'] = "Coin";
        TypeEnum[TypeEnum["Token"] = 'token'] = "Token";
    })(TypeEnum = ListSupportedAssetsRIS.TypeEnum || (ListSupportedAssetsRIS.TypeEnum = {}));
})(ListSupportedAssetsRIS || (exports.ListSupportedAssetsRIS = ListSupportedAssetsRIS = {}));
//# sourceMappingURL=listSupportedAssetsRIS.js.map