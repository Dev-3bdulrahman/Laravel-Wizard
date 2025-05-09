"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDefinitionProviders = registerDefinitionProviders;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const laravelUtils_1 = require("../utils/laravelUtils");
/**
 * Register all definition providers
 * @param context Extension context
 * @param laravelRoot Laravel project root path
 */
function registerDefinitionProviders(context, laravelRoot) {
    const config = (0, laravelUtils_1.getLaravelConfig)(laravelRoot);
    // Register PHP definition provider
    const phpSelector = { language: 'php', scheme: 'file' };
    const phpDefinitionProvider = vscode.languages.registerDefinitionProvider(phpSelector, new LaravelDefinitionProvider(config));
    // Register Blade definition provider
    const bladeSelector = { language: 'blade', scheme: 'file' };
    const bladeDefinitionProvider = vscode.languages.registerDefinitionProvider(bladeSelector, new LaravelDefinitionProvider(config));
    context.subscriptions.push(phpDefinitionProvider, bladeDefinitionProvider);
}
/**
 * Laravel definition provider
 */
class LaravelDefinitionProvider {
    config;
    modelMap = new Map();
    controllerMap = new Map();
    viewMap = new Map();
    routeMap = new Map();
    constructor(config) {
        this.config = config;
        this.initialize();
    }
    /**
     * Initialize the provider by scanning the Laravel project
     */
    initialize() {
        // Scan models
        this.scanModels();
        // Scan controllers
        this.scanControllers();
        // Scan views
        this.scanViews();
        // Scan routes
        this.scanRoutes();
    }
    /**
     * Scan Laravel models
     */
    scanModels() {
        try {
            const modelsPath = this.config.modelsPath;
            if (fs.existsSync(modelsPath)) {
                const modelFiles = (0, laravelUtils_1.getFilesRecursively)(modelsPath, '**/*.php');
                for (const file of modelFiles) {
                    const relativePath = path.relative(modelsPath, file);
                    const modelName = path.basename(relativePath, '.php');
                    this.modelMap.set(modelName.toLowerCase(), file);
                }
            }
        }
        catch (error) {
            console.error('Error scanning models:', error);
        }
    }
    /**
     * Scan Laravel controllers
     */
    scanControllers() {
        try {
            const controllersPath = this.config.controllersPath;
            if (fs.existsSync(controllersPath)) {
                const controllerFiles = (0, laravelUtils_1.getFilesRecursively)(controllersPath, '**/*.php');
                for (const file of controllerFiles) {
                    const relativePath = path.relative(controllersPath, file);
                    const controllerName = path.basename(relativePath, '.php');
                    this.controllerMap.set(controllerName.toLowerCase(), file);
                }
            }
        }
        catch (error) {
            console.error('Error scanning controllers:', error);
        }
    }
    /**
     * Scan Laravel views
     */
    scanViews() {
        try {
            const viewsPath = this.config.viewsPath;
            if (fs.existsSync(viewsPath)) {
                const viewFiles = (0, laravelUtils_1.getFilesRecursively)(viewsPath, '**/*.blade.php');
                for (const file of viewFiles) {
                    const relativePath = path.relative(viewsPath, file);
                    const viewName = relativePath.replace(/\.blade\.php$/, '').replace(/\\/g, '.').replace(/\//g, '.');
                    this.viewMap.set(viewName.toLowerCase(), file);
                }
            }
        }
        catch (error) {
            console.error('Error scanning views:', error);
        }
    }
    /**
     * Scan Laravel routes
     */
    scanRoutes() {
        try {
            const routesPath = this.config.routesPath;
            if (fs.existsSync(routesPath)) {
                const webRoutesPath = path.join(routesPath, 'web.php');
                const apiRoutesPath = path.join(routesPath, 'api.php');
                if (fs.existsSync(webRoutesPath)) {
                    this.parseRouteFile(webRoutesPath);
                }
                if (fs.existsSync(apiRoutesPath)) {
                    this.parseRouteFile(apiRoutesPath);
                }
            }
        }
        catch (error) {
            console.error('Error scanning routes:', error);
        }
    }
    /**
     * Parse a route file to extract route names and their locations
     * @param filePath Route file path
     */
    parseRouteFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            // Simple regex to find route names
            // This is a basic implementation and might not catch all routes
            const routeNameRegex = /->name\s*\(\s*['"]([^'"]+)['"]\s*\)/;
            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(routeNameRegex);
                if (match) {
                    const routeName = match[1];
                    this.routeMap.set(routeName.toLowerCase(), `${filePath}:${i + 1}`);
                }
            }
        }
        catch (error) {
            console.error(`Error parsing route file ${filePath}:`, error);
        }
    }
    /**
     * Provide definition locations
     */
    provideDefinition(document, position, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        const word = document.getText(wordRange);
        const line = document.lineAt(position.line).text;
        // Check for view() function
        const viewMatch = line.match(/view\s*\(\s*['"]([^'"]+)['"]/);
        if (viewMatch && this.isPositionInRange(position, viewMatch.index || 0, viewMatch[0].length)) {
            const viewName = viewMatch[1].toLowerCase();
            return this.getViewDefinition(viewName);
        }
        // Check for route() function
        const routeMatch = line.match(/route\s*\(\s*['"]([^'"]+)['"]/);
        if (routeMatch && this.isPositionInRange(position, routeMatch.index || 0, routeMatch[0].length)) {
            const routeName = routeMatch[1].toLowerCase();
            return this.getRouteDefinition(routeName);
        }
        // Check for model references
        const modelMatch = line.match(/\\App\\Models\\([A-Za-z0-9_]+)/);
        if (modelMatch && this.isPositionInRange(position, modelMatch.index || 0, modelMatch[0].length)) {
            const modelName = modelMatch[1].toLowerCase();
            return this.getModelDefinition(modelName);
        }
        // Check for controller references
        const controllerMatch = line.match(/\\App\\Http\\Controllers\\([A-Za-z0-9_]+)/);
        if (controllerMatch && this.isPositionInRange(position, controllerMatch.index || 0, controllerMatch[0].length)) {
            const controllerName = controllerMatch[1].toLowerCase();
            return this.getControllerDefinition(controllerName);
        }
        return null;
    }
    /**
     * Check if position is within a range in the line
     */
    isPositionInRange(position, startIndex, length) {
        return position.character >= startIndex && position.character <= startIndex + length;
    }
    /**
     * Get view definition
     */
    getViewDefinition(viewName) {
        const viewPath = this.viewMap.get(viewName);
        if (viewPath) {
            return new vscode.Location(vscode.Uri.file(viewPath), new vscode.Position(0, 0));
        }
        return null;
    }
    /**
     * Get route definition
     */
    getRouteDefinition(routeName) {
        const routeLocation = this.routeMap.get(routeName);
        if (routeLocation) {
            const [filePath, line] = routeLocation.split(':');
            return new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(parseInt(line) - 1, 0));
        }
        return null;
    }
    /**
     * Get model definition
     */
    getModelDefinition(modelName) {
        const modelPath = this.modelMap.get(modelName);
        if (modelPath) {
            return new vscode.Location(vscode.Uri.file(modelPath), new vscode.Position(0, 0));
        }
        return null;
    }
    /**
     * Get controller definition
     */
    getControllerDefinition(controllerName) {
        const controllerPath = this.controllerMap.get(controllerName);
        if (controllerPath) {
            return new vscode.Location(vscode.Uri.file(controllerPath), new vscode.Position(0, 0));
        }
        return null;
    }
}
//# sourceMappingURL=definitionProvider.js.map