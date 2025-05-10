import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getLaravelConfig, getFilesRecursively } from '../utils/laravelUtils';

/**
 * Register all definition providers
 * @param context Extension context
 * @param laravelRoot Laravel project root path
 */
export function registerDefinitionProviders(context: vscode.ExtensionContext, laravelRoot: string) {
    const config = getLaravelConfig(laravelRoot);

    // Register PHP definition provider
    const phpSelector = { language: 'php', scheme: 'file' };
    const phpDefinitionProvider = vscode.languages.registerDefinitionProvider(
        phpSelector,
        new LaravelDefinitionProvider(config)
    );

    // Register Blade definition provider
    const bladeSelector = { language: 'blade', scheme: 'file' };
    const bladeDefinitionProvider = vscode.languages.registerDefinitionProvider(
        bladeSelector,
        new LaravelDefinitionProvider(config)
    );

    context.subscriptions.push(phpDefinitionProvider, bladeDefinitionProvider);
}

/**
 * Laravel definition provider
 */
class LaravelDefinitionProvider implements vscode.DefinitionProvider {
    private config: any;
    private modelMap: Map<string, string> = new Map();
    private controllerMap: Map<string, string> = new Map();
    private viewMap: Map<string, string> = new Map();
    private routeMap: Map<string, string> = new Map();

    constructor(config: any) {
        this.config = config;
        this.initialize();
    }

    /**
     * Initialize the provider by scanning the Laravel project
     */
    private initialize() {
        // Log initialization start
        console.log('Initializing Laravel Definition Provider...');

        // Scan models
        this.scanModels();

        // Scan controllers
        this.scanControllers();

        // Scan views
        this.scanViews();

        // Scan routes
        this.scanRoutes();

        // Log initialization complete
        console.log(`Definition Provider initialized with:
            - ${this.modelMap.size} models
            - ${this.controllerMap.size} controllers
            - ${this.viewMap.size} views
            - ${this.routeMap.size} routes`);
    }

    /**
     * Scan Laravel models
     */
    private scanModels() {
        try {
            const modelsPath = this.config.modelsPath;
            if (fs.existsSync(modelsPath)) {
                const modelFiles = getFilesRecursively(modelsPath, '**/*.php');

                for (const file of modelFiles) {
                    const relativePath = path.relative(modelsPath, file);
                    const modelName = path.basename(relativePath, '.php');

                    // Add the model name (e.g., "User")
                    this.modelMap.set(modelName.toLowerCase(), file);

                    // Also add with namespace for flexibility (e.g., "App\Models\User")
                    this.modelMap.set(('app\\models\\' + modelName).toLowerCase(), file);

                    // Also add with leading backslash (e.g., "\App\Models\User")
                    this.modelMap.set(('\\app\\models\\' + modelName).toLowerCase(), file);

                    // Try to extract the actual class name from the file content
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        const classMatch = content.match(/class\s+([A-Za-z0-9_]+)/);
                        if (classMatch && classMatch[1]) {
                            const className = classMatch[1];
                            // Add the actual class name if different from file name
                            if (className.toLowerCase() !== modelName.toLowerCase()) {
                                this.modelMap.set(className.toLowerCase(), file);
                            }
                        }
                    } catch (readError) {
                        // Silently continue if we can't read the file
                    }
                }

                // Also check for models in subdirectories
                const subdirModelFiles = getFilesRecursively(modelsPath, '**/*/');
                for (const dir of subdirModelFiles) {
                    if (fs.statSync(dir).isDirectory()) {
                        const subDirModelFiles = getFilesRecursively(dir, '*.php');
                        for (const file of subDirModelFiles) {
                            const modelName = path.basename(file, '.php');
                            this.modelMap.set(modelName.toLowerCase(), file);

                            // Get the relative path from models directory
                            const relPath = path.relative(modelsPath, path.dirname(file));
                            const namespacedName = relPath.replace(/\\/g, '\\').replace(/\//g, '\\') + '\\' + modelName;
                            this.modelMap.set(('app\\models\\' + namespacedName).toLowerCase(), file);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning models:', error);
        }
    }

    /**
     * Scan Laravel controllers
     */
    private scanControllers() {
        try {
            const controllersPath = this.config.controllersPath;
            if (fs.existsSync(controllersPath)) {
                const controllerFiles = getFilesRecursively(controllersPath, '**/*.php');

                for (const file of controllerFiles) {
                    const relativePath = path.relative(controllersPath, file);
                    const controllerName = path.basename(relativePath, '.php');

                    // Add the controller name (e.g., "UserController")
                    this.controllerMap.set(controllerName.toLowerCase(), file);

                    // Also add without "Controller" suffix for flexibility
                    if (controllerName.toLowerCase().endsWith('controller')) {
                        const baseName = controllerName.substring(0, controllerName.length - 10); // Remove "Controller"
                        this.controllerMap.set(baseName.toLowerCase(), file);
                    }

                    // Also add with namespace for flexibility (e.g., "App\Http\Controllers\UserController")
                    this.controllerMap.set(('app\\http\\controllers\\' + controllerName).toLowerCase(), file);

                    // Also add with leading backslash (e.g., "\App\Http\Controllers\UserController")
                    this.controllerMap.set(('\\app\\http\\controllers\\' + controllerName).toLowerCase(), file);

                    // Try to extract the actual class name and methods from the file content
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        const classMatch = content.match(/class\s+([A-Za-z0-9_]+)/);
                        if (classMatch && classMatch[1]) {
                            const className = classMatch[1];
                            // Add the actual class name if different from file name
                            if (className.toLowerCase() !== controllerName.toLowerCase()) {
                                this.controllerMap.set(className.toLowerCase(), file);
                            }

                            // Extract method names for more precise navigation
                            const methodMatches = content.matchAll(/public\s+function\s+([A-Za-z0-9_]+)\s*\(/g);
                            for (const methodMatch of methodMatches) {
                                const methodName = methodMatch[1];
                                // Add controller@method format (used in routes)
                                this.controllerMap.set((controllerName + '@' + methodName).toLowerCase(), file);
                                this.controllerMap.set((className + '@' + methodName).toLowerCase(), file);
                            }
                        }
                    } catch (readError) {
                        // Silently continue if we can't read the file
                    }
                }

                // Also check for controllers in subdirectories
                const subdirControllerFiles = getFilesRecursively(controllersPath, '**/*/');
                for (const dir of subdirControllerFiles) {
                    if (fs.statSync(dir).isDirectory()) {
                        const subDirControllerFiles = getFilesRecursively(dir, '*.php');
                        for (const file of subDirControllerFiles) {
                            const controllerName = path.basename(file, '.php');
                            this.controllerMap.set(controllerName.toLowerCase(), file);

                            // Get the relative path from controllers directory
                            const relPath = path.relative(controllersPath, path.dirname(file));
                            const namespacedName = relPath.replace(/\\/g, '\\').replace(/\//g, '\\') + '\\' + controllerName;
                            this.controllerMap.set(('app\\http\\controllers\\' + namespacedName).toLowerCase(), file);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning controllers:', error);
        }
    }

    /**
     * Scan Laravel views
     */
    private scanViews() {
        try {
            const viewsPath = this.config.viewsPath;
            if (fs.existsSync(viewsPath)) {
                // Get all Blade templates
                const viewFiles = getFilesRecursively(viewsPath, '**/*.blade.php');

                for (const file of viewFiles) {
                    const relativePath = path.relative(viewsPath, file);
                    // Convert path separators to dots for view names (e.g., 'admin/dashboard.blade.php' -> 'admin.dashboard')
                    const viewName = relativePath.replace(/\.blade\.php$/, '').replace(/\\/g, '.').replace(/\//g, '.');
                    this.viewMap.set(viewName.toLowerCase(), file);

                    // Also add the view with directory separators for flexibility
                    const viewNameWithSlash = relativePath.replace(/\.blade\.php$/, '');
                    this.viewMap.set(viewNameWithSlash.toLowerCase(), file);
                }

                // Also scan for Livewire components if they exist
                const livewireViewsPath = path.join(this.config.rootPath, 'resources/views/livewire');
                if (fs.existsSync(livewireViewsPath)) {
                    const livewireFiles = getFilesRecursively(livewireViewsPath, '**/*.blade.php');

                    for (const file of livewireFiles) {
                        const relativePath = path.relative(livewireViewsPath, file);
                        const viewName = 'livewire.' + relativePath.replace(/\.blade\.php$/, '').replace(/\\/g, '.').replace(/\//g, '.');
                        this.viewMap.set(viewName.toLowerCase(), file);
                    }
                }

                // Scan for components if they exist
                const componentsViewsPath = path.join(this.config.rootPath, 'resources/views/components');
                if (fs.existsSync(componentsViewsPath)) {
                    const componentFiles = getFilesRecursively(componentsViewsPath, '**/*.blade.php');

                    for (const file of componentFiles) {
                        const relativePath = path.relative(componentsViewsPath, file);
                        const viewName = 'components.' + relativePath.replace(/\.blade\.php$/, '').replace(/\\/g, '.').replace(/\//g, '.');
                        this.viewMap.set(viewName.toLowerCase(), file);

                        // Also add with x- prefix for Blade component syntax
                        const componentName = relativePath.replace(/\.blade\.php$/, '').replace(/\\/g, '-').replace(/\//g, '-');
                        this.viewMap.set('x-' + componentName.toLowerCase(), file);
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning views:', error);
        }
    }

    /**
     * Scan Laravel routes
     */
    private scanRoutes() {
        try {
            const routesPath = this.config.routesPath;
            if (fs.existsSync(routesPath)) {
                // Scan all PHP files in the routes directory
                const routeFiles = getFilesRecursively(routesPath, '**/*.php');

                for (const file of routeFiles) {
                    this.parseRouteFile(file);
                }

                // Specifically check for common route files
                const commonRouteFiles = [
                    'web.php',
                    'api.php',
                    'channels.php',
                    'console.php',
                    'admin.php',
                    'auth.php'
                ];

                for (const routeFile of commonRouteFiles) {
                    const routeFilePath = path.join(routesPath, routeFile);
                    if (fs.existsSync(routeFilePath) && !routeFiles.includes(routeFilePath)) {
                        this.parseRouteFile(routeFilePath);
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning routes:', error);
        }
    }

    /**
     * Parse a route file to extract route names and their locations
     * @param filePath Route file path
     */
    private parseRouteFile(filePath: string) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            // More comprehensive regex patterns for route detection
            const routePatterns = [
                // Route::get|post|put|delete|patch('path', ...)->name('name')
                { regex: /Route::(get|post|put|delete|patch|any)\s*\(\s*['"]([^'"]+)['"]/g, group: 2, type: 'path' },
                // ->name('route_name')
                { regex: /->name\s*\(\s*['"]([^'"]+)['"]\s*\)/g, group: 1, type: 'name' },
                // Route::name('prefix')->group(...)
                { regex: /Route::name\s*\(\s*['"]([^'"]+)['"]\s*\)/g, group: 1, type: 'group' },
                // Controller references in routes
                { regex: /([A-Za-z0-9_\\]+Controller)(@[A-Za-z0-9_]+)?/g, group: 1, type: 'controller' }
            ];

            // Process each line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Check each pattern
                for (const pattern of routePatterns) {
                    const matches = Array.from(line.matchAll(pattern.regex));
                    for (const match of matches) {
                        if (pattern.type === 'name') {
                            // Route name
                            const routeName = match[pattern.group];
                            this.routeMap.set(routeName.toLowerCase(), `${filePath}:${i + 1}`);
                        } else if (pattern.type === 'path') {
                            // Route path
                            const routePath = match[pattern.group];
                            this.routeMap.set(routePath.toLowerCase(), `${filePath}:${i + 1}`);

                            // Also add without leading slash
                            if (routePath.startsWith('/')) {
                                this.routeMap.set(routePath.substring(1).toLowerCase(), `${filePath}:${i + 1}`);
                            }
                        } else if (pattern.type === 'controller') {
                            // Controller reference
                            const controllerRef = match[pattern.group];
                            // Store the line number for controller references
                            if (controllerRef && !controllerRef.includes('::')) {
                                const controllerName = controllerRef.replace(/^.*\\/, '');
                                this.controllerMap.set(`route:${controllerName.toLowerCase()}`, `${filePath}:${i + 1}`);
                            }
                        }
                    }
                }

                // Look for view references in routes
                const viewMatches = line.match(/view\s*\(\s*['"]([^'"]+)['"]/);
                if (viewMatches) {
                    const viewName = viewMatches[1];
                    // Store the route file and line number for view references
                    this.viewMap.set(`route:${viewName.toLowerCase()}`, `${filePath}:${i + 1}`);
                }
            }
        } catch (error) {
            console.error(`Error parsing route file ${filePath}:`, error);
        }
    }

    /**
     * Provide definition locations
     */
    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        const word = document.getText(wordRange);
        const line = document.lineAt(position.line).text;

        // Check for view() function - supports both single and double quotes
        const viewMatch = line.match(/view\s*\(\s*['"]([\w\.\-\/]+)['"]/);
        if (viewMatch && this.isPositionInRange(position, viewMatch.index || 0, viewMatch[0].length)) {
            const viewName = viewMatch[1].toLowerCase();
            return this.getViewDefinition(viewName);
        }

        // Check for route() function - supports both single and double quotes
        const routeMatch = line.match(/route\s*\(\s*['"]([\w\.\-\/]+)['"]/);
        if (routeMatch && this.isPositionInRange(position, routeMatch.index || 0, routeMatch[0].length)) {
            const routeName = routeMatch[1].toLowerCase();
            return this.getRouteDefinition(routeName);
        }

        // Check for Blade @include, @extends, and @component directives
        const bladeDirectiveMatch = line.match(/@(include|extends|component)\s*\(\s*['"]([\w\.\-\/]+)['"]/);
        if (bladeDirectiveMatch && this.isPositionInRange(position, bladeDirectiveMatch.index || 0, bladeDirectiveMatch[0].length)) {
            const viewName = bladeDirectiveMatch[2].toLowerCase();
            return this.getViewDefinition(viewName);
        }

        // Check for model references - more flexible pattern
        // Matches App\\Models\\User, \\App\\Models\\User, User::class, etc.
        const modelMatch = line.match(/(?:\\App\\Models\\|App\\Models\\)([A-Za-z0-9_]+)/);
        if (modelMatch && this.isPositionInRange(position, modelMatch.index || 0, modelMatch[0].length)) {
            const modelName = modelMatch[1].toLowerCase();
            return this.getModelDefinition(modelName);
        }

        // Check for model class name directly
        if (this.modelMap.has(word.toLowerCase())) {
            return this.getModelDefinition(word.toLowerCase());
        }

        // Check for controller references - more flexible pattern
        // Matches App\\Http\\Controllers\\UserController, \\App\\Http\\Controllers\\UserController, etc.
        const controllerMatch = line.match(/(?:\\App\\Http\\Controllers\\|App\\Http\\Controllers\\)([A-Za-z0-9_]+)/);
        if (controllerMatch && this.isPositionInRange(position, controllerMatch.index || 0, controllerMatch[0].length)) {
            const controllerName = controllerMatch[1].toLowerCase();
            return this.getControllerDefinition(controllerName);
        }

        // Check for controller class name directly
        if (this.controllerMap.has(word.toLowerCase())) {
            return this.getControllerDefinition(word.toLowerCase());
        }

        // Check for view name in string literals
        // This is useful for cases like ['view' => 'home.index']
        const stringLiteralMatch = line.match(/['"]([a-zA-Z0-9_\.\-\/]+)['"]/);
        if (stringLiteralMatch && this.isPositionInRange(position, stringLiteralMatch.index || 0, stringLiteralMatch[0].length)) {
            const potentialViewName = stringLiteralMatch[1].toLowerCase();
            if (this.viewMap.has(potentialViewName)) {
                return this.getViewDefinition(potentialViewName);
            }
        }

        return null;
    }

    /**
     * Check if position is within a range in the line
     */
    private isPositionInRange(position: vscode.Position, startIndex: number, length: number): boolean {
        return position.character >= startIndex && position.character <= startIndex + length;
    }

    /**
     * Get view definition
     */
    private getViewDefinition(viewName: string): vscode.Location | null {
        const viewPath = this.viewMap.get(viewName);
        if (viewPath) {
            return new vscode.Location(
                vscode.Uri.file(viewPath),
                new vscode.Position(0, 0)
            );
        }
        return null;
    }

    /**
     * Get route definition
     */
    private getRouteDefinition(routeName: string): vscode.Location | null {
        const routeLocation = this.routeMap.get(routeName);
        if (routeLocation) {
            const [filePath, line] = routeLocation.split(':');
            return new vscode.Location(
                vscode.Uri.file(filePath),
                new vscode.Position(parseInt(line) - 1, 0)
            );
        }
        return null;
    }

    /**
     * Get model definition
     */
    private getModelDefinition(modelName: string): vscode.Location | null {
        const modelPath = this.modelMap.get(modelName);
        if (modelPath) {
            return new vscode.Location(
                vscode.Uri.file(modelPath),
                new vscode.Position(0, 0)
            );
        }
        return null;
    }

    /**
     * Get controller definition
     */
    private getControllerDefinition(controllerName: string): vscode.Location | null {
        const controllerPath = this.controllerMap.get(controllerName);
        if (controllerPath) {
            return new vscode.Location(
                vscode.Uri.file(controllerPath),
                new vscode.Position(0, 0)
            );
        }
        return null;
    }
}
