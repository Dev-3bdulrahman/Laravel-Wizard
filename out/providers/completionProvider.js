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
exports.registerCompletionProviders = registerCompletionProviders;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const laravelUtils_1 = require("../utils/laravelUtils");
/**
 * Register all completion providers
 * @param context Extension context
 * @param laravelRoot Laravel project root path
 */
function registerCompletionProviders(context, laravelRoot) {
    const config = (0, laravelUtils_1.getLaravelConfig)(laravelRoot);
    // Register PHP completion provider
    const phpSelector = { language: 'php', scheme: 'file' };
    const phpCompletionProvider = vscode.languages.registerCompletionItemProvider(phpSelector, new LaravelCompletionProvider(config), '.', ':', '>');
    // Register Blade completion provider
    const bladeSelector = { language: 'blade', scheme: 'file' };
    const bladeCompletionProvider = vscode.languages.registerCompletionItemProvider(bladeSelector, new LaravelCompletionProvider(config), '.', ':', '>');
    context.subscriptions.push(phpCompletionProvider, bladeCompletionProvider);
}
/**
 * Laravel completion provider
 */
class LaravelCompletionProvider {
    config;
    models = [];
    controllers = [];
    views = [];
    routes = new Map();
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
                    this.models.push(modelName);
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
                    this.controllers.push(controllerName);
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
                    this.views.push(viewName);
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
                    this.parseRouteFile(webRoutesPath, 'web');
                }
                if (fs.existsSync(apiRoutesPath)) {
                    this.parseRouteFile(apiRoutesPath, 'api');
                }
            }
        }
        catch (error) {
            console.error('Error scanning routes:', error);
        }
    }
    /**
     * Parse a route file to extract route names
     * @param filePath Route file path
     * @param prefix Route prefix
     */
    parseRouteFile(filePath, prefix) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            // Simple regex to find route names
            // This is a basic implementation and might not catch all routes
            const routeNameRegex = /->name\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
            let match;
            while ((match = routeNameRegex.exec(content)) !== null) {
                const routeName = match[1];
                this.routes.set(routeName, `${prefix}:${routeName}`);
            }
        }
        catch (error) {
            console.error(`Error parsing route file ${filePath}:`, error);
        }
    }
    /**
     * Provide completion items
     */
    provideCompletionItems(document, position, token, context) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        // Check for view() function
        if (linePrefix.match(/view\s*\(\s*['"]$/)) {
            return this.provideViewCompletions();
        }
        // Check for route() function
        if (linePrefix.match(/route\s*\(\s*['"]$/)) {
            return this.provideRouteCompletions();
        }
        // Check for model references
        if (linePrefix.match(/\\App\\Models\\$/)) {
            return this.provideModelCompletions();
        }
        // Check for controller references
        if (linePrefix.match(/\\App\\Http\\Controllers\\$/)) {
            return this.provideControllerCompletions();
        }
        return null;
    }
    /**
     * Provide view completions
     */
    provideViewCompletions() {
        return this.views.map(view => {
            const item = new vscode.CompletionItem(view, vscode.CompletionItemKind.File);
            item.detail = 'Blade View';
            item.documentation = `View file: ${view}.blade.php`;
            return item;
        });
    }
    /**
     * Provide route completions
     */
    provideRouteCompletions() {
        return Array.from(this.routes.keys()).map(route => {
            const item = new vscode.CompletionItem(route, vscode.CompletionItemKind.Reference);
            item.detail = 'Route';
            item.documentation = `Route: ${this.routes.get(route)}`;
            return item;
        });
    }
    /**
     * Provide model completions
     */
    provideModelCompletions() {
        return this.models.map(model => {
            const item = new vscode.CompletionItem(model, vscode.CompletionItemKind.Class);
            item.detail = 'Laravel Model';
            item.documentation = `Model: ${model}`;
            return item;
        });
    }
    /**
     * Provide controller completions
     */
    provideControllerCompletions() {
        return this.controllers.map(controller => {
            const item = new vscode.CompletionItem(controller, vscode.CompletionItemKind.Class);
            item.detail = 'Laravel Controller';
            item.documentation = `Controller: ${controller}`;
            return item;
        });
    }
}
//# sourceMappingURL=completionProvider.js.map