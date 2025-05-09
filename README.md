# Laravel Wizard

<div align="center">

![Laravel Wizard](../images/logo.png)

**The Ultimate VS Code Extension for Laravel Development**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=Dev-3bdulrahman.Laravel-Wizard)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Laravel](https://img.shields.io/badge/Laravel-8.x|9.x|10.x|11.x-red.svg)](https://laravel.com)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-blueviolet.svg)](https://code.visualstudio.com)

[Features](#features) • [Installation](#installation) • [Documentation](#usage) • [GitHub](https://github.com/Dev-3bdulrahman/Laravel-Wizard)

</div>

**Laravel Wizard** is the ultimate VS Code extension for Laravel and PHP developers, designed to supercharge your development workflow. Created by [Abdulrahman Mehesan](https://3bdulrahman.com/), this extension provides intelligent code assistance, powerful snippets, and seamless integrations to make Laravel development faster and more efficient.

## ✨ Features

### 🧠 Intelligent IntelliSense
- **Smart Autocompletion** for Laravel classes, factories, models, routes, and more
- **Context-Aware Suggestions** for Laravel functions like `view()`, `route()`, `trans()`, `config()`, `env()`
- **Blade Template IntelliSense** with component suggestions and attribute completion

### 🔍 Advanced Navigation
- **Go to Definition** for models, controllers, routes, and other Laravel components
- **Quick Navigation** to Blade templates, Livewire components, and Filament resources
- **Jump Between Related Files** (controller to view, model to migration, etc.)

### 📦 Powerful Snippets
- **Ready-to-Use Snippets** for creating Laravel components (models, controllers, migrations, etc.)
- **Blade Template Snippets** for common patterns and structures
- **Livewire and Filament** component snippets for rapid development

### ⚡ Artisan Integration
- **Run Artisan Commands** directly from VS Code
- **Command Palette Integration** for common Artisan tasks
- **Interactive Command Builder** with parameter suggestions and documentation

### 🔧 Blade Support
- **Enhanced Syntax Highlighting** for Blade templates
- **Advanced IntelliSense** within Blade files
- **Formatting and Linting** for Blade templates

### 🛣️ Route Analysis
- **Automatic Parsing** of route files
- **Intelligent Route Suggestions** in your code
- **Quick Navigation** to route handlers and controllers

## Requirements

- Visual Studio Code 1.80.0 or higher
- PHP 7.4 or higher
- Laravel project (5.x, 6.x, 7.x, 8.x, 9.x, 10.x, 11.x)

## Extension Settings

This extension contributes the following settings:

* `laravelWizard.enable`: Enable/disable this extension
* `laravelWizard.artisanPath`: Custom path to the Artisan executable
* `laravelWizard.composerPath`: Custom path to the Composer executable
* `laravelWizard.bladeFormatting.enable`: Enable/disable Blade template formatting
* `laravelWizard.snippets.enable`: Enable/disable snippets
* `laravelWizard.intelephense.enable`: Enable/disable PHP IntelliSense integration
* `laravelWizard.livewireSupport.enable`: Enable/disable Livewire support
* `laravelWizard.filamentSupport.enable`: Enable/disable Filament support

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Laravel Wizard"
4. Click Install
5. Reload VS Code when prompted

## Usage

### IntelliSense

Laravel Wizard automatically provides intelligent code completion as you type. It works with:

- Laravel classes and facades
- Blade templates
- Routes
- Models and relationships
- Artisan commands
- Configuration values

### Snippets

Type the prefix and press Tab to insert the snippet:

- `l:model` - Create a new model
- `l:controller` - Create a new controller
- `l:migration` - Create a new migration
- `l:seeder` - Create a new seeder
- `l:factory` - Create a new factory
- `l:request` - Create a new form request
- `l:blade` - Create a new Blade component
- `l:livewire` - Create a new Livewire component
- `l:filament` - Create a new Filament resource

### Artisan Commands

Press `Ctrl+Shift+P` and type "Laravel" to see all available commands.

## 📋 Technical Details

<table>
  <tr>
    <td><strong>Built with</strong></td>
    <td>TypeScript, Node.js, VS Code API</td>
  </tr>
  <tr>
    <td><strong>Version</strong></td>
    <td>1.0.0</td>
  </tr>
  <tr>
    <td><strong>License</strong></td>
    <td>MIT License</td>
  </tr>
  <tr>
    <td><strong>Laravel Compatibility</strong></td>
    <td>Laravel 8.x, 9.x, 10.x, 11.x</td>
  </tr>
</table>

## 🚀 Release Notes

### 1.0.0 (May 2025)

Official release of Laravel Wizard with full feature set:
- Complete IntelliSense for all Laravel components
- Advanced navigation and code analysis
- Comprehensive snippet library
- Full Blade, Livewire, and Filament support
- Artisan command integration with interactive UI
- Auto-updates and compatibility with latest Laravel versions

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

<div align="center">
  <img src="https://github.com/Dev-3bdulrahman.png" width="100px" style="border-radius: 50%;" alt="Abdulrahman Mehesan">
  <h3>Abdulrahman Mehesan</h3>
  <p>Full Stack Developer & Laravel Specialist</p>

  [![Website](https://img.shields.io/badge/Website-3bdulrahman.com-blue.svg)](https://3bdulrahman.com/)
  [![GitHub](https://img.shields.io/badge/GitHub-Dev--3bdulrahman-black.svg)](https://github.com/Dev-3bdulrahman)
  [![Email](https://img.shields.io/badge/Email-contact%403bdulrahman.com-red.svg)](mailto:contact@3bdulrahman.com)
</div>

## 🙏 Acknowledgments

* Laravel Team for creating such an amazing framework
* VS Code Team for the excellent extension API
* All contributors who help improve this extension

<div align="center">
  <h3>Enjoy coding with Laravel Wizard! ⚡</h3>
  <p>© 2025 Laravel Wizard. Developed by <a href="https://3bdulrahman.com/">Abdulrahman Mehesan</a>.</p>
  <p><small>Laravel is a registered trademark of Taylor Otwell. VS Code is a trademark of Microsoft Corporation.</small></p>
</div>
