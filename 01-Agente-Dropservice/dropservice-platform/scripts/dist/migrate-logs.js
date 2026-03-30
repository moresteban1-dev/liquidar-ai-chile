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
// scripts/migrate-logs.ts
var promises_1 = __importDefault(require("fs/promises"));
var path_1 = __importDefault(require("path"));
function migrateLogsInFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, lines, migratedLines, newContent, importLines, lastImport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf-8')];
                case 1:
                    content = _a.sent();
                    lines = content.split('\n');
                    migratedLines = 0;
                    newContent = content
                        .replace(/console\.log\((.*?)\)/g, function (match, args) {
                        migratedLines++;
                        return "logger.info(".concat(args, ")");
                    })
                        .replace(/console\.error\((.*?)\)/g, function (match, args) {
                        migratedLines++;
                        return "logger.error(".concat(args, ")");
                    })
                        .replace(/console\.warn\((.*?)\)/g, function (match, args) {
                        migratedLines++;
                        return "logger.warn(".concat(args, ")");
                    });
                    if (!(migratedLines > 0)) return [3 /*break*/, 3];
                    // Add logger import if missing and not already present
                    if (!newContent.includes("import { logger }")) {
                        importLines = lines.filter(function (l) { return l.startsWith('import '); });
                        lastImport = importLines[importLines.length - 1];
                        if (lastImport) {
                            newContent = newContent.replace(lastImport, "".concat(lastImport, "\nimport { logger } from '@/infrastructure/observability/structured-logger';"));
                        }
                        else {
                            newContent = "import { logger } from '@/infrastructure/observability/structured-logger';\n".concat(newContent);
                        }
                    }
                    return [4 /*yield*/, promises_1.default.writeFile(filePath, newContent, 'utf-8')];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, { filePath: filePath, migratedLines: migratedLines }];
            }
        });
    });
}
function migrateAllLogs() {
    return __awaiter(this, void 0, void 0, function () {
        function scan(dir) {
            return __awaiter(this, void 0, void 0, function () {
                var entries, _i, entries_1, entry, fullPath, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, promises_1.default.readdir(dir, { withFileTypes: true })];
                        case 1:
                            entries = _a.sent();
                            _i = 0, entries_1 = entries;
                            _a.label = 2;
                        case 2:
                            if (!(_i < entries_1.length)) return [3 /*break*/, 7];
                            entry = entries_1[_i];
                            fullPath = path_1.default.join(dir, entry.name);
                            if (!(entry.isDirectory() && entry.name !== 'node_modules')) return [3 /*break*/, 4];
                            return [4 /*yield*/, scan(fullPath)];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 6];
                        case 4:
                            if (!(entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts'))) return [3 /*break*/, 6];
                            return [4 /*yield*/, migrateLogsInFile(fullPath)];
                        case 5:
                            result = _a.sent();
                            if (result.migratedLines > 0) {
                                results.push(result);
                                console.log("\u2705 ".concat(path_1.default.relative(process.cwd(), fullPath), ": ").concat(result.migratedLines, " logs migrados"));
                            }
                            _a.label = 6;
                        case 6:
                            _i++;
                            return [3 /*break*/, 2];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        }
        var rootDir, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('📝 Iniciando migración de logs...\n');
                    rootDir = path_1.default.resolve(process.cwd(), 'src');
                    results = [];
                    return [4 /*yield*/, scan(rootDir)];
                case 1:
                    _a.sent();
                    console.log("\n\uD83D\uDCCA Total: ".concat(results.length, " archivos modificados"));
                    console.log("   Total logs migrados: ".concat(results.reduce(function (sum, r) { return sum + r.migratedLines; }, 0)));
                    return [2 /*return*/];
            }
        });
    });
}
migrateAllLogs().catch(console.error);
