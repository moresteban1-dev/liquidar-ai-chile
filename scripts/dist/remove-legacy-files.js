"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/remove-legacy-files.ts
var promises_1 = __importDefault(require("fs/promises"));
var path_1 = __importDefault(require("path"));
var LEGACY_FILES = [
    {
        path: 'src/core/application/services/availability-service.ts',
        reason: 'Replaced by new availability module in Catalog V2 refactor',
    },
    {
        path: 'src/core/application/services/image-storage.ts',
        reason: 'Replaced by unified media storage service/upload API',
    },
    {
        path: 'src/core/domain/catalog/catalog-types.ts',
        reason: 'Deprecated/Duplicate of CatalogTypes.ts',
    },
    {
        path: 'src/core/application/services/catalog-service.ts',
        reason: 'Duplicate of unified CatalogService.ts (PascalCase)',
    }
];
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var absolutePath, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    absolutePath = path_1.default.isAbsolute(filePath) ? filePath : path_1.default.resolve(process.cwd(), filePath);
                    return [4 /*yield*/, promises_1.default.access(absolutePath)];
                case 1:
                    _b.sent();
                    return [2 /*return*/, true];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function removeLegacyFiles() {
    return __awaiter(this, void 0, void 0, function () {
        var results, _i, LEGACY_FILES_1, _a, filePath, reason, absolutePath, error_1, errorMsg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🗑️  Iniciando eliminación de archivos legacy...\n');
                    results = {
                        removed: [],
                        notFound: [],
                        errors: [],
                    };
                    _i = 0, LEGACY_FILES_1 = LEGACY_FILES;
                    _b.label = 1;
                case 1:
                    if (!(_i < LEGACY_FILES_1.length)) return [3 /*break*/, 9];
                    _a = LEGACY_FILES_1[_i], filePath = _a.path, reason = _a.reason;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 7, , 8]);
                    absolutePath = path_1.default.isAbsolute(filePath) ? filePath : path_1.default.resolve(process.cwd(), filePath);
                    return [4 /*yield*/, fileExists(absolutePath)];
                case 3:
                    if (!_b.sent()) return [3 /*break*/, 5];
                    return [4 /*yield*/, promises_1.default.unlink(absolutePath)];
                case 4:
                    _b.sent();
                    results.removed.push(filePath);
                    console.log("\u2705 Eliminado: ".concat(filePath));
                    console.log("   Raz\u00F3n: ".concat(reason, "\n"));
                    return [3 /*break*/, 6];
                case 5:
                    results.notFound.push(filePath);
                    console.log("\u26A0\uFE0F  No encontrado: ".concat(filePath, "\n"));
                    _b.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    errorMsg = error_1 instanceof Error ? error_1.message : 'Unknown error';
                    results.errors.push({ file: filePath, error: errorMsg });
                    console.log("\u274C Error eliminando ".concat(filePath, ": ").concat(errorMsg, "\n"));
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9:
                    // Generar reporte
                    console.log('\n📊 Resumen de eliminación:');
                    console.log("   \u2705 Eliminados: ".concat(results.removed.length));
                    console.log("   \u26A0\uFE0F  No encontrados: ".concat(results.notFound.length));
                    console.log("   \u274C Errores: ".concat(results.errors.length));
                    // Guardar reporte
                    return [4 /*yield*/, promises_1.default.writeFile(path_1.default.resolve(process.cwd(), 'legacy-removal-report.json'), JSON.stringify(results, null, 2))];
                case 10:
                    // Guardar reporte
                    _b.sent();
                    console.log('\n📄 Reporte guardado en: legacy-removal-report.json');
                    return [2 /*return*/];
            }
        });
    });
}
removeLegacyFiles().catch(console.error);
